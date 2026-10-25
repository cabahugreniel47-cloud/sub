import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Users,
  Ticket,
  Calendar,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  HeartPulse
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const {
    currentUser,
    patients,
    queue,
    appointments,
    setActiveTab,
    setActiveModal
  } = useClinic();

  const totalPatients = patients.length;
  const activeQueue = queue.filter(q => q.stage !== 'Completed' && q.stage !== 'Cancelled');
  const todayAppointments = appointments.length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
            <HeartPulse className="w-4 h-4" />
            <span>Clinic Reception & Patient Intake Desk</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {currentUser?.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Role: <span className="text-slate-700 font-semibold">{currentUser?.title}</span> · PSU Health Office Reception Counter
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveModal('new-patient')}
            className="px-3.5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Walk-in Patient</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Patients Currently in Clinic</span>
            <Ticket className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-600 tabular-nums">
            {activeQueue.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Waiting in Triage or Doctor Room</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Scheduled Appointments</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
            {todayAppointments}
          </div>
          <div className="text-xs text-slate-400 mt-1">Clearances & Checkups today</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Registered University Profiles</span>
            <Users className="w-4 h-4 text-red-700" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
            {totalPatients}
          </div>
          <div className="text-xs text-slate-400 mt-1">Active student and employee records</div>
        </div>
      </div>

      {/* Active Queue Status */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-bold text-slate-900 text-sm">
            Current Clinic Waiting Room Tickets
          </h3>
          <span className="text-xs font-mono text-slate-500">Live Status</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {activeQueue.length === 0 ? (
            <div className="p-6 text-center text-slate-400">No active queue tickets.</div>
          ) : (
            activeQueue.map(t => (
              <div key={t.id} className="p-3.5 hover:bg-slate-50 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-base text-red-800">{t.ticketNumber}</span>
                  <div>
                    <div className="font-semibold text-slate-900">{t.patientName}</div>
                    <div className="text-[11px] text-slate-500">{t.patientClassification} · {t.patientPsuId}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                    t.stage === 'Waiting Triage' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {t.stage}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{t.createdAt}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
