import React, { useState, useEffect } from 'react';
// Note: To use confetti, the Agent will need to run: npm install canvas-confetti
import confetti from 'canvas-confetti';

export default function App() {
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState(12);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Welcome back, Aspirant. Your streak is alive. Shall we master the Preamble today?", type: "mentor" }
  ]);
  const [displayedText, setDisplayedText] = useState(""); // For Typewriter Effect

  // Typewriter Effect Logic (Option B)
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "bot") {
      let i = 0;
      setDisplayedText("");
      const interval = setInterval(() => {
        setDisplayedText((prev) => prev + lastMessage.text.charAt(i));
        i++;
        if (i >= lastMessage.text.length) clearInterval(interval);
      }, 30); // Speed of the "Mentor's Voice"
      return () => clearInterval(interval);
    }
  }, [messages]);

  const triggerCelebration = () => {
    confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#1D4ED8', '#60A5FA', '#FBBF24'] });
  };

  const handleAsk = (textToQuery = query) => {
    if (!textToQuery) return;
    setMessages(prev => [...prev, { role: "user", text: textToQuery }]);
    setQuery("");

    setTimeout(() => {
      const newProgress = Math.min(progress + 8, 100);
      if (newProgress >= 20 && progress < 20) triggerCelebration(); // Gamification trigger
      setProgress(newProgress);
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: `Mastering ${textToQuery} is a major step. This falls under Part III of the Constitution.`, 
        citation: "Article 13: Laws inconsistent with or in derogation of the fundamental rights." 
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-900 text-white font-sans overflow-hidden">
      
      {/* 1. GLASSMORPHISM HEADER */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-lg bg-blue-900/40 border-b border-white/10 p-5 shadow-2xl">
        <div className="max-w-xl mx-auto flex justify-between items-center">
          <div onClick={() => setSidebarOpen(true)} className="p-2 bg-white/10 rounded-lg active:scale-90 transition-transform">
             <span className="text-xl">🏛️</span> 
          </div>
          <div className="text-center">
            <h1 className="text-lg font-black tracking-tighter uppercase italic">PolicyPath AI</h1>
            <div className="flex items-center gap-2 justify-center">
              <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-1000" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="text-[10px] font-bold text-blue-300">{progress}%</span>
            </div>
          </div>
          <div className="bg-orange-500/20 px-3 py-1 rounded-full border border-orange-500/40 text-[10px] font-black text-orange-400">5 🔥</div>
        </div>
      </header>

      {/* 2. THE CONSTITUTIONAL VAULT (Sidebar) */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-800/95 backdrop-blur-xl z-[60] transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out border-r border-white/10 p-6 shadow-2xl`}>
        <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 text-slate-400">✕</button>
        <h2 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-6 mt-4">The Vault</h2>
        <div className="space-y-4">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 text-[11px] font-medium text-slate-300">✓ Preamble Mastery</div>
          <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[11px] font-bold text-blue-400 italic">→ Union & Territory</div>
        </div>
      </div>

      {/* 3. CHAT AREA */}
      <main className="flex-1 overflow-y-auto pt-32 pb-40 px-4">
        <div className="max-w-xl mx-auto space-y-8">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
              <div className={`max-w-[85%] p-5 rounded-3xl shadow-2xl ${
                m.role === 'user' 
                ? 'bg-blue-600 border border-blue-400/50 rounded-tr-none' 
                : 'bg-white/5 backdrop-blur-md border border-white/10 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed font-medium">
                  {i === messages.length - 1 && m.role === 'bot' ? displayedText : m.text}
                </p>
                {m.citation && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Citation</span>
                    <p className="text-[11px] text-slate-400 mt-1 italic font-serif">"{m.citation}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* 4. FLOATING INPUT BAR */}
      <div className="fixed bottom-8 w-full px-4 z-50">
        <div className="max-w-xl mx-auto">
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 px-2">
            {["Article 13", "Mastery Quiz", "Drafting Comm."].map(chip => (
              <button key={chip} onClick={() => handleAsk(chip)} className="whitespace-nowrap px-4 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full text-[10px] font-bold hover:bg-white/10 transition-colors uppercase tracking-tight">{chip}</button>
            ))}
          </div>
          <div className="relative group">
            <input 
              className="w-full pl-6 pr-16 py-5 bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[2rem] text-sm focus:ring-4 focus:ring-blue-500/30 transition-all shadow-2xl placeholder:text-slate-500"
              placeholder="Ask your Mentor..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
            />
            <button 
              onClick={() => handleAsk()}
              className="absolute right-3 top-3 bg-blue-600 p-3 rounded-full shadow-lg active:scale-90 transition-transform hover:bg-blue-500"
            >
              🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
