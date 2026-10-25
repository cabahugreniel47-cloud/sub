import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { X, Volume2, Tv, BellRing, Sparkles } from 'lucide-react';
import { McisLogo, PsuUniversitySeal } from '../common/OfficialLogos';

export const QueueDisplayBoardModal: React.FC = () => {
  const {
    queue,
    setActiveModal,
    playQueueChime,
    recentCalledTicket
  } = useClinic();

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const inConsultation = queue.find(q => q.stage === 'In Consultation');
  const inTriage = queue.find(q => q.stage === 'In Triage');
  const nextInLine = queue.filter(q => q.stage === 'Waiting Triage' || q.stage === 'Waiting Doctor').slice(0, 6);

  // Mask patient name for Philippine Data Privacy Act RA 10173 public display compliance
  const maskName = (fullName: string) => {
    const parts = fullName.split(' ');
    if (parts.length === 1) return parts[0];
    return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 md:p-8 overflow-y-auto">
      <div className="w-full max-w-6xl bg-slate-900 border-2 border-red-900 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        {/* TV Header Bar */}
        <div className="p-6 bg-red-950/90 border-b border-red-900 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/10 shadow-md shrink-0">
              <McisLogo size={44} showText={false} />
              <div className="w-px h-8 bg-white/20" />
              <PsuUniversitySeal size={44} className="shadow-xs" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                PAMPANGA STATE UNIVERSITY MEDICAL CLINIC
              </h1>
              <p className="text-xs text-red-200 uppercase tracking-widest font-semibold">
                Main Campus Waiting Hall · Live Queue Status
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <div className="text-2xl font-black font-mono tracking-wider text-red-100">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <div className="text-xs text-red-300">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
            </div>

            <button
              onClick={() => setActiveModal(null)}
              className="p-2 bg-red-900/60 hover:bg-red-800 text-red-200 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Close TV Mode"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Recently Called Announcement Banner */}
        {recentCalledTicket && (
          <div className="bg-amber-500 text-slate-950 px-6 py-2 text-center text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
            <BellRing className="w-4 h-4" />
            <span>NOW CALLING: TICKET {recentCalledTicket.number} PROCEED TO {recentCalledTicket.room.toUpperCase()}</span>
          </div>
        )}

        {/* TV Main Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
          {/* NOW SERVING COLUMNS (2 Columns) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="text-sm font-bold tracking-widest uppercase text-red-400 pb-2 border-b border-slate-800 flex items-center justify-between">
              <span>NOW SERVING</span>
              <button
                onClick={() => playQueueChime(inConsultation?.ticketNumber || 'Q-101', 'Doctor Room 1')}
                className="text-xs font-semibold px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Speaker Chime</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Doctor Consultation Room 1 */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700 shadow-xl flex flex-col items-center text-center justify-between min-h-[220px]">
                <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Doctor Consultation Room 1
                </div>

                {inConsultation ? (
                  <div className="my-auto">
                    <div className="text-6xl md:text-7xl font-black font-mono text-white tracking-wider animate-pulse">
                      {inConsultation.ticketNumber}
                    </div>
                    <div className="text-sm text-slate-300 mt-2 font-medium">
                      Patient: {maskName(inConsultation.patientName)}
                    </div>
                  </div>
                ) : (
                  <div className="my-auto text-slate-500 text-sm">
                    Station Available / Calling Next
                  </div>
                )}

                <div className="text-[11px] text-slate-400 mt-2">
                  Attending: Dr. Roberto M. Manalo, MD
                </div>
              </div>

              {/* Triage & Vital Signs Desk */}
              <div className="p-6 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-850 border border-slate-700 shadow-xl flex flex-col items-center text-center justify-between min-h-[220px]">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Triage & Vital Signs Desk
                </div>

                {inTriage ? (
                  <div className="my-auto">
                    <div className="text-6xl md:text-7xl font-black font-mono text-amber-400 tracking-wider">
                      {inTriage.ticketNumber}
                    </div>
                    <div className="text-sm text-slate-300 mt-2 font-medium">
                      Patient: {maskName(inTriage.patientName)}
                    </div>
                  </div>
                ) : (
                  <div className="my-auto text-slate-500 text-sm">
                    Awaiting Arriving Patients
                  </div>
                )}

                <div className="text-[11px] text-slate-400 mt-2">
                  Officer: Mary Jane Santos, RN
                </div>
              </div>
            </div>

            {/* University Clinic Advisory Ticker */}
            <div className="p-4 bg-slate-850 border border-slate-800 rounded-2xl flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <p className="text-xs text-slate-300 leading-snug">
                Please prepare your <strong>Pampanga State University Student / Employee ID</strong> when your ticket number is called. Observe silence in the waiting area.
              </p>
            </div>
          </div>

          {/* NEXT IN LINE COLUMN (1 Column) */}
          <div className="space-y-4">
            <div className="text-sm font-bold tracking-widest uppercase text-red-400 pb-2 border-b border-slate-800">
              NEXT IN LINE
            </div>

            <div className="divide-y divide-slate-800 bg-slate-850 border border-slate-800 rounded-2xl p-2 max-h-[380px] overflow-y-auto">
              {nextInLine.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  No pending tickets in queue.
                </div>
              ) : (
                nextInLine.map(t => (
                  <div key={t.id} className="p-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xl font-bold text-red-400">
                        {t.ticketNumber}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">
                          {maskName(t.patientName)}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {t.stage === 'Waiting Triage' ? 'For Triage' : 'For Doctor Room 1'}
                        </div>
                      </div>
                    </div>

                    {t.priority !== 'Regular' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-900/60 text-red-300">
                        {t.priority}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* TV Bottom Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>Republic Act No. 10173 (Data Privacy Act of 2012) Compliant Patient Display</div>
          <div>PSU Health Services Office · Extension 104</div>
        </div>
      </div>
    </div>
  );
};
