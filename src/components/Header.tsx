import React from 'react';
import { Shield, Sparkles, LogOut, CheckCircle, Database, AlertCircle, RefreshCw, Activity, Siren, Zap } from 'lucide-react';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  isBackendOnline: boolean;
  isDbConfigured: boolean;
  onRefreshSession: () => void;
  isDemo: boolean;
  onToggleDemo: (val: boolean) => void;
  onTriggerSos?: () => void;
}

export default function Header({
  user,
  onLogout,
  isBackendOnline,
  isDbConfigured,
  onRefreshSession,
  isDemo,
  onToggleDemo,
  onTriggerSos
}: HeaderProps) {
  const userInitials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : 'US';

  return (
    <header id="app-header" className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* App Logo */}
        <div className="flex items-center gap-3">
          <div className="relative p-2.5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 rounded-2xl text-slate-950 shadow-lg shadow-emerald-500/20 group cursor-pointer">
            <Activity className="w-5 h-5 stroke-[2.5] animate-pulse" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1 font-heading">
                Health<span className="gradient-text-emerald">OS</span>
              </h1>
              <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> 2.5 Flash
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden sm:block tracking-wide uppercase">AI PREVENTIVE HEALTH & LONGEVITY ENGINE</p>
          </div>
        </div>

        {/* Status, SOS & Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick SOS Red Alert Button */}
          {onTriggerSos && (
            <button
              onClick={onTriggerSos}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/50 hover:border-rose-500 text-rose-300 hover:text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-rose-950/50 group animate-pulse-slow"
              title="Trigger SOS Paramedic Dispatch Alert"
            >
              <Siren className="w-3.5 h-3.5 text-rose-400 group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline font-mono">SOS ALERT</span>
            </button>
          )}

          {/* Database Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 font-mono">
            <span className="text-slate-500">DB:</span>
            {isBackendOnline ? (
              isDbConfigured ? (
                <span className="text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" /> Live SQL
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-pulse" /> Sandbox DB
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
              className="text-slate-500 hover:text-white transition-colors p-0.5 hover:bg-slate-800 rounded-md"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Sandbox vs Live toggle */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 shrink-0">
            <button
              onClick={() => onToggleDemo(false)}
              disabled={!isDbConfigured}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                !isDemo && isDbConfigured
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 disabled:opacity-30'
              }`}
            >
              Live
            </button>
            <button
              onClick={() => onToggleDemo(true)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                isDemo
                  ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-sm font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sandbox
            </button>
          </div>

          {/* User profile avatar & logout */}
          {user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800/80">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 max-w-[130px] truncate">
                  {user.email || 'Patient User'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
                  Active
                </span>
              </div>
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500/30">
                {userInitials}
              </div>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-xl transition-all border border-transparent hover:border-rose-900/40"
                title="Log out of HealthOS"
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

