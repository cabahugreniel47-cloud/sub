import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Smartphone, Monitor, CheckCircle, AlertTriangle, Info, X, Send, MessageSquare } from 'lucide-react';

export const DeviceToast: React.FC = () => {
  const {
    deviceToast,
    dismissDeviceToast,
    toast,
    dismissToast,
    recentSmsToast,
    dismissSmsToast,
    isMobile
  } = useClinic();

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto flex flex-col items-center gap-2 select-none pointer-events-none">
      {/* 0. Real-time SMS Dispatch Toast */}
      {recentSmsToast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto w-full bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-xl shadow-2xl border border-emerald-500/60 flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-3 duration-250 ring-2 ring-emerald-500/20"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <MessageSquare className="w-4 h-4 animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                <span>SMS Notification Dispatched</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 font-mono">
                  {recentSmsToast.phone}
                </span>
              </div>
              <div className="font-semibold text-slate-100 text-[11px] sm:text-xs truncate">
                {recentSmsToast.message}
              </div>
            </div>
          </div>

          <button
            onClick={dismissSmsToast}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Dismiss SMS notification"
            aria-label="Dismiss SMS notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 1. Device Adaptation Mode Notification Toast */}
      {deviceToast && (
        <div
          role="status"
          aria-live="polite"
          className="pointer-events-auto w-full bg-slate-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-3 duration-250"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-full bg-[#7F1416] text-white flex items-center justify-center shrink-0">
              {isMobile ? (
                <Smartphone className="w-3.5 h-3.5" />
              ) : (
                <Monitor className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="font-medium text-slate-100 text-[11px] sm:text-xs truncate">
              {deviceToast}
            </span>
          </div>

          <button
            onClick={dismissDeviceToast}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title="Dismiss notification"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. General App Operation Toast (replaces window.alert) */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`pointer-events-auto w-full px-4 py-2.5 rounded-xl shadow-2xl border flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-250 ${
            toast.type === 'warning'
              ? 'bg-amber-900/95 text-amber-50 border-amber-700'
              : toast.type === 'error'
              ? 'bg-red-950/95 text-red-50 border-red-800'
              : 'bg-emerald-950/95 text-emerald-50 border-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {toast.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            ) : toast.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            ) : (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span className="font-medium text-[11px] sm:text-xs leading-tight">
              {toast.message}
            </span>
          </div>

          <button
            onClick={dismissToast}
            className="p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
