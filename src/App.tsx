import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Shield, CheckCircle, Terminal, Heart, Sparkles, Key, 
  Activity, LayoutDashboard, Send, User, MessageSquare, Plus, 
  RefreshCw, LogOut, Smile, Droplets, ArrowRight, UserCheck, AlertCircle,
  Bell, FileText, ShieldAlert, Users, BarChart3
} from 'lucide-react';

export default function App() {
  const [token, setToken] = useState('dev-token-123');
  const [email, setEmail] = useState('asharofficial10@gmail.com');
  const [password, setPassword] = useState('password123');
  
  // Tab/Panel selector: 'chat' | 'logs' | 'notifications' | 'reports' | 'admin' | 'endpoints'
  const [activeTab, setActiveTab] = useState<'chat' | 'logs' | 'notifications' | 'reports' | 'admin' | 'endpoints'>('chat');
  
  // Admin state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminStats, setAdminStats] = useState<any | null>(null);
  const [adminReports, setAdminReports] = useState<any[]>([]);
  const [isFetchingAdminUsers, setIsFetchingAdminUsers] = useState(false);
  const [isFetchingAdminStats, setIsFetchingAdminStats] = useState(false);
  const [isFetchingAdminReports, setIsFetchingAdminReports] = useState(false);
  const [adminError, setAdminError] = useState('');
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(true); 
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [chatError, setChatError] = useState('');

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
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await parseSafeJson(res);
      if (!data.success) {
        setAuthError(data.error || 'Authentication failed.');
        return;
      }
      
      if (data.session?.access_token) {
        setToken(data.session.access_token);
        setIsAuthenticated(true);
        setAuthSuccess(`Authenticated successfully as ${email}!`);
      } else if (mode === 'register') {
        setAuthSuccess(data.message || 'Registration successful! Verification email sent or auto-authenticated.');
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
        body: JSON.stringify({ message: userMsg })
      });
      const data = await parseSafeJson(res);
      if (data.success) {
        const botReply = data.reply || data.response || data.message;
        if (botReply) {
          setChatMessages(prev => [...prev, { role: 'assistant', content: botReply, createdAt: new Date() }]);
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
          <div className="max-w-md w-full mx-auto my-auto bg-slate-950 border border-slate-800/80 p-6 rounded-xl flex flex-col gap-4 shadow-xl z-10">
            <div className="text-center space-y-1">
              <Key className="w-8 h-8 text-indigo-400 mx-auto" />
              <h2 className="text-lg font-bold">Sign In or Create Account</h2>
              <p className="text-xs text-slate-400">Access protected AI Health Chat endpoints</p>
            </div>

            {authError && (
              <div className="flex items-start gap-2 p-3 bg-rose-950/40 border border-rose-900/60 text-rose-300 rounded-lg text-xs leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="flex items-start gap-2 p-3 bg-emerald-950/40 border border-emerald-900/60 text-emerald-300 rounded-lg text-xs leading-relaxed">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/60"
                  placeholder="name@domain.com"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500/60"
                  placeholder="Min. 6 characters"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={() => handleAuth('login')}
                  className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                >
                  Sign In
                </button>
                <button 
                  onClick={() => handleAuth('register')}
                  className="bg-slate-800 hover:bg-slate-700 transition-colors text-slate-200 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1"
                >
                  Register
                </button>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800/80"></div>
                <span className="flex-shrink mx-3 text-[10px] text-slate-500 font-mono uppercase">Or Developer Bypass</span>
                <div className="flex-grow border-t border-slate-800/80"></div>
              </div>

              <button 
                onClick={handleUseDevToken}
                className="w-full bg-slate-900 hover:bg-slate-800 border border-indigo-950 text-indigo-300 hover:text-indigo-200 transition-all py-2 rounded-lg text-xs font-semibold font-mono flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                Initialize Sandbox Session (dev-token-123)
              </button>
            </div>
          </div>
        )}

        {/* Logged in Workspace Dashboard */}
        {isAuthenticated && (
          <div className="flex-grow flex flex-col gap-6 z-10 min-h-0">
            {/* Tabs Bar */}
            <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 p-1 rounded-xl self-start flex-wrap">
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

            {/* Tab Contents: AI Chat Companion */}
            {activeTab === 'chat' && (
              <div className="flex-grow flex flex-col md:flex-row gap-5 min-h-0">
                {/* Chat Feed Panel */}
                <div className="flex-grow flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-inner min-h-[400px] md:h-full justify-between">
                  {/* Panel Header */}
                  <div className="bg-slate-900 border-b border-slate-800/80 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
                      <span className="text-xs font-semibold text-slate-200">Personalized Companion Room</span>
                    </div>
                    <button 
                      onClick={() => fetchChatHistory(token)}
                      className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
                      title="Refresh Chat History"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Messages Feed */}
                  <div className="flex-grow overflow-y-auto p-4 space-y-3.5 min-h-0">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <MessageSquare className="w-8 h-8 text-indigo-400/40" />
                        <div className="max-w-xs space-y-1">
                          <p className="text-sm font-semibold text-slate-300">Welcome to Health Chat!</p>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Ask medical-grounded or lifestyle questions. The AI has immediate access to your profile data, predictions, and logged logs.
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
                            <div className="p-1 bg-indigo-600 rounded-lg text-white mt-0.5">
                              <Sparkles className="w-3 h-3" />
                            </div>
                          )}
                          <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                            msg.role === 'user' 
                              ? 'bg-indigo-600 text-white rounded-tr-none' 
                              : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none'
                          }`}>
                            <p className="whitespace-pre-line">{msg.content}</p>
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
                          <span>Companion is reviewing your logs & typing...</span>
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

                  {/* Input Form */}
                  <form onSubmit={handleSendChat} className="bg-slate-900 border-t border-slate-800/80 p-3 flex gap-2">
                    <input 
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Ask for advice, pattern analysis, or medical queries..."
                      className="flex-grow bg-slate-950 border border-slate-800/80 rounded-lg px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      type="submit"
                      disabled={!newMessage.trim() || isSendingChat}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
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
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">INJECTED</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-800/60 rounded">
                          <span className="text-slate-300 font-medium">Risk Predictions</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">INJECTED</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-800/60 rounded">
                          <span className="text-slate-300 font-medium">Health Scores</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">INJECTED</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-800/60 rounded">
                          <span className="text-slate-300 font-medium">Lifestyle Plan</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">INJECTED</span>
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900 border border-slate-800/60 rounded">
                          <span className="text-slate-300 font-medium">Daily Tracking Logs</span>
                          <span className="text-emerald-400 font-semibold font-mono text-[10px]">INJECTED</span>
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
                  <button 
                    onClick={() => loadAdminDashboard(token)}
                    disabled={isFetchingAdminUsers || isFetchingAdminStats || isFetchingAdminReports}
                    className="px-3.5 py-2 bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-200 hover:text-white rounded-lg flex items-center gap-2 hover:bg-slate-850 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${(isFetchingAdminUsers || isFetchingAdminStats || isFetchingAdminReports) ? 'animate-spin' : ''}`} />
                    Refresh Analytics
                  </button>
                </div>

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
