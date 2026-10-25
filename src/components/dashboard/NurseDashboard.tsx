import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Activity,
  UserPlus,
  Pill,
  Clock,
  ClipboardList,
  AlertTriangle,
  Play,
  HeartPulse,
  Thermometer,
  ChevronRight,
  Tv
} from 'lucide-react';

export const NurseDashboard: React.FC = () => {
  const {
    currentUser,
    queue,
    patients,
    medicines,
    setActiveTab,
    setActiveModal,
    setSelectedPatient,
    setModalPayload
  } = useClinic();

  // Queue waiting for triage
  const waitingTriage = queue.filter(q => q.stage === 'Waiting Triage' || q.stage === 'In Triage');
  const criticalSupplies = medicines.filter(m => m.status === 'Low Stock' || m.status === 'Critical Stock');

  const handleTakeVitals = (patientId: string) => {
    const pat = patients.find(p => p.id === patientId);
    if (pat) {
      setSelectedPatient(pat);
      setModalPayload({ patient: pat });
      setActiveModal('record-vitals');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <HeartPulse className="w-4 h-4" />
            <span>Nurse Triage Station & Clinical Assessment</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {currentUser?.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Station: <span className="text-slate-700 font-semibold">{currentUser?.department}</span> · PRC License: <span className="font-mono text-slate-700">{currentUser?.prcLicense || '0471203'}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveModal('new-patient')}
            className="px-3.5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>New Patient Intake</span>
          </button>
          <button
            onClick={() => setActiveTab('dispensing')}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Pill className="w-3.5 h-3.5" />
            <span>OTC Dispensing Desk</span>
          </button>
          <button
            onClick={() => setActiveModal('tv-queue')}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Launch Live TV Waiting Area Display Board"
          >
            <Tv className="w-3.5 h-3.5 text-amber-700" />
            <span>Live Waiting Board</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Pending Triage / Vitals</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-600 tabular-nums">
            {waitingTriage.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Patients in clinic waiting room</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Pharmacy Critical Alerts</span>
            <AlertTriangle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-red-700 tabular-nums">
            {criticalSupplies.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Medicines requiring replenishment</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Formulary Medicines In Stock</span>
            <Pill className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-900 tabular-nums">
            {medicines.length}
          </div>
          <div className="text-xs text-slate-400 mt-1">Active pharmaceutical products</div>
        </div>
      </div>

      {/* Patients Awaiting Triage & Vitals */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-red-700" />
            <h3 className="font-bold text-slate-900 text-sm">
              Patients Awaiting Triage & Vital Signs Capture
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('queue')}
            className="text-xs font-semibold text-red-700 hover:underline flex items-center gap-1"
          >
            <span>View All Queue Tickets</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {waitingTriage.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              All arriving patients have completed vital signs triage. New queue tickets will appear here automatically.
            </div>
          ) : (
            waitingTriage.map(ticket => {
              const patient = patients.find(p => p.id === ticket.patientId);
              return (
                <div key={ticket.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-red-800 text-base">
                        {ticket.ticketNumber}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {ticket.patientName}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        {ticket.patientPsuId}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                        {ticket.patientClassification}
                      </span>
                      {ticket.priority !== 'Regular' && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-red-100 font-bold text-red-800">
                          {ticket.priority}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-600">
                      <strong>Stated Complaint:</strong> {ticket.chiefComplaint || 'Checkup'} · Arrived at {ticket.createdAt}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTakeVitals(ticket.patientId)}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Capture Vital Signs</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
