import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

// CHANGE THIS TO YOUR ACTUAL RENDER BACKEND URL
const BACKEND_URL = "https://policy-path-ai-backend.onrender.com"; 

// --- 1. GATEKEEPER (Original V1 Auth - No Loops) ---
export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="animate-wave h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364]">
        {/* Glass Login Card */}
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 shadow-2xl w-full max-w-md p-10 rounded-3xl animate-fade-in mx-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-serif text-white mb-2 tracking-widest drop-shadow-lg">POLICYPATH AI 🏛️</h1>
            <p className="text-blue-200 font-light text-sm tracking-wide">Your Personal Constitution Mentor</p>
          </div>
          
          <Auth 
            supabaseClient={supabase} 
            appearance={{ 
              theme: ThemeSupa, 
              variables: { 
                default: { 
                  colors: { 
                    brand: '#2872A1', // Ocean Blue
                    brandAccent: '#154360',
                    inputText: 'white',
                    inputBackground: 'rgba(255,255,255,0.1)',
                    inputBorder: 'rgba(255,255,255,0.3)',
                  },
                  radii: {
                    borderRadiusButton: '12px',
                    inputBorderRadius: '12px',
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
  return <MainApp session={session} />;
}

// --- 2. MAIN APP (Full UI + New Logic) ---
function MainApp({ session }) {
  const userStorageKey = `pp_chat_history_${session.user.id}`;

  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(userStorageKey);
    return saved ? JSON.parse(saved) : [{ role: "bot", text: "Welcome. I am ready to guide you through the Constitution.", type: "mentor" }];
  });
  
  const [vault, setVault] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('home'); // Restored Tabs
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  // Quiz States
  const [testState, setTestState] = useState("idle"); 
  const [quiz, setQuiz] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);

  const messagesEndRef = useRef(null);

  // Fetch Vault & Exam Data on Load
  useEffect(() => { fetchData(); }, [session]);

  async function fetchData() {
    if (!session?.user) return;
    const { data: vData } = await supabase.from('vault').select('*').eq('user_id', session.user.id).order('id', { ascending: false });
    if (vData) setVault(vData);
    
    const { data: eData } = await supabase.from('exam_results').select('score, total_questions, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (eData) setExamResults(eData);
  }

  // Auto-Scroll to bottom
  useEffect(() => {
    localStorage.setItem(userStorageKey, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, userStorageKey]);

  // --- SMART AI HANDLER (The New Brain) ---
  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    const userQuery = query.trim();
    setLoading(true);
    setQuery(""); 
    
    // 1. Add User Message
    const newMessages = [...messages, { role: "user", text: userQuery }];
    setMessages(newMessages);

    // 2. Context Memory (Last 3 messages)
    const historyContext = newMessages.slice(-3).map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n");

    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: historyContext, mode: "chat" })
      });
      
      const data = await res.json();
      let aiText = data.answer;

      // 3. Smart Vault Parsing (Stripping tags)
      if (aiText.includes("||VAULT_START||")) {
        const parts = aiText.split("||VAULT_START||");
        const visibleText = parts[0].trim();
        const hiddenPart = parts[1].split("||VAULT_END||")[0];
        
        let topicTitle = "Constitutional Concept";
        let topicSummary = "Mastered via PolicyPath AI";

        if (hiddenPart.includes("Topic:")) {
           topicTitle = hiddenPart.split("Topic:")[1].split("\n")[0].trim().replace(/\*/g, ''); 
        }
        if (hiddenPart.includes("Summary:")) {
           topicSummary = hiddenPart.split("Summary:")[1].trim().replace(/\*/g, '');
        }

        const isDuplicate = vault.some(v => v.title.toLowerCase() === topicTitle.toLowerCase());

        if (isDuplicate) {
             setMessages(prev => [...prev, { role: "bot", text: `${visibleText}\n\n(Note: You already mastered "${topicTitle}".)` }]);
        } else {
             const { error } = await supabase.from('vault').insert([{ 
               title: topicTitle, 
               status: 'Mastered', 
               notes: topicSummary,
               user_id: session.user.id
             }]);

             if (!error) {
                  confetti({ particleCount: 150, spread: 60, colors: ['#2872A1', '#CBDDE9'] });
                  setMessages(prev => [...prev, { role: "bot", text: visibleText, saved: true }]);
                  fetchData(); 
             } else {
                setMessages(prev => [...prev, { role: "bot", text: visibleText }]);
             }
        }
      } else {
        setMessages(prev => [...prev, { role: "bot", text: aiText }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { role: "bot", text: `⚠️ Network Error. Please try again.` }]);
    } finally {
      setLoading(false);
    }
  };

  // --- TEST ENGINE (Quiz Mode) ---
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
      score: score, total_questions: quiz.length, topics_covered: "Mixed Vault Test", user_id: session.user.id
    }]);
    fetchData();
  };

  const avgScore = examResults.length > 0 
    ? Math.round(examResults.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) / examResults.length) : 0;

  // --- UI RENDER (Original 4 Tabs Layout) ---
  return (
    <div className="h-[100dvh] w-full bg-[#0F2027] text-white font-sans overflow-hidden flex flex-col">
      
      {/* 1. HEADER */}
      <header className="px-6 py-4 flex justify-between items-center z-50 bg-[#0F2027]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
           <span className="text-2xl">🏛️</span>
           <h1 className="font-serif font-bold text-lg tracking-wider text-white">POLICYPATH</h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-[10px] font-bold bg-[#2872A1]/20 text-[#2872A1] px-2 py-1 rounded border border-[#2872A1]/30">BETA 2.0</div>
           <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold text-red-300 hover:text-white transition">EXIT</button>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-32 scroll-smooth">
        
        {/* TAB 1: HOME (Chat) */}
        {activeTab === 'home' && (
          <div className="max-w-3xl mx-auto p-4 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg backdrop-blur-sm border ${
                  m.role === 'user' 
                    ? 'bg-[#2872A1] border-[#2872A1] text-white rounded-br-none' 
                    : 'bg-white/5 border-white/10 text-blue-50 rounded-bl-none'
                }`}>
                  <div className="whitespace-pre-wrap font-light">{m.text}</div>
                  
                  {m.saved && (
                    <div className="mt-3 pt-2 border-t border-white/20 flex items-center gap-2 text-green-400 text-[10px] font-bold uppercase tracking-widest">
                      <span className="bg-green-500/20 p-1 rounded-full">✓</span> Saved to Vault
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* The Cool New Animation */}
            {loading && (
              <div className="flex justify-start animate-pulse pl-4">
                 <div className="flex items-center gap-2 text-xs text-blue-300/70 bg-white/5 px-3 py-2 rounded-full border border-white/10">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    The Mentor is drafting...
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {/* TAB 2: VAULT */}
        {activeTab === 'vault' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <h2 className="text-3xl font-serif font-bold text-white mb-2">Mastery Vault 🏆</h2>
            <p className="text-white/50 text-sm mb-6">Concepts you have conquered.</p>
            
            {vault.length === 0 ? (
              <div className="bg-white/5 border border-white/10 p-12 rounded-3xl text-center">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-white/60">Your vault is empty.</p>
                <button onClick={() => setActiveTab('home')} className="mt-4 text-[#2872A1] font-bold text-sm underline">Start Learning</button>
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8 px-2 snap-x">
                {vault.map(v => (
                  <div key={v.id} onClick={() => setSelectedArticle(v)} 
                       className="bg-white/5 min-w-[280px] w-[280px] h-[380px] p-6 rounded-3xl flex flex-col justify-between snap-center hover:scale-105 transition-transform cursor-pointer border border-white/10 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-blue-400/30 transition"></div>
                    <div>
                      <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full uppercase tracking-widest text-blue-200">Mastered</span>
                      <h3 className="text-2xl font-serif font-bold mt-4 mb-2 leading-tight">{v.title}</h3>
                      <p className="text-xs text-blue-100/60 line-clamp-4 leading-relaxed">{v.notes}</p>
                    </div>
                    <button className="text-xs font-bold uppercase tracking-widest text-left text-white/70 group-hover:text-white transition">Read Note →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TEST PORTAL */}
        {activeTab === 'test' && (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in p-4">
            {testState === 'idle' && (
              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl text-center space-y-6 max-w-sm">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-serif font-bold">Ready to Prove It?</h2>
                <p className="text-sm text-blue-100/70">Generate a quiz based on your Vault.</p>
                <button onClick={startTest} className="w-full bg-white text-[#2872A1] font-bold py-4 rounded-xl shadow-lg hover:bg-blue-50 transition">GENERATE TEST</button>
              </div>
            )}
            
            {testState === 'loading' && <div className="animate-pulse text-xl font-serif text-blue-200">Constructing Challenge...</div>}
            
            {testState === 'active' && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs text-blue-200 mb-4 uppercase font-bold tracking-widest">
                  <span>Question {currentQIndex + 1}/10</span>
                  <span>Score: {score}</span>
                </div>
                <div className="bg-white/5 border border-white/10 p-8 rounded-3xl mb-6 relative">
                  <p className="font-medium text-lg leading-relaxed">{quiz[currentQIndex].question}</p>
                </div>
                <div className="space-y-3">
                  {quiz[currentQIndex].options.map((opt, i) => (
                    <button key={i} onClick={() => submitAnswer(opt)} className="w-full p-4 text-left bg-white/5 border border-white/10 rounded-xl hover:bg-white hover:text-[#2872A1] transition-all duration-200">{opt}</button>
                  ))}
                </div>
              </div>
            )}

            {testState === 'result' && (
              <div className="bg-white/5 border border-white/10 p-10 rounded-3xl text-center space-y-6">
                <h2 className="text-3xl font-serif font-bold">Result</h2>
                <div className="text-7xl font-bold">{score} <span className="text-2xl text-white/50">/ 10</span></div>
                <button onClick={() => setTestState('idle')} className="text-sm underline opacity-70">Close</button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in max-w-lg mx-auto p-4">
            <h2 className="text-2xl font-serif font-bold px-2">Performance</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                <div className="text-4xl font-bold mb-1">{vault.length}</div>
                <div className="text-[9px] uppercase tracking-widest text-blue-200">Topics Mastered</div>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center">
                <div className="text-4xl font-bold mb-1">{avgScore}%</div>
                <div className="text-[9px] uppercase tracking-widest text-blue-200">Avg Accuracy</div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
               <h3 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-70">Recent Activity</h3>
               <div className="space-y-4">
               {examResults.length === 0 ? <p className="text-xs opacity-50">No data yet.</p> : 
                 examResults.slice(0, 5).map((res, i) => (
                 <div key={i} className="flex justify-between text-sm items-center pb-3 border-b border-white/10 last:border-0">
                   <span className="text-blue-100/70">{res.created_at ? new Date(res.created_at).toLocaleDateString() : 'Today'}</span>
                   <span className="font-bold bg-white/10 px-2 py-1 rounded text-xs">{res.score}/{res.total_questions}</span>
                 </div>
               ))}
               </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. INPUT AREA (Only on Home) */}
      {activeTab === 'home' && (
        <div className="fixed bottom-24 w-full px-4 max-w-2xl mx-auto left-0 right-0 z-40">
           <div className="bg-[#0F2027]/90 backdrop-blur-xl border border-white/20 p-2 rounded-full flex items-center shadow-2xl">
             <input 
               value={query} 
               onChange={e => setQuery(e.target.value)} 
               placeholder="Ask about Article 21, Preamble..." 
               className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white focus:outline-none placeholder-white/30" 
               onKeyDown={e => e.key === 'Enter' && handleAsk()} 
               disabled={loading}
             />
             <button 
               onClick={handleAsk} 
               disabled={loading || !query.trim()} 
               className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                 loading || !query.trim() ? 'bg-white/10 text-white/30' : 'bg-[#2872A1] text-white hover:scale-110'
               }`}
             >
               {loading ? '●' : '↑'}
             </button>
           </div>
        </div>
      )}

      {/* 4. BOTTOM NAVIGATION DOCK (4 Tabs Restored) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
         <nav className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 flex gap-6 shadow-2xl">
            {[
              { id: 'home', icon: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> },
              { id: 'vault', icon: <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/> },
              { id: 'test', icon: <circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/> },
              { id: 'analytics', icon: <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/> }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`p-2 transition-all duration-300 rounded-full ${
                  activeTab === tab.id ? 'bg-white text-black scale-110 shadow-lg' : 'text-white/50 hover:text-white'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  {tab.icon}
                </svg>
              </button>
            ))}
         </nav>
      </div>

      {/* 5. READING MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1a2c38] w-full max-w-lg max-h-[80vh] rounded-3xl p-8 overflow-y-auto border border-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-white/70 transition">✕</button>
            <h1 className="text-2xl font-serif font-bold text-white mb-4">{selectedArticle.title}</h1>
            <div className="text-blue-100/80 leading-7 font-light whitespace-pre-wrap">
              {selectedArticle.notes}
            </div>
            <div className="mt-8 pt-4 border-t border-white/10 text-center">
              <span className="text-xs text-white/40 uppercase tracking-widest">Keep Reviewing to retain mastery</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
