import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';
import {
  X,
  UserPlus,
  Mail,
  Phone,
  Building,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Send,
  AlertCircle
} from 'lucide-react';

interface RegistrationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistrationRequestModal: React.FC<RegistrationRequestModalProps> = ({
  isOpen,
  onClose
}) => {
  const { submitRegistrationRequest, showToast } = useClinic();

  const [fullName, setFullName] = useState('');
  const [institutionalId, setInstitutionalId] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('+63 ');
  const [requestedRole, setRequestedRole] = useState<UserRole>('student');
  const [department, setDepartment] = useState('College of Computing Studies');
  const [reason, setReason] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedReqId, setSubmittedReqId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      showToast('Please provide your full name and university email address.', 'warning');
      return;
    }

    const req = await submitRegistrationRequest({
      fullName: fullName.trim(),
      institutionalId: institutionalId.trim() || undefined,
      email: email.trim().toLowerCase(),
      contactNumber: contactNumber.trim(),
      requestedRole,
      department: department.trim(),
      reason: reason.trim() || 'Account request for university clinical services.'
    });

    setSubmittedReqId(req.id);
    setIsSubmitted(true);
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setFullName('');
    setInstitutionalId('');
    setEmail('');
    setContactNumber('+63 ');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#7F1416] via-[#94191c] to-[#7F1416] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <UserPlus className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Request Account / Register
              </h3>
              <p className="text-xs text-red-200">
                Pampanga State University Clinic Information System
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-red-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-700">
          {isSubmitted ? (
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Registration Request Submitted!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Your request has been forwarded to the <strong>Master Clinic Administrator</strong> for verification and authorization.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-medium">Tracking Reference:</span>
                  <span className="font-mono font-bold text-red-800">{submittedReqId}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-medium">Applicant:</span>
                  <span className="font-semibold text-slate-800">{fullName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500 font-medium">Requested Role:</span>
                  <span className="font-bold uppercase text-red-700">{requestedRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Registered Email:</span>
                  <span className="font-mono text-slate-800">{email}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-left text-[11px] leading-relaxed flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Next Step:</strong> Once approved, the system will send an <strong>Official Verification & Activation Email</strong> containing your activation link to create your password.
                </span>
              </div>

              <button
                onClick={handleResetAndClose}
                className="w-full py-2.5 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
              >
                Return to Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
                🛡️ <strong>Verification Policy:</strong> To protect sensitive health records (RA 10173), all self-registration requests must be verified and approved by the Clinic Administrator before access is granted.
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Full Name (First, Middle, Last) *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Maria Corazon D. Santos"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {/* Institutional ID & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Institutional ID Number
                  </label>
                  <input
                    type="text"
                    value={institutionalId}
                    onChange={(e) => setInstitutionalId(e.target.value)}
                    placeholder="e.g. 2024-00192-BC"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Requested System Role *
                  </label>
                  <select
                    value={requestedRole}
                    onChange={(e) => setRequestedRole(e.target.value as UserRole)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-none font-semibold cursor-pointer"
                  >
                    <option value="student">Student / Patient (Optional Portal)</option>
                    <option value="staff">Clinic Reception / Staff</option>
                    <option value="nurse">Nurse / Triage Officer</option>
                    <option value="doctor">Doctor / University Physician</option>
                  </select>
                </div>
              </div>

              {/* Email & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@student.psu.edu.ph"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Contact Number (SMS) *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="+63 917 123 4567"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Department / College */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Department / College Assignment *
                </label>
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. College of Computing Studies or University Medical Office"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {/* Reason */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Reason for Requesting an Account
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="State the clinical, academic, or administrative justification for this account..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:bg-white focus:ring-2 focus:ring-red-600 focus:outline-none"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit for Verification</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
