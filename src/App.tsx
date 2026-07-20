import React from 'react';
import { Server, Shield, CheckCircle, Terminal } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Ambient decorative light */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 border-b border-slate-800 pb-6">
          <div className="p-3 bg-indigo-600 rounded-xl text-white shadow-lg shadow-indigo-500/25">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Supabase Auth API</h1>
            <p className="text-xs text-slate-400">Phase 1 Backend Service • Ready for Ingress</p>
          </div>
        </div>

        {/* Status Line */}
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 text-sm mb-6">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="font-semibold">Backend Server is Online & Fully Protected</span>
        </div>

        {/* Section: Endpoint Matrix */}
        <div className="space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5" />
            Registered API Endpoints
          </h3>
          
          <div className="space-y-2.5">
            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">POST</span>
                <code className="text-xs text-slate-300">/api/auth/register</code>
              </div>
              <span className="text-xs text-slate-500">Public</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">POST</span>
                <code className="text-xs text-slate-300">/api/auth/login</code>
              </div>
              <span className="text-xs text-slate-500">Public</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">POST</span>
                <code className="text-xs text-slate-300">/api/auth/logout</code>
              </div>
              <span className="text-xs text-slate-500">Public</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">GET</span>
                <code className="text-xs text-slate-300">/api/auth/session</code>
              </div>
              <span className="text-xs text-violet-400 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Guarded
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">POST</span>
                <code className="text-xs text-slate-300">/api/auth/resend-verification</code>
              </div>
              <span className="text-xs text-slate-500">Public</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-900/40">POST</span>
                <code className="text-xs text-slate-300">/api/auth/reset-password-request</code>
              </div>
              <span className="text-xs text-slate-500">Public</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">POST</span>
                <code className="text-xs text-slate-300">/api/auth/reset-password-confirm</code>
              </div>
              <span className="text-xs text-violet-400 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Guarded
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold font-mono bg-violet-950 text-violet-300 px-2 py-0.5 rounded border border-violet-900/40">GET</span>
                <code className="text-xs text-slate-300">/api/dashboard/data</code>
              </div>
              <span className="text-xs text-violet-400 font-medium flex items-center gap-1">
                <Shield className="w-3 h-3" /> Guarded
              </span>
            </div>
          </div>
        </div>

        {/* Footer info block */}
        <p className="text-[11px] text-slate-500 mt-6 pt-5 border-t border-slate-800/60 leading-relaxed text-center">
          The server is listening on port 3000. Connect your external client application or run CURL commands directly targeting the standard JSON-RPC interface.
        </p>
      </div>
    </div>
  );
}
