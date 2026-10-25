import React, { useState } from 'react';
import { User, UserRole } from '../../types/clinic';
import {
  X,
  UserCheck,
  CheckCircle,
  AlertCircle,
  Building,
  Mail,
  Phone,
  ShieldCheck,
  Stethoscope,
  Activity,
  Users
} from 'lucide-react';

interface EditUserModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<User>) => Promise<boolean | void> | void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  isOpen,
  onClose,
  onSave
}) => {
  if (!isOpen || !user) return null;

  const [fullName, setFullName] = useState(user.fullName);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [contactNumber, setContactNumber] = useState(user.contactNumber || '');
  const [role, setRole] = useState<UserRole>(user.role);
  const [institutionalId, setInstitutionalId] = useState(user.institutionalId || '');
  const [title, setTitle] = useState(user.title || '');
  const [department, setDepartment] = useState(user.department || '');
  const [prcLicense, setPrcLicense] = useState(user.prcLicense || '');
  const [ptrNumber, setPtrNumber] = useState(user.ptrNumber || '');
  const [status, setStatus] = useState<'active' | 'inactive'>(user.status);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim() || !email.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await onSave(user.id, {
        fullName: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        contactNumber: contactNumber.trim() || undefined,
        role,
        institutionalId: institutionalId.trim() || undefined,
        title: title.trim(),
        department: department.trim(),
        prcLicense: prcLicense.trim() || undefined,
        ptrNumber: ptrNumber.trim() || undefined,
        status
      });

      if (ok !== false) {
        onClose();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <UserCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Edit Personnel Information</h3>
              <p className="text-xs text-slate-300">
                Updating credentials for @{user.username}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 text-xs text-slate-800 space-y-4">
          {/* Role Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Assigned Authority Role *
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {(
                [
                  { r: 'doctor' as const, label: 'Doctor', icon: '🩺' },
                  { r: 'nurse' as const, label: 'Nurse', icon: '💉' },
                  { r: 'staff' as const, label: 'Staff', icon: '📋' },
                  { r: 'administrator' as const, label: 'Admin', icon: '👑' },
                  { r: 'student' as const, label: 'Student', icon: '🎓' }
                ]
              ).map(item => (
                <button
                  key={item.r}
                  type="button"
                  onClick={() => setRole(item.r)}
                  className={`p-2 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                    role === item.r
                      ? 'border-[#7F1416] bg-red-50 text-[#7F1416] ring-2 ring-red-500/20 shadow-xs'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="text-sm mb-0.5">{item.icon}</div>
                  <div className="text-[10px] truncate">{item.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Full Name & Username */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Username *</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 font-mono text-xs"
              />
            </div>
          </div>

          {/* Email & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Institutional Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone (SMS)</label>
              <input
                type="text"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="+63 917 123 4567"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 font-mono text-xs"
              />
            </div>
          </div>

          {/* Title & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Position / Designation Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. University Physician"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Department / Clinic Assignment</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Consultation Room 1"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 text-xs"
              />
            </div>
          </div>

          {/* Institutional ID */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Institutional ID (Employee / Student ID)</label>
            <input
              type="text"
              value={institutionalId}
              onChange={(e) => setInstitutionalId(e.target.value)}
              placeholder="e.g. EMP-2024-0089"
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 font-mono text-xs"
            />
          </div>

          {/* PRC & PTR (if Doctor or Nurse) */}
          {(role === 'doctor' || role === 'nurse') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
              <div>
                <label className="block font-bold text-blue-950 mb-1">PRC License Number</label>
                <input
                  type="text"
                  value={prcLicense}
                  onChange={(e) => setPrcLicense(e.target.value)}
                  placeholder="e.g. 0089421"
                  className="w-full p-2 bg-white border border-blue-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block font-bold text-blue-950 mb-1">PTR Number</label>
                <input
                  type="text"
                  value={ptrNumber}
                  onChange={(e) => setPtrNumber(e.target.value)}
                  placeholder="e.g. PTR-2026-88192"
                  className="w-full p-2 bg-white border border-blue-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          )}

          {/* Account Status Switcher */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
            <div>
              <div className="font-bold text-slate-900">Account Access Status</div>
              <div className="text-[11px] text-slate-500">
                Active accounts can authenticate; inactive accounts are barred from logging in.
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatus('active')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  status === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => setStatus('inactive')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  status === 'inactive'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Inactive
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-98"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
