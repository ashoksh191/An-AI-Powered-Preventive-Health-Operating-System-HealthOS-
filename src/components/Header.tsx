import React from 'react';
import { Shield, Sparkles, LogOut, CheckCircle, Database, AlertCircle, RefreshCw, Activity } from 'lucide-react';
import { isDemoMode, setDemoMode } from '../lib/api';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  isBackendOnline: boolean;
  isDbConfigured: boolean;
  onRefreshSession: () => void;
  isDemo: boolean;
  onToggleDemo: (val: boolean) => void;
}

export default function Header({
  user,
  onLogout,
  isBackendOnline,
  isDbConfigured,
  onRefreshSession,
  isDemo,
  onToggleDemo,
}: HeaderProps) {
  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'US';

  return (
    <header id="app-header" className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        {/* App Logo */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-xl text-slate-950 shadow-md shadow-emerald-500/20">
            <Activity className="w-5.5 h-5.5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5 font-sans">
              Vitalis<span className="text-emerald-400 font-medium text-xs font-mono bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded-full">AI</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block">CLINICAL PREDICTION & LIFESTYLE ENGINE</p>
          </div>
        </div>

        {/* Integration Status & Demo Mode Toggle */}
        <div className="flex items-center gap-3">
          {/* Status badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs text-slate-400 font-mono">
            <span>Database:</span>
            {isBackendOnline ? (
              isDbConfigured ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" /> Live SQL Cloud
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-pulse" /> Offline Fallback
                </span>
              )
            ) : (
              <span className="text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Server Offline
              </span>
            )}
            <button
              onClick={onRefreshSession}
              title="Refresh connection status"
              className="text-slate-500 hover:text-white transition-colors ml-1 p-0.5 hover:bg-slate-800 rounded"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Sandbox toggle banner */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => onToggleDemo(false)}
              disabled={!isDbConfigured}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                !isDemo && isDbConfigured
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:hover:text-slate-400'
              }`}
              title={!isDbConfigured ? "Live mode requires backend configuration" : "Sync with live Postgres Cloud DB"}
            >
              Live
            </button>
            <button
              onClick={() => onToggleDemo(true)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                isDemo
                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Local isolated client sandbox"
            >
              Sandbox
            </button>
          </div>

          {/* User profile dropdown / logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate">
                  {user.email || 'Anonymous'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {isDemo ? 'Sandbox Session' : 'Secured User'}
                </span>
              </div>
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md">
                {userInitials}
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/40 rounded-xl transition-all"
                title="Log out of application"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
