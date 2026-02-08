import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
// 1. IMPORT THE LOGIN WIDGET
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const BACKEND_URL = "https://policy-path-ai-backend.onrender.com"; 
const STORAGE_KEYS = { MESSAGES: 'pp_messages_v3' };

// --- 2. THE GATEKEEPER COMPONENT (Handles Login) ---
export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for active session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for changes (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // IF NOT LOGGED IN -> SHOW LOGIN SCREEN
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#1a0b2e] text-white p-4">
        <div className="w-full max-w-md p-8 bg-[#2d1b4e] rounded-xl border border-purple-500/30 shadow-2xl">
          <h1 className="text-3xl font-black italic text-yellow-400 mb-2 text-center">POLICYPATH AI 🏛️</h1>
          <p className="text-gray-400 text-center mb-8 text-sm">Sign in to access your private Mastery Vault.</p>
          
          {/* THE FANCY WIDGET */}
          <Auth 
            supabaseClient={supabase} 
            appearance={{ 
              theme: ThemeSupa, 
              variables: { 
                default: { 
                  colors: { 
                    brand: '#eab308', 
                    brandAccent: '#ca8a04',
                    inputText: 'white',
                    inputBackground: '#1a0b2e',
                    inputBorder: '#5b21b6',
                  } 
                } 
              } 
            }}
            theme="dark"
            providers={['google']} 
          />
        </div>
      </div>
    );
  }

  // IF LOGGED IN -> SHOW MAIN APP
  return <MainApp session={session} />;
}

