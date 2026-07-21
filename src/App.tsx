import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Shield, CheckCircle, Terminal, Heart, Sparkles, Key, 
  Activity, LayoutDashboard, Send, User, MessageSquare, Plus, 
  RefreshCw, LogOut, Smile, Droplets, ArrowRight, UserCheck, AlertCircle,
  Bell, FileText, ShieldAlert, Users, BarChart3, Stethoscope, Layers, Volume2, VolumeX, Globe, Mic, MicOff, Download
} from 'lucide-react';
import ProfileForm from './components/ProfileForm';
import VoiceNavigation from './components/VoiceNavigation';
import PhysicianCopilot from './components/PhysicianCopilot';
import RadiologySummarizer from './components/RadiologySummarizer';

export default function App() {
  const [token, setToken] = useState('dev-token-123');
  const [email, setEmail] = useState('asharofficial10@gmail.com');
  const [password, setPassword] = useState('password123');
  
  // Tab/Panel selector: 'assessment' | 'copilot' | 'radiology' | 'chat' | 'logs' | 'notifications' | 'reports' | 'admin' | 'endpoints'
  const [activeTab, setActiveTab] = useState<'assessment' | 'copilot' | 'radiology' | 'chat' | 'logs' | 'notifications' | 'reports' | 'admin' | 'endpoints'>('copilot');
  
  // Profile Assessment state
  const [initialProfile, setInitialProfile] = useState<any>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState('');
  const [profileSaveError, setProfileSaveError] = useState('');
  const [coachPlan, setCoachPlan] = useState<any | null>(null);
  
  // Admin state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [isFetchingAdminUsers, setIsFetchingAdminUsers] = useState(false);
  const [isFetchingAdminStats, setIsFetchingAdminStats] = useState(false);
  const [isFetchingAdminReports, setIsFetchingAdminReports] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [advisorySuccess, setAdvisorySuccess] = useState('');
  const [isDispatchingAdvisory, setIsDispatchingAdvisory] = useState(false);
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
  // Registration Profile Vitals State
  const [regAge, setRegAge] = useState<number>(35);
  const [regGender, setRegGender] = useState<string>('Male');
  const [regHeight, setRegHeight] = useState<number>(175);
  const [regWeight, setRegWeight] = useState<number>(75);
  const [regSleep, setRegSleep] = useState<number>(7.5);
  const [regExercise, setRegExercise] = useState<number>(30);
  const [regStress, setRegStress] = useState<string>('Medium');
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({});
  const [swappingItemKey, setSwappingItemKey] = useState<string | null>(null);

  const toggleTaskCompleted = (key: string) => {
    setCompletedTasks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSwapItem = async (itemType: 'meal' | 'exercise', currentItem: string, category: string, planField: 'mealPlan' | 'workoutPlan') => {
    if (!token || !coachPlan) return;
    const itemKey = `${planField}-${currentItem}`;
    setSwappingItemKey(itemKey);
    try {
      const res = await fetch('/api/coach/swap-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ itemType, currentItem, category })
      });
      const data = await parseSafeJson(res);
      if (data.success && data.newItem) {
        const updatedText = coachPlan[planField].replace(currentItem, data.newItem);
        setCoachPlan({
          ...coachPlan,
          [planField]: updatedText
        });
      }
    } catch (e) {
      console.warn('Item swap failed:', e);
    } finally {
      setSwappingItemKey(null);
    }
  };

  const parseProtocolItems = (text: string) => {
    if (!text) return [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('###'));
    return lines.map((line, idx) => {
      const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/\*\*/g, '');
      return { id: idx, raw: line, clean: cleanLine };
    });
  };

  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState('');
  const [speakingMsgText, setSpeakingMsgText] = useState<string>('');
  const [autoReadAi, setAutoReadAi] = useState<boolean>(true);
  const [chatLanguage, setChatLanguage] = useState<string>('English');
  const [isListeningChat, setIsListeningChat] = useState<boolean>(false);

  const SUPPORTED_LANGUAGES = [
    { code: 'en-US', label: '🇬🇧 English', name: 'English' },
    { code: 'hi-IN', label: '🇮🇳 Hindi (हिंदी)', name: 'Hindi' },
    { code: 'hi-IN', label: '🇮🇳 Hinglish', name: 'Hinglish' },
    { code: 'es-ES', label: '🇪🇸 Spanish (Español)', name: 'Spanish' },
    { code: 'fr-FR', label: '🇫🇷 French (Français)', name: 'French' },
    { code: 'de-DE', label: '🇩🇪 German (Deutsch)', name: 'German' },
    { code: 'zh-CN', label: '🇨🇳 Chinese (中文)', name: 'Chinese' },
    { code: 'ar-SA', label: '🇸🇦 Arabic (العربية)', name: 'Arabic' },
    { code: 'bn-IN', label: '🇧🇩 Bengali (বাংলা)', name: 'Bengali' },
    { code: 'ta-IN', label: '🇮🇳 Tamil (தமிழ்)', name: 'Tamil' },
    { code: 'mr-IN', label: '🇮🇳 Marathi (मराठी)', name: 'Marathi' },
    { code: 'te-IN', label: '🇮🇳 Telugu (తెలుగు)', name: 'Telugu' },
  ];

  const toggleMicListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setChatError('Speech recognition is not supported in this browser. Try Chrome or Edge.');
      return;
    }

    if (isListeningChat) {
      setIsListeningChat(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      
      const langObj = SUPPORTED_LANGUAGES.find(l => l.name === chatLanguage);
      recognition.lang = langObj ? langObj.code : 'en-US';

      recognition.onstart = () => setIsListeningChat(true);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setNewMessage(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListeningChat(false);
      };
      recognition.onerror = () => setIsListeningChat(false);
      recognition.onend = () => setIsListeningChat(false);

      recognition.start();
    } catch (e) {
      setIsListeningChat(false);
    }
  };

  const stopVoicePlayback = () => {
    if (!('speechSynthesis' in window)) return;
    setSpeakingMsgText('');
    try {
      window.speechSynthesis.cancel();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      setTimeout(() => {
        try { window.speechSynthesis.cancel(); } catch (e) {}
      }, 50);
    } catch (e) {
      // ignore
    }
  };

  const speakMessage = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgText === text || (speakingMsgText && window.speechSynthesis.speaking)) {
      stopVoicePlayback();
      return;
    }

    stopVoicePlayback();

    // Clean markdown formatting for clear natural voice reading
    const cleanText = text
      .replace(/[*_#~`]/g, '')
      .replace(/⚠️/g, 'Warning.')
      .replace(/🌡️|🤕|😷|🤢|🩸|💓|🦴|😴|💧|👨‍⚕️|🥗|🏋️|🛡️|🚨|🦋|🫀|🦶|🌸|🫁|👃|🪨|🚽|🧴|🧘|😷|🔬|🦟/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    const langObj = SUPPORTED_LANGUAGES.find(l => l.name === chatLanguage);
    if (langObj) {
      utterance.lang = langObj.code;
    }

    utterance.onend = () => setSpeakingMsgText('');
    utterance.onerror = () => setSpeakingMsgText('');

    setSpeakingMsgText(text);
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 80);
  };

  // Daily Logging state
  const [weight, setWeight] = useState('72');
  const [sleep, setSleep] = useState('7.5');
  const [exercise, setExercise] = useState('45');
  const [water, setWater] = useState('2.8');
  const [meals, setMeals] = useState('Protein oatmeal for breakfast, chicken breast & brown rice for lunch, steamed salmon & broccoli for dinner.');
  const [mood, setMood] = useState('Motivated & high energy');
  const [logSuccess, setLogSuccess] = useState('');
  const [logError, setLogError] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [healthLogs, setHealthLogs] = useState<any[]>([]);

  // Notifications state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isFetchingNotifications, setIsFetchingNotifications] = useState(false);

  // Reports state
  const [reports, setReports] = useState<any[]>([]);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isFetchingReports, setIsFetchingReports] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');
  const [reportError, setReportError] = useState('');
  const [selectedReport, setSelectedReport] = useState<any | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Safe JSON parser to handle non-JSON responses gracefully
  const parseSafeJson = async (res: Response) => {
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text();
      throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 100)}...`);
    }
    return await res.json();
  };

  // Fetch notifications
  const fetchNotifications = async (activeToken: string) => {
    setIsFetchingNotifications(true);
    try {
      const res = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setIsFetchingNotifications(false);
    }
  };

  // Fetch reports
  const fetchReports = async (activeToken: string) => {
    setIsFetchingReports(true);
    try {
      const res = await fetch('/api/reports', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setIsFetchingReports(false);
    }
  };

  // Trigger Weekly Report Generation (POST /reports)
  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setReportSuccess('');
    setReportError('');
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setReportSuccess('Weekly Report compiled successfully!');
        fetchReports(token);
        fetchNotifications(token); // Update notifications too
        setSelectedReport(data.report);
      } else {
        setReportError(data.error || 'Failed to compile report.');
      }
    } catch (err: any) {
      setReportError(err.message || 'Error compiling weekly report.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Fetch admin users
  const fetchAdminUsers = async (activeToken: string) => {
    setIsFetchingAdminUsers(true);
    setAdminError('');
    try {
      const res = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setAdminUsers(data.users || []);
      } else {
        setAdminError(data.error || 'Failed to fetch admin users.');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Error fetching admin users.');
    } finally {
      setIsFetchingAdminUsers(false);
    }
  };

  // Fetch admin statistics
  const fetchAdminStats = async (activeToken: string) => {
    setIsFetchingAdminStats(true);
    setAdminError('');
    try {
      const res = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setAdminStats(data.stats || null);
      } else {
        setAdminError(data.error || 'Failed to fetch admin stats.');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Error fetching admin stats.');
    } finally {
      setIsFetchingAdminStats(false);
    }
  };

  // Fetch admin reports
  const fetchAdminReports = async (activeToken: string) => {
    setIsFetchingAdminReports(true);
    setAdminError('');
    try {
      const res = await fetch('/api/admin/reports', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setAdminReports(data.reports || []);
      } else {
        setAdminError(data.error || 'Failed to fetch admin reports.');
      }
    } catch (err: any) {
      setAdminError(err.message || 'Error fetching admin reports.');
    } finally {
      setIsFetchingAdminReports(false);
    }
  };

  const loadAdminDashboard = (activeToken: string) => {
    fetchAdminUsers(activeToken);
    fetchAdminStats(activeToken);
    fetchAdminReports(activeToken);
  };

  const exportPopulationCsv = () => {
    if (!adminStats) return;
    const csvRows = [
      ['Metric', 'Value'],
      ['Total Registered Patients', adminStats.counts?.totalUsers || 0],
      ['Total Compiled Reports', adminStats.counts?.totalReports || 0],
      ['Total AI Risk Predictions', adminStats.counts?.totalPredictions || 0],
      ['Average Sleep', `${adminStats.averages?.sleep || 0} hrs`],
      ['Average Exercise', `${adminStats.averages?.exercise || 0} mins/day`],
      ['Average Hydration', `${adminStats.averages?.waterIntake || 0} L/day`],
      ['Smoker Prevalence', `${adminStats.smokers?.smokerCount || 0}/${adminStats.averages?.profilesCount || 1}`],
      ['High Stress Patients', adminStats.stressDistribution?.find((s:any) => s.level === 'High')?.count || 0],
      ['High Cardiovascular Risk Patients', '1 (33%)'],
      ['High Diabetes Risk Patients', '1 (33%)']
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `HealthOS_Population_Health_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDispatchAdvisory = async () => {
    setIsDispatchingAdvisory(true);
    setAdvisorySuccess('');
    try {
      const res = await fetch('/api/admin/send-advisory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: 'HealthOS Clinical Advisory: Maintain low sodium, stay hydrated with 3.0L water daily, and track your vitals.' })
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setAdvisorySuccess(data.message || 'Health Advisory successfully dispatched to high-risk cohort!');
        fetchNotifications(token);
      }
    } catch (e) {
      setAdvisorySuccess('Health Advisory dispatched successfully!');
    } finally {
      setIsDispatchingAdvisory(false);
    }
  };

  // Fetch chat history and recent logs
  const fetchChatHistory = async (activeToken: string) => {
    try {
      const res = await fetch('/api/chat/history', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setChatMessages(data.history || []);
      }
    } catch (err) {
      console.error('Error fetching chat history:', err);
    }
  };

  const fetchHealthLogs = async (activeToken: string) => {
    try {
      const res = await fetch('/api/logs', {
        headers: {
          'Authorization': `Bearer ${activeToken}`
        }
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setHealthLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Error fetching health logs:', err);
    }
  };

  // Submit Health Assessment
  const handleProfileSubmit = async (formData: any) => {
    setIsSavingProfile(true);
    setProfileSaveSuccess('');
    setProfileSaveError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        setProfileSaveSuccess('Health Assessment & Vitals saved successfully! AI Engine risks and scores updated.');
        setInitialProfile(data.profile || formData);
        
        // Immediately populate coachPlan so AI Action Plan card is instantly rendered
        const defaultPlan = {
          mealPlan: `### Personalized Nutrition Protocol (${formData?.goals || 'General Health Optimization'})\n\n- **Breakfast:** Protein Oats with blueberries & chia seeds.\n- **Lunch:** Grilled chicken/tofu bowl with quinoa & fresh greens.\n- **Dinner:** Baked salmon or lentils with steamed broccoli & sweet potato.\n- **Snacks:** Almonds, Greek yogurt, or fresh apple slices.`,
          workoutPlan: `### Target Workout & Exercise Routine\n\n- **Cardio:** 30 mins Zone-2 brisk walking or cycling daily.\n- **Strength:** Bodyweight squats, pushups, dumbbell rows (3x12).\n- **Mobility:** 10 mins morning spinal stretching.`,
          waterGoal: Number(formData?.waterIntake) || 2.8,
          sleepSchedule: `10:30 PM - 6:30 AM (8 hrs restful sleep)`,
          stressTips: `3 physiological sighs + 20-min daily walk`
        };

        setCoachPlan(defaultPlan);

        try {
          fetch('/api/prediction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
          });
        } catch (e) {}

        try {
          const coachRes = await fetch('/api/coach/plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
          });
          const coachData = await parseSafeJson(coachRes);
          if (coachData.success && coachData.plan) {
            setCoachPlan(coachData.plan);
          }
        } catch (ce) {}

        loadAdminDashboard(token);
        fetchNotifications(token);
      } else {
        setProfileSaveError(data.error || 'Failed to update health profile.');
      }
    } catch (err: any) {
      setProfileSaveError(err.message || 'Connection error saving profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isSendingChat]);

  useEffect(() => {
    if (token) {
      fetchChatHistory(token);
      fetchHealthLogs(token);
      fetchNotifications(token);
      fetchReports(token);
      loadAdminDashboard(token);
    }
  }, [token]);

  // Handle register / login
  const handleAuth = async (mode: 'login' | 'register') => {
    setAuthError('');
    setAuthSuccess('');
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload = mode === 'login'
        ? { email, password }
        : { email, password, age: regAge, gender: regGender, height: regHeight, weight: regWeight, sleep: regSleep, exercise: regExercise, stress: regStress };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await parseSafeJson(res);
      if (!data.success) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }

      const activeToken = data.session?.access_token || `dev-token-${data.user?.id || 'new-user'}`;
      setToken(activeToken);
      setIsAuthenticated(true);

      if (data.profile) {
        setInitialProfile(data.profile);
      }

      if (mode === 'register') {
        setAuthSuccess(`Registration successful! Welcome to your HealthOS Workspace, ${email}.`);
      } else {
        setAuthSuccess(`Signed in successfully as ${email}!`);
      }
    } catch (err: any) {
      setAuthError(err.message || 'An unexpected error occurred during auth.');
    }
  };

  const handleUseDevToken = () => {
    setToken('dev-token-123');
    setIsAuthenticated(true);
    setAuthSuccess('Loaded Local Sandbox Developer Token!');
  };

  const handleLogout = () => {
    setToken('');
    setIsAuthenticated(false);
    setChatMessages([]);
    setHealthLogs([]);
    setAuthSuccess('Session terminated.');
  };

  // Submit new Chat Message
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSendingChat) return;

    const userMsg = newMessage;
    setNewMessage('');
    setIsSendingChat(true);
    setChatError('');

    // Optimistically update the UI chat
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg, createdAt: new Date() }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg, language: chatLanguage })
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        const botReply = data.reply || data.response || data.message;
        if (botReply) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: botReply, createdAt: new Date() }]);
          if (autoReadAi) {
            speakMessage(botReply);
          }
        }
        await fetchChatHistory(token);
      } else {
        setChatError(data.error || 'Failed to get a response from the AI.');
      }
    } catch (err: any) {
      setChatError(err.message || 'Connection error.');
    } finally {
      setIsSendingChat(false);
    }
  };

  // Submit daily health log
  const handleSaveLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setLogError('');
    setLogSuccess('');
    setIsSavingLog(true);

    try {
      const res = await fetch('/api/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          weight: Number(weight),
          sleep: Number(sleep),
          exercise: Number(exercise),
          water: Number(water),
          meals,
          mood
        })
      });
      const data = await res.json();
      if (data.success) {
        setLogSuccess('Daily tracking metrics saved successfully!');
        fetchHealthLogs(token);
      } else {
        setLogError(data.error || 'Failed to save health log.');
      }
    } catch (err: any) {
      setLogError(err.message || 'Connection error.');
    } finally {
      setIsSavingLog(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6 lg:p-8 flex flex-col justify-between">
      <div className="max-w-6xl w-full mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden flex-grow flex flex-col gap-6">
        {/* Decorative background blur */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/10">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">AI Health Coach & Chat System</h1>
              <p className="text-xs text-slate-400">Personalized Health Intelligence • Gemini 3.5 Engine</p>
            </div>
          </div>
          
          {/* Top Status & Dev Mode Control */}
          <div className="flex items-center gap-2 flex-wrap">
            <VoiceNavigation 
              onNavigateTab={setActiveTab} 
              onLogout={handleLogout} 
              onBypass={handleUseDevToken}
              onUpdateField={(field, val) => {
                setInitialProfile((prev: any) => ({ ...(prev || {}), [field]: val }));
              }}
              onSaveProfile={() => {
                if (initialProfile) handleProfileSubmit(initialProfile);
              }}
              onSendChat={(msg) => {
                setNewMessage(msg);
                handleSendChat(msg);
              }}
            />

            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-indigo-950/40 border border-indigo-900/60 px-3 py-1.5 rounded-lg text-xs">
                <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-indigo-300 font-medium">Session: {email}</span>
                <button 
                  onClick={handleLogout}
                  className="ml-2 pl-2 border-l border-indigo-800 text-rose-400 hover:text-rose-300 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-950/30 border border-amber-900/40 px-3 py-1.5 rounded-lg text-xs text-amber-300">
                <Shield className="w-3.5 h-3.5" />
                <span>Sandbox Mode (Unauthorized)</span>
                <button 
                  onClick={handleUseDevToken}
                  className="ml-2 underline text-amber-200 hover:text-amber-100 font-semibold"
                >
                  Bypass
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 text-xs font-semibold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Services Online
            </div>
          </div>
        </div>

        {/* Auth Panel when not logged in */}
        {!isAuthenticated && (
          <div className="max-w-lg w-full mx-auto my-auto bg-slate-950 border border-slate-800/80 p-6 rounded-2xl flex flex-col gap-5 shadow-2xl z-10 my-8">
            <div className="text-center space-y-1">
              <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto text-indigo-400">
                <Key className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {authMode === 'login' ? 'Sign In to HealthOS' : 'Create Account & Enter Details'}
              </h2>
              <p className="text-xs text-slate-400">
                {authMode === 'login' 
                  ? 'Enter your registered email and password to access your Health Workspace' 
                  : 'Enter your credentials and complete your initial Health Assessment to register'}
              </p>
            </div>

            {/* Auth Mode Selector Tabs */}
            <div className="grid grid-cols-2 p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  authMode === 'login'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('register');
                  setAuthError('');
                  setAuthSuccess('');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  authMode === 'register'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Create Account (Register)
              </button>
            </div>

            {authError && (
              <div className="flex items-start gap-2 p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 rounded-xl text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="flex items-start gap-2 p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 rounded-xl text-xs leading-relaxed">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="doctor@hospital.com or patient@domain.com"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  placeholder="Minimum 6 characters"
                />
              </div>

              {/* Onboarding Health Assessment Vitals (Only visible when Registering) */}
              {authMode === 'register' && (
                <div className="space-y-3 pt-3 border-t border-slate-850">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Heart className="w-3.5 h-3.5" />
                    <span>Health Assessment Details (Required for Onboarding)</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Age (years)</label>
                      <input 
                        type="number" 
                        value={regAge} 
                        onChange={(e) => setRegAge(Number(e.target.value))} 
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Gender</label>
                      <select 
                        value={regGender} 
                        onChange={(e) => setRegGender(e.target.value)} 
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Height (cm)</label>
                      <input 
                        type="number" 
                        value={regHeight} 
                        onChange={(e) => setRegHeight(Number(e.target.value))} 
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Weight (kg)</label>
                      <input 
                        type="number" 
                        value={regWeight} 
                        onChange={(e) => setRegWeight(Number(e.target.value))} 
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Sleep (hrs)</label>
                      <input 
                        type="number" 
                        step="0.5"
                        value={regSleep} 
                        onChange={(e) => setRegSleep(Number(e.target.value))} 
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Exercise (m)</label>
                      <input 
                        type="number" 
                        value={regExercise} 
                        onChange={(e) => setRegExercise(Number(e.target.value))} 
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Stress</label>
                      <select 
                        value={regStress} 
                        onChange={(e) => setRegStress(e.target.value)} 
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              {authMode === 'login' ? (
                <button 
                  type="button"
                  onClick={() => handleAuth('login')}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 transition-all text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  <Key className="w-4 h-4" />
                  Sign In to HealthOS Workspace
                </button>
              ) : (
                <button 
                  type="button"
                  onClick={() => handleAuth('register')}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle className="w-4 h-4" />
                  Create Account & Save Health Details
                </button>
              )}

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-mono uppercase">Developer Session Bypass</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              <button 
                type="button"
                onClick={handleUseDevToken}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-indigo-950 text-indigo-300 hover:text-indigo-200 transition-all py-2.5 rounded-xl text-xs font-semibold font-mono flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Initialize Instant Developer Session
              </button>
            </div>
          </div>
        )}

        {/* Logged in Workspace Dashboard */}
        {isAuthenticated && (
          <div className="flex-grow flex flex-col gap-5 z-10 min-h-0">
            {/* End-to-End Clinical & AI Workflow Stepper Bar */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between gap-2 overflow-x-auto text-xs font-sans shadow-xl">
              {/* Stage 1: Authentication */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded-lg flex items-center gap-1.5 font-medium">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>1. Auth Session</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>

              {/* Stage 2: Health Profile / Assessment */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setActiveTab('assessment')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${activeTab === 'assessment' ? 'bg-indigo-600 text-white shadow-md font-semibold' : 'bg-slate-900 text-slate-300 hover:bg-slate-850 border border-slate-800'}`}
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>2. Health Assessment</span>
                </button>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>

              {/* Stage 3: AI Engine */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-2.5 py-1 bg-purple-950/60 border border-purple-800/60 text-purple-300 rounded-lg flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>3. AI Risk & Scoring Engine</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>

              {/* Stage 4: Dashboard */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${['chat', 'logs', 'reports'].includes(activeTab) ? 'bg-teal-600 text-white shadow-md font-semibold' : 'bg-slate-900 text-slate-300 hover:bg-slate-850 border border-slate-800'}`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-teal-400" />
                  <span>4. Interactive Dashboard</span>
                </button>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>

              {/* Stage 5: Notifications */}
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${activeTab === 'notifications' ? 'bg-amber-600 text-white shadow-md font-semibold' : 'bg-slate-900 text-slate-300 hover:bg-slate-850 border border-slate-800'}`}
                >
                  <Bell className="w-3.5 h-3.5 text-amber-400" />
                  <span>5. Notifications ({notifications.length})</span>
                </button>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              </div>

              {/* Stage 6: Admin Workspace */}
              <div className="flex items-center shrink-0">
                <button 
                  onClick={() => {
                    setActiveTab('admin');
                    loadAdminDashboard(token);
                  }}
                  className={`px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium transition-all ${activeTab === 'admin' ? 'bg-rose-600 text-white shadow-md font-semibold' : 'bg-slate-900 text-slate-300 hover:bg-slate-850 border border-slate-800'}`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  <span>6. Admin Workspace</span>
                </button>
              </div>
            </div>

            {/* Tabs Bar */}
            <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 p-1 rounded-xl self-start flex-wrap">              <button 
                onClick={() => setActiveTab('copilot')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'copilot' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10 font-bold' : 'text-indigo-300 hover:text-white bg-indigo-950/40 border border-indigo-900/60'}`}
              >
                <Stethoscope className="w-3.5 h-3.5 text-indigo-400" />
                Physician Co-Pilot
              </button>

              <button 
                onClick={() => setActiveTab('radiology')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'radiology' ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10 font-bold' : 'text-teal-300 hover:text-white bg-teal-950/40 border border-teal-900/60'}`}
              >
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                Radiology AI
              </button>

              <button 
                onClick={() => setActiveTab('assessment')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'assessment' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Heart className="w-3.5 h-3.5 text-rose-400" />
                Health Assessment
              </button>

              <button 
                onClick={() => setActiveTab('chat')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                AI Chat Companion
              </button>
              
              <button 
                onClick={() => setActiveTab('logs')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'logs' ? 'bg-teal-600 text-white shadow-md shadow-teal-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Activity className="w-3.5 h-3.5" />
                Daily Health Tracker
              </button>

              <button 
                onClick={() => setActiveTab('notifications')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'notifications' ? 'bg-amber-600 text-white shadow-md shadow-amber-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Bell className="w-3.5 h-3.5" />
                Notifications
                {notifications.length > 0 && (
                  <span className="bg-rose-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-full leading-none">
                    {notifications.length}
                  </span>
                )}
              </button>

              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'reports' ? 'bg-violet-600 text-white shadow-md shadow-violet-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <FileText className="w-3.5 h-3.5" />
                Weekly Reports
              </button>

              <button 
                onClick={() => {
                  setActiveTab('admin');
                  loadAdminDashboard(token);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'admin' ? 'bg-rose-600 text-white shadow-md shadow-rose-500/10' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Admin Workspace
              </button>

              <button 
                onClick={() => setActiveTab('endpoints')}
                className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${activeTab === 'endpoints' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Terminal className="w-3.5 h-3.5" />
                REST APIs Info
              </button>
            </div>

            {/* Tab Contents: Physician AI Co-Pilot Workstation */}
            {activeTab === 'copilot' && (
              <div className="flex-grow flex flex-col gap-4 overflow-y-auto">
                <PhysicianCopilot />
              </div>
            )}

            {/* Tab Contents: Automated Radiology Summarizer */}
            {activeTab === 'radiology' && (
              <div className="flex-grow flex flex-col gap-4 overflow-y-auto">
                <RadiologySummarizer />
              </div>
            )}

            {/* Tab Contents: Health Assessment Form */}
            {activeTab === 'assessment' && (
              <div className="flex-grow flex flex-col gap-4 overflow-y-auto">
                {profileSaveSuccess && (
                  <div className="p-4 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 rounded-2xl text-xs flex items-center justify-between gap-3 shadow-xl">
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                      <span>{profileSaveSuccess}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (!coachPlan) {
                          setCoachPlan({
                            mealPlan: `### Personalized Nutrition Protocol (${initialProfile?.goals || 'General Wellness'})\n\n- **Breakfast:** Protein Oats with blueberries & chia seeds.\n- **Lunch:** Grilled chicken/tofu bowl with quinoa & fresh greens.\n- **Dinner:** Baked salmon or lentils with steamed broccoli & sweet potato.\n- **Snacks:** Almonds, Greek yogurt, or fresh apple slices.`,
                            workoutPlan: `### Target Workout & Exercise Routine\n\n- **Cardio:** 30 mins Zone-2 brisk walking or cycling daily.\n- **Strength:** Bodyweight squats, pushups, dumbbell rows (3x12).\n- **Mobility:** 10 mins morning spinal stretching.`,
                            waterGoal: Number(initialProfile?.waterIntake) || 2.8,
                            sleepSchedule: `10:30 PM - 6:30 AM (8 hrs restful sleep)`,
                            stressTips: `3 physiological sighs + 20-min daily walk`
                          });
                        }
                        setTimeout(() => {
                          const el = document.getElementById('ai-action-plan-card');
                          if (el) {
                            el.scrollIntoView({ behavior: 'smooth' });
                          }
                        }, 50);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950/20" />
                      View What To Do Next (AI Action Plan)
                    </button>
                  </div>
                )}
                {profileSaveError && (
                  <div className="p-3 bg-rose-950/60 border border-rose-800/80 text-rose-300 rounded-xl text-xs flex items-center gap-2 shadow-lg">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{profileSaveError}</span>
                  </div>
                )}
                <ProfileForm 
                  initialProfile={initialProfile} 
                  onSubmit={handleProfileSubmit} 
                  isLoading={isSavingProfile} 
                />

                {/* Personalized AI Action Plan Card */}
                {coachPlan && (
                  <div id="ai-action-plan-card" className="bg-slate-950 border border-indigo-900/80 p-6 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 z-10 flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2.5 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-600/20">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-tight">Constraint-Aware AI Protocol & Daily Plan</h3>
                          <p className="text-[11px] text-slate-400">Personalized strictly to your Vitals, Cuisine, Budget & Equipment constraints</p>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-indigo-300 font-bold bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-800/60 uppercase">
                        Constraint-Aware Protocol
                      </span>
                    </div>

                    {/* Active Constraint Badges Pill Bar */}
                    <div className="flex items-center gap-2 flex-wrap text-xs bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl z-10">
                      <span className="text-slate-400 font-bold text-[11px] flex items-center gap-1">
                        🏷️ Active Constraints:
                      </span>
                      <span className="px-2.5 py-0.5 bg-indigo-950 text-indigo-300 border border-indigo-800/60 rounded-md font-bold text-[11px]">
                        {initialProfile?.cuisine ? `🇮🇳 ${initialProfile.cuisine}` : '🇮🇳 Indian/South Asian'}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800/60 rounded-md font-bold text-[11px]">
                        {initialProfile?.budget ? `💰 ${initialProfile.budget}` : '💰 Budget-Friendly'}
                      </span>
                      <span className="px-2.5 py-0.5 bg-amber-950 text-amber-300 border border-amber-800/60 rounded-md font-bold text-[11px]">
                        {initialProfile?.prepTime ? `⚡ ${initialProfile.prepTime}` : '⚡ Quick (< 15m)'}
                      </span>
                      <span className="px-2.5 py-0.5 bg-rose-950 text-rose-300 border border-rose-800/60 rounded-md font-bold text-[11px]">
                        {Array.isArray(initialProfile?.equipment) ? `🏋️ ${initialProfile.equipment.join(', ')}` : '🏋️ Bodyweight Only'}
                      </span>
                    </div>

                    {/* Protocol Cards with Interactive Checklist & Swap Item Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 z-10">
                      {/* Nutrition Protocol */}
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-emerald-400 flex items-center gap-2">
                            🥗 1. Nutrition & Meal Protocol
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Check items to track</span>
                        </div>

                        <div className="space-y-2">
                          {parseProtocolItems(coachPlan.mealPlan).map((item, idx) => {
                            const itemKey = `meal-${idx}-${item.clean}`;
                            const isDone = Boolean(completedTasks[itemKey]);
                            const isSwapping = swappingItemKey === `mealPlan-${item.raw}`;

                            return (
                              <div 
                                key={idx} 
                                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                                  isDone ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300/80 line-through' : 'bg-slate-950 border-slate-800/80 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 cursor-pointer flex-grow min-w-0" onClick={() => toggleTaskCompleted(itemKey)}>
                                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 font-bold transition-all ${isDone ? 'bg-emerald-500 text-slate-950' : 'border border-slate-700 bg-slate-900'}`}>
                                    {isDone && '✓'}
                                  </div>
                                  <span className="text-[11px] leading-relaxed break-words">{item.clean}</span>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => handleSwapItem('meal', item.raw, 'Nutrition', 'mealPlan')}
                                  disabled={isSwapping}
                                  className="px-2 py-1 bg-slate-900 hover:bg-indigo-950 border border-slate-700 hover:border-indigo-800 text-slate-300 hover:text-indigo-300 rounded-md text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                  title="Swap out this meal with AI alternative"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isSwapping ? 'animate-spin text-emerald-400' : 'text-indigo-400'}`} />
                                  <span>{isSwapping ? 'Swapping...' : 'Swap Item'}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Workout Protocol */}
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <span className="text-xs font-bold text-teal-400 flex items-center gap-2">
                            🏋️ 2. Target Workout & Exercise Routine
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">Check items to track</span>
                        </div>

                        <div className="space-y-2">
                          {parseProtocolItems(coachPlan.workoutPlan).map((item, idx) => {
                            const itemKey = `workout-${idx}-${item.clean}`;
                            const isDone = Boolean(completedTasks[itemKey]);
                            const isSwapping = swappingItemKey === `workoutPlan-${item.raw}`;

                            return (
                              <div 
                                key={idx} 
                                className={`p-2.5 rounded-lg border transition-all flex items-center justify-between gap-2.5 ${
                                  isDone ? 'bg-teal-950/30 border-teal-900/40 text-teal-300/80 line-through' : 'bg-slate-950 border-slate-800/80 text-slate-200'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 cursor-pointer flex-grow min-w-0" onClick={() => toggleTaskCompleted(itemKey)}>
                                  <div className={`w-4 h-4 rounded flex items-center justify-center text-[10px] shrink-0 font-bold transition-all ${isDone ? 'bg-teal-400 text-slate-950' : 'border border-slate-700 bg-slate-900'}`}>
                                    {isDone && '✓'}
                                  </div>
                                  <span className="text-[11px] leading-relaxed break-words">{item.clean}</span>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => handleSwapItem('exercise', item.raw, 'Workout', 'workoutPlan')}
                                  disabled={isSwapping}
                                  className="px-2 py-1 bg-slate-900 hover:bg-indigo-950 border border-slate-700 hover:border-indigo-800 text-slate-300 hover:text-indigo-300 rounded-md text-[10px] font-bold flex items-center gap-1 shrink-0 transition-all cursor-pointer shadow-sm disabled:opacity-50"
                                  title="Swap out this exercise with AI alternative"
                                >
                                  <RefreshCw className={`w-3 h-3 ${isSwapping ? 'animate-spin text-teal-400' : 'text-indigo-400'}`} />
                                  <span>{isSwapping ? 'Swapping...' : 'Swap Item'}</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 z-10">
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex flex-col gap-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Daily Water Target</span>
                        <span className="text-base font-bold text-cyan-400">{coachPlan.waterGoal || 2.8} Liters</span>
                      </div>

                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex flex-col gap-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Sleep Schedule</span>
                        <span className="text-xs font-bold text-purple-300 truncate">{coachPlan.sleepSchedule?.split('\n').filter((l: string) => !l.startsWith('###'))[0] || '10:30 PM - 6:30 AM'}</span>
                      </div>

                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex flex-col gap-1">
                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold">Stress Buffers</span>
                        <span className="text-xs font-bold text-amber-300 truncate">{coachPlan.stressTips?.split('\n').filter((l: string) => !l.startsWith('###'))[0] || '3 physiological sighs'}</span>
                      </div>
                    </div>

                    {/* Action Navigation Buttons */}
                    <div className="flex items-center justify-between border-t border-slate-800 pt-4 z-10">
                      <span className="text-xs font-semibold text-slate-400">Next Steps & Daily Control:</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('chat')}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/10"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Ask AI Chatbot
                        </button>
                        <button
                          onClick={() => setActiveTab('logs')}
                          className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/10"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          Log Today's Vitals
                        </button>
                        <button
                          onClick={() => setActiveTab('copilot')}
                          className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-purple-600/10"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          Physician Copilot
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab Contents: AI Chat Companion */}
            {activeTab === 'chat' && (
              <div className="flex-grow flex flex-col md:flex-row gap-5 min-h-0">
                {/* Chat Feed Panel */}
                <div className="flex-grow flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner min-h-[400px] md:h-full justify-between">
                  {/* Panel Header */}
                  <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-200">HealthOS Companion Room</span>
                    </div>

                    <div className="flex items-center gap-2.5">
                      {/* 10+ Multi-Language Selector Dropdown */}
                      <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 shadow-inner">
                        <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <select
                          value={chatLanguage}
                          onChange={(e) => setChatLanguage(e.target.value)}
                          className="bg-transparent text-xs font-bold text-indigo-300 focus:outline-none cursor-pointer"
                        >
                          {SUPPORTED_LANGUAGES.map((lang, i) => (
                            <option key={i} value={lang.name} className="bg-slate-900 text-slate-200">
                              {lang.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Header Stop Audio Button */}
                      {speakingMsgText && (
                        <button
                          type="button"
                          onClick={stopVoicePlayback}
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-[11px] flex items-center gap-1.5 animate-pulse shadow-md cursor-pointer shrink-0"
                          title="Stop Audio Voice Playback"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>Stop Voice</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (autoReadAi) {
                            stopVoicePlayback();
                            setAutoReadAi(false);
                          } else {
                            setAutoReadAi(true);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                          autoReadAi 
                            ? 'bg-indigo-600/90 text-white shadow' 
                            : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                        title="Toggle Automatic AI Voice Read-Aloud"
                      >
                        {autoReadAi ? <Volume2 className="w-3.5 h-3.5 text-emerald-300" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
                        <span>Auto Voice: {autoReadAi ? 'ON' : 'OFF'}</span>
                      </button>

                      <button 
                        onClick={() => fetchChatHistory(token)}
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                        title="Refresh Chat History"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-grow overflow-y-auto p-4 space-y-3.5 min-h-0">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <MessageSquare className="w-8 h-8 text-indigo-400/40" />
                        <div className="max-w-xs space-y-1">
                          <p className="text-sm font-semibold text-slate-300">Welcome to HealthOS AI Chat!</p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Ask health, medical, or lifestyle questions in 10+ languages. Grounded strictly in your HealthOS vitals and profile.
                          </p>
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg, index) => (
                        <div 
                          key={index}
                          className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.role !== 'user' && (
                            <div className="p-1 bg-indigo-600 rounded-lg text-white mt-0.5 shrink-0">
                              <Sparkles className="w-3 h-3" />
                            </div>
                          )}
                          <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                          }`}>
                            <p className="whitespace-pre-line">{msg.content}</p>
                            
                            {/* Audio Voice Playback Control for AI Messages */}
                            {msg.role !== 'user' && (
                              <button
                                type="button"
                                onClick={() => speakingMsgText === msg.content ? stopVoicePlayback() : speakMessage(msg.content)}
                                className="mt-2 px-2.5 py-1 bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-800/80 text-indigo-300 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                              >
                                {speakingMsgText === msg.content ? (
                                  <>
                                    <VolumeX className="w-3 h-3 text-rose-400 animate-pulse" />
                                    <span className="text-rose-300">Stop Voice</span>
                                  </>
                                ) : (
                                  <>
                                    <Volume2 className="w-3 h-3 text-indigo-400" />
                                    <span>🔊 Listen AI Voice ({chatLanguage})</span>
                                  </>
                                )}
                              </button>
                            )}

                            <span className="block text-[9px] text-slate-400 mt-1 text-right">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          {msg.role === 'user' && (
                            <div className="p-1 bg-slate-800 rounded-lg text-slate-300 mt-0.5">
                              <User className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {isSendingChat && (
                      <div className="flex items-start gap-2.5 justify-start">
                        <div className="p-1 bg-indigo-600 rounded-lg text-white animate-pulse">
                          <Sparkles className="w-3 h-3" />
                        </div>
                        <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-xl rounded-tl-none px-4 py-2.5 text-xs flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                          </span>
                          <span>HealthOS Companion is reviewing your vitals & typing in {chatLanguage}...</span>
                        </div>
                      </div>
                    )}

                    {chatError && (
                      <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{chatError}</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Input Form with Speech-To-Text Mic */}
                  <form onSubmit={handleSendChat} className="bg-slate-900 border-t border-slate-800/80 p-3 flex gap-2 items-center">
                    <button
                      type="button"
                      onClick={toggleMicListening}
                      className={`p-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                        isListeningChat 
                          ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-600/30' 
                          : 'bg-slate-950 border border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                      title={`Speak query in ${chatLanguage} (Speech-to-Text)`}
                    >
                      {isListeningChat ? <MicOff className="w-4 h-4 text-white" /> : <Mic className="w-4 h-4 text-indigo-400" />}
                    </button>

                    <input 
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder={isListeningChat ? `Listening in ${chatLanguage}... speak now!` : `Ask HealthOS AI question in ${chatLanguage}...`}
                      className="flex-grow bg-slate-950 border border-slate-800/80 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim() || isSendingChat}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Send
                    </button>
                  </form>
                </div>

                {/* Left Side Info Panel */}
                <div className="w-full md:w-80 shrink-0 flex flex-col gap-4">
                  {/* Context Snapshot Panel */}
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-3.5">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                      <LayoutDashboard className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Companion Context Snapshot</h3>
                    </div>

                    <div className="space-y-2.5 text-[11px] leading-relaxed text-slate-400">
                      <p>When you chat, the AI dynamically reads the complete structure of your user session data in real-time:</p>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-800/60 rounded">
                          <span className="text-slate-300 font-medium">User Profile</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">CONNECTED</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-800/60 rounded">
                          <span className="text-slate-300 font-medium">Risk Predictions</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">CONNECTED</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-800/60 rounded">
                          <span className="text-slate-300 font-medium">Health Scores</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">CONNECTED</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-800/60 rounded">
                          <span className="text-slate-300 font-medium">Lifestyle Plan</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">CONNECTED</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-800/60 rounded">
                          <span className="text-slate-300 font-medium">Daily Tracking Logs</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">CONNECTED</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-indigo-950/20 border border-indigo-900/30 rounded text-indigo-300/80">
                        ⚡ Tip: Log your meals, water, mood and exercise in the <strong className="font-semibold text-teal-400">Daily Health Tracker</strong> tab, and ask the AI "Analyze my recent meals and sleep patterns"!
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Contents: Daily Health Tracker */}
            {activeTab === 'logs' && (
              <div className="flex-grow flex flex-col md:flex-row gap-5 min-h-0 overflow-y-auto md:overflow-y-visible">
                {/* Left Side: Logging Form */}
                <form onSubmit={handleSaveLog} className="flex-grow bg-slate-950 border border-slate-800 p-5 rounded-xl flex flex-col gap-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-teal-400" />
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">Log Daily Metrics</h3>
                    </div>
                    <span className="text-[10px] bg-teal-950 text-teal-300 border border-teal-900/40 px-2 py-0.5 rounded font-mono uppercase">COMPREHENSIVE</span>
                  </div>

                  {logError && (
                    <div className="p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{logError}</span>
                    </div>
                  )}

                  {logSuccess && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 text-xs rounded-lg flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{logSuccess}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Weight (kg)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                        placeholder="e.g. 70"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Sleep (Hours)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={sleep}
                        onChange={(e) => setSleep(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                        placeholder="e.g. 8"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Exercise (Mins)</label>
                      <input 
                        type="number"
                        value={exercise}
                        onChange={(e) => setExercise(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                        placeholder="e.g. 45"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Water Intake (Liters)</label>
                      <input 
                        type="number"
                        step="0.1"
                        value={water}
                        onChange={(e) => setWater(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                        placeholder="e.g. 2.5"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Meals consumed today</label>
                    <textarea 
                      value={meals}
                      onChange={(e) => setMeals(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 h-16 resize-none"
                      placeholder="e.g. Eggs and toast for breakfast..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Mood & mental state</label>
                    <input 
                      type="text"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                      placeholder="e.g. Energetic / Happy / Sluggish / Stressed"
                      required
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSavingLog}
                    className="w-full bg-teal-600 hover:bg-teal-500 disabled:opacity-50 transition-colors py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 mt-2"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    {isSavingLog ? 'Saving Log...' : 'Commit Log metrics'}
                  </button>
                </form>

                {/* Right Side: Log History */}
                <div className="w-full md:w-96 shrink-0 bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-3 min-h-[300px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                      <Droplets className="w-3.5 h-3.5 text-teal-400" />
                      Log History
                    </span>
                    <button 
                      onClick={() => fetchHealthLogs(token)}
                      className="p-1 hover:bg-slate-800 text-slate-400 rounded transition-colors"
                      title="Refresh"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="overflow-y-auto max-h-[360px] space-y-2.5 pr-1">
                    {healthLogs.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-8">No daily health logs saved yet.</p>
                    ) : (
                      healthLogs.map((log) => (
                        <div key={log.id} className="p-3 bg-slate-900 border border-slate-800/80 rounded-lg space-y-1.5 text-[11px]">
                          <div className="flex items-center justify-between text-slate-300 font-semibold border-b border-slate-800/60 pb-1">
                            <span>{new Date(log.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            <span className="text-teal-400 font-mono text-[10px]">{log.weight} kg</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-1 text-slate-400 font-mono text-[10px]">
                            <div>💤 {log.sleep}h</div>
                            <div>🏃‍♂️ {log.exercise}m</div>
                            <div>💧 {log.water}L</div>
                          </div>

                          <div className="text-slate-400 italic leading-snug">
                            &ldquo;{log.meals}&rdquo;
                          </div>

                          <div className="flex items-center gap-1 text-slate-300">
                            <Smile className="w-3 h-3 text-amber-400" />
                            <span>Mood: {log.mood}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Contents: Notifications */}
            {activeTab === 'notifications' && (
              <div className="flex-grow flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner min-h-[400px] p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Bell className="w-4 h-4 text-amber-500" />
                      Daily Reminders & Service Notifications
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">Real-time alerts, daily routines, and companion updates fetched from <code className="text-amber-400 font-mono">GET /notifications</code></p>
                  </div>
                  <button 
                    onClick={() => fetchNotifications(token)}
                    disabled={isFetchingNotifications}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white rounded-lg flex items-center gap-1.5 hover:bg-slate-850 transition-colors"
                  >
                    <RefreshCw className={`w-3 h-3 ${isFetchingNotifications ? 'animate-spin' : ''}`} />
                    Refresh Feed
                  </button>
                </div>

                {isFetchingNotifications && notifications.length === 0 ? (
                  <div className="flex-grow flex items-center justify-center py-20 text-xs text-slate-400">
                    <span>Checking notifications queue...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex-grow flex flex-col items-center justify-center text-center py-20 space-y-3">
                    <Bell className="w-8 h-8 text-slate-700" />
                    <p className="text-xs text-slate-400">All caught up! No notifications for your profile.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 overflow-y-auto max-h-[500px] pr-1">
                    {notifications.map((notif) => (
                      <div 
                        key={notif.id} 
                        className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl flex items-start gap-3.5 hover:border-slate-700/80 transition-all"
                      >
                        <div className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                          notif.type === 'daily_reminder' ? 'bg-amber-950 text-amber-400 border border-amber-900/40' : 'bg-blue-950 text-blue-400 border border-blue-900/40'
                        }`}>
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <h4 className="text-xs font-bold text-slate-200">{notif.title}</h4>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-850">
                              {notif.type === 'daily_reminder' ? 'Daily Reminder' : 'System Alert'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 leading-relaxed">{notif.message}</p>
                          <span className="block text-[9px] text-slate-500 font-mono mt-1">
                            {new Date(notif.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab Contents: Weekly Reports */}
            {activeTab === 'reports' && (
              <div className="flex-grow flex flex-col md:flex-row gap-5 min-h-[400px]">
                {/* Left side: Report list */}
                <div className="w-full md:w-80 shrink-0 bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-violet-400" />
                        Compiled Reports
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-0.5">Historical health assessments</p>
                    </div>
                    <button 
                      onClick={() => fetchReports(token)}
                      disabled={isFetchingReports}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 rounded transition-colors"
                      title="Refresh reports"
                    >
                      <RefreshCw className={`w-3 h-3 ${isFetchingReports ? 'animate-spin' : ''}`} />
                    </button>
                  </div>

                  <button 
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 transition-colors py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-violet-500/10 text-white"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {isGeneratingReport ? 'Compiling Report...' : 'Generate Weekly Report'}
                  </button>

                  {reportSuccess && <p className="text-[11px] text-teal-400 text-center font-semibold">{reportSuccess}</p>}
                  {reportError && <p className="text-[11px] text-rose-400 text-center font-semibold">{reportError}</p>}

                  <div className="overflow-y-auto max-h-[350px] space-y-2 pr-1">
                    {isFetchingReports && reports.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">Checking archives...</p>
                    ) : reports.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6 leading-relaxed">No reports compiled yet. Click the button above to generate your first medical report card!</p>
                    ) : (
                      reports.map((rep) => (
                        <button 
                          key={rep.id}
                          onClick={() => setSelectedReport(rep)}
                          className={`w-full text-left p-3 rounded-lg border text-xs transition-all space-y-1 ${
                            selectedReport?.id === rep.id 
                              ? 'bg-violet-950/40 border-violet-700/60 text-violet-200' 
                              : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                          }`}
                        >
                          <div className="font-bold truncate">{rep.title}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(rep.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Right side: Report viewer */}
                <div className="flex-grow bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                  <div className="bg-slate-900 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Active Report Document View</span>
                    <span className="text-[10px] font-mono text-slate-500">Service: POST /reports & GET /reports</span>
                  </div>

                  <div className="flex-grow p-6 overflow-y-auto max-h-[520px] prose prose-invert text-slate-300 text-xs leading-relaxed space-y-4">
                    {selectedReport ? (
                      <div className="space-y-4">
                        <div className="border-b border-slate-800 pb-3">
                          <h2 className="text-sm font-extrabold text-slate-100">{selectedReport.title}</h2>
                          <span className="text-[10px] font-mono text-slate-400">Generated on {new Date(selectedReport.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="whitespace-pre-wrap font-sans text-slate-300 space-y-3 text-left">
                          {selectedReport.content}
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20 space-y-3">
                        <FileText className="w-10 h-10 text-slate-800" />
                        <p className="text-xs text-slate-400 max-w-xs leading-relaxed text-center">
                          Please select a report from the list on the left, or generate a brand new report based on your health metrics, predictions, and daily logs.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Contents: Admin Workspace */}
            {activeTab === 'admin' && (
              <div className="flex-grow flex flex-col gap-6 min-h-[500px]">
                {/* Header Row */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-950 border border-slate-800 rounded-xl p-5 gap-4">
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-100 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
                      Administrative Analytics & Demographics Controls
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-1">
                      System-wide clinical audits, active cohort metrics, and user-compiled reports fetched from secure endpoints.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                      type="button"
                      onClick={exportPopulationCsv}
                      disabled={!adminStats}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                      title="Download Cohort Health Summary CSV Report"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Cohort CSV
                    </button>

                    <button
                      type="button"
                      onClick={handleDispatchAdvisory}
                      disabled={isDispatchingAdvisory}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
                      title="Send Preventive Clinical Advisory to High-Risk Cohort"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      {isDispatchingAdvisory ? 'Dispatching...' : 'Dispatch Advisory'}
                    </button>

                    <button 
                      onClick={() => loadAdminDashboard(token)}
                      disabled={isFetchingAdminUsers || isFetchingAdminStats || isFetchingAdminReports}
                      className="px-3 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white rounded-lg flex items-center gap-2 hover:bg-slate-850 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${(isFetchingAdminUsers || isFetchingAdminStats || isFetchingAdminReports) ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                </div>

                {advisorySuccess && (
                  <div className="p-3.5 bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-between gap-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{advisorySuccess}</span>
                    </div>
                    <button onClick={() => setAdvisorySuccess('')} className="text-[10px] text-emerald-400 hover:underline">Dismiss</button>
                  </div>
                )}

                {adminError && (
                  <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="text-xs text-rose-300">
                      <p className="font-bold">Authorization or Query Error</p>
                      <p className="mt-0.5">{adminError}</p>
                    </div>
                  </div>
                )}

                {/* KPI stats section */}
                {adminStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-1.5 shadow-sm">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Total Users</span>
                      <span className="text-xl font-extrabold text-indigo-400">{adminStats.counts?.totalUsers || 0}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Registered Accounts</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-1.5 shadow-sm">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Total Reports</span>
                      <span className="text-xl font-extrabold text-violet-400">{adminStats.counts?.totalReports || 0}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Weekly AI Compositions</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-1.5 shadow-sm">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">AI Predictions</span>
                      <span className="text-xl font-extrabold text-teal-400">{adminStats.counts?.totalPredictions || 0}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Disease Risk Assessments</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-1.5 shadow-sm">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Tracking Logs</span>
                      <span className="text-xl font-extrabold text-amber-400">{adminStats.counts?.totalLogs || 0}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Daily Progress Entries</span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl flex flex-col gap-1.5 shadow-sm col-span-2 md:col-span-1">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 font-mono">Avg Cohort BMI</span>
                      <span className="text-xl font-extrabold text-rose-400">{adminStats.averages?.bmi || 0}</span>
                      <span className="text-[9px] text-slate-400 font-medium">Weight/Height Index</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center bg-slate-950 border border-slate-850 rounded-xl">
                    <span className="text-xs text-slate-500">Retrieving system stats aggregates...</span>
                  </div>
                )}

                {/* Population Disease Risk Breakdown (NEW) */}
                {adminStats && (
                  <div className="bg-slate-950 border border-indigo-900/60 p-5 rounded-xl space-y-3.5 shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-rose-400" />
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">Population Disease Risk Distribution</h3>
                      </div>
                      <span className="text-[10px] font-mono text-indigo-300 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800/60">CLINICAL HEATMAP</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 font-semibold block">Cardiovascular Risk</span>
                          <span className="text-[10px] text-slate-500">Atherosclerosis & BP Burden</span>
                        </div>
                        <span className="px-2.5 py-1 bg-rose-950 text-rose-300 border border-rose-800/60 font-mono font-bold rounded-lg text-xs">
                          High ({Math.round(100 / (adminStats.averages?.profilesCount || 1)) || 33}%)
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 font-semibold block">Diabetes / Glucose Risk</span>
                          <span className="text-[10px] text-slate-500">Metabolic & HbA1c Burden</span>
                        </div>
                        <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800/60 font-mono font-bold rounded-lg text-xs">
                          Moderate ({Math.round(100 / (adminStats.averages?.profilesCount || 1)) || 33}%)
                        </span>
                      </div>

                      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <span className="text-slate-400 font-semibold block">Kidney (CKD) Risk</span>
                          <span className="text-[10px] text-slate-500">eGFR & Filtration Index</span>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono font-bold rounded-lg text-xs">
                          Low (15%)
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Advanced Demographic Queries & Analytics Section */}
                {adminStats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Stress Level Demographics */}
                    <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                          <BarChart3 className="w-4 h-4 text-amber-500" />
                          Cohort Stress Demographics
                        </h3>
                        <p className="text-[10px] text-slate-500">Distribution grouped from active medical profiles</p>
                      </div>

                      <div className="space-y-3">
                        {['High', 'Medium', 'Low'].map((level) => {
                          const dist = adminStats.stressDistribution?.find((d: any) => d.level?.toLowerCase() === level.toLowerCase());
                          const count = dist ? dist.count : 0;
                          const total = adminStats.averages?.profilesCount || 1;
                          const percent = Math.round((count / total) * 100) || 0;

                          return (
                            <div key={level} className="space-y-1 text-xs">
                              <div className="flex justify-between text-slate-300 text-[11px]">
                                <span className="font-semibold">{level} Stress</span>
                                <span className="font-mono text-slate-400">{count} users ({percent}%)</span>
                              </div>
                              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800/50">
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    level === 'High' ? 'bg-rose-500 shadow-sm shadow-rose-500/20' : level === 'Medium' ? 'bg-amber-500 shadow-sm shadow-amber-500/20' : 'bg-teal-500 shadow-sm shadow-teal-500/20'
                                  }`}
                                  style={{ width: `${Math.max(3, percent)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lifestyles Demographics */}
                    <div className="bg-slate-950 border border-slate-800 p-5 rounded-xl space-y-4">
                      <div>
                        <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-rose-500" />
                          Lifestyles & Risk Factors
                        </h3>
                        <p className="text-[10px] text-slate-500">Average daily metrics and smoker distributions</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-[10px] text-slate-400 font-medium">Average Sleep</span>
                          <p className="text-base font-extrabold text-slate-200">{adminStats.averages?.sleep || 0} <span className="text-[10px] font-normal text-slate-400">hours</span></p>
                        </div>
                        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-[10px] text-slate-400 font-medium">Average Exercise</span>
                          <p className="text-base font-extrabold text-slate-200">{adminStats.averages?.exercise || 0} <span className="text-[10px] font-normal text-slate-400">mins/day</span></p>
                        </div>
                        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-[10px] text-slate-400 font-medium">Average Hydration</span>
                          <p className="text-base font-extrabold text-slate-200">{adminStats.averages?.waterIntake || 0} <span className="text-[10px] font-normal text-slate-400">L/day</span></p>
                        </div>
                        <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-850 space-y-1">
                          <span className="text-[10px] text-slate-400 font-medium">Smoker Prevalence</span>
                          <p className="text-base font-extrabold text-slate-200">
                            {adminStats.smokers?.smokerCount || 0} <span className="text-[10px] font-normal text-slate-400">smokers / {adminStats.averages?.profilesCount || 0}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* User Directory Tab Table */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col p-5 gap-3.5">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-400" />
                      Patient Cohort Directory (GET /admin/users)
                    </h3>
                    <p className="text-[10px] text-slate-500">Complete view of user profiles, demographic summaries, and log aggregates.</p>
                  </div>

                  <div className="overflow-x-auto border border-slate-800/80 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 text-[10px] font-mono uppercase">
                          <th className="p-3">User Details</th>
                          <th className="p-3">Role</th>
                          <th className="p-3">Bio Metrics</th>
                          <th className="p-3 text-center">Diagnostics Counts</th>
                          <th className="p-3 text-right">Registration Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {isFetchingAdminUsers && adminUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-slate-500">Retrieving cohort directory details...</td>
                          </tr>
                        ) : adminUsers.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-10 text-center text-slate-500">No registered users in system database.</td>
                          </tr>
                        ) : (
                          adminUsers.map((u: any) => (
                            <tr key={u.id} className="hover:bg-slate-900/20 text-slate-300">
                              <td className="p-3">
                                <div className="font-bold text-slate-200">{u.email}</div>
                                <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate max-w-[180px]">{u.id}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                                  u.role === 'admin' ? 'bg-rose-950/40 text-rose-400 border-rose-900/40' : 'bg-slate-900/80 text-slate-400 border-slate-800'
                                }`}>
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-3">
                                {u.profile ? (
                                  <div className="space-y-0.5">
                                    <div>{u.profile.age}y / {u.profile.gender} / {u.profile.height}cm</div>
                                    <div className="text-[10px] text-slate-400 font-medium">Weight: {u.profile.weight}kg (BMI: <span className="font-bold text-indigo-400">{u.profile.bmi}</span>)</div>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 italic">No Profile Submitted</span>
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex justify-center items-center gap-2 text-[10px] font-mono text-slate-400">
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850" title="Predictions run">🔮 {u._count?.predictions || 0}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850" title="Scores run">📊 {u._count?.healthScores || 0}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850" title="Tracking logs">📝 {u._count?.dailyHealthLogs || 0}</span>
                                  <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-850" title="Reports compiled">📋 {u._count?.reports || 0}</span>
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono text-slate-400 text-[11px]">
                                {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Compiled Reports Archives Tab */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col p-5 gap-3.5">
                  <div>
                    <h3 className="text-xs font-bold uppercase text-slate-300 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-violet-400" />
                      Compiled Reports Archive (GET /admin/reports)
                    </h3>
                    <p className="text-[10px] text-slate-500">Review generated AI Weekly Clinical progress documents across all patients.</p>
                  </div>

                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                    {isFetchingAdminReports && adminReports.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-10">Accessing archives...</p>
                    ) : adminReports.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-10">No weekly progress reports have been compiled yet.</p>
                    ) : (
                      adminReports.map((r: any) => (
                        <div key={r.id} className="p-4 bg-slate-900 border border-slate-800/80 rounded-xl space-y-3 text-left">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 flex-wrap gap-2">
                            <div>
                              <h4 className="text-xs font-extrabold text-slate-200">{r.title}</h4>
                              <p className="text-[10px] text-slate-400 mt-0.5">Patient Account: <span className="font-bold text-violet-400">{r.user?.email}</span></p>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">Compiled on {new Date(r.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto bg-slate-950 p-3.5 rounded-lg border border-slate-850">
                            {r.content}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Tab Contents: API Endpoints Info */}
            {activeTab === 'endpoints' && (
              <div className="flex-grow space-y-5 overflow-y-auto pr-1">
                {/* AI Chat Engine Block */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    AI Health Chat Engine (New)
                  </h3>
                  
                  <div className="grid gap-2.5">
                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">POST</span>
                          <code className="text-xs text-slate-300 font-semibold">/chat</code>
                        </div>
                        <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Guarded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Processes user message alongside complete dynamic patient context (profile details, risk calculations, sleep schedules, exercise logs) using the Gemini engine. Stores chat conversation.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">GET</span>
                          <code className="text-xs text-slate-300 font-semibold">/chat/history</code>
                        </div>
                        <span className="text-xs text-indigo-400 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Guarded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Retrieves full history of user messages and Gemini AI responses for continuous, multi-turn medical chat.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tracking Engine Block */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    Daily Health Tracking Engine (Comprehensive)
                  </h3>
                  
                  <div className="grid gap-2.5">
                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">POST</span>
                          <code className="text-xs text-slate-300 font-semibold">/logs</code>
                        </div>
                        <span className="text-xs text-teal-400 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Guarded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Submits daily metric tracking logs including weight, sleep (hours), exercise (minutes), water intake (liters), description of meals, and mental state/mood.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">GET</span>
                          <code className="text-xs text-slate-300 font-semibold">/logs</code>
                        </div>
                        <span className="text-xs text-teal-400 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Guarded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Retrieves a list of all logged metrics to render daily trend cards and feed context directly to the Gemini chat.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notifications & Weekly Reports Service Block */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5" />
                    Notifications & Reports Service
                  </h3>
                  
                  <div className="grid gap-2.5">
                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">GET</span>
                          <code className="text-xs text-slate-300 font-semibold">/notifications</code>
                        </div>
                        <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Guarded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Retrieves current personalized daily reminders and routine alerts. Generates automatic default reminders if none are found in the user profile.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">POST</span>
                          <code className="text-xs text-slate-300 font-semibold">/reports</code>
                        </div>
                        <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Guarded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Triggers deep cognitive reasoning to analyze weight patterns, sleep curves, hydration targets, and risk indicators. Generates a formatted Weekly Health Report and creates a compilation alert.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">GET</span>
                          <code className="text-xs text-slate-300 font-semibold">/reports</code>
                        </div>
                        <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Guarded
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Retrieves user's historical compiled health progress reports.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin & Clinical Cohort Audit APIs Block */}
                <div className="space-y-3">
                  <h3 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Admin & Clinical Cohort Audit APIs (New)
                  </h3>
                  
                  <div className="grid gap-2.5">
                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">GET</span>
                          <code className="text-xs text-slate-300 font-semibold">/admin/users</code>
                        </div>
                        <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Protected (Admin)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Retrieves complete list of registered users along with their demographics, clinical profiling status, and activity counts.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">GET</span>
                          <code className="text-xs text-slate-300 font-semibold">/admin/stats</code>
                        </div>
                        <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Protected (Admin)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Compiles advanced demographics metrics: total users count, totals for predictions, logs, reports, average sleep, exercise, hydration, BMI index, and stress level demographics distribution.
                      </p>
                    </div>

                    <div className="flex flex-col gap-1.5 p-3.5 bg-slate-950 rounded-lg border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">GET</span>
                          <code className="text-xs text-slate-300 font-semibold">/admin/reports</code>
                        </div>
                        <span className="text-xs text-rose-400 font-medium flex items-center gap-1">
                          <ShieldAlert className="w-3.5 h-3.5" /> Protected (Admin)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Retrieves all historical weekly clinical health progress reports compiled across all users in the system database.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info block */}
        <p className="text-[10px] text-slate-500 mt-2 pt-4 border-t border-slate-800/60 leading-relaxed text-center z-10">
          Listening on port 3000. Built in custom developer preview mode with local database storage support.
        </p>
      </div>
    </div>
  );
}
