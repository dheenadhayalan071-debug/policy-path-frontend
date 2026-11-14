import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { supabase } from './supabaseClient';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND_URL = "https://policy-path-ai-backend-1.onrender.com";

const AI_WELCOME_MSG =
  "Namaste! 🙏 Main tumhara AI mentor hoon. Constitution, Polity, Economy — kuch bhi pucho. Shuru karte hain?";

// --- CURRICULUM DATA FOR LEARN & PRACTICE ---
const SUBJECTS_DATA = [
  {
    id: 'polity',
    icon: '📕',
    name: 'Indian Polity',
    totalTopics: 45,
    subtitle: 'Constitution, Parliament & Governance',
    chapters: [
      {
        id: 'source-of-authority',
        title: 'Source of Authority',
        defaultStatus: 'mastered',
        progress: 100,
        concept:
          'In India, constitutional sovereignty rests with "We, the People of India." The Constituent Assembly drafted and adopted the Constitution on 26 November 1949 on behalf of the citizens, making the people—not the British Parliament or any monarch—the ultimate fountainhead of legal and political authority.',
        keyPoints: [
          'Enacting clause of the Preamble establishes popular sovereignty ("We, the People of India").',
          'Adopted on 26 November 1949; came into full force on 26 January 1950.',
          'Constitution is supreme law; all three organs (Legislature, Executive, Judiciary) derive powers from it.',
        ],
        pyq: 'Asked in UPSC Prelims 2017, 2020 & 2021 (Nature of Indian Sovereignty & Preamble)',
      },
      {
        id: 'citizenship',
        title: 'Citizenship',
        defaultStatus: 'mastered',
        progress: 100,
        concept:
          'Articles 5 to 11 (Part II) of the Constitution deal with citizenship at the commencement of the Republic, while Parliament holds exclusive power under Article 11 to regulate acquisition and termination of citizenship via the Citizenship Act, 1955.',
        keyPoints: [
          'India follows Single Citizenship (borrowed from the UK), unlike dual citizenship in the USA.',
          'Five modes of acquisition under Citizenship Act 1955: Birth, Descent, Registration, Naturalisation, Incorporation of Territory.',
          'Three modes of loss: Renunciation, Termination, and Deprivation.',
        ],
        pyq: 'Asked in UPSC Prelims 2018 & 2021 (Single Citizenship & Constitutional Provisions)',
      },
      {
        id: 'fundamental-rights',
        title: 'Fundamental Rights',
        defaultStatus: 'in_progress',
        progress: 60,
        concept:
          'Articles 12 to 35 (Part III), known as the Magna Carta of India, guarantee six core civil and political rights enforceable directly by the Supreme Court (Article 32) and High Courts (Article 226) against arbitrary state action.',
        keyPoints: [
          'Six categories: Right to Equality (14–18), Freedom (19–22), Against Exploitation (23–24), Religion (25–28), Cultural & Educational (29–30), Constitutional Remedies (32).',
          'Article 20 and Article 21 can never be suspended even during a National Emergency (44th Amendment, 1978).',
          'Justiciable in nature and subject to reasonable restrictions in the interest of sovereignty, public order, and morality.',
        ],
        pyq: 'Asked in UPSC Prelims 2015, 2017, 2019, 2021 & 2023 (Article 14, 19, 21 & Writs)',
      },
      {
        id: 'directive-principles',
        title: 'Directive Principles',
        defaultStatus: 'not_started',
        progress: 60,
        concept:
          'Articles 36 to 51 (Part IV), borrowed from the Irish Constitution, are positive socio-economic obligations guiding the State to establish a Welfare State and economic democracy in India.',
        keyPoints: [
          'Non-justiciable in courts (Article 37), yet "fundamental in the governance of the country."',
          'Classified into three ideological streams: Socialistic, Gandhian, and Liberal-Intellectual principles.',
          'Minerva Mills case (1980) held that harmony and balance between Fundamental Rights and DPSP is part of the Basic Structure.',
        ],
        pyq: 'Asked in UPSC Prelims 2015, 2017, 2020 & 2023 (Welfare State & Separation of Judiciary)',
      },
      {
        id: 'fundamental-duties',
        title: 'Fundamental Duties',
        defaultStatus: 'not_started',
        progress: 0,
        concept:
          'Article 51A (Part IV-A) enumerates 11 civic and moral duties of Indian citizens, added on the recommendation of the Swaran Singh Committee to remind citizens that rights are inseparable from duties.',
        keyPoints: [
          'First 10 duties added by the 42nd Constitutional Amendment Act, 1976; 11th duty (education for children aged 6–14) added by 86th Amendment, 2002.',
          'Inspired by the Constitution of the erstwhile USSR; apply only to citizens (not foreigners).',
          'Non-enforceable directly by writs, though Parliament can enforce specific duties via statutes (e.g., Prevention of Insults to National Honour Act).',
        ],
        pyq: 'Asked in UPSC Prelims 2012, 2015 & 2017 (42nd Amendment & Enforceability)',
      },
    ],
  },
  {
    id: 'economy',
    icon: '📗',
    name: 'Indian Economy',
    totalTopics: 38,
    subtitle: 'Fiscal Policy, RBI, Inflation & Growth',
    chapters: [
      {
        id: 'monetary-policy',
        title: 'Monetary Policy & RBI',
        defaultStatus: 'not_started',
        progress: 0,
        concept:
          'The Reserve Bank of India regulates money supply, credit conditions, and inflation targeting (4% ± 2%) through the six-member Monetary Policy Committee (MPC) under the RBI Act, 1934.',
        keyPoints: [
          'Quantitative tools: Repo Rate, Reverse Repo, SDF, CRR, SLR, and Open Market Operations (OMOs).',
          'MPC consists of 3 RBI officials and 3 external members appointed by the Central Government.',
          'Headline inflation benchmark in India is CPI (Combined).',
        ],
        pyq: 'Asked in UPSC Prelims 2019, 2020 & 2022 (MPC & Liquidity Tools)',
      },
    ],
  },
  {
    id: 'geography',
    icon: '📘',
    name: 'Geography',
    totalTopics: 42,
    subtitle: 'Monsoon, Drainage, Resources & Maps',
    chapters: [
      {
        id: 'indian-monsoon',
        title: 'Indian Monsoon Mechanism',
        defaultStatus: 'not_started',
        progress: 0,
        concept:
          'The Indian Monsoon is a seasonal reversal of planetary winds driven by differential heating of land and sea, northward shift of the ITCZ, Tibetan Plateau heating, and Mascarene High pressure.',
        keyPoints: [
          'South-West Monsoon brings ~75% of India’s annual rainfall (June to September).',
          'El Niño suppresses Indian monsoon rainfall; La Niña and positive Indian Ocean Dipole (IOD) strengthen it.',
          'Tamil Nadu coast receives bulk of its rainfall from the North-East (retreating) Monsoon.',
        ],
        pyq: 'Asked in UPSC Prelims 2017 & 2021 (ITCZ, Jet Streams & IOD)',
      },
    ],
  },
  {
    id: 'history',
    icon: '📙',
    name: 'History',
    totalTopics: 50,
    subtitle: 'Ancient, Medieval, Modern & Art/Culture',
    chapters: [
      {
        id: 'constitutional-developments',
        title: 'Acts Before 1947',
        defaultStatus: 'not_started',
        progress: 0,
        concept:
          'British parliamentary statutes from the Regulating Act of 1773 to the Government of India Act of 1935 laid the institutional skeleton—federalism, bicameralism, and provincial autonomy—later adapted into the Indian Constitution.',
        keyPoints: [
          'Morley-Minto Reforms (1909) introduced separate electorates for Muslims.',
          'Montagu-Chelmsford Reforms (1919) introduced Dyarchy in provinces.',
          'Government of India Act (1935) introduced Provincial Autonomy and proposed an All-India Federation.',
        ],
        pyq: 'Asked in UPSC Prelims 2018, 2021 & 2023 (1919 & 1935 Acts)',
      },
    ],
  },
  {
    id: 'current-affairs',
    icon: '📓',
    name: 'Current Affairs',
    totalTopics: null,
    subtitle: 'Updated daily',
    chapters: [
      {
        id: 'daily-polity-digest',
        title: 'Supreme Court & Constitutional Updates',
        defaultStatus: 'not_started',
        progress: 0,
        concept:
          'Stay updated with landmark Supreme Court constitutional bench verdicts, Parliamentary committee reports, Governor-State relations, and Election Commission reforms relevant for Prelims and GS Paper II.',
        keyPoints: [
          'Focus on constitutional articles cited in recent judgments (Articles 14, 19, 21, 142, 200, 356).',
          'Link every current event back to static Laxmikanth/NCERT concepts.',
        ],
        pyq: 'High-yield area for UPSC Prelims & Mains GS-2',
      },
    ],
  },
];