// --- 3. THE MAIN APP (Your Dashboard Logic) ---
function MainApp({ session }) {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return saved ? JSON.parse(saved) : [{ role: "bot", text: "I am ready. Let's master the Constitution.", type: "mentor" }];
  });
  
  const [vault, setVault] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Test Portal State
  const [testState, setTestState] = useState("idle"); 
  const [quiz, setQuiz] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);

  const messagesEndRef = useRef(null);

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    // 1. Get Vault
    const { data: vData } = await supabase.from('vault').select('*').order('id', { ascending: false });
    if (vData) setVault(vData);

    // 2. Get Analytics
    const { data: eData } = await supabase.from('exam_results').select('score, total_questions');
    if (eData) setExamResults(eData);
  }

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // --- DIAGNOSTIC HANDLEASK ---
  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    const userQuery = query.trim();
    setLoading(true);
    setQuery("");
    setMessages(prev => [...prev, { role: "user", text: userQuery }]);

    const lastBot = messages.filter(m => m.role === 'bot').pop()?.text || "";
    const context = `[History: User studied "${lastBot.slice(0, 50)}..."] User: "${userQuery}"`;

    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: context, mode: "chat" })
      });
      const data = await res.json();
      let aiText = data.answer;

      if (aiText.includes("||VAULT_START||")) {
        const parts = aiText.split("||VAULT_START||");
        const visibleText = parts[0].trim();
        const hiddenPart = parts[1].split("||VAULT_END||")[0];
        
        // Parser
        let topicTitle = "New Mastery";
        if (hiddenPart.includes("Topic:")) {
           topicTitle = hiddenPart.split("Topic:")[1]
             .replace(/\*/g, '')
             .split("\n")[0]
             .trim(); 
        }

        let topicNotes = hiddenPart
            .replace(/Topic:.*?\n/i, '')
            .replace(/Summary:\s*/i, "")
            .replace(/\*/g, '') 
            .trim();

        // Save Attempt
        const { error } = await supabase.from('vault').insert([{ 
          title: topicTitle, 
          status: 'Mastered', 
          notes: topicNotes 
        }]);

        if (error) {
            setMessages(prev => [...prev, { role: "bot", text: `❌ Database Error: ${error.message}` }]);
        } else {
            confetti({ particleCount: 150, spread: 60 });
            setMessages(prev => [...prev, { role: "bot", text: visibleText, saved: true }]);
            fetchData(); 
        }

      } else {
        setMessages(prev => [...prev, { role: "bot", text: aiText }]);
      }

    } catch (e) {
      setMessages(prev => [...prev, { role: "bot", text: `⚠️ NETWORK ERROR: ${e.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  // --- TEST ENGINE ---
  const startTest = async () => {
    if (vault.length === 0) return alert("Vault is empty. Study first!");
    setTestState("loading");
    
    const topics = vault.map(v => v.title).join(", ");
    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: topics, mode: "quiz" })
      });
      const data = await res.json();
      const jsonStr = data.answer.replace(/```json|```/g, '').trim();
      setQuiz(JSON.parse(jsonStr).slice(0, 10));
      setScore(0); setCurrentQIndex(0); setTestState("active");
    } catch (e) {
      setTestState("idle"); alert("Error generating test.");
    }
  };

  const submitAnswer = (option) => {
    if (option === quiz[currentQIndex].answer) setScore(s => s + 1);
    if (currentQIndex + 1 < quiz.length) setCurrentQIndex(i => i + 1);
    else finishTest();
  };

  const finishTest = async () => {
    setTestState("result");
    await supabase.from('exam_results').insert([{
      score: score, total_questions: quiz.length, topics_covered: "Mixed Vault Test"
    }]);
    fetchData();
  };

  const avgScore = examResults.length > 0 
    ? Math.round(examResults.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) / examResults.length) : 0;

  // --- RENDER ---
  return (
    <div className="flex flex-col h-[100dvh] bg-[#1a0b2e] text-white font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="p-4 bg-[#2d1b4e] border-b border-purple-500/20 flex justify-between items-center z-50">
        <h1 className="font-black italic text-yellow-400 text-lg">POLICYPATH AI 🏛️</h1>
        <div className="flex items-center gap-2">
           <div className="text-[10px] font-bold bg-purple-800 px-2 py-1 rounded text-purple-200">BETA 2.0</div>
           
           {/* LOGOUT BUTTON */}
           <button 
             onClick={() => supabase.auth.signOut()} 
             className="text-[10px] font-bold bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20 hover:bg-red-500 hover:text-white transition"
           >
             LOGOUT
           </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        
        {/* TAB: MENTOR */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-purple-600 text-white' : 'bg-[#2d1b4e] text-gray-200 border border-purple-500/20'}`}>
                  {m.text}
                  {m.saved && (
                    <div className="mt-3 pt-2 border-t border-white/10 flex items-center gap-2 text-yellow-400 text-[10px] font-black uppercase tracking-widest">
                      <span>💾</span> Saved to Vault
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-gray-500 text-xs animate-pulse pl-2">Mentor is thinking...</div>}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* TAB: VAULT */}
        {activeTab === 'vault' && (
          <div className="space-y-4 animate-in fade-in">
            <h2 className="text-xl font-black text-yellow-500 uppercase italic">Mastery Vault 📜</h2>
            {vault.length === 0 ? <p className="text-gray-400 text-center mt-10">Vault is empty. Go study!</p> : vault.map(v => (
              <div key={v.id} onClick={() => setSelectedArticle(v)} className="p-4 bg-[#2d1b4e] rounded-xl border border-purple-500/20 active:scale-95 transition-all">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-white">{v.title}</h3>
                  <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded uppercase">Mastered</span>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2">{v.notes}</p>
              </div>
            ))}
          </div>
        )}

        {/* TAB: TEST PORTAL */}
        {activeTab === 'test' && (
          <div className="h-full flex flex-col items-center justify-center animate-in zoom-in">
            {testState === 'idle' && (
              <div className="text-center space-y-6">
                <span className="text-6xl block">🎯</span>
                <h2 className="text-2xl font-black text-white uppercase">Mock Test Zone</h2>
                <button onClick={startTest} className="bg-yellow-500 text-black font-black py-4 px-10 rounded-full shadow-lg hover:scale-105 transition-transform">START TEST</button>
              </div>
            )}
            
            {testState === 'loading' && <div className="animate-pulse text-yellow-500 font-bold">GENERATING QUESTIONS...</div>}
            
            {testState === 'active' && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs text-gray-400 mb-4 uppercase font-bold">
                  <span>Q {currentQIndex + 1} / 10</span>
                  <span>Score: {score}</span>
                </div>
                <div className="bg-[#2d1b4e] p-6 rounded-2xl border border-purple-500/30 mb-6">
                  <p className="font-medium text-lg">{quiz[currentQIndex].question}</p>
                </div>
                <div className="space-y-3">
                  {quiz[currentQIndex].options.map((opt, i) => (
                    <button key={i} onClick={() => submitAnswer(opt)} className="w-full p-4 text-left bg-purple-900/40 rounded-xl border border-purple-500/20 hover:bg-yellow-500 hover:text-black transition-colors">{opt}</button>
                  ))}
                </div>
              </div>
            )}

            {testState === 'result' && (
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-black text-yellow-500 italic">TEST COMPLETE</h2>
                <div className="text-6xl font-bold text-white">{score} <span className="text-2xl text-gray-500">/ 10</span></div>
                <button onClick={() => setTestState('idle')} className="underline text-gray-400">Close</button>
              </div>
            )}
          </div>
        )}

        {/* TAB: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in slide-in-from-right">
            <h2 className="text-xl font-black text-yellow-500 uppercase italic">Performance 📊</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#2d1b4e] rounded-2xl border border-purple-500/20 text-center">
                <div className="text-3xl font-bold text-white">{vault.length}</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Topics Mastered</div>
              </div>
              <div className="p-4 bg-[#2d1b4e] rounded-2xl border border-purple-500/20 text-center">
                <div className={`text-3xl font-bold ${avgScore > 70 ? 'text-green-400' : 'text-orange-400'}`}>{avgScore}%</div>
                <div className="text-[10px] text-gray-400 uppercase tracking-widest mt-1">Avg Test Score</div>
              </div>
            </div>

            <div className="p-6 bg-[#2d1b4e] rounded-2xl border border-purple-500/20">
               <h3 className="text-sm font-bold text-white mb-4">RECENT TESTS</h3>
               {examResults.slice(0, 5).map((res, i) => (
                 <div key={i} className="flex justify-between text-xs py-2 border-b border-white/5 last:border-0">
                   <span className="text-gray-400">{new Date(res.created_at).toLocaleDateString()}</span>
                   <span className="font-bold text-yellow-500">{res.score} / {res.total_questions}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

      </main>

      {/* FOOTER NAV */}
      <nav className="fixed bottom-0 w-full bg-[#130623] border-t border-purple-500/20 p-2 flex justify-around z-40 pb-6">
        {['home', 'vault', 'test', 'analytics'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`p-2 transition-all ${activeTab === tab ? 'text-yellow-400 -translate-y-2' : 'text-gray-500'}`}>
            <div className="text-xl capitalize">{tab === 'home' ? '⚡' : tab === 'vault' ? '📜' : tab === 'test' ? '🎯' : '📈'}</div>
            <div className="text-[9px] font-black uppercase tracking-widest mt-1">{tab}</div>
          </button>
        ))}
      </nav>
      
      {/* INPUT AREA */}
      {activeTab === 'home' && (
        <div className="fixed bottom-24 w-full px-4 max-w-xl mx-auto left-0 right-0 z-50">
           <div className="flex gap-2">
             <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Ask your mentor..." className="flex-1 bg-[#2d1b4e] border border-purple-500/30 rounded-full px-6 py-4 text-sm text-white focus:border-yellow-500 outline-none shadow-xl" onKeyDown={e => e.key === 'Enter' && handleAsk()} />
             <button onClick={handleAsk} disabled={loading} className="bg-yellow-500 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-xl font-bold text-xl">{loading ? '⏳' : '🚀'}</button>
           </div>
        </div>
      )}

      {/* DOCUMENT OVERLAY */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[100] bg-[#1a0b2e] p-6 animate-in slide-in-from-bottom">
          <button onClick={() => setSelectedArticle(null)} className="mb-8 text-yellow-500 font-bold text-xs uppercase tracking-widest">← Back</button>
          <h1 className="text-3xl font-serif font-black text-white italic mb-6">{selectedArticle.title}</h1>
          <div className="p-6 bg-[#2d1b4e] rounded-2xl border border-purple-500/30">
            <h4 className="text-[10px] text-yellow-500 font-black uppercase mb-4">MENTOR NOTES</h4>
            <p className="text-gray-300 leading-relaxed font-serif text-lg">{selectedArticle.notes}</p>
          </div>
        </div>
      )}
    </div>
  );
      }
