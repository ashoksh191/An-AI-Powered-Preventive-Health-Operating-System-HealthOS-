import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Navigation, Command, CheckCircle2, HelpCircle } from 'lucide-react';

interface VoiceNavigationProps {
  onNavigateTab: (tab: 'assessment' | 'copilot' | 'radiology' | 'chat' | 'logs' | 'notifications' | 'reports' | 'admin' | 'endpoints' | 'vision' | 'lab') => void;
  onLogout?: () => void;
  onBypass?: () => void;
  onUpdateField?: (field: string, value: any) => void;
  onSaveProfile?: () => void;
  onSendChat?: (message: string) => void;
  onTriggerSos?: () => void;
}

export default function VoiceNavigation({ onNavigateTab, onLogout, onBypass, onUpdateField, onSaveProfile, onSendChat, onTriggerSos }: VoiceNavigationProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState<string>('Click mic and say "Ask AI what to do for acidity" or "Go to Vision AI"');
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
        setFeedback('Listening for hands-free voice commands...');
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
        setFeedback('Microphone error. Click mic to restart.');
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
    const cleanCmd = cmd.trim();
    if (!cleanCmd) return;

    // 0. Voice Emergency Action ("SOS", "Emergency", "Red Alert", "इमरजेंसी")
    if (cleanCmd.includes('sos') || cleanCmd.includes('emergency') || cleanCmd.includes('red alert') || cleanCmd.includes('ambulance') || cleanCmd.includes('इमरजेंसी')) {
      if (onTriggerSos) onTriggerSos();
      const msg = 'Triggering Emergency Paramedic SOS Red Alert!';
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 1. Voice Editing: Weight (e.g., "set weight 75" or "weight 75")
    const weightMatch = cleanCmd.match(/(?:set weight|weight is|my weight|weight)\s*(?:to|is)?\s*(\d+(?:\.\d+)?)/);
    if (weightMatch && !cleanCmd.includes('go to')) {
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
    const heightMatch = cleanCmd.match(/(?:set height|height is|my height|height)\s*(?:to|is)?\s*(\d+(?:\.\d+)?)/);
    if (heightMatch && !cleanCmd.includes('go to')) {
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
    const ageMatch = cleanCmd.match(/(?:set age|age is|i am)\s*(?:to|is)?\s*(\d+)/);
    if (ageMatch && !cleanCmd.includes('go to')) {
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
    const sleepMatch = cleanCmd.match(/(?:set sleep|sleep is)\s*(?:to|is)?\s*(\d+(?:\.\d+)?)/);
    if (sleepMatch && !cleanCmd.includes('go to')) {
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
    const exerciseMatch = cleanCmd.match(/(?:set exercise|exercise is)\s*(?:to|is)?\s*(\d+)/);
    if (exerciseMatch && !cleanCmd.includes('go to')) {
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
    if (cleanCmd.includes('save profile') || cleanCmd.includes('update profile') || cleanCmd.includes('submit form') || cleanCmd.includes('सेव करो')) {
      if (onSaveProfile) onSaveProfile();
      const msg = 'Saving and updating health profile';
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 7. Voice Navigation Rules
    if (cleanCmd.includes('vision') || cleanCmd.includes('food') || cleanCmd.includes('meal') || cleanCmd.includes('camera') || cleanCmd.includes('खाना')) {
      onNavigateTab('vision');
      const msg = 'Opening Vision AI Food & Meal Analyzer';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    } 
    
    if (cleanCmd.includes('lab') || cleanCmd.includes('blood') || cleanCmd.includes('biomarker') || cleanCmd.includes('report') || cleanCmd.includes('ब्लड')) {
      onNavigateTab('lab');
      const msg = 'Opening Lab Report & Blood Biomarker Analyzer';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    if (cleanCmd.includes('copilot') || cleanCmd.includes('doctor') || cleanCmd.includes('physician') || cleanCmd.includes('ehr') || cleanCmd.includes('कॉपालिट')) {
      onNavigateTab('copilot');
      const msg = 'Opening Physician AI Co-Pilot Workstation';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    if (cleanCmd.includes('radiology') || cleanCmd.includes('x-ray') || cleanCmd.includes('mri') || cleanCmd.includes('scan') || cleanCmd.includes('रेडियोलॉजी')) {
      onNavigateTab('radiology');
      const msg = 'Opening Radiology Report Summarizer';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    if (cleanCmd.includes('assessment') || cleanCmd.includes('profile') || cleanCmd.includes('vitals') || cleanCmd.includes('असेसमेंट') || cleanCmd.includes('प्रोफाइल')) {
      onNavigateTab('assessment');
      const msg = 'Navigating to Health Assessment';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    if (cleanCmd.includes('logs') || cleanCmd.includes('tracker') || cleanCmd.includes('daily') || cleanCmd.includes('लॉग्स') || cleanCmd.includes('ट्रैकर')) {
      onNavigateTab('logs');
      const msg = 'Opening Daily Health Tracker';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    if (cleanCmd.includes('notifications') || cleanCmd.includes('alerts') || cleanCmd.includes('नोटिफिकेशन')) {
      onNavigateTab('notifications');
      const msg = 'Opening Notifications';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    if (cleanCmd.includes('reports') || cleanCmd.includes('weekly') || cleanCmd.includes('रिपोर्ट')) {
      onNavigateTab('reports');
      const msg = 'Opening Weekly Reports';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    if (cleanCmd.includes('admin') || cleanCmd.includes('workspace') || cleanCmd.includes('analytics') || cleanCmd.includes('एडमिन')) {
      onNavigateTab('admin');
      const msg = 'Navigating to Admin Workspace';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    if (cleanCmd.includes('api') || cleanCmd.includes('endpoints') || cleanCmd.includes('docs')) {
      onNavigateTab('endpoints');
      const msg = 'Opening REST APIs Info';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    if (cleanCmd.includes('logout') || cleanCmd.includes('sign out') || cleanCmd.includes('लॉगआउट')) {
      if (onLogout) onLogout();
      const msg = 'Logging out of session';
      setFeedback(`Recognized: "${cleanCmd}" ➔ ${msg}`);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 8. Autonomous Voice Query Handler: Any spoken sentence automatically sent to AI Chatbot!
    const isHealthOrGeneralQuery = cleanCmd.length > 3 && (
      cleanCmd.includes('ask') || cleanCmd.includes('what') || cleanCmd.includes('how') || 
      cleanCmd.includes('why') || cleanCmd.includes('cure') || cleanCmd.includes('fever') || 
      cleanCmd.includes('acidity') || cleanCmd.includes('pain') || cleanCmd.includes('namaste') || 
      cleanCmd.includes('hello') || cleanCmd.includes('hi') || cleanCmd.includes('diet') ||
      cleanCmd.includes('help') || cleanCmd.split(' ').length >= 2
    );

    if (isHealthOrGeneralQuery) {
      onNavigateTab('chat');
      if (onSendChat) onSendChat(cleanCmd);
      const msg = `Asking AI Assistant: "${cleanCmd}"`;
      setFeedback(msg);
      speakFeedback(`Asking AI Assistant for ${cleanCmd}`);
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
