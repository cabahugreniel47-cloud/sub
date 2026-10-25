import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Bell,
  X,
  Check,
  Copy,
  ExternalLink,
  Volume2,
  VolumeX,
  Stethoscope,
  Ticket,
  FileText,
  Pill,
  Calendar,
  Award,
  UserCheck
} from 'lucide-react';

export const GlobalNumberPopup: React.FC = () => {
  const {
    activeNumberPopup,
    dismissNumberPopup,
    soundChimeEnabled,
    toggleSoundChime,
    setActiveTab,
    setSelectedPatient,
    patients,
    currentUser
  } = useClinic();

  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!activeNumberPopup) return;

    setProgress(100);
    setCopied(false);

    const duration = 10000; // 10 seconds
    const interval = 100;
    const step = (interval / duration) * 100;

    const timer = setInterval(() => {
      if (!isHovered) {
        setProgress(prev => {
          if (prev <= 0) {
            clearInterval(timer);
            dismissNumberPopup();
            return 0;
          }
          return prev - step;
        });
      }
    }, interval);

    return () => clearInterval(timer);
  }, [activeNumberPopup?.id, isHovered]);

  if (!activeNumberPopup) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(activeNumberPopup.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAction = () => {
    if (activeNumberPopup.patientId) {
      const p = patients.find(pat => pat.id === activeNumberPopup.patientId);
      if (p) setSelectedPatient(p);
    }

    if (activeNumberPopup.linkTab) {
      setActiveTab(activeNumberPopup.linkTab);
    } else if (currentUser?.role === 'doctor') {
      setActiveTab('consultations');
    }

    dismissNumberPopup();
  };

  const getIcon = () => {
    switch (activeNumberPopup.type) {
      case 'queue':
        return <Ticket className="w-5 h-5 text-amber-400" />;
      case 'consultation':
        return <Stethoscope className="w-5 h-5 text-blue-400" />;
      case 'rx':
        return <Pill className="w-5 h-5 text-purple-400" />;
      case 'appointment':
        return <Calendar className="w-5 h-5 text-emerald-400" />;
      case 'medcert':
        return <Award className="w-5 h-5 text-amber-300" />;
      case 'patient':
        return <UserCheck className="w-5 h-5 text-cyan-400" />;
      default:
        return <Bell className="w-5 h-5 text-amber-400" />;
    }
  };

  const getBadgeColors = () => {
    switch (activeNumberPopup.type) {
      case 'queue':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'consultation':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'rx':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'appointment':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'medcert':
        return 'bg-amber-400/20 text-amber-200 border-amber-400/40';
      default:
        return 'bg-red-500/20 text-red-200 border-red-500/40';
    }
  };

  return (
    <div
      className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md w-full animate-in slide-in-from-top-3 fade-in duration-300 shadow-2xl"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-slate-900/95 backdrop-blur-md text-white border-2 border-red-800/80 rounded-2xl overflow-hidden shadow-2xl ring-4 ring-black/10">
        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-1">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-emerald-400 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-3">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-800 rounded-xl border border-slate-700/80">
                {getIcon()}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-slate-300">
                    Live System Auto-Popup
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white truncate max-w-[210px] sm:max-w-[260px]">
                  {activeNumberPopup.title}
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={toggleSoundChime}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title={soundChimeEnabled ? 'Audio Chime Enabled' : 'Audio Chime Muted'}
              >
                {soundChimeEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              </button>
              <button
                type="button"
                onClick={dismissNumberPopup}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* NUMBER HERO DISPLAY */}
          <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-0.5">
                Official Reference / Queue Number
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight text-white font-mono drop-shadow-sm">
                  {activeNumberPopup.number}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase ${getBadgeColors()}`}>
                  {activeNumberPopup.type}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700 transition-all flex flex-col items-center gap-1 cursor-pointer"
              title="Copy Number"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
              <span className="text-[9px] font-bold">{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          {/* Patient Details & Clinical Note */}
          <div className="space-y-1 text-xs">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Patient:</span>
              <span className="font-bold text-white text-right truncate max-w-[220px]">
                {activeNumberPopup.patientName}
              </span>
            </div>
            {activeNumberPopup.department && (
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-400">Department / Role:</span>
                <span className="text-slate-300 text-right truncate max-w-[200px]">
                  {activeNumberPopup.department}
                </span>
              </div>
            )}
            {activeNumberPopup.details && (
              <p className="text-[11px] text-amber-200/90 bg-amber-950/40 p-2 rounded-lg border border-amber-900/50 mt-1 line-clamp-2">
                {activeNumberPopup.details}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleAction}
              className="flex-1 py-2 px-3 bg-red-700 hover:bg-red-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{activeNumberPopup.actionLabel || 'Open Record & Inspect'}</span>
            </button>
            <button
              type="button"
              onClick={dismissNumberPopup}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
