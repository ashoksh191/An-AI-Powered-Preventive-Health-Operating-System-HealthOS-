import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Navigation, Command, CheckCircle2, HelpCircle } from 'lucide-react';

interface VoiceNavigationProps {
  onNavigateTab: (tab: 'assessment' | 'chat' | 'logs' | 'notifications' | 'reports' | 'admin' | 'endpoints') => void;
  onLogout?: () => void;
  onBypass?: () => void;
  onUpdateField?: (field: string, value: any) => void;
  onSaveProfile?: () => void;
  onSendChat?: (message: string) => void;
}

export default function VoiceNavigation({ onNavigateTab, onLogout, onBypass, onUpdateField, onSaveProfile, onSendChat }: VoiceNavigationProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string>('Click mic and say "Set weight 75" or "Go to Assessment"');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showCommandsModal, setShowCommandsModal] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback('Listening for voice commands...');
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        processVoiceCommand(currentTranscript.toLowerCase());
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setFeedback('Microphone error. Click to restart.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setFeedback('Web Speech API is not supported in this browser.');
    }
  }, []);

  const speakFeedback = (text: string) => {
    if (!soundEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const processVoiceCommand = (cmd: string) => {
    // 1. Voice Editing: Weight (e.g., "set weight 75" or "weight 75")
    const weightMatch = cmd.match(/(?:set weight|weight is|my weight|weight)\s*(?:to|is)?\s*(\d+(?:\.\d+)?)/);
    if (weightMatch && !cmd.includes('go to')) {
      const val = parseFloat(weightMatch[1]);
      if (onUpdateField) onUpdateField('weight', val);
      onNavigateTab('assessment');
      const msg = `Updated weight to ${val} kg`;
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 2. Voice Editing: Height (e.g., "set height 180" or "height 180")
    const heightMatch = cmd.match(/(?:set height|height is|my height|height)\s*(?:to|is)?\s*(\d+(?:\.\d+)?)/);
    if (heightMatch && !cmd.includes('go to')) {
      const val = parseFloat(heightMatch[1]);
      if (onUpdateField) onUpdateField('height', val);
      onNavigateTab('assessment');
      const msg = `Updated height to ${val} cm`;
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 3. Voice Editing: Age (e.g., "set age 30" or "i am 30 years old")
    const ageMatch = cmd.match(/(?:set age|age is|i am)\s*(?:to|is)?\s*(\d+)/);
    if (ageMatch && !cmd.includes('go to')) {
      const val = parseInt(ageMatch[1]);
      if (onUpdateField) onUpdateField('age', val);
      onNavigateTab('assessment');
      const msg = `Updated age to ${val} years`;
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 4. Voice Editing: Sleep (e.g., "set sleep 8" or "sleep 8 hours")
    const sleepMatch = cmd.match(/(?:set sleep|sleep is)\s*(?:to|is)?\s*(\d+(?:\.\d+)?)/);
    if (sleepMatch && !cmd.includes('go to')) {
      const val = parseFloat(sleepMatch[1]);
      if (onUpdateField) onUpdateField('sleep', val);
      onNavigateTab('assessment');
      const msg = `Updated sleep to ${val} hours`;
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 5. Voice Editing: Exercise (e.g., "set exercise 45" or "exercise 45 mins")
    const exerciseMatch = cmd.match(/(?:set exercise|exercise is)\s*(?:to|is)?\s*(\d+)/);
    if (exerciseMatch && !cmd.includes('go to')) {
      const val = parseInt(exerciseMatch[1]);
      if (onUpdateField) onUpdateField('exercise', val);
      onNavigateTab('assessment');
      const msg = `Updated exercise to ${val} minutes`;
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 6. Voice Action: Save Profile ("save profile", "update profile", "सेव करो")
    if (cmd.includes('save profile') || cmd.includes('update profile') || cmd.includes('submit form') || cmd.includes('सेव करो')) {
      if (onSaveProfile) onSaveProfile();
      const msg = 'Saving and updating health profile';
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 7. Voice Action: Ask AI Chatbot ("ask AI what should I eat for dinner")
    const chatMatch = cmd.match(/(?:ask ai|ask assistant|chat)\s+(.+)/);
    if (chatMatch) {
      const query = chatMatch[1];
      onNavigateTab('chat');
      if (onSendChat) onSendChat(query);
      const msg = `Asking AI Chatbot: ${query}`;
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }
    if (cmd.includes('assessment') || cmd.includes('profile') || cmd.includes('vitals') || cmd.includes('असेसमेंट') || cmd.includes('प्रोफाइल')) {
      onNavigateTab('assessment');
      const msg = 'Navigating to Health Assessment';
      setFeedback(`Recognized: "${cmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
    } else if (cmd.includes('chat') || cmd.includes('companion') || cmd.includes('assistant') || cmd.includes('ai') || cmd.includes('चैट') || cmd.includes('बात')) {
      onNavigateTab('chat');
      const msg = 'Opening AI Chat Companion';
      setFeedback(`Recognized: "${cmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
    } else if (cmd.includes('logs') || cmd.includes('tracker') || cmd.includes('daily') || cmd.includes('लॉग्स') || cmd.includes('ट्रैकर')) {
      onNavigateTab('logs');
      const msg = 'Opening Daily Health Tracker';
      setFeedback(`Recognized: "${cmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
    } else if (cmd.includes('notifications') || cmd.includes('alerts') || cmd.includes('नोटिफिकेशन')) {
      onNavigateTab('notifications');
      const msg = 'Opening Notifications';
      setFeedback(`Recognized: "${cmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
    } else if (cmd.includes('reports') || cmd.includes('weekly') || cmd.includes('रिपोर्ट')) {
      onNavigateTab('reports');
      const msg = 'Opening Weekly Reports';
      setFeedback(`Recognized: "${cmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
    } else if (cmd.includes('admin') || cmd.includes('workspace') || cmd.includes('analytics') || cmd.includes('एडमिन')) {
      onNavigateTab('admin');
      const msg = 'Navigating to Admin Workspace';
      setFeedback(`Recognized: "${cmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
    } else if (cmd.includes('api') || cmd.includes('endpoints') || cmd.includes('docs')) {
      onNavigateTab('endpoints');
      const msg = 'Opening REST APIs Info';
      setFeedback(`Recognized: "${cmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
    } else if (cmd.includes('logout') || cmd.includes('sign out') || cmd.includes('लॉगआउट')) {
      if (onLogout) onLogout();
      const msg = 'Logging out of session';
      setFeedback(`Recognized: "${cmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
    } else if (cmd.includes('bypass') || cmd.includes('demo')) {
      if (onBypass) onBypass();
      const msg = 'Initializing sandbox session';
      setFeedback(`Recognized: "${cmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Error starting speech recognition:', err);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Error stopping speech recognition:', err);
      }
    }
  };

  const toggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="relative">
      {/* Voice Bar Control Pill */}
      <div className="flex items-center gap-2 bg-slate-950/90 border border-indigo-900/60 p-1.5 pl-3 rounded-xl shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="text-slate-300 font-semibold hidden sm:inline">Voice Control</span>
        </div>

        {/* Mic Toggle Button */}
        <button
          onClick={toggleMic}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            isListening
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 animate-pulse'
              : 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/40 border border-indigo-500/30'
          }`}
          title={isListening ? 'Stop Listening' : 'Start Voice Navigation'}
        >
          {isListening ? (
            <>
              <Mic className="w-3.5 h-3.5 animate-spin" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Voice Nav</span>
            </>
          )}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title={soundEnabled ? 'Mute Audio Response' : 'Enable Audio Response'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {/* Commands Guide Button */}
        <button
          onClick={() => setShowCommandsModal(!showCommandsModal)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Voice Commands List"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {/* Voice Activity Feedback Banner */}
      {isListening && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-slate-900 border border-rose-800/80 p-3 rounded-xl shadow-2xl z-50 text-xs space-y-1">
          <div className="flex items-center justify-between text-rose-300 font-semibold">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Listening for command...
            </span>
            <span className="text-[10px] font-mono text-slate-500 uppercase">Live Voice</span>
          </div>
          <p className="text-slate-200 font-mono italic text-[11px] bg-slate-950 p-1.5 rounded border border-slate-800">
            "{transcript || 'Say a command like: Go to Assessment'}"
          </p>
        </div>
      )}

      {/* Voice Commands Cheat Sheet Modal */}
      {showCommandsModal && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-slate-950 border border-indigo-900/80 p-4 rounded-2xl shadow-2xl z-50 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Command className="w-4 h-4" />
              <span>Voice Commands Guide</span>
            </div>
            <button 
              onClick={() => setShowCommandsModal(false)}
              className="text-slate-500 hover:text-slate-300 text-xs font-mono"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="font-mono text-emerald-400">"Go to Assessment"</span>
              <span className="text-[10px] text-slate-400">Health Profiler</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="font-mono text-emerald-400">"Open Chat"</span>
              <span className="text-[10px] text-slate-400">AI Companion</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="font-mono text-emerald-400">"Open Logs"</span>
              <span className="text-[10px] text-slate-400">Health Tracker</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="font-mono text-emerald-400">"Show Notifications"</span>
              <span className="text-[10px] text-slate-400">System Alerts</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="font-mono text-emerald-400">"Show Reports"</span>
              <span className="text-[10px] text-slate-400">Weekly Summaries</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900 p-1.5 rounded border border-slate-800">
              <span className="font-mono text-emerald-400">"Open Admin"</span>
              <span className="text-[10px] text-slate-400">Analytics Controls</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
