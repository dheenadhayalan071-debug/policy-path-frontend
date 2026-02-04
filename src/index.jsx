import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
        <React.StrictMode>
                <App />
        </React.StrictMode>
)

{/* VAULT TAB: THE INTERACTIVE LIBRARY */}
{activeTab === 'vault' && (
  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
    <div className="flex justify-between items-end mb-6">
      <h2 className="text-lg font-black text-yellow-500 uppercase italic">The Constitutional Vault 📜</h2>
      <span className="text-[10px] font-bold text-purple-300">2 ITEMS SAVED</span>
    </div>

    {vault.map(item => (
      <button 
        key={item.id} 
        onClick={() => {
          setActiveTab('home');
          handleAsk(`Let's review my progress on ${item.title}`);
        }}
        className="w-full p-6 bg-white/5 backdrop-blur-md rounded-[2rem] border border-white/10 flex justify-between items-center text-left hover:bg-white/10 active:scale-[0.98] transition-all shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center border border-purple-500/30">
            <span className="text-lg">{item.id === 1 ? '💎' : '📖'}</span>
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight">{item.title}</h4>
            <p className="text-[10px] text-purple-300 font-black uppercase mt-0.5">{item.date}</p>
          </div>
        </div>
        <span className={`text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-tighter ${
          item.status === 'Mastered' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30'
        }`}>
          {item.status}
        </span>
      </button>
    ))}

    {/* TUTOR'S STRATEGY CARD */}
    <div className="mt-12 p-6 bg-yellow-500/10 border border-yellow-500/20 rounded-[2.5rem] italic">
      <p className="text-[11px] text-yellow-200 leading-relaxed">
        <span className="font-black text-yellow-500 uppercase not-italic">Coach's Tip:</span> "Mastering the Articles is only 50% of the battle, Champ. You need to connect them to the latest Supreme Court judgments. Check back tomorrow for the 'Judgment Hub' update!" 🚀
      </p>
    </div>
  </div>
)}
