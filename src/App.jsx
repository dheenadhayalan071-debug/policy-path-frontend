import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

const BACKEND_URL = "https://policy-path-ai-backend.onrender.com";

const STORAGE_KEYS = {
  MESSAGES: 'pp_messages',
  PROGRESS: 'pp_progress',
  VAULT: 'pp_vault'
};

export default function App() {
  // Persistence Engine: Initialize from localStorage
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    return saved ? JSON.parse(saved) : [
      { role: "bot", text: "Welcome back, Aspirant. Your streak is alive. Shall we master the Preamble today?", type: "mentor", isHistory: true }
    ];
  });

  const [progress, setProgress] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return saved ? JSON.parse(saved) : 12;
  });

  const [vault, setVault] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VAULT);
    return saved ? JSON.parse(saved) : [
      { id: 1, title: "Preamble Mastery", status: "Mastered", date: "Feb 3" },
      { id: 2, title: "Article 1-4", status: "In Progress", date: "Feb 4" }
    ];
  });

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [activeTab, setActiveTab] = useState('home');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-save hook
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(vault));
  }, [messages, progress, vault]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, displayedText, activeTab]);

  // Typewriter Effect
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "bot" && !lastMessage.isHistory) {
      let i = 0;
      setDisplayedText("");
      const interval = setInterval(() => {
        setDisplayedText((prev) => prev + lastMessage.text.charAt(i));
        i++;
        if (i >= lastMessage.text.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    } else if (lastMessage?.role === "bot") {
      setDisplayedText(lastMessage.text);
    }
  }, [messages]);

  const triggerCelebration = () => {
    confetti({ 
      particleCount: 150, 
      spread: 70, 
      origin: { y: 0.6 }, 
      colors: ['#FBBF24', '#1D4ED8', '#60A5FA'] 
    });
  };

  const handleAsk = async (textToQuery = query) => {
    if (!textToQuery.trim() || loading) return;
    
    const userQuery = textToQuery.trim();
    setLoading(true);
    setQuery("");
    
    // Save user query
    setMessages(prev => [...prev, { role: "user", text: userQuery }]);

    try {
      const response = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: userQuery })
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();

      setMessages(prev => [...prev, { 
        role: "bot", 
        text: data.answer || "I am processing the legal frameworks...",
        citation: data.citation || null,
        isHistory: false
      }]);

      if (data.progress_boost) {
        setProgress(prev => {
          const next = Math.min(prev + data.progress_boost, 100);
          triggerCelebration();
          return next;
        });
      }

    } catch (error) {
      console.error("Mentor Error:", error);
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: "The path to knowledge occasionally faces obstacles, Aspirant. My connection to the central archives is momentarily unstable. Please, rephrase your query or wait a moment.",
        isHistory: false
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-900 text-white font-['Inter',sans-serif] overflow-hidden animate-wave">
      
      {/* PRESTIGE HEADER */}
      <header className="pt-8 pb-4 px-6 backdrop-blur-xl bg-black/30 border-b border-yellow-500/20 sticky top-0 z-50">
        <div className="flex justify-between items-center max-w-xl mx-auto">
          <div>
            <h1 className="text-xl font-['Cinzel',serif] font-black italic tracking-tighter text-yellow-400">
              POLICYPATH AI 🏛️
            </h1>
            <p className="text-[9px] font-['Inter',sans-serif] font-bold text-purple-200 uppercase tracking-[0.2em]">The Coach's Edition</p>
          </div>
          <div className="bg-yellow-500/20 px-3 py-1 rounded-full border border-yellow-500/50 text-[10px] font-['Inter',sans-serif] font-black text-yellow-500">
            STREAK: 7🔥
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-40">
        <div className="max-w-xl mx-auto">
          
          {activeTab === 'home' && (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in`}>
                  <div className={`max-w-[88%] p-5 rounded-[2rem] shadow-2xl backdrop-blur-md ${
                    m.role === 'user' ? 'bg-purple-700/60 border border-purple-400/30' : 'bg-white/10 border border-white/10'
                  }`}>
                    <p className="text-sm font-['Inter',sans-serif] font-medium leading-relaxed">
                      {i === messages.length - 1 && m.role === 'bot' ? displayedText : m.text}
                    </p>
                    {m.citation && (
                      <div className="mt-4 pt-3 border-t border-white/10">
                        <span className="text-[9px] font-['Cinzel',serif] font-black text-yellow-500 uppercase tracking-widest">Citation</span>
                        <p className="text-[11px] font-['Cinzel',serif] text-purple-200 mt-1 italic">"{m.citation}"</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {loading && <div className="text-yellow-500 text-[10px] font-['Inter',sans-serif] font-black animate-pulse uppercase">Coach is synthesizing...</div>}
              <div ref={messagesEndRef} />
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="space-y-4 animate-in fade-in">
              <h2 className="text-lg font-['Cinzel',serif] font-black text-yellow-500 uppercase italic mb-6">The Constitutional Vault 📜</h2>
              {vault.map(item => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedArticle(item)}
                  className="p-5 bg-white/5 rounded-3xl border border-white/10 flex justify-between items-center active:scale-95 transition-transform cursor-pointer shadow-lg"
                >
                  <div>
                    <h4 className="text-sm font-['Inter',sans-serif] font-bold text-white">{item.title}</h4>
                    <p className="text-[10px] text-purple-300 font-['Inter',sans-serif] font-medium uppercase mt-1">{item.date}</p>
                  </div>
                  <span className={`text-[10px] font-['Inter',sans-serif] font-black px-3 py-1 rounded-full ${item.status === 'Mastered' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-500'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
              <h2 className="text-lg font-['Cinzel',serif] font-black text-yellow-500 uppercase italic">Rank Projection 📈</h2>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                 <p className="text-purple-200">Current Progress: {progress}%</p>
                 <div className="w-full bg-white/10 h-2 rounded-full mt-4">
                   <div className="bg-yellow-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'exam' && (
            <div className="space-y-8 animate-in zoom-in text-center py-20">
               <span className="text-6xl mb-4 block">🎯</span>
               <h2 className="text-2xl font-['Cinzel',serif] font-black text-yellow-400 uppercase tracking-widest">Mock Exam Portal</h2>
               <p className="text-purple-200 font-medium">Prepare for the challenge. Coming in Phase 3.</p>
               <button className="mt-8 px-8 py-4 bg-yellow-500 text-purple-900 font-black rounded-full uppercase tracking-widest shadow-xl active:scale-95">Enroll Now</button>
            </div>
          )}
        </div>
      </main>

      {/* INPUT & NAV FIXED GROUP */}
      <section className="fixed bottom-0 w-full z-50">
        {activeTab === 'home' && (
          <div className="px-6 pb-4">
            <div className="max-w-xl mx-auto flex gap-2">
              <input 
                className="flex-1 px-6 py-4 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2rem] text-sm text-white placeholder:text-purple-300/50 outline-none focus:ring-2 focus:ring-yellow-500/50" 
                placeholder={loading ? "Coach is connecting..." : "Ask your Mentor..."} 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()} 
                disabled={loading}
              />
              <button 
                onClick={() => handleAsk()} 
                disabled={loading || !query.trim()}
                className={`w-14 h-14 flex items-center justify-center rounded-full shadow-xl transition-all ${
                  loading || !query.trim() ? 'bg-slate-700 text-slate-500' : 'bg-yellow-500 text-purple-900 hover:scale-105 active:scale-90'
                }`}
              >
                {loading ? '⏳' : '🚀'}
              </button>
            </div>
          </div>
        )}

        <nav className="pb-8 pt-4 px-8 backdrop-blur-3xl bg-black/60 border-t border-white/10">
          <div className="max-w-xl mx-auto flex justify-between items-center">
            {['home', 'vault', 'analytics', 'exam'].map(id => (
              <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center gap-1.5 transition-all ${activeTab === id ? 'text-yellow-400 scale-110' : 'text-slate-500'}`}>
                <span className="text-xl">{id === 'home' ? '⚡' : id === 'vault' ? '📜' : id === 'analytics' ? '📈' : '🎯'}</span>
                <span className="text-[9px] font-['Inter',sans-serif] font-black uppercase tracking-widest">{id}</span>
              </button>
            ))}
          </div>
        </nav>
      </section>

      {/* FULL SCREEN READING MODE OVERLAY */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[100] bg-slate-900 animate-in slide-in-from-bottom duration-500">
          <header className="p-6 border-b border-white/10 flex justify-between items-center bg-black/20 backdrop-blur-xl sticky top-0">
            <button onClick={() => setSelectedArticle(null)} className="text-yellow-500 font-['Inter',sans-serif] font-black tracking-widest text-[10px] uppercase">← Back to Vault</button>
            <span className="text-[10px] font-['Inter',sans-serif] font-black text-purple-300 uppercase tracking-widest italic">Document View</span>
          </header>
          
          <article className="p-8 overflow-y-auto h-full pb-32">
            <h2 className="text-3xl font-['Cinzel',serif] font-black text-yellow-500 italic leading-tight mb-8">
              {selectedArticle.title}
            </h2>
            <div className="space-y-6 font-['Cinzel',serif] text-lg text-purple-100 leading-relaxed">
              <p className="italic border-l-2 border-yellow-500/30 pl-4 py-2 bg-yellow-500/5">
                "The Constitution is not a mere lawyer's document, it is a vehicle of Life, and its spirit is always the spirit of Age."
              </p>
              <p>
                This space serves as your personalized deep-dive archive for <strong>{selectedArticle.title}</strong>. 
                In the next phase, we will fetch the real Constitutional clauses and case study notes directly from the AI server.
              </p>
              <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                <h4 className="text-yellow-500 text-xs font-['Inter',sans-serif] font-black uppercase tracking-widest mb-4 underline decoration-yellow-500/30">Coach's Focus Notes</h4>
                <p className="text-sm font-['Inter',sans-serif] text-purple-200">
                  Focus on the "Basic Structure Doctrine" connections here. UPSC often links this concept to the Kesavananda Bharati case.
                </p>
              </div>
            </div>
          </article>
        </div>
      )}

    </div>
  );
}
