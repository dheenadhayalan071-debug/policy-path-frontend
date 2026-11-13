import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = "https://policy-path-ai-backend-1.onrender.com";

// --- 1. THE FRONT DOOR (Landing Page + Auth Modal Wrapper) ---
export default function App() {
  const [session, setSession] = useState(null);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      return localStorage.getItem('pp_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('pp_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('pp_theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsInitialLoad(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setShowAuthModal(false);
        setIsGuestMode(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const authAppearance = {
    theme: ThemeSupa,
    variables: {
      default: {
        colors: {
          brand: '#FF6B00',
          brandAccent: '#E66000',
          inputText: isDarkMode ? '#F9FAFB' : '#111827',
          inputBackground: isDarkMode ? '#141D2B' : '#FFFFFF',
          inputBorder: isDarkMode ? '#283548' : '#E5E7EB',
        },
        radii: {
          borderRadiusButton: '12px',
          buttonBorderRadius: '12px',
          inputBorderRadius: '12px',
        },
      },
    },
  };

  if (isInitialLoad) {
    return <div className="h-screen w-screen bg-[#FFFFFF] dark:bg-[#0F1724]" />;
  }

  // EXPLICIT LANDING PAGE
  if (!session && !isGuestMode) {
    return (
      <div className="h-[100dvh] w-screen flex flex-col items-center justify-center bg-[#F9FAFB] dark:bg-[#0F1724] overflow-y-auto px-4 py-8 relative">
        {/* Top-Right Theme Toggle */}
        <button
          onClick={() => setIsDarkMode((d) => !d)}
          aria-label="Toggle Dark Mode"
          className="fixed top-5 right-5 z-20 surface-card px-3 py-2 text-xs font-semibold text-[#111827] dark:text-white flex items-center gap-2 hover:border-[#FF6B00] transition"
        >
          <span>{isDarkMode ? '☀️' : '🌙'}</span>
          <span>{isDarkMode ? 'Light' : 'Dark'}</span>
        </button>

        <div className="surface-card-elevated w-full max-w-md p-8 sm:p-10 animate-fade-in relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[12px] bg-[#FF6B00]/10 text-[#FF6B00] text-[11px] font-bold uppercase tracking-widest mb-4">
              UPSC Polity & Governance
            </div>
            <h1 className="text-3xl font-serif font-black text-[#1A2332] dark:text-white mb-2 tracking-tight">
              POLICYPATH AI
            </h1>
            <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
              Your Personal Constitution Mentor
            </p>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={authAppearance}
            theme={isDarkMode ? 'dark' : 'light'}
            providers={['google']}
          />

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="text-[#9CA3AF] text-[11px] font-semibold uppercase tracking-widest">
              — OR —
            </div>
            <button
              onClick={() => setIsGuestMode(true)}
              className="w-full bg-[#1A2332] hover:bg-[#243044] text-white font-semibold py-3 rounded-[12px] transition-colors shadow-sm text-sm"
            >
              Continue as Guest
            </button>
            <p className="text-[11px] text-[#9CA3AF] text-center mt-1">
              Guests can chat, but need an account to save to the Vault.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <MainApp
        session={session}
        triggerAuth={() => setShowAuthModal(true)}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode((d) => !d)}
      />

      {/* Auth Modal overlay triggers when protected tab clicked mid-app */}
      <AnimatePresence>
        {showAuthModal && !session && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-[#111827]/60 px-4"
          >
            <motion.div
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              className="surface-card-elevated w-full max-w-md p-8 sm:p-10 relative"
            >
              <button
                onClick={() => setShowAuthModal(false)}
                className="absolute top-4 right-5 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-serif font-bold text-[#1A2332] dark:text-white mb-1">
                  Unlock PolicyPath
                </h1>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                  Save your progress, take tests, and view analytics.
                </p>
              </div>
              <Auth
                supabaseClient={supabase}
                appearance={authAppearance}
                theme={isDarkMode ? 'dark' : 'light'}
                providers={['google']}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// --- 2. MAIN APP ---
function MainApp({ session, triggerAuth, isDarkMode, toggleDarkMode }) {
  const userStorageKey = session ? `pp_chat_history_${session.user.id}` : `pp_chat_history_guest`;

  // --- STATES ---
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(userStorageKey);
    return saved
      ? JSON.parse(saved)
      : [{ role: "bot", text: "Welcome. I am ready to guide you through the Constitution. Ask me anything to start.", type: "mentor" }];
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
  const [selectedOption, setSelectedOption] = useState(null);

  // Profile & Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', education_level: '', institution: '', city: '' });
  const [isNewUser, setIsNewUser] = useState(false);
  const [viewingSwot, setViewingSwot] = useState(null);

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef(null);

  // Tab Navigation Protection
  const handleTabChange = (tabName) => {
    setIsSidebarOpen(false);
    if (!session && tabName !== 'home') {
      triggerAuth();
      return;
    }
    setActiveTab(tabName);
  };

  // --- XP & STREAK LOGIC ---
  const updateXP = async (amount, type) => {
    if (!session?.user) return;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
    if (!profile) return;

    const lastActive = new Date(profile.last_active);
    const today = new Date();
    const isSameDay = lastActive.toDateString() === today.toDateString();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastActive.toDateString() === yesterday.toDateString();

    let newStreak = profile.streak;
    let xpToAdd = amount;

    if (type === 'login' && !isSameDay) {
      xpToAdd = 10;
    }

    if (!isSameDay) {
      if (isConsecutive) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const updates = {
      xp: profile.xp + xpToAdd,
      streak: newStreak,
      last_active: new Date().toISOString(),
      topics_mastered: type === 'mastery' ? profile.topics_mastered + 1 : profile.topics_mastered,
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
    if (!formData.full_name) return alert("Name is required!");
    const { error } = await supabase.from('profiles').update(formData).eq('id', session.user.id);
    if (!error) {
      alert("Profile Saved Successfully!");
      setUserProfile((prev) => ({ ...prev, ...formData }));
      setEditingProfile(false);
      setIsNewUser(false);
      fetchData();
    } else {
      alert("Error saving: " + error.message);
    }
  };

  async function fetchData() {
    if (!session?.user) return;
    try {
      const { data: vData } = await supabase
        .from('vault')
        .select('*')
        .eq('user_id', session.user.id)
        .order('id', { ascending: false });
      if (vData) setVault(vData);

      const { data: eData } = await supabase
        .from('exam_results')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });
      if (eData) setExamResults(eData);

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setUserProfile(profile);
        setFormData((prev) => ({
          full_name: profile.full_name || prev.full_name || '',
          education_level: profile.education_level || prev.education_level || '',
          institution: profile.institution || prev.institution || '',
          city: profile.city || prev.city || '',
        }));

        if (!profile.full_name || profile.full_name.trim() === "") {
          setIsNewUser(true);
          setEditingProfile(true);
        } else {
          setIsNewUser(false);
        }
      }
    } catch (err) {
      console.error("Unexpected Error:", err);
    }
  }

  // --- EFFECT HOOKS ---
  useEffect(() => {
    fetchData();
    fetchLeaderboard();
    if (session) updateXP(0, 'login');
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

    const historyContext = messages
      .slice(-3)
      .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
      .join("\n");

    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: userQuery, history: historyContext, mode: "chat" }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      let aiText = data.answer;

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

        if (session) {
          const isDuplicate = vault.some((v) => v.title.toLowerCase() === topicTitle.toLowerCase());
          if (isDuplicate) {
            setMessages((prev) => [
              ...prev,
              { role: "bot", text: `${visibleText}\n\n(Note: You already mastered "${topicTitle}".)` },
            ]);
          } else {
            const { error } = await supabase.from('vault').insert([
              { title: topicTitle, status: 'Mastered', notes: topicSummary, user_id: session.user.id },
            ]);

            if (!error) {
              confetti({ particleCount: 150, spread: 60, colors: ['#FF6B00', '#10B981', '#1A2332'] });
              setMessages((prev) => [...prev, { role: "bot", text: visibleText, saved: true }]);
              updateXP(25, 'mastery');
              fetchData();
            } else {
              setMessages((prev) => [...prev, { role: "bot", text: visibleText }]);
            }
          }
        } else {
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: `${visibleText}\n\n*(Login to save this to your Vault!)*` },
          ]);
        }
      } else {
        setMessages((prev) => [...prev, { role: "bot", text: aiText }]);
      }
    } catch (e) {
      setMessages((prev) => [...prev, { role: "bot", text: `⚠️ Network Error. Please try again.` }]);
    } finally {
      setLoading(false);
    }
  };

  const startTest = async () => {
    if (vault.length === 0) return alert("Vault is empty. Study first!");
    setTestState("loading");

    const topics = vault.map((v) => v.title).join(", ");
    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: topics, mode: "quiz", history: "" }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const jsonStr = data.answer.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(jsonStr);
      const questionsList = Array.isArray(parsed) ? parsed : parsed.questions;

      if (!questionsList || questionsList.length === 0) {
        throw new Error("No questions returned");
      }

      setQuiz(questionsList.slice(0, 10));
      setScore(0);
      setCurrentQIndex(0);
      setTestState("active");
    } catch (e) {
      console.error("Quiz Gen Error:", e);
      setTestState("idle");
      alert(`Error generating test: ${e.message}`);
    }
  };

  const finishTest = async () => {
    setTestState("result");
    const passed = score > 5;
    const earnedXP = passed ? 10 : 0;

    let aiSwot = "Strengths: Good start.\nWeakness: Needs revision.";
    try {
      const prompt = `Analyze this test performance: Score ${score}/10. Topics: Mixed Constitution. 
      Generate a brief 4-line SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) addressed to the student.`;

      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: prompt, history: "", mode: "chat" }),
      });
      const data = await res.json();
      aiSwot = data.answer;
    } catch (e) {
      console.error("SWOT Gen Failed");
    }

    await supabase.from('exam_results').insert([
      {
        score: score,
        total_questions: quiz.length,
        topics_covered: "Mixed Vault Test",
        user_id: session.user.id,
        swot_analysis: aiSwot,
      },
    ]);

    if (earnedXP > 0) updateXP(earnedXP, 'quiz');
    fetchData();
  };

  const avgScore =
    examResults.length > 0
      ? Math.round(
          examResults.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) /
            examResults.length
        )
      : 0;

  // --- UI RENDER ---
  return (
    <div className="h-[100dvh] w-full bg-[#FFFFFF] dark:bg-[#0F1724] text-[#111827] dark:text-[#F9FAFB] font-sans overflow-hidden flex flex-col relative transition-colors duration-200">
      {/* HEADER */}
      <header className="px-5 py-3.5 flex justify-between items-center z-40 bg-[#FFFFFF] dark:bg-[#1A2332] border-b border-[#E5E7EB] dark:border-[#283548]">
        <div className="flex items-center gap-3.5">
          {/* Hamburger Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            aria-label="Open menu"
            className="text-[#1A2332] dark:text-white hover:text-[#FF6B00] transition p-1.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
            <h1 className="font-serif font-bold text-base sm:text-lg tracking-wide text-[#1A2332] dark:text-white">
              POLICYPATH
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle Dark Mode"
            className="px-2.5 py-1.5 rounded-[12px] border border-[#E5E7EB] dark:border-[#283548] bg-[#F9FAFB] dark:bg-[#0F1724] text-xs font-semibold text-[#111827] dark:text-[#F9FAFB] hover:border-[#FF6B00] transition flex items-center gap-1.5"
          >
            <span>{isDarkMode ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          <div className="text-[10px] font-bold bg-[#1A2332] text-white px-2.5 py-1 rounded-[12px] tracking-wider">
            BETA 2.0
          </div>
        </div>
      </header>

      {/* SIDEBAR OVERLAY */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-[#111827]/50 z-50"
            />
            {/* Sidebar Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 bottom-0 w-3/4 max-w-xs bg-[#FFFFFF] dark:bg-[#1A2332] border-r border-[#E5E7EB] dark:border-[#283548] z-50 flex flex-col p-6 shadow-xl"
            >
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-5 right-5 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white text-lg font-bold"
              >
                ✕
              </button>

              {/* Sidebar Header / Profile Preview */}
              <div className="mb-8 mt-3 pb-6 border-b border-[#E5E7EB] dark:border-[#283548]">
                {session ? (
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-[#FF6B00] text-white rounded-[12px] flex items-center justify-center text-xl font-bold shadow-sm">
                      🎓
                    </div>
                    <div>
                      <h3 className="text-[#111827] dark:text-white font-bold text-sm">
                        {userProfile?.full_name || 'Scholar'}
                      </h3>
                      <p className="text-xs font-semibold text-[#10B981] mt-0.5">
                        {userProfile?.xp || 0} XP • {userProfile?.streak || 0} Day Streak
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div>
                      <h3 className="text-[#111827] dark:text-white font-bold text-sm">Guest User</h3>
                      <button
                        onClick={triggerAuth}
                        className="text-xs text-[#FF6B00] font-semibold hover:underline mt-0.5"
                      >
                        Sign in to save progress
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar Navigation */}
              <div className="flex flex-col gap-2 flex-1">
                <button
                  onClick={() => handleTabChange('leaderboard')}
                  className="flex items-center gap-3.5 text-left p-3.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[#111827] dark:text-white transition"
                >
                  <span className="text-lg">👑</span>
                  <span className="font-semibold text-sm">Hall of Fame</span>
                </button>
                <button
                  onClick={() => handleTabChange('profile')}
                  className="flex items-center gap-3.5 text-left p-3.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[#111827] dark:text-white transition"
                >
                  <span className="text-lg">🪪</span>
                  <span className="font-semibold text-sm">Student ID</span>
                </button>
              </div>

              {/* Sidebar Footer */}
              <div className="pt-5 border-t border-[#E5E7EB] dark:border-[#283548] mt-auto">
                {session ? (
                  <button
                    onClick={() => {
                      supabase.auth.signOut();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 p-3.5 rounded-[12px] bg-[#EF4444]/10 text-[#EF4444] font-semibold text-sm hover:bg-[#EF4444]/15 transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={triggerAuth}
                    className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold py-3.5 rounded-[12px] shadow-sm transition text-sm"
                  >
                    Sign In / Register
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 overflow-y-auto pb-36 scroll-smooth bg-[#FFFFFF] dark:bg-[#0F1724]">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[85%] p-4 sm:p-5 rounded-[12px] text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#1A2332] text-white shadow-sm'
                      : 'surface-card text-[#111827] dark:text-[#F9FAFB]'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  {m.saved && (
                    <div className="mt-3 pt-2.5 border-t border-[#E5E7EB] dark:border-[#283548] flex items-center gap-2 text-[#10B981] text-[11px] font-bold uppercase tracking-wider">
                      <span className="bg-[#10B981]/15 px-1.5 py-0.5 rounded-full">✓</span>
                      Saved to Vault
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start pl-1">
                <div className="surface-card flex items-center gap-2.5 text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] px-4 py-2.5">
                  <div className="w-2 h-2 bg-[#FF6B00] rounded-full animate-bounce" />
                  The Mentor is drafting...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}

        {/* TAB 2: VAULT */}
        {activeTab === 'vault' && (
          <div className="p-5 sm:p-6 max-w-4xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A2332] dark:text-white mb-1">
                Mastery Vault
              </h2>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">
                Your constitutional knowledge portfolio ({vault.length} topics).
              </p>
            </motion.div>

            {vault.length === 0 ? (
              <div className="surface-card p-12 text-center">
                <div className="text-4xl mb-3">📭</div>
                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm">Your vault is empty.</p>
                <button
                  onClick={() => setActiveTab('home')}
                  className="mt-4 bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold text-xs px-5 py-2.5 rounded-[12px] transition"
                >
                  Start Learning
                </button>
              </div>
            ) : (
              <motion.div
                className="flex gap-5 overflow-x-auto hide-scrollbar pb-10 px-1 snap-x"
                initial="hidden"
                animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
              >
                {vault.map((v, i) => (
                  <motion.div
                    key={v.id}
                    onClick={() => setSelectedArticle(v)}
                    variants={{
                      hidden: { opacity: 0, x: 30 },
                      visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 120 } },
                    }}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="surface-card-elevated min-w-[275px] w-[275px] h-[340px] p-6 flex flex-col justify-between snap-center cursor-pointer hover:border-[#FF6B00] relative overflow-hidden"
                  >
                    {/* Top Accent Stripe */}
                    <div
                      className={`absolute top-0 left-0 right-0 h-1.5 ${
                        i % 3 === 0
                          ? 'bg-[#FF6B00]'
                          : i % 3 === 1
                          ? 'bg-[#10B981]'
                          : 'bg-[#1A2332]'
                      }`}
                    />
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] px-2.5 py-1 rounded-[12px] uppercase tracking-wider">
                        ✓ Mastered
                      </span>
                      <h3 className="text-xl font-serif font-bold mt-4 mb-2.5 leading-snug text-[#111827] dark:text-white">
                        {v.title}
                      </h3>
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] line-clamp-5 leading-relaxed">
                        {v.notes}
                      </p>
                    </div>
                    <div className="text-[11px] font-semibold text-[#FF6B00] pt-3 border-t border-[#E5E7EB] dark:border-[#283548]">
                      Read Note →
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        )}

        {/* TAB 3: TEST PORTAL */}
        {activeTab === 'test' && (
          <div className="min-h-full flex flex-col items-center justify-center animate-fade-in p-4">
            {testState === 'idle' && (
              <div className="surface-card-elevated p-8 sm:p-10 text-center space-y-5 max-w-sm w-full">
                <div className="w-14 h-14 mx-auto rounded-[12px] bg-[#FF6B00]/10 text-[#FF6B00] flex items-center justify-center text-3xl">
                  🎯
                </div>
                <div>
                  <h2 className="text-2xl font-serif font-bold text-[#1A2332] dark:text-white">
                    Ready to Prove It?
                  </h2>
                  <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1.5">
                    Generate a 10-question UPSC quiz based on your Vault.
                  </p>
                </div>
                <button
                  onClick={startTest}
                  className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-bold py-3.5 rounded-[12px] shadow-sm transition-colors text-sm tracking-wide"
                >
                  GENERATE TEST
                </button>
              </div>
            )}

            {testState === 'loading' && (
              <div className="surface-card px-8 py-6 text-center space-y-2">
                <div className="w-6 h-6 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="text-base font-serif font-bold text-[#1A2332] dark:text-white">
                  Constructing Challenge...
                </div>
              </div>
            )}

            {testState === 'active' && (
              <div className="w-full max-w-md animate-fade-in">
                <div className="flex justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-3 uppercase font-bold tracking-wider">
                  <span>
                    Question {currentQIndex + 1}/{quiz.length}
                  </span>
                  <span className="text-[#10B981]">Score: {score}</span>
                </div>

                <div className="surface-card-elevated p-6 sm:p-7 mb-5 min-h-[130px] flex items-center">
                  <p className="font-semibold text-base sm:text-lg leading-relaxed text-[#111827] dark:text-white">
                    {quiz[currentQIndex].question}
                  </p>
                </div>

                <div className="space-y-2.5">
                  {quiz[currentQIndex].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(opt)}
                      className={`w-full p-4 text-left rounded-[12px] border text-sm font-medium transition-all flex justify-between items-center ${
                        selectedOption === opt
                          ? 'bg-[#1A2332] border-[#1A2332] text-white shadow-sm'
                          : 'surface-card text-[#111827] dark:text-[#F9FAFB] hover:border-[#FF6B00]'
                      }`}
                    >
                      <span>{opt}</span>
                      {selectedOption === opt && <span className="text-[#FF6B00]">●</span>}
                    </button>
                  ))}
                </div>

                <button
                  disabled={!selectedOption}
                  onClick={() => {
                    if (selectedOption === quiz[currentQIndex].answer) setScore((s) => s + 1);
                    setSelectedOption(null);
                    if (currentQIndex + 1 < quiz.length) {
                      setCurrentQIndex((i) => i + 1);
                    } else {
                      finishTest();
                    }
                  }}
                  className={`mt-6 w-full py-3.5 rounded-[12px] font-bold text-sm uppercase tracking-wider transition-all ${
                    selectedOption
                      ? 'bg-[#FF6B00] hover:bg-[#E66000] text-white shadow-sm'
                      : 'bg-[#E5E7EB] dark:bg-[#283548] text-[#9CA3AF] cursor-not-allowed'
                  }`}
                >
                  {currentQIndex + 1 === quiz.length ? "Finish Test" : "Next Question →"}
                </button>
              </div>
            )}

            {testState === 'result' && (
              <div className="surface-card-elevated p-8 sm:p-10 text-center space-y-5 max-w-sm w-full">
                <h2 className="text-2xl font-serif font-bold text-[#1A2332] dark:text-white">
                  Test Result
                </h2>
                <div
                  className={`text-6xl font-bold ${
                    score > 5 ? 'text-[#10B981]' : 'text-[#EF4444]'
                  }`}
                >
                  {score}{' '}
                  <span className="text-2xl text-[#9CA3AF] font-normal">/ {quiz.length}</span>
                </div>
                <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
                  Check Analytics for your detailed AI SWOT breakdown.
                </p>
                <button
                  onClick={() => setTestState('idle')}
                  className="w-full bg-[#1A2332] hover:bg-[#243044] text-white font-semibold py-3 rounded-[12px] text-sm transition"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ANALYTICS */}
        {activeTab === 'analytics' && (
          <div className="space-y-5 animate-fade-in max-w-lg mx-auto p-5">
            <h2 className="text-2xl font-serif font-bold text-[#1A2332] dark:text-white">
              Performance
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="surface-card p-6 text-center">
                <div className="text-3xl font-bold text-[#1A2332] dark:text-white mb-1">
                  {vault.length}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#9CA3AF]">
                  Topics Mastered
                </div>
              </div>
              <div className="surface-card p-6 text-center">
                <div className="text-3xl font-bold text-[#10B981] mb-1">{avgScore}%</div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280] dark:text-[#9CA3AF]">
                  Avg Accuracy
                </div>
              </div>
            </div>

            <div className="surface-card p-6">
              <h3 className="text-xs font-bold uppercase tracking-widest mb-5 text-[#6B7280] dark:text-[#9CA3AF]">
                Recent Tests (Tap for SWOT)
              </h3>
              <div className="space-y-3">
                {examResults.length === 0 ? (
                  <p className="text-xs text-[#9CA3AF]">No data yet.</p>
                ) : (
                  examResults.slice(0, 5).map((res, i) => (
                    <div
                      key={i}
                      onClick={() => setViewingSwot(res)}
                      className="flex justify-between text-sm items-center pb-3 border-b border-[#E5E7EB] dark:border-[#283548] last:border-0 cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#243044] p-2 rounded-[12px] transition"
                    >
                      <div>
                        <div className="text-[#111827] dark:text-white font-semibold">
                          {res.topics_covered || "General Test"}
                        </div>
                        <div className="text-[11px] text-[#9CA3AF]">
                          {new Date(res.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <span
                        className={`font-bold px-3 py-1 rounded-[12px] text-xs ${
                          res.score >= 5
                            ? 'bg-[#10B981]/10 text-[#10B981]'
                            : 'bg-[#EF4444]/10 text-[#EF4444]'
                        }`}
                      >
                        {res.score}/{res.total_questions}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {viewingSwot && (
              <div className="fixed inset-0 z-[70] bg-[#111827]/60 flex items-center justify-center p-4 animate-fade-in">
                <div className="surface-card-elevated w-full max-w-sm p-7 relative">
                  <button
                    onClick={() => setViewingSwot(null)}
                    className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white font-bold"
                  >
                    ✕
                  </button>
                  <h3 className="text-xl font-serif font-bold text-[#1A2332] dark:text-white mb-1">
                    AI SWOT Analysis
                  </h3>
                  <div className="text-xs text-[#FF6B00] mb-5 uppercase tracking-wider font-bold">
                    Score: {viewingSwot.score}/{viewingSwot.total_questions}
                  </div>
                  <div className="bg-[#F9FAFB] dark:bg-[#0F1724] p-4 rounded-[12px] text-sm leading-relaxed text-[#111827] dark:text-[#F9FAFB] border border-[#E5E7EB] dark:border-[#283548] whitespace-pre-wrap">
                    {viewingSwot.swot_analysis || "Analysis not available for this test."}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="p-5 max-w-lg mx-auto space-y-6 animate-fade-in">
            <div className="text-center">
              <h2 className="text-2xl font-serif font-bold text-[#1A2332] dark:text-white">
                Hall of Fame
              </h2>
              <p className="text-[#6B7280] dark:text-[#9CA3AF] text-sm mt-1">
                Top Scholars Globally
              </p>
            </div>
            <div className="surface-card overflow-hidden">
              {leaderboard.map((user, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-4 border-b border-[#E5E7EB] dark:border-[#283548] last:border-0 ${
                    index === 0 ? 'bg-[#FF6B00]/5' : ''
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-8 h-8 rounded-[12px] flex items-center justify-center font-bold text-xs ${
                        index === 0
                          ? 'bg-[#FF6B00] text-white'
                          : index === 1
                          ? 'bg-[#1A2332] text-white'
                          : 'bg-[#F9FAFB] dark:bg-[#0F1724] text-[#6B7280] border border-[#E5E7EB] dark:border-[#283548]'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#111827] dark:text-white">
                        {user.username}
                      </div>
                      <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] flex gap-2.5 mt-0.5">
                        <span>🔥 {user.streak}d streak</span>
                        <span>📚 {user.topics_mastered} mastered</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[#10B981]">{user.xp} XP</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: PROFILE */}
        {activeTab === 'profile' && (
          <div className="p-5 max-w-lg mx-auto animate-fade-in">
            <h2 className="text-2xl font-serif font-bold text-[#1A2332] dark:text-white mb-5 text-center">
              Student ID
            </h2>
            <div className="surface-card-elevated p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#1A2332] text-white rounded-[12px] flex items-center justify-center text-2xl">
                  🎓
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#111827] dark:text-white">
                    {userProfile?.full_name || session.user.email.split('@')[0]}
                  </h3>
                  <span className="inline-block mt-1 text-[11px] font-bold bg-[#10B981]/10 text-[#10B981] px-2.5 py-0.5 rounded-[12px]">
                    Scholar • {userProfile?.xp || 0} XP
                  </span>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between border-b border-[#E5E7EB] dark:border-[#283548] pb-2.5">
                  <span className="text-[#6B7280] dark:text-[#9CA3AF]">Education</span>
                  <span className="font-semibold text-[#111827] dark:text-white">
                    {userProfile?.education_level || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#E5E7EB] dark:border-[#283548] pb-2.5">
                  <span className="text-[#6B7280] dark:text-[#9CA3AF]">Institution</span>
                  <span className="font-semibold text-[#111827] dark:text-white">
                    {userProfile?.institution || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[#6B7280] dark:text-[#9CA3AF]">City</span>
                  <span className="font-semibold text-[#111827] dark:text-white">
                    {userProfile?.city || 'Not set'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingProfile(true)}
                className="mt-6 w-full bg-[#1A2332] hover:bg-[#243044] text-white py-3 rounded-[12px] text-xs uppercase tracking-wider font-bold transition"
              >
                Edit Profile
              </button>
            </div>

            {editingProfile && (
              <div className="fixed inset-0 z-[60] bg-[#111827]/60 flex items-center justify-center p-4">
                <div className="surface-card-elevated w-full max-w-md p-6">
                  <h3 className="text-lg font-bold text-[#1A2332] dark:text-white mb-4">
                    {isNewUser ? "Setup Your Profile" : "Edit Details"}
                  </h3>
                  <div className="space-y-3">
                    <input
                      placeholder="Full Name (Required)"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] p-3 text-sm text-[#111827] dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                    <input
                      placeholder="Class / Degree"
                      value={formData.education_level}
                      onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                      className="w-full bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] p-3 text-sm text-[#111827] dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                    <input
                      placeholder="Institution"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] p-3 text-sm text-[#111827] dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                    <input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] p-3 text-sm text-[#111827] dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                  <div className="flex gap-3 mt-5">
                    {!isNewUser && (
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="flex-1 py-3 rounded-[12px] text-sm font-semibold text-[#6B7280] hover:bg-[#F9FAFB] dark:hover:bg-[#243044]"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={saveProfile}
                      className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white py-3 rounded-[12px] text-sm font-bold shadow-sm"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

        {/* 3. INPUT AREA (Home only) */}
      {activeTab === 'home' && (
        <div className="fixed bottom-20 w-full px-4 max-w-2xl mx-auto left-0 right-0 z-40">
          <div className="surface-card-elevated p-1.5 flex items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about Article 21, Preamble..."
              className="flex-1 bg-transparent border-none px-3.5 py-2 text-sm text-[#111827] dark:text-white focus:outline-none placeholder-[#9CA3AF]"
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              disabled={loading}
            />
            <button
              onClick={handleAsk}
              disabled={loading || !query.trim()}
              className={`w-10 h-10 rounded-[12px] flex items-center justify-center font-bold transition-colors ${
                loading || !query.trim()
                  ? 'bg-[#F9FAFB] dark:bg-[#0F1724] text-[#9CA3AF]'
                  : 'bg-[#FF6B00] hover:bg-[#E66000] text-white'
              }`}
            >
              {loading ? '●' : '↑'}
            </button>
          </div>
        </div>
      )}

      {/* 4. CLEAN BOTTOM NAVIGATION (4 Tabs Only) */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <nav className="surface-card-elevated px-6 py-2.5 flex gap-7">
          {[
            { id: 'home', icon: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
            { id: 'vault', icon: <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /> },
            {
              id: 'test',
              icon: (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <path d="m9 12 2 2 4-4" />
                </>
              ),
            },
            {
              id: 'analytics',
              icon: (
                <>
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4" />
                  <line x1="6" y1="20" x2="6" y2="14" />
                </>
              ),
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`p-2 rounded-[12px] transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#FF6B00]/10 text-[#FF6B00]'
                  : 'text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {tab.icon}
              </svg>
            </button>
          ))}
        </nav>
      </div>

      {/* 5. READING MODAL */}
      {selectedArticle && (
        <div className="fixed inset-0 z-[60] bg-[#111827]/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="surface-card-elevated w-full max-w-lg max-h-[80vh] p-7 overflow-y-auto relative">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-5 right-5 bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] w-8 h-8 rounded-[12px] flex items-center justify-center text-[#6B7280] hover:text-[#111827] dark:hover:text-white font-bold"
            >
              ✕
            </button>
            <span className="inline-block text-[10px] font-bold bg-[#10B981]/10 text-[#10B981] px-2.5 py-1 rounded-[12px] uppercase tracking-wider mb-3">
              Mastered Note
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#1A2332] dark:text-white mb-4">
              {selectedArticle.title}
            </h1>
            <div className="text-[#111827] dark:text-[#F9FAFB] leading-relaxed whitespace-pre-wrap text-sm sm:text-base">
              {selectedArticle.notes}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
