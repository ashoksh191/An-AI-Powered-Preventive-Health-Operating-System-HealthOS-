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
      recognition.interimResults = false; // Only finalize voice inputs to reduce unnecessary event updates
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setFeedback('Listening for hands-free voice commands...');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript.trim()) {
          setTranscript(finalTranscript.trim());
          processVoiceCommand(finalTranscript.toLowerCase().trim());
        }
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

    // 0. Voice Emergency Action ("SOS", "Emergency", "Red Alert", "इमरजेंसी", "bachao")
    if (cleanCmd.includes('sos') || cleanCmd.includes('emergency') || cleanCmd.includes('red alert') || cleanCmd.includes('ambulance') || cleanCmd.includes('इमरजेंसी') || cleanCmd.includes('bachao')) {
      if (onTriggerSos) onTriggerSos();
      const msg = 'Triggering Emergency Paramedic SOS Red Alert!';
      setFeedback(msg);
      speakFeedback(msg);
      stopListening();
      return;
    }

    // 1. Voice Editing: Weight (e.g., "set weight 75" or "weight 75")
    const weightMatch = cleanCmd.match(/(?:set weight|weight is|my weight|weight)\s*(?:to|is)?\s*(\d+(?:\.\d+)?)/);
    if (weightMatch && !cleanCmd.includes('go to') && !cleanCmd.includes('open')) {
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
    if (heightMatch && !cleanCmd.includes('go to') && !cleanCmd.includes('open')) {
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
    if (ageMatch && !cleanCmd.includes('go to') && !cleanCmd.includes('open')) {
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
    if (sleepMatch && !cleanCmd.includes('go to') && !cleanCmd.includes('open')) {
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
    if (exerciseMatch && !cleanCmd.includes('go to') && !cleanCmd.includes('open')) {
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

    // 7. Structured Tab Navigation mapping (English + Hindi/Hinglish keys)
    const tabMappings: { keys: string[]; tab: 'assessment' | 'copilot' | 'radiology' | 'chat' | 'logs' | 'notifications' | 'reports' | 'admin' | 'endpoints' | 'vision' | 'lab'; msg: string }[] = [
      { keys: ['vision', 'food', 'meal', 'camera', 'khana', 'bhojan'], tab: 'vision', msg: 'Opening Vision AI Food & Meal Analyzer' },
      { keys: ['lab', 'blood', 'biomarker', 'report', 'test', 'biological', 'biochemical', 'ब्लड', 'खून'], tab: 'lab', msg: 'Opening Lab Report & Blood Biomarker Analyzer' },
      { keys: ['copilot', 'doctor', 'physician', 'prescription', 'soap', 'clinical', 'कॉपालिट'], tab: 'copilot', msg: 'Opening Physician AI Co-Pilot Workstation' },
      { keys: ['radiology', 'x-ray', 'mri', 'ct scan', 'ultrasound', 'summarizer', 'रेडियोलॉजी'], tab: 'radiology', msg: 'Opening Radiology Report Summarizer' },
      { keys: ['assessment', 'profile', 'vitals', 'longevity clock', 'biological age', 'असेसमेंट', 'प्रोफाइल'], tab: 'assessment', msg: 'Navigating to Health Assessment' },
      { keys: ['logs', 'tracker', 'daily tracker', 'log metrics', 'लॉग्स', 'ट्रैकर'], tab: 'logs', msg: 'Opening Daily Health Tracker' },
      { keys: ['notifications', 'alerts', 'inbox', 'roast', 'witty', 'zomato', 'push', 'नोटिफिकेशन'], tab: 'notifications', msg: 'Opening Witty Notifications Feed' },
      { keys: ['weekly report', 'weekly summary', 'reports list', 'progress report', 'रिपोर्ट'], tab: 'reports', msg: 'Opening Weekly Reports' },
      { keys: ['admin', 'workspace', 'analytics', 'cohort directory', 'population summary', 'system stats', 'एडमिन'], tab: 'admin', msg: 'Navigating to Admin Workspace' },
      { keys: ['api', 'endpoints', 'docs', 'rest apis info', 'server docs'], tab: 'endpoints', msg: 'Opening REST APIs Info' }
    ];

    for (const mapping of tabMappings) {
      if (mapping.keys.some(key => cleanCmd.includes(key))) {
        onNavigateTab(mapping.tab);
        setFeedback(`Recognized: "${cleanCmd}" ➔ ${mapping.msg}`);
        speakFeedback(mapping.msg);
        stopListening();
        return;
      }
    }

    if (cleanCmd.includes('logout') || cleanCmd.includes('sign out') || cleanCmd.includes('logout kholo') || cleanCmd.includes('लॉगआउट')) {
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
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-md ${
            isListening
              ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-rose-600/40 animate-pulse ring-2 ring-rose-400/50'
              : 'bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 shadow-cyan-950/40'
          }`}
          title={isListening ? 'Stop Listening' : 'Start Voice Navigation'}
        >
          {isListening ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
              </span>
              <Mic className="w-3.5 h-3.5 animate-bounce" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Voice AI Control</span>
            </>
          )}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          title={soundEnabled ? 'Mute Audio Response' : 'Enable Audio Response'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
        </button>

        {/* Commands Guide Button */}
        <button
          onClick={() => setShowCommandsModal(!showCommandsModal)}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
          title="Voice Commands List"
        >
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
        </button>
      </div>

      {/* Voice Activity Feedback Banner */}
      {isListening && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-slate-950/95 border border-rose-500/40 p-3.5 rounded-2xl shadow-2xl backdrop-blur-xl z-50 text-xs space-y-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between text-rose-300 font-semibold">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              Listening to voice input...
            </span>
            <span className="text-[10px] font-mono text-rose-400/80 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800/40">LIVE MIC</span>
          </div>
          <p className="text-slate-200 font-mono italic text-[11px] bg-slate-900/90 p-2 rounded-xl border border-slate-800">
            "{transcript || 'Speak a command (e.g. "Go to Radiology", "SOS Alert", "Set weight 70")'}"
          </p>
        </div>
      )}

      {/* Voice Commands Cheat Sheet Modal */}
      {showCommandsModal && (
        <div className="absolute top-full right-0 mt-2 w-84 bg-slate-950/95 border border-cyan-500/30 p-4 rounded-2xl shadow-2xl backdrop-blur-xl z-50 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold font-heading">
              <Command className="w-4 h-4" />
              <span>Voice AI Commands Guide</span>
            </div>
            <button 
              onClick={() => setShowCommandsModal(false)}
              className="text-slate-500 hover:text-slate-300 text-xs font-mono p-1 rounded-lg hover:bg-slate-900"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5 text-slate-300 max-h-60 overflow-y-auto pr-1">
            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="font-mono text-emerald-400 font-medium">"Go to Assessment"</span>
              <span className="text-[10px] text-slate-400">Biological Age</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="font-mono text-emerald-400 font-medium">"Open Copilot"</span>
              <span className="text-[10px] text-slate-400">Physician EHR</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="font-mono text-emerald-400 font-medium">"Open Radiology"</span>
              <span className="text-[10px] text-slate-400">Imaging Scanner</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="font-mono text-emerald-400 font-medium">"Analyze Meal"</span>
              <span className="text-[10px] text-slate-400">Macro Vision</span>
            </div>
            <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="font-mono text-rose-400 font-medium">"Dispatch SOS"</span>
              <span className="text-[10px] text-rose-300">Paramedic Brief</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
