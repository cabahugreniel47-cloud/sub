import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole, ClinicModule } from '../../types/clinic';
import {
  Shield,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Info,
  Lock,
  Sliders,
  Users,
  Stethoscope,
  Activity,
  Package,
  ClipboardList,
  Calendar,
  BarChart3,
  FileClock,
  Settings,
  Pill,
  Sparkles
} from 'lucide-react';

interface ModuleDef {
  id: ClinicModule;
  label: string;
  category: 'Clinical' | 'Operations' | 'Administration';
  icon: React.ElementType;
  description: string;
}

const MODULES: ModuleDef[] = [
  { id: 'dashboard', label: 'Central Command / Dashboard', category: 'Operations', icon: Activity, description: 'Role-specific operational overview' },
  { id: 'queue', label: 'Queue Management & Triage', category: 'Clinical', icon: ClipboardList, description: 'Ticket issuance, calling, priority handling' },
  { id: 'patients', label: 'Patient Medical Records', category: 'Clinical', icon: Users, description: 'Demographics, medical history, allergies' },
  { id: 'vitals', label: 'Vital Signs Assessment', category: 'Clinical', icon: Activity, description: 'Hemodynamic assessment and pain scale' },
  { id: 'consultations', label: 'Consultation', category: 'Clinical', icon: Stethoscope, description: 'Physician diagnosis, Rx & medical certificate' },
  { id: 'dispensing', label: 'Medicine Dispensing Desk', category: 'Operations', icon: Pill, description: 'Prescription fulfillment and patient dosage' },
  { id: 'inventory', label: 'Pharmacy Formulary Stock', category: 'Operations', icon: Package, description: 'Medication stock, lot expiry, reorders' },
  { id: 'appointments', label: 'Appointment Scheduling', category: 'Operations', icon: Calendar, description: 'Clinic booking, follow-up scheduling' },
  { id: 'reports', label: 'Reports & Census Analytics', category: 'Administration', icon: BarChart3, description: 'Morbidity census, population metrics, PDF export' },
  { id: 'users', label: 'User Accounts & Roles', category: 'Administration', icon: Shield, description: 'Admin management of clinic personnel & requests' },
  { id: 'logs', label: 'System Audit Logs', category: 'Administration', icon: FileClock, description: 'RA 10173 access trail and security events' },
  { id: 'settings', label: 'System Settings', category: 'Administration', icon: Settings, description: 'Database architecture and clinic preferences' }
];

