import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import { McisLogo, PsuUniversitySeal } from '../common/OfficialLogos';
import {
  HeartPulse,
  Ticket,
  Calendar,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle,
  Activity,
  MapPin,
  Phone,
  Pill,
  Bell,
  ArrowRight,
  ShieldCheck,
  Printer
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const {
    currentUser,
    patients,
    queue,
    consultations,
    appointments,
    notifications,
    setActiveTab,
    setModalPayload,
    setActiveModal
  } = useClinic();

  // Find linked student record securely matching current authenticated user
  const myRecord = patients.find(
    p => (currentUser?.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
         (currentUser?.institutionalId && p.psuId === currentUser.institutionalId) ||
         (currentUser?.fullName && `${p.firstName} ${p.lastName}`.toLowerCase() === currentUser.fullName.toLowerCase())
  ) || (patients.length === 1 ? patients[0] : null);

  const myTicket = queue.find(q => (myRecord ? q.patientId === myRecord.id : false) && q.stage !== 'Completed');
  const myConsultations = consultations.filter(c => myRecord ? c.patientId === myRecord.id : false);
  const myAppointments = appointments.filter(a => myRecord ? a.patientId === myRecord.id : false);
  const myNotifications = notifications.filter(n => n.targetRoles.includes('student') || n.type === 'system' || n.type === 'queue_alert');

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      {/* Student Clinic Pass Header */}
      <div className="bg-gradient-to-r from-red-800 to-red-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 p-1 bg-black/30 rounded-xl border border-white/15 shrink-0">
                <McisLogo size={28} showText={false} />
                <PsuUniversitySeal size={28} className="shadow-xs" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-red-950/60 px-2.5 py-1 rounded-full border border-red-700/50">
                PSU Student Health Pass
              </span>
            </div>
            <span className="font-mono text-xs text-red-200">
              {myRecord?.psuId}
            </span>
          </div>

          <h2 className="text-2xl font-black tracking-tight">
            {myRecord?.firstName} {myRecord?.lastName}
          </h2>
          <p className="text-red-100 text-xs mt-0.5">
            {myRecord?.courseAndYear} · {myRecord?.collegeOrDepartment}
          </p>

          <div className="mt-4 pt-4 border-t border-red-700/60 flex items-center justify-between text-xs">
            <div>
              <span className="text-red-300">Blood Type:</span>{' '}
              <span className="font-bold text-white">{myRecord?.bloodType}</span>
            </div>
            <div>
              <span className="text-red-300">PhilHealth:</span>{' '}
              <span className="font-mono text-white">{myRecord?.philHealthNumber || 'Registered'}</span>
            </div>
          </div>

          {/* Allergy Alert */}
          {myRecord?.knownAllergies && myRecord.knownAllergies.length > 0 && myRecord.knownAllergies[0] !== 'None declared' && (
            <div className="mt-3 p-2 bg-red-950/70 border border-red-600/60 rounded-lg text-xs flex items-center gap-2 text-red-200">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Allergy Warning:</strong> {myRecord.knownAllergies.join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live Clinic Queue Status Tracker */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4 text-red-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              My Live Queue Status
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">Live Campus Tracker</span>
        </div>

        {myTicket ? (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-800 font-semibold">Your Ticket Number:</div>
                <div className="text-3xl font-extrabold font-mono text-red-800">
                  {myTicket.ticketNumber}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 bg-amber-200 text-amber-900 font-bold text-xs rounded-full">
                  {myTicket.stage}
                </span>
                <div className="text-[11px] text-amber-800 mt-1">
                  Location: {myTicket.counterOrRoom}
                </div>
              </div>
            </div>

            <p className="text-xs text-amber-900 leading-snug">
              Please proceed to <strong>{myTicket.counterOrRoom}</strong> when your ticket is announced. Have your student ID ready.
            </p>

            <div className="pt-2 border-t border-amber-200/80 flex items-center justify-between gap-2">
              <span className="text-[11px] text-amber-800 font-medium">
                Official Clinic Intake Slip:
              </span>
              <button
                type="button"
                onClick={() => {
                  setModalPayload({
                    type: 'queue-receipt',
                    ticket: myTicket,
                    patient: myRecord
                  });
                  setActiveModal('print-queue-receipt');
                }}
                className="px-3 py-1.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-amber-300" />
                <span>Print Official Slip / Receipt</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
            You are not currently in the clinic queue. When you visit the clinic front desk, your ticket will appear here in real time.
          </div>
        )}
      </div>

      {/* My Appointments & Clearances */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              My Clinic Visits & Appointments
            </h3>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {myAppointments.length === 0 ? (
            <div className="py-4 text-center text-slate-400">No scheduled appointments.</div>
          ) : (
            myAppointments.map(a => (
              <div key={a.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800">{a.purpose}</div>
                  <div className="text-slate-500 text-[11px]">{a.notes || 'General consultation'}</div>
                </div>
                <div className="text-right font-mono">
                  <div className="text-slate-900 font-semibold">{a.date}</div>
                  <div className="text-slate-500 text-[11px]">{a.time}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Clinic Hotlines & Location */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1.5">
        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-red-700" />
          <span>PSU Medical Clinic · Ground Floor, Student Services Bldg.</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-500">
          <Phone className="w-3.5 h-3.5" />
          <span>Clinic Hotline: 0917-882-9011 · Operating Hours: 8:00 AM - 5:00 PM</span>
        </div>
      </div>
    </div>
  );
};
