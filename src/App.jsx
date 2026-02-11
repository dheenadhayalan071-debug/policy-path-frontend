import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { motion, AnimatePresence } from 'framer-motion';
import Spline from '@splinetool/react-spline';

// CHANGE THIS TO YOUR ACTUAL RENDER BACKEND URL
const BACKEND_URL = "https://policy-path-ai-backend.onrender.com"; 

// --- 1. GATEKEEPER (Auth) ---
export default function App() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session));
    return () => subscription.unsubscribe();
  }, []);

  if (!session) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2872A1] animate-gradient-slow">
        <div className="backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl w-full max-w-md p-10 rounded-3xl animate-fade-in mx-4">
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
                    brand: '#2872A1', 
                    brandAccent: '#154360',
                    inputText: 'white',
                    inputBackground: 'rgba(255,255,255,0.1)',
                    inputBorder: 'rgba(255,255,255,0.3)',
                  },
                  radii: { borderRadiusButton: '12px', inputBorderRadius: '12px' }
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


// --- 2. MAIN APP ---
function MainApp({ session }) {
  const userStorageKey = `pp_chat_history_${session.user.id}`;

  // --- STATES ---
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
  
  // Quiz States
  const [testState, setTestState] = useState("idle"); 
  const [quiz, setQuiz] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);

  // Leaderboard & Profile States
  const [leaderboard, setLeaderboard] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', education_level: '', institution: '', city: ''
  });

  const messagesEndRef = useRef(null);

  // --- XP & STREAK LOGIC (FIXED) ---
  const updateXP = async (amount, type) => {
    if (!session?.user) return;

    // 1. Get current profile
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

    if (!profile) return;

    const lastActive = new Date(profile.last_active);
    const today = new Date();
    
    // Check if we are still on the same day as the last update
    const isSameDay = lastActive.toDateString() === today.toDateString();
    
    // Logic: "Yesterday" for streak calculation
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastActive.toDateString() === yesterday.toDateString();

    let newStreak = profile.streak;
    let xpToAdd = amount;

    // RULE: Don't give "Login XP" if already logged in today
    if (type === 'login') {
        if (isSameDay) return; 
        xpToAdd = 10; // Daily Login Bonus
    }

    // Streak Calculation
    if (!isSameDay) {
        if (isConsecutive) {
            newStreak += 1; 
        } else {
            newStreak = 1; // Broken streak, reset
        }
    }

    // 3. Update Database
    const updates = {
      xp: profile.xp + xpToAdd,
      streak: newStreak,
      last_active: new Date().toISOString(),
      topics_mastered: type === 'mastery' ? profile.topics_mastered + 1 : profile.topics_mastered
    };

    await supabase.from('profiles').update(updates).eq('id', session.user.id);
    fetchLeaderboard();
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username, xp, streak, topics_mastered')
      .order('xp', { ascending: false })
      .limit(10);
    if (data) setLeaderboard(data);
  };

  const saveProfile = async () => {
    const { error } = await supabase.from('profiles').update(formData).eq('id', session.user.id);
    if (!error) {
      alert("Profile Updated!");
      setEditingProfile(false);
      fetchData(); 
    } else {
      alert("Error saving profile.");
    }
  };

  async function fetchData() {
    if (!session?.user) return;
    
    // Vault
    const { data: vData } = await supabase.from('vault').select('*').eq('user_id', session.user.id).order('id', { ascending: false });
    if (vData) setVault(vData);
    
    // Exam Results
    const { data: eData } = await supabase.from('exam_results').select('score, total_questions, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false });
    if (eData) setExamResults(eData);

    // Profile Data
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (profile) {
       setUserProfile(profile);
       setFormData({ 
         full_name: profile.full_name || '', 
         education_level: profile.education_level || '', 
         institution: profile.institution || '', 
         city: profile.city || '' 
       });
    }
  }

  // --- EFFECT HOOKS ---
  useEffect(() => { 
    fetchData(); 
    fetchLeaderboard(); 
    updateXP(0, 'login'); 
  }, [session]);

  useEffect(() => {
    localStorage.setItem(userStorageKey, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, userStorageKey]);

  // --- CORE FEATURES ---
  const handleAsk = async () => {
    if (!query.trim() || loading) return;
    const userQuery = query.trim();
    setLoading(true);
    setQuery(""); 
    
    const newMessages = [...messages, { role: "user", text: userQuery }];
    setMessages(newMessages);

    const historyContext = messages.slice(-3).map(m => `${m.role.toUpperCase()}: ${m.text}`).join("\n");

    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: userQuery, history: historyContext, mode: "chat" })
      });
      
      const data = await res.json();
      let aiText = data.answer;

      if (aiText.includes("||VAULT_START||")) {
        const parts = aiText.split("||VAULT_START||");
        const visibleText = parts[0].trim();
        const hiddenPart = parts[1].split("||VAULT_END||")[0];
        
        let topicTitle = "Constitutional Concept";
        let topicSummary = "Mastered via PolicyPath AI";

        if (hiddenPart.includes("Topic:")) topicTitle = hiddenPart.split("Topic:")[1].split("\n")[0].trim().replace(/\*/g, ''); 
        if (hiddenPart.includes("Summary:")) topicSummary = hiddenPart.split("Summary:")[1].trim().replace(/\*/g, '');

        const isDuplicate = vault.some(v => v.title.toLowerCase() === topicTitle.toLowerCase());

        if (isDuplicate) {
             setMessages(prev => [...prev, { role: "bot", text: `${visibleText}\n\n(Note: You already mastered "${topicTitle}".)` }]);
        } else {
             const { error } = await supabase.from('vault').insert([{ 
               title: topicTitle, status: 'Mastered', notes: topicSummary, user_id: session.user.id
             }]);

             if (!error) {
                  confetti({ particleCount: 150, spread: 60, colors: ['#2872A1', '#CBDDE9'] });
                  setMessages(prev => [...prev, { role: "bot", text: visibleText, saved: true }]);
                  updateXP(25, 'mastery'); 
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

  const startTest = async () => {
    if (vault.length === 0) return alert("Vault is empty. Study first!");
    setTestState("loading");
    
    const topics = vault.map(v => v.title).join(", ");
    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: topics, mode: "quiz", history: "" })
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
    const passed = score > 5;
    const earnedXP = passed ? 10 : 0; 
    
    await supabase.from('exam_results').insert([{
      score: score, total_questions: quiz.length, topics_covered: "Mixed Vault Test", user_id: session.user.id
    }]);
    
    if (earnedXP > 0) updateXP(earnedXP, 'quiz');
    fetchData();
  };

  const avgScore = examResults.length > 0 
    ? Math.round(examResults.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) / examResults.length) : 0;

  // --- UI RENDER ---
  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#CBDDE9] text-white font-sans overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <header className="px-6 py-4 flex justify-between items-center z-50 bg-[#0F2027]/30 backdrop-blur-xl border-b border-white/10 shadow-lg">
        <div className="flex items-center gap-2">
           <span className="text-2xl drop-shadow-md">🏛️</span>
           <h1 className="font-serif font-bold text-lg tracking-wider text-white drop-shadow-md">POLICYPATH</h1>
        </div>
        <div className="flex items-center gap-3">
           <div className="text-[10px] font-bold bg-[#2872A1]/20 text-blue-200 px-2 py-1 rounded border border-[#2872A1]/30 backdrop-blur-md">BETA 2.0</div>
           <button onClick={() => supabase.auth.signOut()} className="text-[10px] font-bold text-red-200/70 hover:text-red-200 transition">EXIT</button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-32 scroll-smooth">
        
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="max-w-3xl mx-auto p-4 space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                <div className={`max-w-[85%] p-5 rounded-2xl text-sm leading-relaxed shadow-xl backdrop-blur-md border border-white/10 ${
                  m.role === 'user' 
                    ? 'bg-[#2872A1]/90 text-white rounded-br-none shadow-[#2872A1]/20' 
                    : 'bg-white/10 text-blue-50 rounded-bl-none shadow-black/20'
                }`}>
                  <div className="whitespace-pre-wrap font-light tracking-wide">{m.text}</div>
                  
                  {m.saved && (
                    <div className="mt-3 pt-2 border-t border-white/20 flex items-center gap-2 text-green-300 text-[10px] font-bold uppercase tracking-widest">
                      <span className="bg-green-500/20 p-1 rounded-full">✓</span> Saved to Vault
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start animate-pulse pl-4">
                 <div className="flex items-center gap-2 text-xs text-blue-200/80 bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-md">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                    The Mentor is drafting...
                 </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {/* TAB 2: VAULT (Physics Edition) */}
        {activeTab === 'vault' && (
          <div className="p-6 max-w-4xl mx-auto space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-6"
            >
              <h2 className="text-3xl font-serif font-bold text-white mb-2 drop-shadow-lg">Mastery Vault 🏆</h2>
              <p className="text-blue-200/70 text-sm">Your knowledge portfolio.</p>
            </motion.div>
            
            {vault.length === 0 ? (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-3xl text-center shadow-2xl">
                <div className="text-4xl mb-4 opacity-50">📭</div>
                <p className="text-white/60">Your vault is empty.</p>
                <button onClick={() => setActiveTab('home')} className="mt-4 text-[#2872A1] font-bold text-sm underline hover:text-blue-300 transition">Start Learning</button>
              </div>
            ) : (
              <motion.div 
                className="flex gap-6 overflow-x-auto hide-scrollbar pb-12 px-2 snap-x"
                initial="hidden"
                animate="visible"
                variants={{
                  visible: { transition: { staggerChildren: 0.1 } } 
                }}
              >
                {vault.map((v, i) => (
                  <motion.div 
                    key={v.id} 
                    onClick={() => setSelectedArticle(v)} 
                    variants={{
                      hidden: { opacity: 0, x: 50, scale: 0.9 },
                      visible: { opacity: 1, x: 0, scale: 1, transition: { type: "spring", stiffness: 100 } }
                    }}
                    whileHover={{ scale: 1.05, rotateZ: 1, transition: { type: "spring", stiffness: 300 } }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-white/5 backdrop-blur-xl min-w-[280px] w-[280px] h-[380px] p-6 rounded-3xl flex flex-col justify-between snap-center cursor-pointer border border-white/10 shadow-2xl relative overflow-hidden group"
                  >
                    <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${
                      i % 3 === 0 ? 'from-blue-500 to-purple-600' : 
                      i % 3 === 1 ? 'from-emerald-500 to-teal-600' : 
                      'from-orange-500 to-red-600'
                    } group-hover:opacity-40 transition-opacity duration-500`}></div>
                    <div className="relative z-10">
                      <span className="text-[10px] bg-white/10 px-2 py-1 rounded-full uppercase tracking-widest text-white/80 border border-white/5 shadow-sm">Mastered</span>
                      <h3 className="text-2xl font-serif font-bold mt-4 mb-2 leading-tight drop-shadow-md text-white">{v.title}</h3>
                      <p className="text-xs text-blue-50/70 line-clamp-4 leading-relaxed font-light">{v.notes}</p>
                    </div>
                    <motion.button className="relative z-10 text-xs font-bold uppercase tracking-widest text-left text-white/50 group-hover:text-white transition-colors flex items-center gap-2">
                      Open Card <span className="text-lg">→</span>
                    </motion.button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* TAB 3: TEST PORTAL */}
        {activeTab === 'test' && (
          <div className="h-full flex flex-col items-center justify-center animate-fade-in p-4">
            {testState === 'idle' && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-[2rem] text-center space-y-6 max-w-sm shadow-2xl">
                <div className="text-6xl mb-4 drop-shadow-lg">🎯</div>
                <h2 className="text-2xl font-serif font-bold">Ready to Prove It?</h2>
                <p className="text-sm text-blue-100/70">Generate a quiz based on your Vault.</p>
                <button onClick={startTest} className="w-full bg-white text-[#0F2027] font-bold py-4 rounded-xl shadow-lg hover:bg-blue-50 hover:scale-105 transition-all">GENERATE TEST</button>
              </div>
            )}
            
            {testState === 'loading' && <div className="animate-pulse text-xl font-serif text-blue-200">Constructing Challenge...</div>}
            
            {testState === 'active' && (
              <div className="w-full max-w-md">
                <div className="flex justify-between text-xs text-blue-200 mb-4 uppercase font-bold tracking-widest">
                  <span>Question {currentQIndex + 1}/10</span>
                  <span>Score: {score}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-3xl mb-6 relative shadow-xl">
                  <p className="font-medium text-lg leading-relaxed">{quiz[currentQIndex].question}</p>
                </div>
                <div className="space-y-3">
                  {quiz[currentQIndex].options.map((opt, i) => (
                    <button key={i} onClick={() => submitAnswer(opt)} className="w-full p-4 text-left bg-white/5 border border-white/10 rounded-xl hover:bg-white hover:text-[#2872A1] transition-all duration-200 backdrop-blur-md">{opt}</button>
                  ))}
                </div>
              </div>
            )}

            {testState === 'result' && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-3xl text-center space-y-6 shadow-2xl">
                <h2 className="text-3xl font-serif font-bold">Result</h2>
                <div className="text-7xl font-bold drop-shadow-lg">{score} <span className="text-2xl text-white/50">/ 10</span></div>
                <button onClick={() => setTestState('idle')} className="text-sm underline opacity-70 hover:opacity-100 transition">Close</button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-fade-in max-w-lg mx-auto p-4">
            <h2 className="text-2xl font-serif font-bold px-2 drop-shadow-md">Performance</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center shadow-lg hover:bg-white/10 transition">
                <div className="text-4xl font-bold mb-1 drop-shadow-md">{vault.length}</div>
                <div className="text-[9px] uppercase tracking-widest text-blue-200">Topics Mastered</div>
              </div>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl text-center shadow-lg hover:bg-white/10 transition">
                <div className="text-4xl font-bold mb-1 drop-shadow-md">{avgScore}%</div>
                <div className="text-[9px] uppercase tracking-widest text-blue-200">Avg Accuracy</div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
               <h3 className="text-xs font-bold uppercase tracking-widest mb-6 opacity-70">Recent Activity</h3>
               <div className="space-y-4">
               {examResults.length === 0 ? <p className="text-xs opacity-50">No data yet.</p> : 
                 examResults.slice(0, 5).map((res, i) => (
                 <div key={i} className="flex justify-between text-sm items-center pb-3 border-b border-white/10 last:border-0">
                   <span className="text-blue-100/80">{res.created_at ? new Date(res.created_at).toLocaleDateString() : 'Today'}</span>
                   <span className="font-bold bg-white/10 px-2 py-1 rounded text-xs border border-white/5">{res.score}/{res.total_questions}</span>
                 </div>
               ))}
               </div>
            </div>
          </div>
        )}

        {/* TAB 5: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="p-6 max-w-lg mx-auto space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif font-bold text-white drop-shadow-lg">Hall of Fame 👑</h2>
              <p className="text-blue-200/70 text-sm">Top Scholars Globally</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
              {leaderboard.map((user, index) => (
                <div key={index} className={`flex items-center justify-between p-4 border-b border-white/5 last:border-0 ${index === 0 ? 'bg-yellow-500/10' : ''}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      index === 0 ? 'bg-yellow-400 text-black' : 
                      index === 1 ? 'bg-gray-300 text-black' : 
                      index === 2 ? 'bg-orange-400 text-black' : 'bg-white/10 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-white">{user.username}</div>
                      <div className="text-[10px] text-blue-200 flex gap-2">
                        <span>🔥 {user.streak} Day Streak</span>
                        <span>📚 {user.topics_mastered} Mastered</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-xl font-bold text-blue-300 drop-shadow-md">{user.xp} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === 'profile' && (
          <div className="p-6 max-w-lg mx-auto animate-fade-in">
            <h2 className="text-3xl font-serif font-bold text-white mb-6 drop-shadow-lg text-center">Student ID 🪪</h2>
            
            {/* ID CARD DISPLAY */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl relative overflow-hidden mb-8">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
               
               <div className="flex items-center gap-4 mb-6">
                 <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-2xl shadow-lg">
                   {userProfile?.student_level?.includes('Grandmaster') ? '👑' : '🎓'}
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-white">{userProfile?.full_name || session.user.email.split('@')[0]}</h3>
                   <span className="text-xs bg-blue-500/30 px-2 py-1 rounded text-blue-100 border border-blue-400/30">
                     {userProfile?.student_level || 'Novice 🌱'}
                   </span>
                 </div>
               </div>

               <div className="space-y-3 text-sm text-blue-100/80">
                 <div className="flex justify-between border-b border-white/5 pb-2">
                   <span>🎓 Education</span>
                   <span className="font-bold text-white">{userProfile?.education_level || 'Not set'}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/5 pb-2">
                   <span>🏫 Institution</span>
                   <span className="font-bold text-white">{userProfile?.institution || 'Not set'}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/5 pb-2">
                   <span>📍 City</span>
                   <span className="font-bold text-white">{userProfile?.city || 'Not set'}</span>
                 </div>
               </div>

               <button onClick={() => setEditingProfile(true)} className="mt-6 w-full bg-white/10 hover:bg-white/20 py-2 rounded-xl text-xs uppercase tracking-widest font-bold transition">
                 Edit Profile
               </button>
            </div>

            {/* EDIT MODAL OVERLAY */}
            {editingProfile && (
              <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                <div className="bg-[#1a2c38] w-full max-w-md rounded-3xl p-6 border border-white/10 shadow-2xl">
                  <h3 className="text-xl font-bold mb-4">Edit Details</h3>
                  <div className="space-y-4">
                    <input 
                      placeholder="Full Name" 
                      value={formData.full_name} 
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-400"
                    />
                    <input 
                      placeholder="Class / Degree (e.g. 12th Grade)" 
                      value={formData.education_level} 
                      onChange={e => setFormData({...formData, education_level: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-400"
                    />
                    <input 
                      placeholder="School / College" 
                      value={formData.institution} 
                      onChange={e => setFormData({...formData, institution: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-400"
                    />
                    <input 
                      placeholder="City" 
                      value={formData.city} 
                      onChange={e => setFormData({...formData, city: e.target.value})}
                      className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setEditingProfile(false)} className="flex-1 py-3 rounded-xl text-white/50 hover:bg-white/5">Cancel</button>
                    <button onClick={saveProfile} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold shadow-lg">Save</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </main>

      {/* 3. INPUT AREA (Home only) */}
      {activeTab === 'home' && (
        <div className="fixed bottom-24 w-full px-4 max-w-2xl mx-auto left-0 right-0 z-40">
           <div className="bg-[#0F2027]/60 backdrop-blur-2xl border border-white/20 p-2 rounded-full flex items-center shadow-2xl ring-1 ring-white/10">
             <input 
               value={query} 
               onChange={e => setQuery(e.target.value)} 
               placeholder="Ask about Article 21, Preamble..." 
               className="flex-1 bg-transparent border-none px-4 py-2 text-sm text-white focus:outline-none placeholder-blue-200/50 font-light" 
               onKeyDown={e => e.key === 'Enter' && handleAsk()} 
               disabled={loading}
             />
             <button 
               onClick={handleAsk} 
               disabled={loading || !query.trim()} 
               className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all ${
                 loading || !query.trim() ? 'bg-white/5 text-white/30' : 'bg-[#2872A1] text-white hover:scale-110 hover:shadow-blue-500/50'
               }`}
             >
               {loading ? '●' : '↑'}
             </button>
           </div>
        </div>
      )}

      {/* 4. BOTTOM NAVIGATION */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
         <nav className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 flex gap-6 shadow-2xl ring-1 ring-white/5">
            {[
              { id: 'home', icon: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/> },
              { id: 'vault', icon: <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/> },
              { id: 'test', icon: <><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></> },
              { id: 'analytics', icon: <><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></> },
              { id: 'leaderboard', icon: <path d="M6 9H12V21H6V9ZM18 15H12V21H18V15ZM12 3L2 21H22L12 3Z" /> },
              { id: 'profile', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                className={`p-2 transition-all duration-300 rounded-full relative ${
                  activeTab === tab.id ? 'text-white scale-125 drop-shadow-glow' : 'text-white/40 hover:text-white hover:scale-110'
                }`}
              >
                {activeTab === tab.id && <div className="absolute inset-0 bg-white/20 blur-lg rounded-full"></div>}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                  {tab.icon}
                </svg>
              </button>
            ))}
         </nav>
      </div>

      {/* 5. READING MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[60] bg-[#0F2027]/90 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#1a2c38]/80 w-full max-w-lg max-h-[80vh] rounded-[2rem] p-8 overflow-y-auto border border-white/10 relative shadow-2xl ring-1 ring-white/5">
            <button onClick={() => setSelectedArticle(null)} className="absolute top-6 right-6 bg-white/10 hover:bg-white/20 w-8 h-8 rounded-full flex items-center justify-center text-white/70 transition-all">✕</button>
            <h1 className="text-3xl font-serif font-bold text-white mb-6 drop-shadow-md">{selectedArticle.title}</h1>
            <div className="text-blue-100/90 leading-loose font-serif whitespace-pre-wrap text-lg">
              {selectedArticle.notes}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <span className="text-xs text-white/30 uppercase tracking-widest font-bold">Keep Reviewing to retain mastery</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
