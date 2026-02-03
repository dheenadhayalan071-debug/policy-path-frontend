import React, { useState } from 'react';

export default function App() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! I am your PolicyPath Tutor. Ask me anything about the Indian Constitution." }
  ]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query) return;
    setLoading(true);
    
    // 1. Add user query to the list
    setMessages(prev => [...prev, { role: "user", text: query }]);
    setQuery("");

    // 2. Mock Logic (For now) - This is where Chandani's link will go later
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "bot", text: "I'm connecting to the backend... Soon I'll answer that for real!" }]);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 p-4 font-sans">
      <header className="py-4 border-b">
        <h1 className="text-xl font-bold text-blue-700 text-center">PolicyPath AI 🇮🇳</h1>
      </header>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-slate-800'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-slate-400 text-sm animate-pulse">Tutor is thinking...</div>}
      </div>

      {/* Input Area */}
      <div className="flex gap-2 pb-6">
        <input 
          className="flex-1 p-4 border rounded-full shadow-inner focus:outline-none"
          placeholder="Ask a question..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button 
          onClick={handleAsk}
          className="bg-blue-700 text-white p-4 rounded-full shadow-lg active:scale-95 transition-transform"
        >
          Ask
        </button>
      </div>
    </div>
  );
}