const ROLES: { role: UserRole; title: string; badge: string; isMaster?: boolean }[] = [
  { role: 'administrator', title: 'Administrator (Master)', badge: 'bg-red-950 text-red-200 border-red-800', isMaster: true },
  { role: 'doctor', title: 'Doctor (MD)', badge: 'bg-blue-100 text-blue-900 border-blue-300' },
  { role: 'nurse', title: 'Nurse (RN)', badge: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { role: 'staff', title: 'Clinic Staff', badge: 'bg-amber-100 text-amber-900 border-amber-300' },
  { role: 'student', title: 'Student Portal', badge: 'bg-slate-100 text-slate-800 border-slate-300' }
];

export const RolePermissionsMatrix: React.FC = () => {
  const {
    rolePermissions,
    toggleModulePermission,
    updateRolePermissions,
    resetRolePermissionsToDefault,
    showToast
  } = useClinic();

  return (
    <div className="space-y-6">
      {/* Top Banner with Hierarchy Architecture */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-red-900/40">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-red-900/60 text-red-200 border border-red-700/60 text-[10px] font-mono font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Master System Authority Control</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Role & Permissions Management Switchboard
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              As System Administrator, you hold master authority over which modules and operational capabilities Doctor, Nurse, and Staff accounts can access across the clinic system.
            </p>
          </div>

          <button
            onClick={resetRolePermissionsToDefault}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-white/20 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-300" />
            <span>Reset All to System Defaults</span>
          </button>
        </div>

        {/* Visual Hierarchy Flow */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-black/30 p-3 rounded-xl border border-red-500/30">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 text-xs">
              <span>👑 ADMINISTRATOR (MASTER)</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Controls and manages the entire system, user accounts, security roles, permissions, audit logs, and configurations.
            </p>
          </div>

          <div className="bg-black/20 p-3 rounded-xl border border-white/10">
            <div className="font-bold text-blue-300 flex items-center gap-1.5 text-xs">
              <span>🩺 DOCTOR & 💉 NURSE</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Execute medical consultations, SOAP diagnosis, electronic Rx, triage prioritization, vitals, and dispensing.
            </p>
          </div>

          <div className="bg-black/20 p-3 rounded-xl border border-white/10">
            <div className="font-bold text-emerald-300 flex items-center gap-1.5 text-xs">
              <span>📋 CLINIC STAFF</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1">
              Front-desk intake, queue ticket issuance, appointment scheduling, and supplies logging.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Module Access Control Matrix</h3>
            <p className="text-[11px] text-slate-500">
              Toggle checkmarks to grant or restrict module access in real-time. Changes immediately update the sidebar navigation for that role.
            </p>
          </div>
          <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full border border-emerald-200 font-bold">
            Live Synchronized
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 w-72">System Module</th>
                {ROLES.map(r => (
                  <th key={r.role} className="py-3.5 px-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${r.badge}`}>
                        {r.title}
                      </span>
                      {r.isMaster && (
                        <span className="text-[9px] text-red-700 font-bold mt-0.5">Master Lock</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MODULES.map(module => {
                const Icon = module.icon;
                return (
                  <tr key={module.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{module.label}</div>
                          <div className="text-[10px] text-slate-400">{module.description}</div>
                        </div>
                      </div>
                    </td>

                    {ROLES.map(r => {
                      const isMasterAdmin = r.role === 'administrator';
                      const adminSystemModules: ClinicModule[] = ['dashboard', 'users', 'logs', 'settings'];
                      const isAllowed = isMasterAdmin
                        ? adminSystemModules.includes(module.id)
                        : rolePermissions[r.role]?.allowedModules?.includes(module.id);

                      return (
                        <td key={r.role} className="py-3 px-3 text-center">
                          {isMasterAdmin ? (
                            isAllowed ? (
                              <div className="inline-flex items-center justify-center p-1 rounded-full bg-red-100 text-red-800" title="System Governance Module (Mandatory Admin Access)">
                                <Lock className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="inline-flex items-center justify-center p-1 rounded-full bg-slate-100 text-slate-400" title="Restricted by RA 10173 Patient Privacy Shield">
                                <XCircle className="w-4 h-4" />
                              </div>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleModulePermission(r.role, module.id)}
                              className={`p-1.5 rounded-lg transition-transform active:scale-90 cursor-pointer ${
                                isAllowed
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-300 hover:text-slate-500'
                              }`}
                              title={`Click to ${isAllowed ? 'revoke' : 'grant'} ${module.label} access for ${r.role}`}
                            >
                              {isAllowed ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-400" />
                              )}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Authority Capabilities Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Clinical & Operational Authority Privileges</h3>
            <p className="text-[11px] text-slate-500">
              Authority privileges controlling prescription issuance, pharmacy dispensing, medical clearances, and user management.
            </p>
          </div>
          <span className="text-[10px] text-[#7F1416] font-bold">
            Republic Act No. 10173 & Medical Practice Act
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Doctor Authority Card */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
            <div className="font-bold text-blue-900 flex items-center justify-between">
              <span>🩺 Doctor Authority</span>
              <span className="text-[10px] bg-blue-200 text-blue-900 px-1.5 py-0.2 rounded font-mono">Clinical</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-700">
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Clinical Diagnoses (SOAP)
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Electronic Prescriptions (Rx)
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Medical Certificates & Leaves
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Finished Consultations
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <XCircle className="w-3.5 h-3.5" /> User Account Creation (Admin Only)
              </li>
            </ul>
          </div>

          {/* Nurse Authority Card */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2">
            <div className="font-bold text-emerald-900 flex items-center justify-between">
              <span>💉 Nurse Authority</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono">Triage</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-700">
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Vital Signs & Triage Severity
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Pharmacy Medicine Dispensing
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Inventory Lot Tracking
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <XCircle className="w-3.5 h-3.5" /> Autonomous Rx Formulation
              </li>
            </ul>
          </div>

          {/* Clinic Staff Card */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
            <div className="font-bold text-amber-900 flex items-center justify-between">
              <span>📋 Clinic Staff Authority</span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded font-mono">Reception</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-slate-700">
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Queue Ticket Generation
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Patient Intake & Demographics
              </li>
              <li className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Appointment Booking
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <XCircle className="w-3.5 h-3.5" /> Clinical Diagnoses & Rx
              </li>
            </ul>
          </div>

          {/* Administrator Master Card */}
          <div className="p-4 rounded-xl border border-red-300 bg-red-50/70 space-y-2">
            <div className="font-bold text-[#7F1416] flex items-center justify-between">
              <span>👑 Administrator Master</span>
              <span className="text-[10px] bg-red-800 text-white px-1.5 py-0.2 rounded font-mono">Master</span>
            </div>
            <ul className="space-y-1.5 text-[11px] text-[#7F1416]">
              <li className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-700" /> System Control & Oversight
              </li>
              <li className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-700" /> User Accounts (Doctors/Nurses/Staff)
              </li>
              <li className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-700" /> Module Access Control Switchboard
              </li>
              <li className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-red-700" /> Full Security Audit Logs
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
