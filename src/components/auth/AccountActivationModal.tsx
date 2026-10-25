import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { PsuUniversitySeal, McisLogo } from '../common/OfficialLogos';
import {
  X,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  UserCheck,
  Lock
} from 'lucide-react';

interface AccountActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
  onActivatedSuccess?: (usernameOrEmail: string) => void;
}

export const AccountActivationModal: React.FC<AccountActivationModalProps> = ({
  isOpen,
  onClose,
  initialToken = '',
  onActivatedSuccess
}) => {
  const {
    users,
    registrationRequests,
    activateAccountWithToken,
    showToast
  } = useClinic();

  const [tokenInput, setTokenInput] = useState(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activatedUsername, setActivatedUsername] = useState('');

  // Synchronize when initialToken changes
  useEffect(() => {
    if (initialToken) {
      setTokenInput(initialToken);
    }
  }, [initialToken]);

  if (!isOpen) return null;

  // Find linked user or request by activationToken OR 6-digit verificationCode
  const cleanToken = tokenInput.trim();
  const cleanUpper = cleanToken.toUpperCase();
  const linkedRequest = registrationRequests.find(
    r => r.activationToken === cleanToken || (r.verificationCode && r.verificationCode.toUpperCase() === cleanUpper)
  );
  const linkedUser = users.find(
    u =>
      u.activationToken === cleanToken ||
      (u.verificationCode && u.verificationCode.toUpperCase() === cleanUpper) ||
      (linkedRequest && u.email.toLowerCase() === linkedRequest.email.toLowerCase())
  );

  const targetName = linkedUser?.fullName || linkedRequest?.fullName || 'Authorized Personnel';
  const targetEmail = linkedUser?.email || linkedRequest?.email || '';
  const targetRole = linkedUser?.role || linkedRequest?.requestedRole || 'doctor';
  const targetUsername = linkedUser?.username || (targetEmail.split('@')[0] || 'username');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!cleanToken) {
      setErrorMessage('Please enter a valid account activation token or link.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your entries.');
      return;
    }

    const result = await activateAccountWithToken(cleanToken, newPassword);
    if (result.success) {
      setIsSuccess(true);
      setActivatedUsername(targetUsername);
      showToast('Account successfully activated! You can now log in.', 'success');
    } else {
      setErrorMessage(result.message || 'Activation failed. Please contact the Clinic Administrator.');
    }
  };

  const handleFinishAndLogin = () => {
    onClose();
    if (onActivatedSuccess) {
      onActivatedSuccess(targetUsername || targetEmail);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#7F1416] via-[#94191c] to-[#7F1416] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 p-1 bg-white/10 border border-white/20 rounded-2xl shadow-inner shrink-0">
              <McisLogo size={28} showText={false} />
              <PsuUniversitySeal size={28} className="shadow-xs" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Account Activation</h3>
              <p className="text-xs text-red-200">Create Password & Complete Registration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-red-200 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-xs text-slate-700 space-y-4">
          {isSuccess ? (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  Account Activated Successfully!
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your confidential password has been established and your account is now fully active.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Authorized User:</span>
                  <span className="font-bold text-slate-900">{targetName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">System Role:</span>
                  <span className="font-bold uppercase text-red-700">{targetRole}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-500">Username:</span>
                  <span className="font-mono font-bold text-slate-800">@{activatedUsername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold text-emerald-700">ACTIVE</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleFinishAndLogin}
                className="w-full py-3 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98"
              >
                <span>Proceed to Log In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] text-slate-600 leading-relaxed">
                🔐 <strong>Secure Account Setup:</strong> In compliance with clinic security policies (RA 10173), establish your confidential password below to activate your account.
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Activation Token / Verification Code Input */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  6-Digit Verification Code or Activation Token *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="e.g. PSU-849-201 or act_k9x7b2m4"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 text-slate-900 font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Account Match Preview if token matches */}
              {(linkedUser || linkedRequest) && (
                <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Verified Account: {targetName}</span>
                  </div>
                  <div className="text-[11px] text-emerald-800">
                    Role: <strong className="uppercase">{targetRole}</strong> · Email: <span className="font-mono">{targetEmail}</span>
                  </div>
                </div>
              )}

              {/* Password Fields */}
              <div className="space-y-3 pt-1">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Create New Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 text-slate-900 text-xs focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your password"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-red-600 text-slate-900 text-xs focus:outline-none"
                    />
                  </div>
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
                  className="px-5 py-2.5 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-98"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Activate & Set Password</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
