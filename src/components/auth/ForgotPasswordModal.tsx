import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  X,
  Lock,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose
}) => {
  const { requestPasswordReset, completePasswordReset, showToast } = useClinic();

  const [step, setStep] = useState<'request' | 'sent' | 'reset'>('request');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!usernameOrEmail.trim()) {
      setFeedback({ message: 'Please enter your registered username or email.', type: 'error' });
      return;
    }

    const res = await requestPasswordReset(usernameOrEmail.trim());
    if (res.success) {
      setResetToken(res.resetToken || '');
      setStep('sent');
      showToast('Password reset link dispatched to registered email!', 'success');
    } else {
      setFeedback({ message: res.message, type: 'error' });
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (newPassword.length < 6) {
      setFeedback({ message: 'Password must be at least 6 characters long.', type: 'error' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setFeedback({ message: 'Passwords do not match.', type: 'error' });
      return;
    }

    const res = await completePasswordReset(resetToken, newPassword);
    if (res.success) {
      showToast('Password reset successfully! You can now log in.', 'success');
      onClose();
    } else {
      setFeedback({ message: res.message, type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#7F1416] via-[#94191c] to-[#7F1416] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
              <KeyRound className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">
                Forgot Password
              </h3>
              <p className="text-xs text-red-200">
                Secure Account Recovery & Verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-red-200 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 text-xs text-slate-700 space-y-4">
          {feedback && (
            <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
              feedback.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
            }`}>
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Enter your registered clinic username or institutional email address. We will verify your account and send a secure verification process to reset your password.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Username or Registered Email *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={usernameOrEmail}
                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                    placeholder="e.g. doctor.manalo or admin.clinic@psu.edu.ph"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 text-slate-900 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Reset Verification</span>
                </button>
              </div>
            </form>
          )}

          {step === 'sent' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-900">
                  Password Reset Verification Dispatched!
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                  A verification receipt and reset link was sent to your registered email address.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-1 text-xs">
                <div className="font-semibold text-slate-800">Verification Link Generated:</div>
                <div className="font-mono text-[11px] text-red-800 break-all bg-white p-2 rounded-lg border border-slate-200">
                  https://psu-clinic.edu.ph/reset-password?token={resetToken}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('reset')}
                  className="flex-1 py-2.5 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Proceed to Create New Password
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {step === 'reset' && (
            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <p className="text-slate-600 leading-relaxed">
                Establish your new secure password below to complete account credential recovery.
              </p>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type your password"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 text-slate-900 text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStep('request')}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Update Password & Finish</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
