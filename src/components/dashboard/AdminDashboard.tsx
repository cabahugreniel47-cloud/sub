import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Shield,
  Users,
  UserCheck,
  Bell,
  Sliders,
  FileClock,
  Settings,
  ChevronRight,
  Lock,
  Server,
  Tv,
  CheckCircle2,
  Key,
  UserPlus,
  ShieldCheck
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    users,
    registrationRequests,
    activityLogs,
    notifications,
    setActiveTab,
    setActiveModal,
    showToast
  } = useClinic();

  // System & Account Governance Metrics (Privacy-first: No clinical/patient private inputs exposed)
  const totalUsers = users.length;
  const activePersonnel = users.filter(u => u.status === 'active' && u.role !== 'student').length;
  const studentAccounts = users.filter(u => u.role === 'student').length;
  const pendingRequests = registrationRequests.filter(r => r.status === 'Pending').length;
  const totalAuditLogs = activityLogs.length;
  const unreadAlerts = notifications.filter(n => !n.read).length;

  // Breakdown of staff accounts
  const doctorCount = users.filter(u => u.role === 'doctor').length;
  const nurseCount = users.filter(u => u.role === 'nurse').length;
  const staffCount = users.filter(u => u.role === 'staff').length;

  return (
    <div className="space-y-7">
      {/* CENTRAL COMMAND HEADER */}
      <div className="bg-gradient-to-r from-slate-950 via-[#400809] to-slate-950 rounded-2xl p-6 sm:p-7 text-white shadow-lg border border-red-900/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-red-900/80 border border-red-600 text-amber-300 font-mono text-xs font-black tracking-widest uppercase flex items-center gap-1.5 shadow-sm">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>SYSTEM ADMINISTRATOR · CENTRAL COMMAND</span>
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-300 text-[10px] font-mono border border-white/10">
                RA 10173 Privacy-Compliant Governance
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-[10px] font-bold border border-emerald-800/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Services Operational
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Central System Governance & Access Control
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Dedicated system administration console for Pampanga State University Clinic. In strict compliance with the Data Privacy Act of 2012 (RA 10173), Administrator authority is focused exclusively on <strong>Central Command</strong>, <strong>User Accounts & Roles</strong>, <strong>System Audit Logs</strong>, and <strong>System Settings</strong>—protecting private patient health records and clinical inputs.
            </p>
          </div>

          {/* Quick Governance Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('users')}
              className="px-4 py-2.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer border border-red-500/30"
            >
              <Users className="w-4 h-4" />
              <span>User Accounts & Roles</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer border border-white/20 shadow-xs"
            >
              <Settings className="w-4 h-4 text-amber-300" />
              <span>System Settings</span>
            </button>
          </div>
        </div>

        {/* Privacy Separation Notice */}
        <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-2">
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="font-bold text-amber-300">Data Privacy Separation:</span>
            <span>Admin manages system accounts, security roles, audit logs & settings · Clinical records & inputs are restricted to licensed medical staff.</span>
          </div>
          <div className="font-mono text-[10px] text-emerald-400">
            ✓ RA 10173 Clinical Privacy Shield Active
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. SYSTEM GOVERNANCE KPI OVERVIEW */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7F1416]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 font-sans">
              System & Account Telemetry
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Non-Clinical Infrastructure Overview</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {/* Card 1: Total Accounts */}
          <div
            onClick={() => setActiveTab('users')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-red-700/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Users</span>
              <div className="p-1.5 rounded-lg bg-red-50 text-[#7F1416] group-hover:scale-110 transition-transform">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">{totalUsers}</div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">
              Registered System Accounts
            </div>
          </div>

          {/* Card 2: Active Clinic Personnel */}
          <div
            onClick={() => setActiveTab('users')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-600/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Staff</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:scale-110 transition-transform">
                <UserCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 font-mono">{activePersonnel}</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1 truncate">
              {doctorCount} MD · {nurseCount} RN · {staffCount} Staff
            </div>
          </div>

          {/* Card 3: Pending Registration Requests */}
          <div
            onClick={() => setActiveTab('users')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-600/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Account Requests</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 group-hover:scale-110 transition-transform">
                <UserPlus className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-600 font-mono">{pendingRequests}</div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">
              Awaiting Admin Approval
            </div>
          </div>

          {/* Card 4: Student Portal Users */}
          <div
            onClick={() => setActiveTab('users')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-600/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Portal Accounts</span>
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">{studentAccounts}</div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">
              Verified Student Passes
            </div>
          </div>

          {/* Card 5: Security Audit Events */}
          <div
            onClick={() => setActiveTab('logs')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-600/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Audit Events</span>
              <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 group-hover:scale-110 transition-transform">
                <FileClock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-purple-900 font-mono">{totalAuditLogs}</div>
            <div className="text-[10px] text-slate-500 mt-1 truncate">
              Immutable Security Trail
            </div>
          </div>

          {/* Card 6: System Alerts */}
          <div
            onClick={() => setActiveTab('settings')}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-600/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">System Config</span>
              <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 group-hover:scale-110 transition-transform">
                <Settings className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 font-mono">v2.0</div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1 truncate">
              {unreadAlerts > 0 ? `${unreadAlerts} System Notices` : 'All Nodes Healthy'}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. THE 4 CORE ADMINISTRATOR PILLARS */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#7F1416]" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 font-sans">
              Authorized Administrator Modules
            </h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Focused System Governance (No Private Clinical Inputs)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Pillar 1: User Accounts & Roles */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-red-100 text-[#7F1416]">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  {users.length} Accounts
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">User Accounts & Roles</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Approve account registration requests, dispatch email verification codes, create Doctor/Nurse/Staff accounts, and reset passwords.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-amber-700 font-semibold">{pendingRequests} Pending Requests</span>
              <button
                onClick={() => setActiveTab('users')}
                className="text-xs font-bold text-[#7F1416] hover:text-[#650e10] flex items-center gap-1 cursor-pointer"
              >
                <span>Open Accounts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 2: Role Permissions Matrix */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-amber-100 text-amber-900">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  RBAC Matrix
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Role & Access Permissions</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Configure module access boundaries for Doctors, Nurses, Clinic Staff, and Students while maintaining clinical privacy.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-semibold">RA 10173 Enforced</span>
              <button
                onClick={() => setActiveTab('users')}
                className="text-xs font-bold text-[#7F1416] hover:text-[#650e10] flex items-center gap-1 cursor-pointer"
              >
                <span>Configure Roles</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 3: System Audit Logs */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-900">
                  <FileClock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded-full">
                  {activityLogs.length} Events Logged
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">System Audit Logs</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Monitor system authentication events, account approvals, security timestamps, and terminal IP logs without exposing private medical notes.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-emerald-700 font-semibold">Audit Immutable</span>
              <button
                onClick={() => setActiveTab('logs')}
                className="text-xs font-bold text-[#7F1416] hover:text-[#650e10] flex items-center gap-1 cursor-pointer"
              >
                <span>View Audit Logs</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pillar 4: System Settings */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                  System Config
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-sm">System Settings</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Manage clinic facility information, clinical triage thresholds, patient database lifecycle rules, and Clin Clin AI Assistant services.
              </p>
            </div>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Centralized Storage</span>
              <button
                onClick={() => setActiveTab('settings')}
                className="text-xs font-bold text-[#7F1416] hover:text-[#650e10] flex items-center gap-1 cursor-pointer"
              >
                <span>Open Settings</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SYSTEM SECURITY STREAM & INFRASTRUCTURE STATUS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): Recent System & Authentication Audit Stream */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="font-bold text-sm text-slate-900">
                  Recent System Security & Access Events
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Real-time log of user sign-ins, role updates, and system activity (clinical diagnoses are redacted for patient privacy).
              </p>
            </div>
            <button
              onClick={() => setActiveTab('logs')}
              className="text-xs font-bold text-[#7F1416] hover:underline cursor-pointer"
            >
              View Full Audit Trail
            </button>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1 space-y-1">
            {activityLogs.slice(0, 7).map(log => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700 mt-0.5 shrink-0">
                    <Shield className="w-3.5 h-3.5 text-[#7F1416]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">{log.userName}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-bold uppercase bg-slate-100 text-slate-600">
                        {log.userRole}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">· {log.module}</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      {log.action}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {log.timestamp.split(' ')[1] || log.timestamp}
                  </span>
                  <span className="text-[9px] text-emerald-700 font-mono">
                    ✓ Logged ({log.ipAddress.split(' ')[0]})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (1 Col): System Infrastructure & Privacy Shield */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">System Infrastructure Status</h3>
            <p className="text-xs text-slate-500">Database, privacy compliance & display nodes</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Server className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="font-bold text-slate-900">Centralized Database</div>
                  <div className="text-[10px] text-slate-500">MySQL Relational Schema (12 Tables)</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                Connected
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Tv className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-bold text-slate-900">Waiting Area TV Board</div>
                  <div className="text-[10px] text-slate-500">Live display hosted at Nurse Station</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-200 text-slate-700">
                Nurse Station
              </span>
            </div>

            <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Lock className="w-4 h-4 text-emerald-700" />
                <div>
                  <div className="font-bold text-emerald-950">Patient Privacy Shield</div>
                  <div className="text-[10px] text-emerald-700">Clinical inputs hidden from Admin</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-200 text-emerald-900">
                Active
              </span>
            </div>

            <div className="p-3.5 bg-gradient-to-r from-red-50 to-amber-50 rounded-xl border border-red-200/60 space-y-2">
              <div className="font-bold text-slate-900 text-xs flex items-center justify-between">
                <span>Role Separation Summary</span>
                <span className="text-[10px] font-mono font-bold text-[#7F1416]">RBAC v2.0</span>
              </div>
              <ul className="space-y-1 text-[11px] text-slate-700">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#7F1416] shrink-0" />
                  <span><strong>Admin:</strong> Accounts, Roles, Audit Logs, Settings</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span><strong>Doctor:</strong> Consultation, Rx, Med Cert, Appointments</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                  <span><strong>Nurse/Staff:</strong> Intake, Triage Vitals, Dispensing</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
