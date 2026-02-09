import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';

const BACKEND_URL = "https://policy-path-ai-backend.onrender.com"; 

// --- 1. GATEKEEPER (The "Front Door") ---
export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="animate-wave h-screen flex items-center justify-center p-4">
        {/* Glass Login Card */}
        <div className="glass-panel w-full max-w-md p-10 rounded-2xl animate-fade-in">
          <h1 className="text-4xl font-serif text-white mb-2 text-center tracking-widest">POLICYPATH AI</h1>
          <p className="text-blue-100 text-center mb-8 font-sans font-light">Your Personal Constitution Mentor</p>
          
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
                    borderRadiusButton: '8px',
                    inputBorderRadius: '8px',
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

// --- 2. MAIN APP (The "Cockpit") ---
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
  const [activeTab, setActiveTab] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState(null);
  
  const [testState, setTestState] = useState("idle"); 
  const [quiz, setQuiz] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);

  const messagesEndRef = useRef(null);

  useEffect(() => { fetchData(); }, [session]);

  async function fetchData() {
    if (!session?.user) return;
    const { data: vData } = await supabase.from('vault').select('*').eq('user_id', session.user.id).order('id', { ascending: false });
    if (vData) setVault(vData);
    const { data: eData } = await supabase.from('exam_results').select('score, total_questions, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (eData) setExamResults(eData);
  }

  useEffect(() => {
    localStorage.setItem(userStorageKey, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, userStorageKey]);

  // --- SMART AI HANDLER ---
  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    const userQuery = query.trim();
    setLoading(true);
    setQuery("");
    setMessages(prev => [...prev, { role: "user", text: userQuery }]);

    const lastBotMessage = messages.filter(m => m.role === 'bot').pop()?.text || "";
    
    const strictContext = `
    CURRENT_STATE:
    [PREVIOUS_AI_MESSAGE]: "${lastBotMessage.slice(0, 500)}"
    [USER_LATEST_INPUT]: "${userQuery}"
    
    INSTRUCTIONS:
    1. READ [PREVIOUS_AI_MESSAGE]. Did you ask a question there?
    2. IF YES -> [USER_LATEST_INPUT] is the answer. GRADE IT.
       - If Correct: Say "Correct!", explain briefly, and output ||VAULT_START|| tag.
       - If Wrong: Say "Not quite," and explain why.
    3. IF NO (or history is empty) -> This is a new topic. Explain and ask a question.
    `;

    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: strictContext, mode: "chat" })
      });
      const data = await res.json();
      let aiText = data.answer;

      if (aiText.includes("||VAULT_START||")) {
        const parts = aiText.split("||VAULT_START||");
        const visibleText = parts[0].trim();
        const hiddenPart = parts[1].split("||VAULT_END||")[0];
        
        let topicTitle = "New Mastery";
        if (hiddenPart.includes("Topic:")) {
           topicTitle = hiddenPart.split("Topic:")[1].replace(/\*/g, '').split("\n")[0].trim(); 
        }
        let topicNotes = hiddenPart.replace(/Topic:.*?\n/i, '').replace(/Summary:\s*/i, "").replace(/\*/g, '').trim();

        const isDuplicate = vault.some(v => v.title.toLowerCase() === topicTitle.toLowerCase());

        if (isDuplicate) {
             setMessages(prev => [...prev, { role: "bot", text: `${visibleText}\n\n(Note: You already mastered "${topicTitle}".)` }]);
        } else {
             const { error } = await supabase.from('vault').insert([{ 
               title: topicTitle, 
               status: 'Mastered', 
               notes: topicNotes,
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
      score: score, total_questions: quiz.length, topics_covered: "Mixed Vault Test", user_id: session.user.id
    }]);
    fetchData();
  };

  const avgScore = examResults.length > 0 
    ? Math.round(examResults.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) / examResults.length) : 0;

  // --- UI RENDER (THE ARTWORK) ---
  return (
    <div className="animate-wave flex flex-col h-[100dvh] text-white font-sans overflow-hidden">
      
      {/* 1. HEADER (Minimal & Glass) */}
      <header className="px-6 py-4 flex justify-between items-center z-50">
        <h1 className="font-serif font-bold text-xl tracking-wider text-white drop-shadow-md">POLICYPATH AI 🏛️</h1>
        <div className="flex items-center gap-2">
           <div className="text-[10px] font-bold bg-white/20 px-2 py-1 rounded backdrop-blur-sm">BETA 2.0</div>
           <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold bg-red-500/20 text-red-100 px-3 py-1 rounded border border-red-400/30 hover:bg-red-500 hover:text-white transition">EXIT</button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-32 hide-scrollbar">
        
        {/* TAB: MENTOR (Chat) */}
        {activeTab === 'home' && (
          <div className="space-y-6 max-w-2xl mx-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed shadow-lg ${
                  m.role === 'user' 
                    ? 'bg-[#2872A1] text-white rounded-br-none' // Ocean Blue for User
                    : 'glass-panel text-blue-50 rounded-bl-none' // Glass for AI
                }`}>
                  {m.text}
                  {m.saved && (
                    <div className="mt-3 pt-2 border-t border-white/20 flex items-center gap-2 text-green-300 text-[10px] font-bold uppercase tracking-widest">
                      <span>✓</span> Saved to Vault
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-white/50 text-xs animate-pulse pl-4">Typing...</div>}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* TAB: VAULT (Horizontal Carousel) */}
        {activeTab === 'vault' && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="text-2xl font-serif font-bold text-white px-2">Mastery Vault</h2>
            
            {vault.length === 0 ? (
              <div className="glass-panel p-10 rounded-2xl text-center text-white/60">
                <p>Your vault is empty. Start chatting to master topics.</p>
              </div>
            ) : (
              // CAROUSEL CONTAINER
              <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8 px-2 snap-x">
                {vault.map(v => (
                  <div key={v.id} onClick={() => setSelectedArticle(v)} 
                       className="glass-panel min-w-[280px] w-[280px] h-[380px] p-6 rounded-3xl flex flex-col justify-between snap-center hover:scale-105 transition-transform cursor-pointer border-t border-white/30 relative overflow-hidden group">
                    
                    {/* Decorative Gradient Blob */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/20 rounded-full blur-2xl -translate-y-10 translate-x-10 group-hover:bg-blue-400/30 transition"></div>
                    
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full uppercase tracking-widest">Mastered</span>
                      </div>
                      <h3 className="text-2xl font-serif font-bold mb-2 leading-tight">{v.title}</h3>
                      <p className="text-xs text-blue-100/80 line-clamp-4 leading-relaxed">{v.notes}</p>
                    </div>
                    
                    <button className="text-xs font-bold uppercase tracking-widest text-left text-white/70 group-hover:text-white transition">Read Note →</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB: TEST PORTAL */}
        {activeTab === 'test' && (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in">
            {testState === 'idle' && (
              <div className="glass-panel p-8 rounded-3xl text-center space-y-6 max-w-sm">
                <div className="text-6xl mb-4">🎯</div>
                <h2 className="text-2xl font-serif font-bold">Ready to Prove It?</h2>
                <p className="text-sm text-blue-100/70">Generate a quiz based on your Vault.</p>
                <button onClick={startTest} className="w-full bg-white text-[#2872A1] font-bold py-4 rounded-xl shadow-lg hover:bg-blue-50 transition">GENERATE TEST</button>
              </div>
            )}
            
            {testState === 'loading' && <div className="animate-pulse text-xl font-serif">Constructing Challenge...</div>}
            
            {testState === 'active' && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs text-blue-200 mb-4 uppercase font-bold tracking-widest">
                  <span>Question {currentQIndex + 1}/10</span>
                  <span>Score: {score}</span>
                </div>
                <div className="glass-panel p-8 rounded-3xl mb-6 relative">
                  <p className="font-medium text-lg leading-relaxed">{quiz[currentQIndex].question}</p>
                </div>
                <div className="space-y-3">
                  {quiz[currentQIndex].options.map((opt, i) => (
                    <button key={i} onClick={() => submitAnswer(opt)} className="w-full p-4 text-left glass-panel rounded-xl hover:bg-white hover:text-[#2872A1] transition-all duration-200">{opt}</button>
                  ))}
                </div>
              </div>
            )}

            {testState === 'result' && (
              <div className="glass-panel p-10 rounded-3xl text-center space-y-6">
                <h2 className="text-3xl font-serif font-bold">Result</h2>
                <div className="text-7xl font-bold">{score} <span className="text-2xl text-white/50">/ 10</span></div>
                <button onClick={() => setTestState('idle')} className="text-sm underline opacity-70">Close</button>
              </div>
            )}
          </div>
        )}

        {/* TAB: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in max-w-lg mx-auto">
            <h2 className="text-2xl font-serif font-bold px-2">Performance</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-6 rounded-2xl text-center">
                <div className="text-4xl font-bold mb-1">{vault.length}</div>
                <div className="text-[9px] uppercase tracking-widest text-blue-200">Topics Mastered</div>
              </div>
              <div className="glass-panel p-6 rounded-2xl text-center">
                <div className="text-4xl font-bold mb-1">{avgScore}%</div>
                <div className="text-[9px] uppercase tracking-widest text-blue-200">Avg Accuracy</div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl">
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

      {/* 4. FLOATING DOCK NAVIGATION (The "iPhone" Look) */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-xs">
         <nav className="glass-panel rounded-full px-6 py-3 flex justify-between items-center shadow-2xl backdrop-blur-xl border border-white/20">
            {['home', 'vault', 'test', 'analytics'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`p-2 transition-all duration-300 rounded-full ${
                  activeTab === tab ? 'bg-white text-[#2872A1] shadow-lg scale-110' : 'text-white/70 hover:text-white'
                }`}
              >
                {/* Minimal Icons */}
                {tab === 'home' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>}
                {tab === 'vault' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>}
                {tab === 'test' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>}
                {tab === 'analytics' && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>}
              </button>
            ))}
         </nav>
      </div>
      
      {/* 5. FLOATING INPUT (Above the Dock) */}
      {activeTab === 'home' && (
        <div className="fixed bottom-24 w-full px-4 max-w-xl mx-auto left-0 right-0 z-40">
           <div className="glass-panel p-1 rounded-full flex items-center shadow-xl">
             <input 
               value={query} 
               onChange={e => setQuery(e.target.value)} 
               placeholder="Ask your mentor..." 
               className="flex-1 bg-transparent border-none px-6 py-3 text-sm text-white focus:outline-none placeholder-blue-200/50" 
               onKeyDown={e => e.key === 'Enter' && handleAsk()} 
             />
             <button 
               onClick={handleAsk} 
               disabled={loading} 
               className="bg-[#2872A1] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition"
             >
               {loading ? '...' : '↑'}
             </button>
           </div>
        </div>
      )}

      {/* 6. OVERLAY (Reading Mode) */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[60] bg-[#0F2A3D]/90 backdrop-blur-xl p-6 flex items-center justify-center animate-fade-in">
          <div className="glass-panel w-full max-w-lg h-[80vh] rounded-3xl p-8 overflow-y-auto relative border border-white/20 shadow-2xl">
            <button onClick={() => setSelectedArticle(null)} className="absolute top-6 right-6 text-white/50 hover:text-white text-xl">✕</button>
            <span className="text-[10px] bg-white/10 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">Mastered Note</span>
            <h1 className="text-3xl font-serif font-bold text-white mb-6">{selectedArticle.title}</h1>
            <div className="prose prose-invert prose-sm">
              <p className="text-blue-50 leading-loose font-serif text-lg whitespace-pre-wrap">{selectedArticle.notes}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
