import React, { useState, useEffect, useRef } from 'react';

export default function App() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! I am your PolicyPath Tutor. Ask me anything about the Indian Constitution." }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleAsk = async () => {
    if (!query.trim()) return;
    
    const userMessage = query.trim();
    setLoading(true);
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setQuery("");

    // Mock Logic
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: "bot", 
        text: `Based on your question about "${userMessage}", I can tell you that PolicyPath AI is currently being configured to provide accurate legal information. In the meantime, did you know that the Indian Constitution is the longest written constitution of any sovereign country in the world?` 
      }]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 font-sans">
      {/* Professional Header */}
      <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">PolicyPath AI 🇮🇳</h1>
          <div className="text-xs bg-blue-600 px-2 py-1 rounded-full border border-blue-400">Beta</div>
        </div>
      </header>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] sm:max-w-[70%] p-4 rounded-2xl shadow-sm border ${
                m.role === 'user' 
                  ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                  : 'bg-white text-slate-800 border-slate-200 rounded-tl-none'
              }`}>
                <p className="text-sm sm:text-base leading-relaxed">{m.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Large Input Area */}
      <div className="bg-white border-t p-4 pb-8 sm:pb-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input 
            className="flex-1 p-4 bg-slate-100 border-none rounded-2xl text-slate-900 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-base"
            placeholder="Ask about the Indian Constitution..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
            disabled={loading}
          />
          <button 
            onClick={handleAsk}
            disabled={loading || !query.trim()}
            className={`px-6 rounded-2xl font-bold transition-all flex items-center justify-center ${
              loading || !query.trim()
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-blue-700 text-white hover:bg-blue-800 active:scale-95 shadow-lg shadow-blue-200'
            }`}
          >
            {loading ? '...' : 'Ask'}
          </button>
        </div>
      </div>
    </div>
  );
}
