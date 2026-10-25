import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Database,
  ShieldCheck,
  Server,
  Save,
  CheckCircle2,
  Clock,
  MapPin,
  Lock,
  Users,
  Activity,
  Bot,
  Sparkles,
  Phone,
  Building,
  RefreshCw,
  Archive,
  Trash2,
  AlertTriangle,
  FileCheck
} from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const { patients, showToast, setActiveTab } = useClinic();
  const [activeSubTab, setActiveSubTab] = useState<'facility' | 'database' | 'clinclin' | 'security'>('facility');

  // Form states
  const [facilityName, setFacilityName] = useState('Pampanga State University - Main Campus Medical Clinic');
  const [facilityAddress, setFacilityAddress] = useState('Cabambangan, Bacolor, Pampanga, Region III, Philippines');
  const [facilityHours, setFacilityHours] = useState('Monday to Friday: 8:00 AM - 5:00 PM');
  const [emergencyHotline, setEmergencyHotline] = useState('0917-882-9011 / Ext. 104');
  
  // Clinical thresholds
  const [bpAlertSystolic, setBpAlertSystolic] = useState('140');
  const [bpAlertDiastolic, setBpAlertDiastolic] = useState('90');
  const [feverThreshold, setFeverThreshold] = useState('37.8');
  const [autoAdvanceQueue, setAutoAdvanceQueue] = useState(true);

  // Database stats
  const activePatients = patients.filter(p => p.status !== 'archived');
  const archivedPatients = patients.filter(p => p.status === 'archived');
  const totalPatients = patients.length;

  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Clinic facility parameters updated successfully.', 'success');
  };

  const handleSaveClinical = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('Clinical triage thresholds updated successfully.', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7F1416] uppercase tracking-wider mb-1">
            <Server className="w-4 h-4" />
            <span>Clinic Administration & Operations</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            System Settings & Database Controls
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Configure clinic facility details, clinical triage thresholds, patient database lifecycle rules, and Clin Clin AI Assistant services.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl text-xs font-bold flex-wrap">
          <button
            onClick={() => setActiveSubTab('facility')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'facility' ? 'bg-[#7F1416] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Facility & Operations</span>
          </button>
          <button
            onClick={() => setActiveSubTab('database')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'database' ? 'bg-[#7F1416] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Database & Patient Lifecycle</span>
          </button>
          <button
            onClick={() => setActiveSubTab('clinclin')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'clinclin' ? 'bg-[#7F1416] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Clin Clin Assistant</span>
          </button>
          <button
            onClick={() => setActiveSubTab('security')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'security' ? 'bg-[#7F1416] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Security & Governance</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: FACILITY & OPERATIONS */}
      {activeSubTab === 'facility' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Facility Info Card */}
          <form onSubmit={handleSaveFacility} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs text-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Building className="w-4 h-4 text-[#7F1416]" />
                <span>Clinic Facility Information</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Operational
              </span>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Campus Facility Name</label>
              <input
                type="text"
                value={facilityName}
                onChange={e => setFacilityName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7F1416]/20"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Physical Address</label>
              <input
                type="text"
                value={facilityAddress}
                onChange={e => setFacilityAddress(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7F1416]/20"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">Operating Hours</label>
                <input
                  type="text"
                  value={facilityHours}
                  onChange={e => setFacilityHours(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7F1416]/20"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">Emergency Hotline</label>
                <input
                  type="text"
                  value={emergencyHotline}
                  onChange={e => setEmergencyHotline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-red-900 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7F1416]/20"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Facility Info</span>
              </button>
            </div>
          </form>

          {/* Clinical Triage & Queue Rules */}
          <form onSubmit={handleSaveClinical} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 text-xs text-slate-700">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#7F1416]" />
                <span>Clinical Triage Alert Thresholds</span>
              </h3>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Philippine DOH Standard
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1 text-slate-700">High BP Alert (Systolic)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={bpAlertSystolic}
                    onChange={e => setBpAlertSystolic(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs focus:bg-white"
                  />
                  <span className="text-slate-500 font-mono text-[10px]">mmHg</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700">High BP Alert (Diastolic)</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    value={bpAlertDiastolic}
                    onChange={e => setBpAlertDiastolic(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs focus:bg-white"
                  />
                  <span className="text-slate-500 font-mono text-[10px]">mmHg</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-700">Fever Alert Threshold (°C)</label>
              <div className="flex items-center gap-1.5 max-w-[200px]">
                <input
                  type="number"
                  step="0.1"
                  value={feverThreshold}
                  onChange={e => setFeverThreshold(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-900 text-xs focus:bg-white"
                />
                <span className="text-slate-500 font-mono text-[10px]">°C</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Temperatures at or above this threshold trigger an Urgent triage tag and notify the attending physician.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900">Automatic Queue Advancement</div>
                <div className="text-[10px] text-slate-500">Auto-call next waiting patient upon doctor completion</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAdvanceQueue}
                  onChange={e => setAutoAdvanceQueue(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7F1416]" />
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Clinical Thresholds</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUB-TAB 2: DATABASE & PATIENT LIFECYCLE */}
      {activeSubTab === 'database' && (
        <div className="space-y-6 text-xs text-slate-700">
          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Current / Active</span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{activePatients.length}</div>
              <div className="text-[11px] text-emerald-700 font-semibold mt-1">Currently enrolled and active</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Past / Archived</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{archivedPatients.length}</div>
              <div className="text-[11px] text-amber-700 font-semibold mt-1">Archived past patients with stored history</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Database Records</span>
                <Database className="w-4 h-4 text-[#7F1416]" />
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 font-mono">{totalPatients}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-1">Persistent clinical records in database</div>
            </div>
          </div>

          {/* Database Lifecycle Actions & Governance */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#7F1416]" />
                  <span>Patient Lifecycle Controls: Remove, Delete, Restore & Stored History</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Full CRUD database lifecycle operations for managing current and historical patient records with audit trail compliance.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('patients')}
                className="px-4 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl font-bold cursor-pointer transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Open Patient Registry</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Feature 1: Remove / Archive */}
              <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Archive className="w-4 h-4" />
                  <span>1. Remove / Archive</span>
                </div>
                <p className="text-[11px] text-amber-950/80 leading-relaxed">
                  Removes patient from the active daily registry without losing medical data. Archives the patient with timestamp, logged staff, and recorded reason (graduation, transfer, or clearance).
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    PUT /api/clinic/patients/:id/archive
                  </span>
                </div>
              </div>

              {/* Feature 2: Restore to Active */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                  <RefreshCw className="w-4 h-4" />
                  <span>2. Restore to Active</span>
                </div>
                <p className="text-[11px] text-emerald-950/80 leading-relaxed">
                  Restores any past or archived patient back to the active clinic roster instantly. Restores their queue eligibility and unfreezes consultation appointment booking.
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-mono font-bold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded">
                    PUT /api/clinic/patients/:id/restore
                  </span>
                </div>
              </div>

              {/* Feature 3: Delete & Purge */}
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 space-y-2">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <Trash2 className="w-4 h-4" />
                  <span>3. Permanent Delete</span>
                </div>
                <p className="text-[11px] text-rose-950/80 leading-relaxed">
                  Permanently purges a record from the database. Protected with strict PSU ID confirmation to prevent accidental loss and logs an immutable entry in the system audit trail.
                </p>
                <div className="pt-2">
                  <span className="text-[10px] font-mono font-bold bg-rose-100 text-rose-900 px-2 py-0.5 rounded">
                    DELETE /api/clinic/patients/:id
                  </span>
                </div>
              </div>
            </div>

            {/* Feature 4: Stored History Explanation */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <Clock className="w-4 h-4 text-[#7F1416]" />
                <span>Stored History of Current & Past Patients</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                The centralized clinic database maintains a complete chronological medical history for both active and archived patients. Staff can review vital signs assessments, physician consultations, prescribed medications, appointments, and issuance of medical certificates in one unified timeline, with PDF export capability.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: CLIN CLIN AI ASSISTANT */}
      {activeSubTab === 'clinclin' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs text-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7F1416] to-amber-600 flex items-center justify-center text-white shadow-xs">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Clin Clin AI Assistant</h3>
                <p className="text-xs text-slate-500">Official Intelligent Clinical Assistant for Pampanga State University Medical Clinic</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full font-bold text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Online & Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>AI Capabilities & Modules</span>
              </div>
              <ul className="space-y-1.5 text-slate-600 text-xs">
                <li>• <strong>Nurse Triage Assistant:</strong> Recommends triage levels based on vital signs (Emergency, Urgent, Routine).</li>
                <li>• <strong>Doctor SOAP Support:</strong> Summarizes clinical notes and structures Subjective/Objective/Assessment/Plan.</li>
                <li>• <strong>Patient Health Portal:</strong> Answers clinic FAQs, explain certificate requirements, and verifies queue status.</li>
                <li>• <strong>Medicine Formulary Guide:</strong> Verifies dosage forms and PSU clinic inventory availability.</li>
              </ul>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Governance & Clinical Safety</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                Clin Clin adheres to strict university medical safety guardrails. It never overrides licensed physician judgment, clearly disclaims advice to students, and operates strictly within Philippine DOH clinical protocols.
              </p>
              <div className="pt-2 text-[11px] text-slate-500">
                Core Model: <strong>Gemini 2.5 Flash</strong> via @google/genai SDK
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: SECURITY & GOVERNANCE */}
      {activeSubTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5 text-xs text-slate-700">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#7F1416]" />
              <span>Data Privacy & Security Governance (RA 10173)</span>
            </h3>
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Role-Based Access Control (RBAC)</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Separation of duties strictly maintained. Doctors access consultations and medical records; Nurses conduct triage, vitals, and dispensing; Administrators manage accounts, audit trails, and facility parameters; Students have read-only access to their own medical pass.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900">Philippine Data Privacy Act (RA 10173)</div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                All patient health identifiers, hemodynamic assessments, and medical certificates are protected. Access requires authenticated university credentials, and audit logs record every database modification.
              </p>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 text-emerald-950 flex items-center gap-3">
            <FileCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            <div className="text-xs">
              <span className="font-bold">System Status: Production Ready.</span> All patient records, consultations, and queue data are backed by persistent storage.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
