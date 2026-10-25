import React, { useState, useEffect } from 'react';
import { VerificationReceipt } from '../../types/clinic';
import { MedicalClinicLogo, OfficialDocumentHeader, DocumentSecurityStamp } from '../common/OfficialLogos';
import {
  initGmailAuth,
  googleSignInForGmail,
  getGmailAccessToken,
  getConnectedGmailAddress,
  sendApprovalEmailViaGmail
} from '../../services/gmailService';
import {
  X,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Printer,
  ExternalLink,
  KeyRound,
  Check,
  Send,
  AlertCircle,
  Loader2,
  Lock,
  Hash
} from 'lucide-react';

interface VerificationEmailReceiptModalProps {
  receipt: VerificationReceipt | null;
  onClose: () => void;
  onOpenActivation?: (token: string) => void;
}

export const VerificationEmailReceiptModal: React.FC<VerificationEmailReceiptModalProps> = ({
  receipt,
  onClose,
  onOpenActivation
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [recipientEmailInput, setRecipientEmailInput] = useState('');
  const [connectedGmail, setConnectedGmail] = useState<string | null>(getConnectedGmailAddress());
  const [hasToken, setHasToken] = useState<boolean>(Boolean(getGmailAccessToken()));
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Confirmation modal before sending real email (Mandatory Workspace confirmation rule)
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSentResult, setEmailSentResult] = useState<{
    success: boolean;
    message: string;
    sender?: string;
    recipient?: string;
  } | null>(null);

  useEffect(() => {
    if (receipt) {
      setRecipientEmailInput(receipt.recipientEmail || 'dominiqueserrano100@gmail.com');
      setEmailSentResult(null);
    }
  }, [receipt]);

  useEffect(() => {
    const unsubscribe = initGmailAuth(
      (user) => {
        setConnectedGmail(user.email || 'dominiqueserrano100@gmail.com');
        setHasToken(true);
      },
      () => {
        setConnectedGmail(getConnectedGmailAddress());
        setHasToken(Boolean(getGmailAccessToken()));
      }
    );
    return () => unsubscribe();
  }, []);

  if (!receipt) return null;

  const verificationCode = receipt.verificationCode || 'PSU-849-201';
  const temporaryPassword = receipt.temporaryPassword || 'PsuClinic@2026';

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2200);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoogleConnect = async () => {
    setIsSigningIn(true);
    setEmailSentResult(null);
    try {
      const res = await googleSignInForGmail();
      if (res) {
        setConnectedGmail(res.user.email || 'dominiqueserrano100@gmail.com');
        setHasToken(true);
        setEmailSentResult({
          success: true,
          message: `Connected as ${res.user.email || 'dominiqueserrano100@gmail.com'}. You can now tap "Send Real Email Now"!`
        });
      } else {
        setEmailSentResult({
          success: false,
          message: 'Google Sign-In window was closed or blocked by the browser. Please allow popups and select dominiqueserrano100@gmail.com.'
        });
      }
    } catch (err: any) {
      setEmailSentResult({
        success: false,
        message: err?.message || 'Google Sign-In could not complete.'
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleConfirmAndSendEmail = async () => {
    setShowSendConfirm(false);
    setIsSendingEmail(true);
    setEmailSentResult(null);

    try {
      const targetRecipient = recipientEmailInput.trim() || receipt.recipientEmail;
      const result = await sendApprovalEmailViaGmail(receipt, targetRecipient);

      if (result.success) {
        setConnectedGmail(result.senderEmail || connectedGmail || 'dominiqueserrano100@gmail.com');
        setHasToken(true);
        setEmailSentResult({
          success: true,
          message: `Official formatted approval email with Verification Code (${verificationCode}) & Temporary Password (${temporaryPassword}) was sent to ${targetRecipient}!`,
          sender: result.senderEmail || 'dominiqueserrano100@gmail.com',
          recipient: targetRecipient
        });
      } else {
        setEmailSentResult({
          success: false,
          message: result.error || 'Could not send email via Gmail. Please check your Google authorization.'
        });
      }
    } catch (err: any) {
      setEmailSentResult({
        success: false,
        message: err?.message || 'Unexpected error while dispatching email.'
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const roleLabel =
    receipt.assignedRole === 'administrator'
      ? 'Master System Administrator'
      : receipt.assignedRole === 'doctor'
      ? 'University Physician (Doctor)'
      : receipt.assignedRole === 'nurse'
      ? 'Registered Clinic Nurse'
      : receipt.assignedRole === 'staff'
      ? 'Clinic Administrative Staff'
      : 'Student / Patient';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] relative">
        {/* Modal Window Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <span>Official Account Approval & Credential Email Dispatch</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500 text-slate-950 font-bold">
                  APPROVED
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Includes 6-Digit Verification Code, Temporary Password, and Gmail Delivery
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real Gmail Sender Control Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-[#7F1416] to-slate-900 px-5 py-3.5 text-white border-b border-red-900/40 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5" />
                <span>Real Gmail Dispatch Integration</span>
              </div>
              <p className="text-[11px] text-red-100">
                {hasToken && connectedGmail ? (
                  <>Connected Sender: <span className="font-mono font-bold text-white">{connectedGmail}</span></>
                ) : (
                  <>
                    Sign in with <span className="font-mono text-amber-200">dominiqueserrano100@gmail.com</span> to send this formatted email.
                  </>
                )}
              </p>
            </div>

            {!hasToken ? (
              <button
                type="button"
                onClick={handleGoogleConnect}
                disabled={isSigningIn}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer shrink-0 transition-all"
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 block">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
                <span>{isSigningIn ? 'Connecting Gmail...' : 'Sign in with Google'}</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Gmail Authorized</span>
                </span>
                <button
                  type="button"
                  onClick={handleGoogleConnect}
                  className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-semibold cursor-pointer transition-colors"
                >
                  Switch Account
                </button>
              </div>
            )}
          </div>

          {/* Recipient Email Bar & Send Trigger */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-white/10">
            <div className="flex-1 flex items-center bg-black/30 border border-white/20 rounded-xl px-3 py-1.5">
              <span className="text-[11px] text-amber-300 font-bold mr-2 shrink-0">Send To:</span>
              <input
                type="email"
                value={recipientEmailInput}
                onChange={(e) => setRecipientEmailInput(e.target.value)}
                placeholder="Enter recipient email address"
                className="bg-transparent text-white font-mono text-xs w-full focus:outline-none"
              />
              {recipientEmailInput !== 'dominiqueserrano100@gmail.com' && (
                <button
                  type="button"
                  onClick={() => setRecipientEmailInput('dominiqueserrano100@gmail.com')}
                  className="text-[10px] text-amber-300 hover:text-amber-200 underline ml-2 shrink-0 cursor-pointer"
                >
                  Use my email
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowSendConfirm(true)}
              disabled={isSendingEmail || !recipientEmailInput.trim()}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-all shrink-0"
            >
              {isSendingEmail ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sending via Gmail...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Real Email Now</span>
                </>
              )}
            </button>
          </div>

          {/* Status Feedback Banner */}
          {emailSentResult && (
            <div
              className={`p-2.5 rounded-xl text-xs flex items-start gap-2 ${
                emailSentResult.success
                  ? 'bg-emerald-950/90 border border-emerald-400/50 text-emerald-200'
                  : 'bg-red-950/90 border border-red-400/50 text-red-200'
              }`}
            >
              {emailSentResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-bold">{emailSentResult.success ? 'Email Dispatched via Gmail!' : 'Delivery Notice'}</div>
                <div className="text-[11px] opacity-90">{emailSentResult.message}</div>
              </div>
            </div>
          )}
        </div>

        {/* Email Preview Canvas */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1 text-slate-800 bg-slate-50 space-y-5">
          {/* Email Envelope Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500 border-b border-slate-100 pb-2">
              <div>
                <span className="font-semibold text-slate-700">From: </span>
                <span className="font-mono text-slate-600">
                  PSU Medical Clinic &lt;{connectedGmail || 'dominiqueserrano100@gmail.com'}&gt;
                </span>
              </div>
              <div className="font-mono text-slate-400">{receipt.issuedAt}</div>
            </div>

            <div className="text-[11px] text-slate-500 border-b border-slate-100 pb-2">
              <span className="font-semibold text-slate-700">To: </span>
              <span className="font-medium text-slate-900">{receipt.recipientName}</span>{' '}
              <span className="font-mono text-slate-600">&lt;{recipientEmailInput || receipt.recipientEmail}&gt;</span>
            </div>

            <div className="text-xs font-bold text-slate-900 pt-0.5">
              Subject: [PSU-MCIS] Account Approved — Official Login Credentials &amp; Verification Code ({receipt.referenceNumber})
            </div>
          </div>

          {/* Official Formatted University Email Body */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8 space-y-6 relative overflow-hidden">
            {/* Watermark */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.035] select-none z-0">
              <MedicalClinicLogo size={320} />
            </div>

            <div className="relative z-10 space-y-6">
              {/* Official Header */}
              <OfficialDocumentHeader
                includeLogos={true}
                documentTitle="Official Account Approval & Login Credential Notice"
                documentSubtitle="Authorized Clinic Account Verification Code & Temporary Password"
                controlNumber={receipt.referenceNumber || 'REG-RCPT-2026-001'}
              />

              {/* Salutation */}
              <div className="space-y-3">
                <div className="text-sm font-bold text-slate-900">
                  Dear {receipt.recipientName},
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  We are pleased to inform you that your account request for the{' '}
                  <strong>Pampanga State University Medical Clinic Information System (MCIS)</strong> has been verified and{' '}
                  <strong>APPROVED</strong> by the Master System Administrator.
                </p>
              </div>

              {/* Highlighted Credentials Card: Verification Code + Temporary Password */}
              <div className="p-4 sm:p-5 bg-amber-50/90 border-2 border-dashed border-amber-400 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:border-r sm:border-amber-200 sm:pr-4">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-[#7F1416]" />
                    <span>6-Digit Verification Code</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-mono text-xl font-black text-[#7F1416] tracking-wider">
                      {verificationCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(verificationCode, 'code')}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'code' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'code' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    Use on the Account Activation screen to verify your account.
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5 text-[#7F1416]" />
                    <span>Temporary Login Password</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="font-mono text-lg font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-amber-300">
                      {temporaryPassword}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(temporaryPassword, 'pass')}
                      className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'pass' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedField === 'pass' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-800">
                    Use with your username/email to log in immediately.
                  </p>
                </div>
              </div>

              {/* Account Details Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-slate-100 px-4 py-2.5 font-bold text-xs text-slate-800 flex items-center justify-between border-b border-slate-200">
                  <span>Official Account Credential Summary</span>
                  <span className="font-mono text-[10px] text-slate-500">Ref: {receipt.referenceNumber}</span>
                </div>

                <div className="p-4 space-y-2 text-xs divide-y divide-slate-100">
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Account Holder Name:</span>
                    <span className="font-bold text-slate-900">{receipt.recipientName}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Allocated Username:</span>
                    <span className="font-mono font-bold text-[#7F1416]">@{receipt.username}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Temporary Password:</span>
                    <span className="font-mono font-bold text-slate-900">{temporaryPassword}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Verification Code:</span>
                    <span className="font-mono font-bold text-emerald-800">{verificationCode}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Assigned Authority Role:</span>
                    <span className="font-bold uppercase text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {roleLabel}
                    </span>
                  </div>
                  {receipt.institutionalId && (
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Institutional ID Number:</span>
                      <span className="font-mono font-semibold text-slate-800">{receipt.institutionalId}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Department / Unit:</span>
                    <span className="font-medium text-slate-800">{receipt.department}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Activation Token:</span>
                    <span className="font-mono text-slate-600">{receipt.activationToken}</span>
                  </div>
                </div>
              </div>

              {/* Instructions Box */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#7F1416]" />
                  <span>How to Sign In or Activate Your Account:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                  <li>
                    <strong>Direct Login:</strong> Sign in on the PSU Medical Clinic Login Page using{' '}
                    <code className="font-mono font-bold text-slate-800">@{receipt.username}</code> and temporary password{' '}
                    <code className="font-mono font-bold text-slate-800">{temporaryPassword}</code>.
                  </li>
                  <li>
                    <strong>Code Verification &amp; Custom Password:</strong> Click the button below (or &ldquo;Activate Account&rdquo; on the login screen), enter Verification Code{' '}
                    <code className="font-mono font-bold text-[#7F1416]">{verificationCode}</code>, and create your personal password.
                  </li>
                </ol>

                {onOpenActivation && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => onOpenActivation(verificationCode)}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer inline-flex items-center justify-center gap-2"
                    >
                      <KeyRound className="w-4 h-4 text-amber-300" />
                      <span>Verify Code &amp; Set Custom Password Now</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Official Security Stamp */}
              <DocumentSecurityStamp
                serialCode={receipt.referenceNumber}
                issuedBy={receipt.issuedBy || 'Master System Administrator'}
                role="Clinic Systems Security & Records Officer"
                timestamp={receipt.issuedAt}
                compact={true}
              />
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() =>
                handleCopyText(
                  `PSU Medical Clinic Credentials\nUsername: @${receipt.username}\nTemporary Password: ${temporaryPassword}\nVerification Code: ${verificationCode}\nActivation Token: ${receipt.activationToken}`,
                  'all'
                )
              }
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
            >
              {copiedField === 'all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Credentials Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy All Credentials</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span>Print Format</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold cursor-pointer transition-colors"
            >
              Close
            </button>

            {onOpenActivation && (
              <button
                onClick={() => onOpenActivation(verificationCode)}
                className="px-4 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
              >
                <span>Open Activation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Explicit User Confirmation Dialog Before Sending Email via Gmail API */}
        {showSendConfirm && (
          <div className="absolute inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-[#7F1416] flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Confirm Gmail Dispatch</h4>
                  <p className="text-xs text-slate-500">Send official account credentials on your behalf</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5 text-slate-700">
                <div>
                  <span className="text-slate-500">From Gmail Account:</span>{' '}
                  <strong className="font-mono text-slate-900">{connectedGmail || 'dominiqueserrano100@gmail.com'}</strong>
                </div>
                <div>
                  <span className="text-slate-500">To Recipient:</span>{' '}
                  <strong className="font-mono text-[#7F1416]">{recipientEmailInput}</strong>
                </div>
                <div>
                  <span className="text-slate-500">Included Credentials:</span>{' '}
                  <span className="font-mono font-bold">Code: {verificationCode}</span> ·{' '}
                  <span className="font-mono font-bold">Pass: {temporaryPassword}</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed">
                Are you sure you want to send this formatted approval email via Gmail to{' '}
                <strong>{recipientEmailInput}</strong>?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSendConfirm(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAndSendEmail}
                  className="px-4 py-2 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Send Email</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