// --- HELPER: STRUCTURED SECTION CARD & CLEAN MARKDOWN RENDERER (P0 + P2) ---
function FormattedAIMessage({ text }) {
  if (!text) return null;
  const sectionIcons = ['📌', '🔑', '📚', '⚖️', '📝', '👉'];

  const renderInlineBold = (str) => {
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-semibold text-[#111827] dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={idx}>{part.replace(/\*/g, '')}</span>;
    });
  };

  const rawLines = text.split('\n');
  const blocks = [];
  let currentBlock = null;

  rawLines.forEach((rawLine) => {
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    const startsWithSectionIcon = sectionIcons.some((icon) => trimmed.startsWith(icon));
    if (startsWithSectionIcon) {
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { header: trimmed, items: [] };
    } else if (currentBlock) {
      currentBlock.items.push(trimmed);
    } else {
      blocks.push({ header: null, items: [trimmed] });
    }
  });
  if (currentBlock) blocks.push(currentBlock);

  return (
    <div className="space-y-2.5 text-[15px] leading-[1.6] text-[#4B5563] dark:text-[#D1D5DB]">
      {blocks.map((block, bIdx) => {
        const isStructuredCard = Boolean(block.header);
        return (
          <div
            key={bIdx}
            className={
              isStructuredCard
                ? 'bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] p-3.5 space-y-1.5'
                : 'space-y-1.5'
            }
          >
            {block.header && (
              <div className="font-semibold text-[15px] text-[#111827] dark:text-white">
                {renderInlineBold(block.header.replace(/^#+\s*/, ''))}
              </div>
            )}
            {block.items.map((line, lIdx) => {
              if (line.startsWith('###') || line.startsWith('##')) {
                return (
                  <div
                    key={lIdx}
                    className="pt-1 font-semibold text-[15px] text-[#111827] dark:text-white"
                  >
                    {line.replace(/^#+\s*/, '').replace(/\*\*/g, '')}
                  </div>
                );
              }
              if (/^[-*•]\s+/.test(line)) {
                const content = line.replace(/^[-*•]\s+/, '');
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-0.5">
                    <span className="text-[#FF6B00] font-bold mt-0.5">•</span>
                    <div className="flex-1">{renderInlineBold(content)}</div>
                  </div>
                );
              }
              const numMatch = line.match(/^(\d+\.)\s+(.*)/);
              if (numMatch) {
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-0.5">
                    <span className="font-semibold text-[#1A2332] dark:text-[#FF6B00]">
                      {numMatch[1]}
                    </span>
                    <div className="flex-1">{renderInlineBold(numMatch[2])}</div>
                  </div>
                );
              }
              return <p key={lIdx}>{renderInlineBold(line)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}

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
        <button
          onClick={() => setIsDarkMode((d) => !d)}
          aria-label="Toggle dark mode"
          className="fixed top-5 right-5 z-20 surface-card px-3 py-2 text-[12px] font-medium text-[#111827] dark:text-white flex items-center gap-2 hover:border-[#FF6B00] transition"
        >
          <span>{isDarkMode ? '☀️' : '🌙'}</span>
          <span>{isDarkMode ? 'Light mode' : 'Dark mode'}</span>
        </button>

        <div className="surface-card-elevated w-full max-w-md p-8 sm:p-10 animate-fade-in relative z-10">
          <div className="text-center mb-7">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[12px] bg-[#FF6B00]/10 text-[#FF6B00] text-[12px] font-medium mb-3">
              Your free AI mentor for UPSC
            </div>
            <h1 className="type-h1 mb-2">PolicyPath</h1>
            <p className="type-body text-[#111827] dark:text-[#F9FAFB] font-medium">
              Lakhs aspirants ke saath aap bhi UPSC ki tayyari karo — bilkul free
            </p>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={authAppearance}
            theme={isDarkMode ? 'dark' : 'light'}
            providers={['google']}
          />

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="type-caption">— Or —</div>
            <button
              onClick={() => setIsGuestMode(true)}
              className="w-full bg-[#1A2332] hover:bg-[#243044] text-white font-semibold py-3 rounded-[12px] transition-colors shadow-sm text-[15px]"
            >
              Continue as guest
            </button>
            <p className="type-caption text-center mt-1">
              You can chat as a guest, or sign in to save your progress.
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
                <h2 className="type-h2 mb-1">Unlock PolicyPath</h2>
                <p className="type-body">
                  Your free AI mentor for UPSC — save notes, practice PYQs, and track your growth.
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

  // --- NAVIGATION & MODAL STATES ---
  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'learn' | 'practice' | 'progress' | 'leaderboard' | 'profile'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('pp_lang') || 'English';
    } catch {
      return 'English';
    }
  });
  const [reminderEnabled, setReminderEnabled] = useState(() => {
    try {
      return localStorage.getItem('pp_reminder_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Persist language choice
  useEffect(() => {
    try {
      localStorage.setItem('pp_lang', language);
    } catch {}
  }, [language]);

  // --- P2: DAILY STUDY REMINDER OPT-IN & SCHEDULER ---
  const handleEnableReminders = async () => {
    if (!('Notification' in window)) {
      alert("Notifications are not supported in this browser, par hum tumhe app mein daily yaad dilate rahenge! 💪");
      return;
    }
    if (reminderEnabled) {
      setReminderEnabled(false);
      localStorage.setItem('pp_reminder_enabled', 'false');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setReminderEnabled(true);
      localStorage.setItem('pp_reminder_enabled', 'true');
      localStorage.setItem('pp_reminder_time', '20:00');
      new Notification('PolicyPath Mentor 🏛️', {
        body: 'Shabaash! Daily 8:00 PM UPSC study reminder set. Consistency se hi selection hota hai! 🔥',
        icon: '/parliament-emblem.png',
      });
    } else {
      alert("Please allow notifications in your browser settings so PolicyPath can send daily study reminders.");
    }
  };

useEffect(() => {
    if (!reminderEnabled || !('Notification' in window) || Notification.permission !== 'granted') return;
    const interval = setInterval(() => {
      const now = new Date();
      const todayKey = now.toDateString();
      if (now.getHours() === 20 && now.getMinutes() === 0 && localStorage.getItem('pp_reminder_last_sent') !== todayKey) {
        localStorage.setItem('pp_reminder_last_sent', todayKey);
        new Notification('PolicyPath Daily Revision ⏰', {
          body: 'Aaj ka 10-question Polity quiz complete kiya kya? Chalo 5 minute revise karte hain! 🔥',
          icon: '/parliament-emblem.png',
        });
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [reminderEnabled]);

  // --- HOME TODAY'S PLAN STATE ---
  const [todaysPlan, setTodaysPlan] = useState([
    { id: 'revise-fr', label: 'Revise: Fundamental Rights', done: false, action: 'lesson', subjectId: 'polity', chapterId: 'fundamental-rights' },
    { id: 'new-dpsp', label: 'New: Directive Principles', done: false, action: 'lesson', subjectId: 'polity', chapterId: 'directive-principles' },
    { id: 'practice-polity', label: 'Practice: 10 MCQs on Polity', done: false, action: 'practice' },
  ]);

  // --- LEARN STATE ---
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [aiLessonExtra, setAiLessonExtra] = useState('');
  const [loadingLessonAI, setLoadingLessonAI] = useState(false);

  // --- PRACTICE STATE ---
  const [testState, setTestState] = useState("idle"); // 'idle' | 'topic_picker' | 'loading' | 'active' | 'result'
  const [quizTitle, setQuizTitle] = useState("Polity Quick Quiz — 10Q");
  const [quiz, setQuiz] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);

  // --- AI CHAT STATE ---
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem(userStorageKey);
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return parsed.filter(
        (m) =>
          m.text !==
          "Welcome. I am ready to guide you through the Constitution. Ask me anything to start."
      );
    } catch {
      return [];
    }
  });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // --- SUPABASE DATA STATES ---
  const [vault, setVault] = useState([]);
  const [examResults, setExamResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', education_level: '', institution: '', city: '' });
  const [isNewUser, setIsNewUser] = useState(false);
  const [viewingSwot, setViewingSwot] = useState(null);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  // Derived User Display Info
  const displayName =
    userProfile?.full_name?.trim() ||
    (session?.user?.email ? session.user.email.split('@')[0] : 'Aspirant');
  const firstName = displayName.split(' ')[0];
  const streakCount = userProfile?.streak || 0;
  const totalXP = userProfile?.xp || 0;
  const isEmptyProgress = totalXP === 0 && streakCount === 0;
  const currentLevel = Math.floor(totalXP / 100) + 1;
  const xpInCurrentLevel = totalXP % 100;
  const xpToNextLevel = 100 - xpInCurrentLevel;
  const levelNames = ['Beginner', 'Learner', 'Scholar', 'Analyst', 'Officer', 'Topper'];
  const levelTitle = levelNames[Math.min(currentLevel - 1, levelNames.length - 1)];

  // Tab Navigation Protection
  const handleTabChange = (tabName) => {
    setIsSidebarOpen(false);
    setIsChatOpen(false);
    if (!session && tabName !== 'home') {
      triggerAuth();
      return;
    }
    if (tabName === 'learn') {
      setSelectedSubjectId(null);
      setSelectedLesson(null);
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
    fetchData();
  };

  const fetchLeaderboard = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('username, full_name, xp, streak, topics_mastered')
      .order('xp', { ascending: false })
      .limit(10);
    if (data) setLeaderboard(data);
  };

  const saveProfile = async () => {
    if (!formData.full_name) return alert("Tumhara naam zaroori hai — please enter your full name!");
    const { error } = await supabase.from('profiles').update(formData).eq('id', session.user.id);
    if (!error) {
      alert("Shabaash! Your profile has been saved 🎉");
      setUserProfile((prev) => ({ ...prev, ...formData }));
      setEditingProfile(false);
      setIsNewUser(false);
      fetchData();
    } else {
      alert("Could not save right now: " + error.message);
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
      console.error("Unexpected error:", err);
    }
  }

  useEffect(() => {
    fetchData();
    fetchLeaderboard();
    if (session) updateXP(0, 'login');
  }, [session]);

  useEffect(() => {
    localStorage.setItem(userStorageKey, JSON.stringify(messages));
    if (isChatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, userStorageKey, isChatOpen]);

  // --- SAVE TOPIC TO "TOPICS YOU KNOW ✅" ---
  const saveTopicToMastered = async (title, notes) => {
    if (!session) {
      triggerAuth();
      return;
    }
    const isDuplicate = vault.some((v) => v.title.toLowerCase() === title.toLowerCase());
    if (isDuplicate) {
      alert(`"${title}" is already in Topics You Know ✅! Keep going!`);
      return;
    }
    const { error } = await supabase.from('vault').insert([
      { title, status: 'Mastered', notes: notes || 'Mastered with PolicyPath AI', user_id: session.user.id },
    ]);
    if (!error) {
      confetti({ particleCount: 150, spread: 60, colors: ['#FF6B00', '#10B981', '#1A2332'] });
      updateXP(25, 'mastery');
      fetchData();
      alert(`Shabaash! "${title}" saved to Topics You Know ✅ (+25 XP 🎉)`);
    } else {
      alert("Could not save topic right now: " + error.message);
    }
  };

  // --- OPEN LESSON & FETCH AI DEEP-DIVE ---
  const openLesson = async (chapter) => {
    setSelectedLesson(chapter);
    setAiLessonExtra('');
    setLoadingLessonAI(true);
    try {
      const prompt = `Provide a crisp UPSC exam-focused breakdown for "${chapter.title}" with: 1) Constitutional Articles/Provisions, 2) Key Supreme Court case or committee, and 3) One Prelims trap to watch out for. Keep it concise in bullet points.`;
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: prompt, history: "", mode: "chat", language }),
      });
      if (res.ok) {
        const data = await res.json();
        const cleaned = data.answer.split('||VAULT_START||')[0].trim();
        setAiLessonExtra(cleaned);
      }
    } catch (e) {
      console.error("Lesson AI fetch skipped:", e);
    } finally {
      setLoadingLessonAI(false);
    }
  };

  // --- AI CHAT SEND ---
  const sendChatMessage = async (customPrompt) => {
    const textToSend = (customPrompt ?? query).trim();
    if (!textToSend || loading) return;

    setLoading(true);
    if (!customPrompt) setQuery("");

    const newMessages = [...messages, { role: "user", text: textToSend }];
    setMessages(newMessages);

    const historyContext = messages
      .slice(-3)
      .map((m) => `${m.role}: ${m.text}`)
      .join("\n");

    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_query: textToSend,
          history: historyContext,
          mode: "chat",
          language,
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      let aiText = data.answer;

      if (aiText.includes("||VAULT_START||")) {
        const parts = aiText.split("||VAULT_START||");
        const visibleText = parts[0].trim();
        const hiddenPart = parts[1].split("||VAULT_END||")[0];

        let topicTitle = "Constitutional concept";
        let topicSummary = "Mastered with PolicyPath AI";

        if (hiddenPart.includes("Topic:")) {
          topicTitle = hiddenPart.split("Topic:")[1].split("\n")[0].trim().replace(/\*/g, '');
        }
        if (hiddenPart.includes("Summary:")) {
          topicSummary = hiddenPart.split("Summary:")[1].trim().replace(/\*/g, '');
        }

        if (session) {
          const isDuplicate = vault.some((v) => v.title.toLowerCase() === topicTitle.toLowerCase());
          if (!isDuplicate) {
            const { error } = await supabase.from('vault').insert([
              { title: topicTitle, status: 'Mastered', notes: topicSummary, user_id: session.user.id },
            ]);
            if (!error) {
              confetti({ particleCount: 150, spread: 60, colors: ['#FF6B00', '#10B981', '#1A2332'] });
              updateXP(25, 'mastery');
              fetchData();
            }
          }
        }
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: visibleText, topicHint: topicTitle, saved: Boolean(session) },
        ]);
      } else {
        const inferredTopic = textToSend.length > 45 ? textToSend.slice(0, 45) + '...' : textToSend;
        setMessages((prev) => [...prev, { role: "bot", text: aiText, topicHint: inferredTopic }]);
      }
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `⚠️ Connection thoda slow hai. Ek baar phir try karo!` },
      ]);
    } finally {
      setLoading(false);
    }
  };

 // --- VOICE INPUT (🎤 FOR HINDI/ENGLISH THINKING STUDENTS) ---
  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Try Chrome on Android or Desktop.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'हिंदी' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery((prev) => (prev ? `${prev} ${transcript}` : transcript));
    };

    recognition.start();
  };

  // --- QUIZ ENGINE (SMART QUIZ, TOPIC-WISE, PYQs) ---
  const startQuizWithTopics = async (topicsPrompt, label = "Polity Quick Quiz — 10Q") => {
    if (!session) {
      triggerAuth();
      return;
    }
    setIsChatOpen(false);
    setActiveTab('practice');
    setQuizTitle(label);
    setTestState("loading");

    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: topicsPrompt, mode: "quiz", history: "", language }),
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
      setSelectedOption(null);
      setTestState("active");
    } catch (e) {
      console.error("Quiz Gen Error:", e);
      setTestState("idle");
      alert(`Quiz abhi load nahi ho paya (${e.message}). Ek baar phir try karo!`);
    }
  };

  const handleSmartQuiz = () => {
    const weakAndSaved = [
      'Fundamental Rights',
      'Preamble of India',
      ...vault.map((v) => v.title),
    ]
      .slice(0, 6)
      .join(', ');
    startQuizWithTopics(weakAndSaved, "Polity Quick Quiz — 10Q");
  };

  const handlePyqQuiz = () => {
    startQuizWithTopics(
      "Actual UPSC Civil Services Prelims Previous Year Questions (2015-2024) on Indian Constitution, Preamble, Fundamental Rights, Parliament, and Judiciary",
      "UPSC Prelims PYQs — 10Q"
    );
  };

  const finishTest = async () => {
    setTestState("result");
    const passed = score > 5;
    const earnedXP = passed ? 10 : 5;

    if (score >= 7) {
      confetti({ particleCount: 150, spread: 60, colors: ['#FF6B00', '#10B981', '#1A2332'] });
    }

    let aiSwot = "Strengths: Good conceptual grasp.\nWeakness: Needs deeper article revision.";
    try {
      const prompt = `Analyze this test performance: Score ${score}/${quiz.length} on ${quizTitle}. 
      Generate a brief 4-line encouraging SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) addressed to the student.`;

      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_query: prompt, history: "", mode: "chat", language }),
      });
      const data = await res.json();
      aiSwot = data.answer;
    } catch (e) {
      console.error("SWOT reflection skipped");
    }

    if (session?.user) {
      await supabase.from('exam_results').insert([
        {
          score: score,
          total_questions: quiz.length,
          topics_covered: quizTitle || "Polity Quick Quiz — 10Q",
          user_id: session.user.id,
          swot_analysis: aiSwot,
        },
      ]);
      updateXP(earnedXP, 'quiz');
      fetchData();
    }
  };

  // --- COMPUTED METRICS (WITH TRUE EMPTY STATES) ---
  const hasQuizHistory = examResults.length > 0;
  const avgScore = hasQuizHistory
    ? Math.round(
        examResults.reduce((acc, curr) => acc + (curr.score / curr.total_questions) * 100, 0) /
          examResults.length
      )
    : null;
  const isLowAccuracy = hasQuizHistory && avgScore < 50;

  const masteredTitlesSet = new Set(vault.map((v) => v.title.toLowerCase()));
  const politySubject = SUBJECTS_DATA[0];
  const polityMasteredCount = Math.max(
    vault.length,
    politySubject.chapters.filter((c) => c.defaultStatus === 'mastered').length
  );

  // Build dynamic chapters list for selected subject (merging Supabase saved topics)
  const getSubjectChapters = (subject) => {
    if (!subject) return [];
    const baseChapters = subject.chapters.map((ch) => {
      const isMasteredInDb = masteredTitlesSet.has(ch.title.toLowerCase());
      return {
        ...ch,
        status: isMasteredInDb ? 'mastered' : ch.defaultStatus,
        progress: isMasteredInDb ? 100 : ch.progress,
      };
    });

    if (subject.id === 'polity') {
      const baseTitles = new Set(baseChapters.map((c) => c.title.toLowerCase()));
      const extraFromDb = vault
        .filter((v) => !baseTitles.has(v.title.toLowerCase()))
        .map((v) => ({
          id: `db-${v.id}`,
          title: v.title,
          status: 'mastered',
          progress: 100,
          concept: v.notes || 'Mastered with PolicyPath AI.',
          keyPoints: [
            'Saved directly from your AI Mentor revision.',
            'Ready for UPSC Prelims MCQ practice.',
          ],
          pyq: 'High-yield Constitutional concept',
        }));
      return [...baseChapters, ...extraFromDb];
    }

    return baseChapters;
  };

  // Refer a friend handler
  const handleShareApp = async () => {
    const shareData = {
      title: 'PolicyPath — Your free AI mentor for UPSC',
      text: 'Lakhs aspirants ke saath aap bhi UPSC ki tayyari karo — bilkul free! Try PolicyPath AI:',
      url: 'https://policy-path-theta.vercel.app/',
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert('Invite link copied! Share it on WhatsApp with your UPSC study group 📤');
      }
    } catch (err) {
      console.log('Share cancelled');
    }
  };

  // --- BOTTOM NAVIGATION CONFIG (Home | Learn | Practice | Progress) ---
  const navTabs = [
    {
      id: 'home',
      label: 'Home',
      outlineIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      filledIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.47 3.84a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.06l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 0 0 1.061 1.06l8.69-8.69Z" />
          <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
        </svg>
      ),
    },
    {
      id: 'learn',
      label: 'Learn',
      outlineIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      ),
      filledIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.25 4.533A9.707 9.707 0 0 0 6 3a9.735 9.735 0 0 0-3.25.555.75.75 0 0 0-.5.707v14.25a.75.75 0 0 0 1 .707A8.237 8.237 0 0 1 6 18.75c1.995 0 3.823.707 5.25 1.886V4.533ZM12.75 20.636A8.214 8.214 0 0 1 18 18.75c.966 0 1.89.166 2.75.47a.75.75 0 0 0 1-.708V4.262a.75.75 0 0 0-.5-.707A9.735 9.735 0 0 0 18 3a9.707 9.707 0 0 0-5.25 1.533v16.103Z" />
        </svg>
      ),
    },
    {
      id: 'practice',
      label: 'Practice',
      outlineIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      ),
      filledIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M21.731 2.269a2.625 2.625 0 0 0-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 0 0 0-3.712ZM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 0 0-1.32 2.214l-.8 2.685a.75.75 0 0 0 .933.933l2.685-.8a5.25 5.25 0 0 0 2.214-1.32L19.513 8.2Z" />
        </svg>
      ),
    },
    {
      id: 'progress',
      label: 'Progress',
      outlineIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
      filledIcon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75ZM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 0 1-1.875-1.875V8.625ZM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.036 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 0 1 3 19.875v-6.75Z" />
        </svg>
      ),
    },
  ];

  // --- UI RENDER ---
  return (
    <div className="h-[100dvh] w-full bg-[#FFFFFF] dark:bg-[#0F1724] text-[#4B5563] dark:text-[#D1D5DB] font-sans overflow-hidden flex flex-col relative transition-colors duration-200">
      {/* TOP HEADER */}
      <header className="px-4 sm:px-5 py-3 flex justify-between items-center z-40 bg-[#FFFFFF] dark:bg-[#1A2332] border-b border-[#E5E7EB] dark:border-[#283548]">
        <div className="flex items-center gap-3">
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
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6B00]" />
              <h1 className="type-brand text-[#1A2332] dark:text-white">PolicyPath</h1>
            </div>
            <p className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] leading-tight hidden sm:block">
              Your free AI mentor for UPSC
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Hindi / English Language Toggle */}
          <button
            onClick={() => setLanguage((l) => (l === 'English' ? 'हिंदी' : 'English'))}
            aria-label="Toggle language"
            className="px-2.5 py-1.5 rounded-[12px] border border-[#E5E7EB] dark:border-[#283548] bg-[#F9FAFB] dark:bg-[#0F1724] text-[12px] font-semibold text-[#FF6B00] hover:border-[#FF6B00] transition"
          >
            🌐 {language === 'English' ? 'EN' : 'हिंदी'}
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
            className="px-2.5 py-1.5 rounded-[12px] border border-[#E5E7EB] dark:border-[#283548] bg-[#F9FAFB] dark:bg-[#0F1724] text-[12px] font-medium text-[#111827] dark:text-[#F9FAFB] hover:border-[#FF6B00] transition flex items-center gap-1"
          >
            <span>{isDarkMode ? '☀️' : '🌙'}</span>
            <span className="hidden sm:inline">{isDarkMode ? 'Light' : 'Dark'}</span>
          </button>

          <div className="text-[11px] font-bold bg-[#1A2332] text-white px-2.5 py-1 rounded-[12px] tracking-wider">
            BETA
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* SIDEBAR / PROFILE DRAWER                                              */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-[#111827]/50 z-50"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed top-0 left-0 bottom-0 w-4/5 max-w-xs bg-[#FFFFFF] dark:bg-[#1A2332] border-r border-[#E5E7EB] dark:border-[#283548] z-50 flex flex-col p-5 shadow-xl overflow-y-auto"
            >
              <div className="flex justify-end">
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-[12px] font-medium text-[#6B7280] hover:text-[#111827] dark:hover:text-white px-2.5 py-1 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] transition"
                >
                  ╳ Close
                </button>
              </div>

              <div className="mt-2 pb-5 border-b border-[#E5E7EB] dark:border-[#283548]">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-[12px] bg-[#1A2332] text-white flex items-center justify-center text-xl font-bold shrink-0">
                    {session ? firstName.charAt(0).toUpperCase() : '👤'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="type-h3 font-semibold text-[#111827] dark:text-white truncate">
                      {session ? displayName : 'Future Officer'}
                    </h3>
                    {isEmptyProgress ? (
                      <div className="type-caption text-[#10B981] font-semibold mt-0.5">
                        Aaj se shuru karte hain! 💪
                      </div>
                    ) : (
                      <div className="type-caption text-[#FF6B00] font-medium mt-0.5">
                        🔥 {streakCount}-day streak
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 bg-[#F9FAFB] dark:bg-[#0F1724] p-3 rounded-[12px] border border-[#E5E7EB] dark:border-[#283548]">
                  <div className="text-[12px] font-medium text-[#111827] dark:text-white mb-1.5">
                    {isEmptyProgress
                      ? 'Aaj se shuru karte hain! 💪'
                      : `⭐ ${totalXP} XP — Level ${currentLevel}: ${levelTitle}`}
                  </div>
                  <div className="w-full h-2 bg-[#E5E7EB] dark:bg-[#283548] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all duration-300"
                      style={{ width: `${Math.max(xpInCurrentLevel, isEmptyProgress ? 8 : 0)}%` }}
                    />
                  </div>
                  <div className="type-caption mt-1">
                    Level {currentLevel + 1} in {xpToNextLevel} XP
                  </div>
                </div>
              </div>

              <div className="py-4 space-y-1 flex-1">
                <button
                  onClick={() => handleTabChange('progress')}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[15px] text-[#374151] dark:text-white transition"
                >
                  <span>📊</span>
                  <span>My Progress</span>
                </button>
                <button
                  onClick={() => handleTabChange('home')}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[15px] text-[#374151] dark:text-white transition"
                >
                  <span>📖</span>
                  <span>Study Plan</span>
                </button>
                <button
                  onClick={() => handleTabChange('leaderboard')}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[15px] text-[#374151] dark:text-white transition"
                >
                  <span>🏆</span>
                  <span>Hall of Fame</span>
                </button>
                <button
                  onClick={() => handleTabChange('learn')}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[15px] text-[#374151] dark:text-white transition"
                >
                  <span>🔖</span>
                  <span>Topics You Know ✅</span>
                </button>
                <button
                  onClick={() => handleTabChange('profile')}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[15px] text-[#374151] dark:text-white transition"
                >
                  <span>📋</span>
                  <span>My Student ID</span>
                </button>
                <button
                  onClick={handleEnableReminders}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[15px] text-[#374151] dark:text-white transition"
                >
                  <span className="flex items-center gap-3">
                    <span>🔔</span>
                    <span>Daily Reminder</span>
                  </span>
                  <span
                    className={`text-[12px] font-semibold ${
                      reminderEnabled ? 'text-[#10B981]' : 'text-[#9CA3AF]'
                    }`}
                  >
                    {reminderEnabled ? '8:00 PM ON' : 'Off'}
                  </span>
                </button>
                <button
                  onClick={toggleDarkMode}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[15px] text-[#374151] dark:text-white transition"
                >
                  <span className="flex items-center gap-3">
                    <span>⚙️</span>
                    <span>Theme</span>
                  </span>
                  <span className="type-caption">{isDarkMode ? 'Dark' : 'Light'}</span>
                </button>
                <button
                  onClick={() => setLanguage((l) => (l === 'English' ? 'हिंदी' : 'English'))}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[15px] text-[#374151] dark:text-white transition"
                >
                  <span className="flex items-center gap-3">
                    <span>🌐</span>
                    <span>Language</span>
                  </span>
                  <span className="text-[12px] font-semibold text-[#FF6B00]">{language}</span>
                </button>
                <button
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setShowHelpModal(true);
                  }}
                  className="w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] text-[15px] text-[#374151] dark:text-white transition"
                >
                  <span>❓</span>
                  <span>Help & Feedback</span>
                </button>
              </div>

              <div className="pt-4 border-t border-[#E5E7EB] dark:border-[#283548] space-y-3">
                <div className="bg-[#10B981]/10 border border-[#10B981]/20 rounded-[12px] p-3">
                  <div className="text-[12px] font-semibold text-[#10B981]">
                    🆓 PolicyPath is FREE forever
                  </div>
                  <div className="type-caption mt-0.5">Your free AI mentor for UPSC</div>
                </div>

                <button
                  onClick={handleShareApp}
                  className="w-full bg-[#F9FAFB] dark:bg-[#0F1724] hover:border-[#FF6B00] border border-[#E5E7EB] dark:border-[#283548] text-[#111827] dark:text-white font-medium py-2.5 rounded-[12px] text-[14px] transition"
                >
                  Refer a friend 📤
                </button>

                {session ? (
                  <button
                    onClick={() => {
                      supabase.auth.signOut();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full bg-[#EF4444]/10 hover:bg-[#EF4444]/15 text-[#EF4444] font-semibold py-2.5 rounded-[12px] text-[14px] transition"
                  >
                    Sign out
                  </button>
                ) : (
                  <button
                    onClick={triggerAuth}
                    className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold py-2.5 rounded-[12px] text-[14px] transition"
                  >
                    Sign in / Register
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ===================================================================== */}
      {/* MAIN CONTENT AREA                                                     */}
      {/* ===================================================================== */}
      <main className="flex-1 overflow-y-auto pb-32 scroll-smooth bg-[#FFFFFF] dark:bg-[#0F1724]">
        {/* ------------------------------------------------------------------- */}
        {/* HOME SCREEN                                                         */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'home' && (
          <div className="max-w-xl mx-auto p-5 space-y-5 animate-fade-in">
            <div>
              <h1 className="type-h1">Namaste, {firstName}! 🙏</h1>
              <p className="type-body mt-0.5">
                {streakCount > 0
                  ? `Day ${streakCount} of your UPSC journey`
                  : 'Lakhs aspirants ke saath aap bhi UPSC ki tayyari karo — bilkul free'}
              </p>
              <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-[12px] bg-[#FF6B00]/10 text-[#FF6B00] text-[12px] font-semibold">
                {streakCount > 0 ? (
                  <>
                    <span>🔥</span>
                    <span>{streakCount}-day streak — keep going!</span>
                  </>
                ) : (
                  <span>Aaj se shuru karte hain! 💪</span>
                )}
              </div>
            </div>

            {/* Today's Plan Card */}
            <div className="surface-card-elevated p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="type-h2 flex items-center gap-2">
                  <span>📅</span>
                  <span>Today's Focus</span>
                </h2>
                <span className="type-caption">
                  {todaysPlan.filter((t) => t.done).length}/{todaysPlan.length} done
                </span>
              </div>

              <div className="space-y-2.5">
                {todaysPlan.map((item) => (
                  <button
                    key={item.id}
                    onClick={() =>
                      setTodaysPlan((prev) =>
                        prev.map((p) => (p.id === item.id ? { ...p, done: !p.done } : p))
                      )
                    }
                    className="w-full flex items-center gap-3 text-left p-2.5 rounded-[12px] hover:bg-[#F9FAFB] dark:hover:bg-[#243044] transition"
                  >
                    <span
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[11px] font-bold shrink-0 ${
                        item.done
                          ? 'bg-[#10B981] border-[#10B981] text-white'
                          : 'border-[#9CA3AF] text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span
                      className={`text-[15px] ${
                        item.done
                          ? 'line-through text-[#9CA3AF]'
                          : 'text-[#111827] dark:text-[#F9FAFB]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const nextTask = todaysPlan.find((t) => !t.done) || todaysPlan[0];
                  if (nextTask.action === 'practice') {
                    handleTabChange('practice');
                  } else {
                    const subj = SUBJECTS_DATA.find((s) => s.id === 'polity');
                    const chap = subj.chapters.find((c) => c.id === nextTask.chapterId);
                    handleTabChange('learn');
                    setSelectedSubjectId('polity');
                    if (chap) openLesson(chap);
                  }
                }}
                className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold py-3 rounded-[12px] text-[15px] transition shadow-sm"
              >
                Start Today's Plan →
              </button>
            </div>

            {/* Quick Stats Strip (True Empty States Instead of Zeros) */}
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleTabChange('learn')}
                className="surface-card p-3.5 text-center hover:border-[#FF6B00] transition"
              >
                <div className="text-[18px] font-bold text-[#111827] dark:text-white">
                  🏆 {polityMasteredCount}
                </div>
                <div className="type-caption mt-0.5">Topics Known</div>
              </button>
              <button
                onClick={() => handleTabChange('practice')}
                className="surface-card p-3.5 text-center hover:border-[#FF6B00] transition"
              >
                <div className="text-[18px] font-bold text-[#10B981]">
                  {hasQuizHistory ? `📈 ${avgScore}%` : '🎯 Start'}
                </div>
                <div className="type-caption mt-0.5">
                  {hasQuizHistory ? 'Accuracy' : '1st Quiz →'}
                </div>
              </button>
              <div className="surface-card p-3.5 text-center">
                <div className="text-[18px] font-bold text-[#FF6B00]">
                  {streakCount > 0 ? `🔥 ${streakCount}d` : '💪 Day 1'}
                </div>
                <div className="type-caption mt-0.5">
                  {streakCount > 0 ? 'Streak' : 'Shuru karo'}
                </div>
              </div>
            </div>

            {/* Motivational Nudge */}
            <div className="surface-card p-4 bg-[#F9FAFB] dark:bg-[#1A2332] flex items-start gap-3">
              <span className="text-xl shrink-0">💡</span>
              <p className="type-body text-[#111827] dark:text-[#F9FAFB] font-medium">
                {hasQuizHistory
                  ? '"Pichle hafte se 15% improvement hua hai. Aise hi chalte raho!"'
                  : '"Har topper ne zero se shuru kiya tha. Aaj ek topic padh kar apna streak start karo!"'}
              </p>
            </div>

            {/* Continue Learning Section */}
            <div className="space-y-2.5">
              <h3 className="type-h3">Jahan chhoda tha, wahan se shuru karo</h3>
              <button
                onClick={() => {
                  const subj = SUBJECTS_DATA[0];
                  const dpsp = subj.chapters.find((c) => c.id === 'directive-principles');
                  handleTabChange('learn');
                  setSelectedSubjectId('polity');
                  if (dpsp) openLesson(dpsp);
                }}
                className="w-full surface-card-elevated p-4 text-left hover:border-[#FF6B00] transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="type-caption">Indian Polity • Part IV</div>
                    <div className="text-[16px] font-semibold text-[#111827] dark:text-white mt-0.5">
                      Directive Principles — 60% complete →
                    </div>
                  </div>
                  <span className="text-xl">📘</span>
                </div>
                <div className="w-full h-2 bg-[#E5E7EB] dark:bg-[#283548] rounded-full overflow-hidden">
                  <div className="h-full bg-[#FF6B00] rounded-full" style={{ width: '60%' }} />
                </div>
              </button>
            </div>

            {/* Daily Reminder Opt-in + Refer a Friend */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleEnableReminders}
                className="surface-card p-4 text-left hover:border-[#FF6B00] transition flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-[14px] font-semibold text-[#111827] dark:text-white">
                    {reminderEnabled ? '🔔 Reminder Active (8 PM)' : '🔔 Daily Study Reminder'}
                  </div>
                  <div className="type-caption mt-0.5">
                    {reminderEnabled ? 'Streak protection ON' : 'Never miss a revision day'}
                  </div>
                </div>
                <span className="text-[12px] font-bold text-[#FF6B00]">
                  {reminderEnabled ? '✓' : 'Enable →'}
                </span>
              </button>

              <button
                onClick={handleShareApp}
                className="surface-card p-4 text-left hover:border-[#10B981] transition flex items-center justify-between gap-2"
              >
                <div>
                  <div className="text-[14px] font-semibold text-[#111827] dark:text-white">
                    📤 Refer a friend
                  </div>
                  <div className="type-caption mt-0.5">Study UPSC together — free</div>
                </div>
                <span className="text-[12px] font-bold text-[#10B981]">Invite →</span>
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* LEARN SCREEN ("Topics You Know ✅")                                  */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'learn' && (
          <div className="max-w-xl mx-auto p-5 space-y-5 animate-fade-in">
            {!selectedSubjectId && (
              <>
                <div>
                  <h1 className="type-h1">Topics You Know ✅</h1>
                  <p className="type-body mt-0.5">Jo padh liya, woh yahan safe hai</p>
                </div>

                <div className="space-y-3">
                  {SUBJECTS_DATA.map((subj) => {
                    const masteredNum =
                      subj.id === 'polity' ? Math.min(polityMasteredCount, subj.totalTopics) : 0;
                    const pct = subj.totalTopics
                      ? Math.round((masteredNum / subj.totalTopics) * 100)
                      : 0;

                    return (
                      <button
                        key={subj.id}
                        onClick={() => setSelectedSubjectId(subj.id)}
                        className="w-full surface-card p-4 text-left hover:border-[#FF6B00] transition space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{subj.icon}</span>
                            <div>
                              <h3 className="type-h3 font-semibold text-[#111827] dark:text-white">
                                {subj.name}
                              </h3>
                              <p className="type-caption">{subj.subtitle}</p>
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-[#FF6B00]">
                            {subj.totalTopics
                              ? masteredNum > 0
                                ? `${masteredNum}/${subj.totalTopics} topics`
                                : 'Start now'
                              : 'Updated daily'}{' '}
                            →
                          </span>
                        </div>

                        {subj.totalTopics && (
                          <div className="w-full h-2 bg-[#E5E7EB] dark:bg-[#283548] rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#10B981] rounded-full transition-all"
                              style={{ width: `${Math.max(pct, masteredNum > 0 ? 12 : 4)}%` }}
                            />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {selectedSubjectId && !selectedLesson && (() => {
              const activeSubject = SUBJECTS_DATA.find((s) => s.id === selectedSubjectId);
              const chapters = getSubjectChapters(activeSubject);

              return (
                <>
                  <button
                    onClick={() => setSelectedSubjectId(null)}
                    className="text-[13px] font-semibold text-[#FF6B00] hover:underline"
                  >
                    ← Back to Topics You Know
                  </button>

                  <div>
                    <h1 className="type-h1">
                      {activeSubject.icon} {activeSubject.name}
                    </h1>
                    <p className="type-body mt-0.5">
                      Tap any chapter to revise your notes or ask a doubt
                    </p>
                  </div>

                  <div className="space-y-3">
                    {chapters.map((ch) => {
                      const statusIcon =
                        ch.status === 'mastered'
                          ? '✅'
                          : ch.status === 'in_progress'
                          ? '🔵'
                          : '⚪';
                      const statusLabel =
                        ch.status === 'mastered'
                          ? 'Mastered'
                          : ch.status === 'in_progress'
                          ? `In Progress — ${ch.progress}%`
                          : 'Ready to learn';

                      return (
                        <button
                          key={ch.id}
                          onClick={() => openLesson(ch)}
                          className="w-full surface-card p-4 text-left hover:border-[#FF6B00] transition flex items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-3">
                            <span className="text-lg mt-0.5">{statusIcon}</span>
                            <div>
                              <h3 className="type-h3 font-semibold text-[#111827] dark:text-white">
                                {ch.title}
                              </h3>
                              <span
                                className={`type-caption font-medium ${
                                  ch.status === 'mastered'
                                    ? 'text-[#10B981]'
                                    : ch.status === 'in_progress'
                                    ? 'text-[#FF6B00]'
                                    : ''
                                }`}
                              >
                                {statusLabel}
                              </span>
                            </div>
                          </div>
                          <span className="text-[#9CA3AF] text-sm">→</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              );
            })()}

            {selectedLesson && (
              <div className="space-y-4 animate-fade-in">
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="text-[13px] font-semibold text-[#FF6B00] hover:underline"
                >
                  ← Back to Chapters
                </button>

                <div className="surface-card-elevated p-6 space-y-5">
                  <div>
                    <span
                      className={`inline-block text-[12px] font-medium px-2.5 py-0.5 rounded-[12px] mb-2 ${
                        selectedLesson.status === 'mastered'
                          ? 'bg-[#10B981]/10 text-[#10B981]'
                          : 'bg-[#FF6B00]/10 text-[#FF6B00]'
                      }`}
                    >
                      {selectedLesson.status === 'mastered' ? '✅ Mastered' : '🔵 Active Lesson'}
                    </span>
                    <h1 className="type-h1">{selectedLesson.title}</h1>
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="type-h3 font-semibold text-[#111827] dark:text-white">
                      📌 Concept Explanation
                    </h3>
                    <p className="type-body">{selectedLesson.concept}</p>
                  </div>

                  <div className="space-y-2">
                    <h3 className="type-h3 font-semibold text-[#111827] dark:text-white">
                      🔑 Key Points
                    </h3>
                    <ul className="space-y-2">
                      {selectedLesson.keyPoints.map((pt, idx) => (
                        <li key={idx} className="flex items-start gap-2 type-body">
                          <span className="text-[#FF6B00] font-bold">•</span>
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {loadingLessonAI && (
                    <div className="bg-[#F9FAFB] dark:bg-[#0F1724] p-3.5 rounded-[12px] border border-[#E5E7EB] dark:border-[#283548] type-caption">
                      🤖 PolicyPath soch raha hai... preparing UPSC exam notes
                    </div>
                  )}
                  {aiLessonExtra && (
                    <div className="space-y-1.5">
                      <div className="text-[12px] font-semibold text-[#FF6B00]">
                        🤖 Mentor Exam Notes
                      </div>
                      <FormattedAIMessage text={aiLessonExtra} />
                    </div>
                  )}

                  <div className="bg-[#1A2332] text-white p-4 rounded-[12px] space-y-1">
                    <div className="text-[12px] font-semibold text-[#FF6B00]">
                      📝 PYQ Connections
                    </div>
                    <p className="text-[14px] text-white/90">{selectedLesson.pyq}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        saveTopicToMastered(selectedLesson.title, selectedLesson.concept);
                        setSelectedLesson((prev) => ({ ...prev, status: 'mastered' }));
                      }}
                      className="w-full bg-[#10B981] hover:bg-[#0EA572] text-white font-semibold py-3 rounded-[12px] text-[14px] transition"
                    >
                      ✅ Mark as Mastered
                    </button>
                    <button
                      onClick={() => {
                        const topic = selectedLesson.title;
                        setIsChatOpen(true);
                        sendChatMessage(`Explain ${topic} for UPSC Prelims and Mains with landmark cases.`);
                      }}
                      className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold py-3 rounded-[12px] text-[14px] transition"
                    >
                      Ask a doubt about this topic 💬
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* PRACTICE SCREEN                                                     */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'practice' && (
          <div className="max-w-xl mx-auto p-5 animate-fade-in">
            {testState === 'idle' && (
              <div className="space-y-5">
                <div>
                  <h1 className="type-h1">✍️ Thoda practice karte hain?</h1>
                  <p className="type-body italic mt-1">
                    "Revision ke bina preparation adhuri hai"
                  </p>
                </div>

                <div className="surface-card-elevated p-5 space-y-3">
                  <div>
                    <h2 className="type-h2">🎯 Polity Quick Quiz — 10Q</h2>
                    <p className="type-body mt-1">
                      AI picks from your weak areas automatically so you improve faster
                    </p>
                  </div>
                  <button
                    onClick={handleSmartQuiz}
                    className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold py-3 rounded-[12px] text-[15px] transition shadow-sm"
                  >
                    Start Practice →
                  </button>
                </div>

                <div className="surface-card p-5 space-y-3">
                  <div>
                    <h2 className="type-h2">📚 Topic-wise Practice</h2>
                    <p className="type-body mt-1">Choose a subject & topic to master</p>
                  </div>
                  <button
                    onClick={() => setTestState('topic_picker')}
                    className="w-full bg-[#1A2332] hover:bg-[#243044] text-white font-semibold py-3 rounded-[12px] text-[15px] transition"
                  >
                    Select Topic →
                  </button>
                </div>

                <div className="surface-card p-5 space-y-3">
                  <div>
                    <h2 className="type-h2">📝 Previous Year Questions</h2>
                    <p className="type-body mt-1">Solve actual UPSC Prelims questions</p>
                  </div>
                  <button
                    onClick={handlePyqQuiz}
                    className="w-full bg-[#1A2332] hover:bg-[#243044] text-white font-semibold py-3 rounded-[12px] text-[15px] transition"
                  >
                    Start PYQs →
                  </button>
                </div>
              </div>
            )}

            {testState === 'topic_picker' && (
              <div className="space-y-4 animate-fade-in">
                <button
                  onClick={() => setTestState('idle')}
                  className="text-[13px] font-semibold text-[#FF6B00] hover:underline"
                >
                  ← Back to Practice Zone
                </button>
                <h2 className="type-h2">Choose a topic to practice</h2>
                <div className="space-y-2.5">
                  {SUBJECTS_DATA.flatMap((s) =>
                    s.chapters.map((c) => ({ ...c, subjectName: s.name, icon: s.icon }))
                  ).map((item) => (
                    <button
                      key={item.id}
                      onClick={() =>
                        startQuizWithTopics(item.title, `${item.title} Quick Quiz — 10Q`)
                      }
                      className="w-full surface-card p-4 text-left hover:border-[#FF6B00] transition flex items-center justify-between"
                    >
                      <div>
                        <div className="type-caption">
                          {item.icon} {item.subjectName}
                        </div>
                        <div className="text-[15px] font-semibold text-[#111827] dark:text-white mt-0.5">
                          {item.title}
                        </div>
                      </div>
                      <span className="text-[#FF6B00] font-semibold text-sm">Start Practice →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {testState === 'loading' && (
              <div className="surface-card-elevated p-10 text-center space-y-3 mt-12">
                <div className="w-7 h-7 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto" />
                <h3 className="type-h3 font-semibold text-[#111827] dark:text-white">
                  Preparing {quizTitle}...
                </h3>
                <p className="type-caption">Setting up 10 UPSC-level conceptual MCQs for you</p>
              </div>
            )}

            {testState === 'active' && (
              <div className="animate-fade-in space-y-5">
                <div className="flex justify-between type-caption font-medium">
                  <span>
                    Question {currentQIndex + 1} of {quiz.length}
                  </span>
                  <span className="text-[#10B981] font-semibold">Score: {score}</span>
                </div>

                <div className="surface-card-elevated p-6 min-h-[130px] flex items-center">
                  <h3 className="type-h3 text-[#111827] dark:text-white font-semibold">
                    {quiz[currentQIndex].question}
                  </h3>
                </div>

                <div className="space-y-2.5">
                  {quiz[currentQIndex].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedOption(opt)}
                      className={`w-full p-4 text-left rounded-[12px] border text-[15px] transition-all flex justify-between items-center ${
                        selectedOption === opt
                          ? 'bg-[#1A2332] border-[#1A2332] text-white font-medium shadow-sm'
                          : 'surface-card text-[#4B5563] dark:text-[#D1D5DB] hover:border-[#FF6B00]'
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
                  className={`w-full py-3.5 rounded-[12px] font-semibold text-[15px] transition-all ${
                    selectedOption
                      ? 'bg-[#FF6B00] hover:bg-[#E66000] text-white shadow-sm'
                      : 'bg-[#E5E7EB] dark:bg-[#283548] text-[#9CA3AF] cursor-not-allowed'
                  }`}
                >
                  {currentQIndex + 1 === quiz.length ? "Finish practice" : "Next question →"}
                </button>
              </div>
            )}

            {testState === 'result' && (
              <div className="surface-card-elevated p-8 text-center space-y-5 mt-6">
                <h2 className="type-h2">
                  {score >= 6 ? 'Shabaash! Great effort 🎉' : 'Good attempt! Keep going 💪'}
                </h2>
                <div className="type-stat">
                  {score}{' '}
                  <span className="text-[18px] text-[#9CA3AF] font-normal">/ {quiz.length}</span>
                </div>
                <div className="inline-block bg-[#10B981]/10 text-[#10B981] text-[12px] font-semibold px-3 py-1 rounded-[12px]">
                  {score >= 6
                    ? 'Improvement detected! +10 XP earned 📈'
                    : 'Har topper ne zero se shuru kiya tha. +5 XP earned!'}
                </div>
                <p className="type-body">
                  {score < 6
                    ? 'Thoda aur revise karein toh score aur badhega!'
                    : 'Check Progress for your detailed AI SWOT breakdown.'}
                </p>
                {score < 6 && (
                  <button
                    onClick={handleSmartQuiz}
                    className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold py-3 rounded-[12px] text-[15px] transition"
                  >
                    Score low? Let's practice →
                  </button>
                )}
                <button
                  onClick={() => setTestState('idle')}
                  className="w-full bg-[#1A2332] hover:bg-[#243044] text-white font-semibold py-3 rounded-[12px] text-[15px] transition"
                >
                  Back to Practice Zone
                </button>
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* PROGRESS SCREEN (TRUE EMPTY STATE + GROWTH TRAJECTORY)              */}
        {/* ------------------------------------------------------------------- */}
        {activeTab === 'progress' && (
          <div className="max-w-xl mx-auto p-5 space-y-5 animate-fade-in">
            <h1 className="type-h1">📊 Your Progress</h1>

            {!hasQuizHistory ? (
              <div className="surface-card-elevated p-7 text-center space-y-4">
                <div className="text-4xl">🚀</div>
                <h2 className="type-h2">Aaj se shuru karte hain! 💪</h2>
                <p className="type-body">
                  "Har topper ne zero se shuru kiya tha. Apna pehla 10-question Polity quiz solve karo aur apna growth chart unlock karo!"
                </p>
                <div className="inline-block bg-[#10B981]/10 text-[#10B981] text-[12px] font-semibold px-3 py-1 rounded-[12px]">
                  ✅ {polityMasteredCount} topics already in Topics You Know
                </div>
                <button
                  onClick={handleSmartQuiz}
                  className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold py-3.5 rounded-[12px] text-[15px] transition shadow-sm"
                >
                  Start Practice →
                </button>
              </div>
            ) : (
              <>
                {isLowAccuracy && (
                  <div className="surface-card-elevated p-4 border-l-4 border-l-[#FF6B00] space-y-2.5">
                    <p className="type-body text-[#111827] dark:text-white font-medium">
                      "Har topper ne zero se shuru kiya tha. Keep going."
                    </p>
                    <button
                      onClick={handleSmartQuiz}
                      className="text-[13px] font-semibold text-[#FF6B00] hover:underline"
                    >
                      Score low? Let's practice →
                    </button>
                  </div>
                )}

                <div className="surface-card-elevated p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="type-h3 font-semibold text-[#111827] dark:text-white">
                      Your Growth Trajectory
                    </h3>
                    <span className="text-[12px] font-bold text-[#10B981] bg-[#10B981]/10 px-2.5 py-0.5 rounded-[12px]">
                      {examResults.length} {examResults.length === 1 ? 'Quiz' : 'Quizzes'} Done ↑
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-[#E5E7EB] dark:bg-[#283548] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#10B981] rounded-full transition-all"
                      style={{ width: `${Math.max(avgScore, 15)}%` }}
                    />
                  </div>
                  <p className="type-caption text-[#10B981] font-medium">
                    "Har quiz ke saath tumhari clarity aur strong ho rahi hai!"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="surface-card p-5 text-center space-y-1">
                    <div className="type-stat">📈 {avgScore}%</div>
                    <div className="type-caption">Accuracy</div>
                    {isLowAccuracy && (
                      <button
                        onClick={handleSmartQuiz}
                        className="text-[11px] font-semibold text-[#FF6B00] hover:underline pt-1 block mx-auto"
                      >
                        Score low? Let's practice →
                      </button>
                    )}
                  </div>
                  <div className="surface-card p-5 text-center">
                    <div className="type-stat text-[#1A2332] dark:text-white">
                      ✅ {polityMasteredCount}
                    </div>
                    <div className="type-caption mt-1">Topics Known</div>
                  </div>
                </div>

                <div className="surface-card p-5 space-y-2.5">
                  <h3 className="type-h3 font-semibold text-[#111827] dark:text-white">
                    💪 Strong Topics
                  </h3>
                  <div className="space-y-2 type-body">
                    <div className="flex justify-between items-center">
                      <span>• Source of Authority</span>
                      <span className="text-[12px] font-semibold text-[#10B981]">Mastered</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>• Citizenship</span>
                      <span className="text-[12px] font-semibold text-[#10B981]">Mastered</span>
                    </div>
                  </div>
                </div>

                <div className="surface-card p-5 space-y-3">
                  <h3 className="type-h3 font-semibold text-[#111827] dark:text-white">
                    🎯 Focus Areas for Growth
                  </h3>
                  <div className="space-y-2 type-body">
                    <div className="flex justify-between items-center">
                      <span>• Fundamental Rights</span>
                      <span className="text-[12px] font-semibold text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-[12px]">
                        High-yield • Revise
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>• Directive Principles</span>
                      <span className="text-[12px] font-semibold text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-[12px]">
                        In progress
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      startQuizWithTopics(
                        'Fundamental Rights, Directive Principles of State Policy',
                        'Polity Quick Quiz — 10Q'
                      )
                    }
                    className="w-full bg-[#FF6B00] hover:bg-[#E66000] text-white font-semibold py-3 rounded-[12px] text-[14px] transition"
                  >
                    Score low? Let's practice →
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="type-h3 font-semibold text-[#111827] dark:text-white">
                    Recent Quizzes
                  </h3>
                  {examResults.slice(0, 5).map((res, i) => {
                    const pct = Math.round((res.score / res.total_questions) * 100);
                    const prevRes = examResults[i + 1];
                    const improved = prevRes ? res.score >= prevRes.score : true;

                    return (
                      <div key={i} className="surface-card p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="text-[15px] font-semibold text-[#111827] dark:text-white">
                            {res.topics_covered || 'Polity Quick Quiz — 10Q'} •{' '}
                            <span className="type-caption font-normal">
                              {new Date(res.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          </div>
                          {improved && (
                            <span className="text-[11px] font-semibold text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-[12px]">
                              Improvement detected! 📈
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[13px] font-bold text-[#111827] dark:text-white">
                            {res.score}/{res.total_questions}
                          </span>
                          <div className="flex-1 h-2 bg-[#E5E7EB] dark:bg-[#283548] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct >= 50 ? 'bg-[#10B981]' : 'bg-[#FF6B00]'
                              }`}
                              style={{ width: `${Math.max(pct, 10)}%` }}
                            />
                          </div>
                          <span className="type-caption font-semibold">{pct}%</span>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <button
                            onClick={() => setViewingSwot(res)}
                            className="text-[13px] font-semibold text-[#FF6B00] hover:underline"
                          >
                            View Analysis →
                          </button>
                          {pct < 50 && (
                            <button
                              onClick={handleSmartQuiz}
                              className="text-[12px] font-medium text-[#6B7280] hover:text-[#FF6B00]"
                            >
                              Score low? Let's practice →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {viewingSwot && (
              <div className="fixed inset-0 z-[70] bg-[#111827]/60 flex items-center justify-center p-4 animate-fade-in">
                <div className="surface-card-elevated w-full max-w-sm p-7 relative max-h-[80vh] overflow-y-auto">
                  <button
                    onClick={() => setViewingSwot(null)}
                    className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white font-bold"
                  >
                    ✕
                  </button>
                  <h2 className="type-h2 mb-1">Mentor Feedback & SWOT</h2>
                  <div className="type-caption text-[#FF6B00] font-medium mb-4">
                    Score: {viewingSwot.score}/{viewingSwot.total_questions}
                  </div>
                  <div className="bg-[#F9FAFB] dark:bg-[#0F1724] p-4 rounded-[12px] border border-[#E5E7EB] dark:border-[#283548]">
                    <FormattedAIMessage
                      text={
                        viewingSwot.swot_analysis ||
                        "Keep practicing — detailed analysis unlocks on your next quiz!"
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="p-5 max-w-xl mx-auto space-y-5 animate-fade-in">
            <div>
              <h1 className="type-h1">🏆 Hall of Fame</h1>
              <p className="type-body mt-0.5">Top UPSC learners growing together</p>
            </div>
            <div className="surface-card overflow-hidden">
              {leaderboard.length === 0 ? (
                <div className="p-6 text-center type-body">
                  Aaj se shuru karte hain! 💪 Complete a topic or quiz to appear on the leaderboard.
                </div>
              ) : (
                leaderboard.map((user, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 border-b border-[#E5E7EB] dark:border-[#283548] last:border-0 ${
                      index === 0 ? 'bg-[#FF6B00]/5' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`w-8 h-8 rounded-[12px] flex items-center justify-center font-bold text-[12px] ${
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
                        <div className="font-semibold text-[15px] text-[#111827] dark:text-white">
                          {user.full_name || user.username || 'Aspirant'}
                        </div>
                        <div className="type-caption flex gap-2.5 mt-0.5">
                          <span>🔥 {user.streak || 1}d streak</span>
                          <span>✅ {user.topics_mastered || 0} topics known</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[15px] font-bold text-[#10B981]">{user.xp || 0} XP</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: STUDENT ID PROFILE */}
        {activeTab === 'profile' && (
          <div className="p-5 max-w-xl mx-auto animate-fade-in">
            <h1 className="type-h1 mb-5">📋 My Student ID</h1>
            <div className="surface-card-elevated p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-[#1A2332] text-white rounded-[12px] flex items-center justify-center text-2xl font-bold">
                  {firstName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="type-h2">{displayName}</h2>
                  <span className="inline-block mt-1 text-[12px] font-medium bg-[#10B981]/10 text-[#10B981] px-2.5 py-0.5 rounded-[12px]">
                    {isEmptyProgress
                      ? 'Aaj se shuru karte hain! 💪'
                      : `Level ${currentLevel}: ${levelTitle} • ${totalXP} XP`}
                  </span>
                </div>
              </div>
              <div className="space-y-3 type-body">
                <div className="flex justify-between border-b border-[#E5E7EB] dark:border-[#283548] pb-2.5">
                  <span className="text-[#6B7280] dark:text-[#9CA3AF]">Education</span>
                  <span className="font-medium text-[#111827] dark:text-white">
                    {userProfile?.education_level || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#E5E7EB] dark:border-[#283548] pb-2.5">
                  <span className="text-[#6B7280] dark:text-[#9CA3AF]">Institution</span>
                  <span className="font-medium text-[#111827] dark:text-white">
                    {userProfile?.institution || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between pb-1">
                  <span className="text-[#6B7280] dark:text-[#9CA3AF]">City</span>
                  <span className="font-medium text-[#111827] dark:text-white">
                    {userProfile?.city || 'Not set'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditingProfile(true)}
                className="mt-6 w-full bg-[#1A2332] hover:bg-[#243044] text-white py-3 rounded-[12px] text-[15px] font-semibold transition"
              >
                Edit profile
              </button>
            </div>

            {editingProfile && (
              <div className="fixed inset-0 z-[60] bg-[#111827]/60 flex items-center justify-center p-4">
                <div className="surface-card-elevated w-full max-w-md p-6">
                  <h2 className="type-h2 mb-4">
                    {isNewUser ? "Set up your Student ID" : "Edit your details"}
                  </h2>
                  <div className="space-y-3">
                    <input
                      placeholder="Full name (required)"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] p-3 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                    <input
                      placeholder="Class / Degree"
                      value={formData.education_level}
                      onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                      className="w-full bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] p-3 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                    <input
                      placeholder="Institution"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] p-3 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                    <input
                      placeholder="City"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] p-3 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:border-[#FF6B00]"
                    />
                  </div>
                  <div className="flex gap-3 mt-5">
                    {!isNewUser && (
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="flex-1 py-3 rounded-[12px] text-[15px] font-medium text-[#6B7280] hover:bg-[#F9FAFB] dark:hover:bg-[#243044]"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      onClick={saveProfile}
                      className="flex-1 bg-[#FF6B00] hover:bg-[#E66000] text-white py-3 rounded-[12px] text-[15px] font-semibold shadow-sm"
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

      {/* ===================================================================== */}
      {/* FLOATING "Ask Doubt 💬" FAB BUTTON (BOTTOM RIGHT)                     */}
      {/* ===================================================================== */}
      {!isChatOpen && (
        <button
          onClick={() => {
            setIsChatOpen(true);
            setTimeout(() => chatInputRef.current?.focus(), 120);
          }}
          className="fixed bottom-20 right-4 z-40 bg-[#FF6B00] hover:bg-[#E66000] active:scale-95 text-white font-semibold text-[14px] px-4 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all"
        >
          <span>Ask Doubt 💬</span>
        </button>
      )}

      {/* ===================================================================== */}
      {/* AI CHAT (POLICYPATH MENTOR FULL-SCREEN DRAWER — ZERO NAV OVERLAP)     */}
      {/* ===================================================================== */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed inset-0 z-50 bg-[#FFFFFF] dark:bg-[#0F1724] flex flex-col"
          >
            {/* Chat Header with Language Switch */}
            <div className="px-4 sm:px-5 py-3.5 bg-[#FFFFFF] dark:bg-[#1A2332] border-b border-[#E5E7EB] dark:border-[#283548] flex items-center justify-between gap-2">
              <div>
                <h2 className="type-h2 flex items-center gap-2">
                  <span>🤖</span>
                  <span>PolicyPath Mentor</span>
                </h2>
                <p className="type-caption">"Your free AI mentor for UPSC"</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLanguage((l) => (l === 'English' ? 'हिंदी' : 'English'))}
                  className="px-2.5 py-1.5 rounded-[12px] border border-[#E5E7EB] dark:border-[#283548] text-[12px] font-semibold text-[#FF6B00] hover:border-[#FF6B00] transition"
                >
                  🌐 {language}
                </button>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="px-3 py-1.5 rounded-[12px] border border-[#E5E7EB] dark:border-[#283548] text-[12px] font-semibold text-[#111827] dark:text-white hover:border-[#FF6B00] transition"
                >
                  Close ✕
                </button>
              </div>
            </div>

            {/* Chat Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-2xl w-full mx-auto">
              {/* AI Welcome Card */}
              <div className="surface-card-elevated p-5 space-y-3">
                <div className="text-[12px] font-bold text-[#FF6B00]">AI Mentor</div>
                <p className="type-body text-[#111827] dark:text-white font-medium">
                  {AI_WELCOME_MSG}
                </p>
                <div className="pt-1">
                  <div className="type-caption mb-2">Quick options:</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Fundamental Rights',
                      'Continue Polity',
                      'Explain a concept',
                      'Solve a PYQ',
                    ].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => sendChatMessage(chip)}
                        className="px-3 py-1.5 rounded-[12px] bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] hover:border-[#FF6B00] text-[13px] font-medium text-[#111827] dark:text-white transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Conversation History */}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                >
                  {m.role === 'user' ? (
                    <div className="max-w-[82%] bg-[#1A2332] text-white p-4 rounded-[12px] shadow-sm">
                      <div className="text-[11px] font-semibold text-white/60 mb-1">You</div>
                      <div className="text-[15px] leading-[1.6] whitespace-pre-wrap">{m.text}</div>
                    </div>
                  ) : (
                    <div className="max-w-[94%] surface-card-elevated p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] font-bold text-[#FF6B00]">AI Mentor</span>
                        {m.saved && (
                          <span className="text-[11px] font-semibold text-[#10B981]">
                            ✓ Saved to Topics You Know ✅
                          </span>
                        )}
                      </div>

                      <FormattedAIMessage text={m.text} />

                      {/* Action Buttons After Each AI Response */}
                      <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#283548] flex flex-wrap gap-2">
                        <button
                          onClick={() =>
                            saveTopicToMastered(
                              m.topicHint || 'Constitutional Concept',
                              m.text
                            )
                          }
                          className="px-3 py-1.5 rounded-[12px] bg-[#10B981]/10 hover:bg-[#10B981]/20 text-[#10B981] text-[12px] font-semibold transition"
                        >
                          Save to Notes 📌
                        </button>
                        <button
                          onClick={() =>
                            startQuizWithTopics(
                              m.topicHint || m.text.slice(0, 80),
                              'Polity Quick Quiz — 10Q'
                            )
                          }
                          className="px-3 py-1.5 rounded-[12px] bg-[#FF6B00]/10 hover:bg-[#FF6B00]/20 text-[#FF6B00] text-[12px] font-semibold transition"
                        >
                          Quiz me on this ✍️
                        </button>
                        <button
                          onClick={() =>
                            sendChatMessage(
                              "Explain this more simply in easy Hinglish/English with a practical Indian example."
                            )
                          }
                          className="px-3 py-1.5 rounded-[12px] bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] hover:border-[#1A2332] text-[#374151] dark:text-[#D1D5DB] text-[12px] font-medium transition"
                        >
                          Explain more simply 🔄
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing Indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="surface-card px-4 py-3 flex items-center gap-2.5 text-[13px] font-medium text-[#6B7280] dark:text-[#9CA3AF]">
                    <span className="w-2 h-2 rounded-full bg-[#FF6B00] animate-bounce" />
                    <span>PolicyPath soch raha hai... 🤔</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-16" />
            </div>

            {/* Bottom Input Bar with Voice (🎤) & Send (➤) */}
            <div className="p-3.5 bg-[#FFFFFF] dark:bg-[#1A2332] border-t border-[#E5E7EB] dark:border-[#283548]">
              <div className="max-w-2xl mx-auto flex items-center gap-2">
                <input
                  ref={chatInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder={isListening ? "Bolna shuru karo... listening" : "Type or speak your doubt..."}
                  disabled={loading}
                  className="flex-1 bg-[#F9FAFB] dark:bg-[#0F1724] border border-[#E5E7EB] dark:border-[#283548] rounded-[12px] px-4 py-3 text-[15px] text-[#111827] dark:text-white focus:outline-none focus:border-[#FF6B00] placeholder-[#9CA3AF]"
                />
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  aria-label="Voice input"
                  className={`w-11 h-11 rounded-[12px] border flex items-center justify-center text-lg transition ${
                    isListening
                      ? 'bg-[#EF4444] border-[#EF4444] text-white animate-pulse'
                      : 'bg-[#F9FAFB] dark:bg-[#0F1724] border-[#E5E7EB] dark:border-[#283548] text-[#111827] dark:text-white hover:border-[#FF6B00]'
                  }`}
                >
                  🎤
                </button>
                <button
                  type="button"
                  onClick={() => sendChatMessage()}
                  disabled={loading || !query.trim()}
                  aria-label="Send message"
                  className={`w-11 h-11 rounded-[12px] flex items-center justify-center font-bold text-base transition ${
                    loading || !query.trim()
                      ? 'bg-[#E5E7EB] dark:bg-[#283548] text-[#9CA3AF]'
                      : 'bg-[#FF6B00] hover:bg-[#E66000] text-white'
                  }`}
                >
                  ➤
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HELP & FEEDBACK MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-[70] bg-[#111827]/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="surface-card-elevated w-full max-w-sm p-6 relative space-y-3">
            <button
              onClick={() => setShowHelpModal(false)}
              className="absolute top-4 right-4 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white font-bold"
            >
              ✕
            </button>
            <h2 className="type-h2">❓ Help & Feedback</h2>
            <p className="type-body">
              Koi bhi doubt ho ya feedback dena ho, tap "Ask Doubt 💬" anytime — main hamesha yahin hoon!
            </p>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full bg-[#1A2332] text-white font-semibold py-2.5 rounded-[12px] text-[14px]"
            >
              Samajh gaya 👍
            </button>
          </div>
        </div>
      )}

        {/* ===================================================================== */}
      {/* BOTTOM NAVIGATION (Home | Learn | Practice | Progress)                */}
      {/* ===================================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFFFF] dark:bg-[#1A2332] border-t border-[#E5E7EB] dark:border-[#283548] px-2 py-2">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-[12px] transition-colors ${
                  isActive
                    ? 'text-[#FF6B00]'
                    : 'text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white'
                }`}
              >
                {isActive ? tab.filledIcon : tab.outlineIcon}
                <span
                  className={`text-[12px] mt-1 leading-none ${
                    isActive ? 'font-bold text-[#FF6B00]' : 'font-normal'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
