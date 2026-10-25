import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { VerificationReceipt } from '../types/clinic';

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send'
];

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'select_account',
  login_hint: 'dominiqueserrano100@gmail.com'
});

let isSigningIn = false;
let activeSignInPromise: Promise<{ user: FirebaseUser; accessToken: string } | null> | null = null;
let cachedAccessToken: string | null = null;
let cachedGoogleEmail: string | null = null;

export const initGmailAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      cachedGoogleEmail = user.email;
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedGoogleEmail = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignInForGmail = async (): Promise<{ user: FirebaseUser; accessToken: string } | null> => {
  if (isSigningIn && activeSignInPromise) {
    return activeSignInPromise;
  }

  isSigningIn = true;
  activeSignInPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        return null;
      }

      cachedAccessToken = credential.accessToken;
      cachedGoogleEmail = result.user.email;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      const code = error?.code || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        code === 'auth/popup-blocked'
      ) {
        return null;
      }
      return null;
    } finally {
      isSigningIn = false;
      activeSignInPromise = null;
    }
  })();

  return activeSignInPromise;
};

export const getGmailAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const getConnectedGmailAddress = (): string | null => {
  return cachedGoogleEmail || auth.currentUser?.email || null;
};

export const disconnectGmail = async () => {
  await auth.signOut();
  cachedAccessToken = null;
  cachedGoogleEmail = null;
};

/**
 * Generates an official formatted HTML email for PSU Medical Clinic account approval
 */
export const buildOfficialApprovalEmailHtml = (receipt: VerificationReceipt): string => {
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

  const verificationCode = receipt.verificationCode || 'PSU-849-201';
  const tempPassword = receipt.temporaryPassword || 'PsuClinic@2026';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>PSU Medical Clinic Account Approval & Credentials</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;color:#1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:28px 12px;">
    <tr>
      <td align="center">
        <table width="620" cellpadding="0" cellspacing="0" style="max-width:620px;width:100%;background-color:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #cbd5e1;box-shadow:0 8px 24px rgba(15,23,42,0.08);">
          
          <!-- Official University Crimson Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#7F1416 0%,#991B1B 100%);padding:24px 28px;color:#ffffff;border-bottom:4px solid #fbbf24;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <div style="font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#fde68a;font-weight:700;">Republic of the Philippines</div>
                    <div style="font-size:18px;font-weight:800;margin-top:2px;letter-spacing:0.3px;">PAMPANGA STATE UNIVERSITY</div>
                    <div style="font-size:12px;color:#fecaca;font-weight:600;margin-top:2px;">University Medical &amp; Dental Clinic · Information System (MCIS)</div>
                  </td>
                  <td align="right" style="vertical-align:top;">
                    <span style="display:inline-block;background-color:#10b981;color:#052e16;font-size:10px;font-weight:800;padding:5px 10px;border-radius:999px;letter-spacing:0.8px;">APPROVED &amp; VERIFIED</span>
                    <div style="font-size:10px;color:#fecaca;margin-top:6px;font-family:monospace;">Ref: ${receipt.referenceNumber}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Salutation & Approval Notice -->
          <tr>
            <td style="padding:28px 28px 16px 28px;">
              <p style="margin:0 0 12px 0;font-size:15px;font-weight:700;color:#0f172a;">Dear ${receipt.recipientName},</p>
              <p style="margin:0 0 16px 0;font-size:13px;line-height:1.6;color:#475569;">
                We are pleased to inform you that your account registration request for the <strong>Pampanga State University Medical Clinic Information System (MCIS)</strong> has been officially reviewed, verified, and <strong>APPROVED</strong> by the Master System Administrator.
              </p>

              <div style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:12px 16px;margin-bottom:20px;">
                <div style="font-size:12px;font-weight:700;color:#065f46;">✓ Official Login Credentials &amp; Verification Code Issued</div>
                <div style="font-size:11px;color:#047857;margin-top:2px;">You may now sign in immediately using your Temporary Password or activate via your 6-digit Verification Code.</div>
              </div>
            </td>
          </tr>

          <!-- Highlighted Verification Code & Temporary Password Box -->
          <tr>
            <td style="padding:0 28px 20px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fffbeb;border:2px dashed #f59e0b;border-radius:14px;padding:18px;">
                <tr>
                  <td width="50%" style="padding-right:10px;border-right:1px solid #fde68a;">
                    <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#92400e;letter-spacing:0.8px;">6-Digit Verification Code</div>
                    <div style="font-size:22px;font-weight:900;font-family:'Courier New',monospace;color:#7F1416;margin-top:4px;letter-spacing:1.5px;">${verificationCode}</div>
                    <div style="font-size:10px;color:#b45309;margin-top:2px;">Enter on Account Activation screen</div>
                  </td>
                  <td width="50%" style="padding-left:14px;">
                    <div style="font-size:10px;font-weight:800;text-transform:uppercase;color:#92400e;letter-spacing:0.8px;">Temporary Password</div>
                    <div style="font-size:19px;font-weight:900;font-family:'Courier New',monospace;color:#0f172a;margin-top:4px;background:#ffffff;padding:3px 8px;border-radius:6px;border:1px solid #fcd34d;display:inline-block;">${tempPassword}</div>
                    <div style="font-size:10px;color:#b45309;margin-top:2px;">Use for direct portal login</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Complete Account Details Table -->
          <tr>
            <td style="padding:0 28px 20px 28px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;font-size:12px;">
                <tr style="background-color:#f8fafc;">
                  <td colspan="2" style="padding:10px 14px;font-weight:800;color:#1e293b;border-bottom:1px solid #e2e8f0;">
                    OFFICIAL ACCOUNT CREDENTIAL RECORD
                  </td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;color:#64748b;border-bottom:1px solid #f1f5f9;width:42%;">Account Holder:</td>
                  <td style="padding:9px 14px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">${receipt.recipientName}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Allocated Username:</td>
                  <td style="padding:9px 14px;font-weight:800;font-family:monospace;color:#7F1416;border-bottom:1px solid #f1f5f9;">@${receipt.username}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Registered Email:</td>
                  <td style="padding:9px 14px;font-family:monospace;color:#1e293b;border-bottom:1px solid #f1f5f9;">${receipt.recipientEmail}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Assigned System Role:</td>
                  <td style="padding:9px 14px;font-weight:700;color:#1d4ed8;border-bottom:1px solid #f1f5f9;">${roleLabel}</td>
                </tr>
                ${receipt.institutionalId ? `
                <tr>
                  <td style="padding:9px 14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Institutional ID:</td>
                  <td style="padding:9px 14px;font-family:monospace;font-weight:700;color:#1e293b;border-bottom:1px solid #f1f5f9;">${receipt.institutionalId}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding:9px 14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Department / Unit:</td>
                  <td style="padding:9px 14px;color:#1e293b;border-bottom:1px solid #f1f5f9;">${receipt.department}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;color:#64748b;border-bottom:1px solid #f1f5f9;">Activation Token:</td>
                  <td style="padding:9px 14px;font-family:monospace;color:#475569;border-bottom:1px solid #f1f5f9;">${receipt.activationToken}</td>
                </tr>
                <tr>
                  <td style="padding:9px 14px;color:#64748b;">Approved &amp; Issued By:</td>
                  <td style="padding:9px 14px;font-weight:600;color:#334155;">${receipt.issuedBy} (${receipt.issuedAt})</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Step-by-Step Instructions -->
          <tr>
            <td style="padding:0 28px 22px 28px;">
              <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px;">
                <div style="font-size:12px;font-weight:800;color:#0f172a;margin-bottom:8px;">HOW TO ACCESS &amp; ACTIVATE YOUR ACCOUNT:</div>
                <ol style="margin:0;padding-left:18px;font-size:12px;color:#475569;line-height:1.7;">
                  <li>Open the <strong>Pampanga State University Medical Clinic Portal</strong>.</li>
                  <li><strong>Option A (Direct Login):</strong> Enter your Username (<code>@${receipt.username}</code>) or Email and your Temporary Password (<code>${tempPassword}</code>).</li>
                  <li><strong>Option B (Code Verification):</strong> Click <strong>"Activate Account"</strong> on the login page, enter your Verification Code (<code>${verificationCode}</code>), and set your permanent personal password.</li>
                </ol>
              </div>
            </td>
          </tr>

          <!-- Security Footer -->
          <tr>
            <td style="background-color:#0f172a;padding:18px 28px;color:#94a3b8;font-size:11px;line-height:1.5;">
              <div style="color:#f8fafc;font-weight:700;margin-bottom:4px;">Pampanga State University — University Health &amp; Medical Services</div>
              <div>Bacolor, Pampanga, Philippines · Compliant with Republic Act No. 10173 (Data Privacy Act of 2012)</div>
              <div style="margin-top:6px;color:#64748b;font-size:10px;">CONFIDENTIALITY NOTICE: This email contains official PSU Medical Clinic login credentials intended solely for ${receipt.recipientEmail}. Do not share your verification code or password.</div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Encodes an RFC 2822 MIME message to base64url format required by Gmail REST API
 */
function encodeMimeMessageBase64Url(to: string, subject: string, htmlBody: string, fromEmail?: string): string {
  const cleanSubject = `=?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const fromHeader = fromEmail
    ? `PSU Medical Clinic <${fromEmail}>`
    : 'PSU Medical Clinic <dominiqueserrano100@gmail.com>';

  const mimeLines = [
    `From: ${fromHeader}`,
    `To: ${to}`,
    `Subject: ${cleanSubject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: 7bit',
    '',
    htmlBody
  ];

  const rawMessage = mimeLines.join('\r\n');
  const utf8Bytes = new TextEncoder().encode(rawMessage);
  let binary = '';
  for (let i = 0; i < utf8Bytes.byteLength; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Sends the formatted approval email via the user's authenticated Gmail account
 */
export const sendApprovalEmailViaGmail = async (
  receipt: VerificationReceipt,
  customRecipientEmail?: string
): Promise<{ success: boolean; messageId?: string; senderEmail?: string; error?: string; needsAuth?: boolean }> => {
  try {
    const recipient = (customRecipientEmail || receipt.recipientEmail).trim();
    const subject = `[PSU-MCIS] Account Approved — Login Credentials & Verification Code (${receipt.referenceNumber})`;
    const htmlBody = buildOfficialApprovalEmailHtml({
      ...receipt,
      recipientEmail: recipient
    });

    // 1. If we already have an active Google OAuth token in memory, send directly via Gmail API
    const token = getGmailAccessToken();
    const senderEmail = getConnectedGmailAddress();

    if (token) {
      const raw = encodeMimeMessageBase64Url(recipient, subject, htmlBody, senderEmail || undefined);

      const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });

      if (response.status === 401 || response.status === 403) {
        cachedAccessToken = null;
        return {
          success: false,
          needsAuth: true,
          error: 'Your Gmail session expired. Please tap "Sign in with Google" first, then send again.'
        };
      }

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          messageId: data.id,
          senderEmail: senderEmail || 'dominiqueserrano100@gmail.com'
        };
      }
    }

    // 2. Try server-side SMTP if GMAIL_SMTP_APP_PASSWORD is set in environment secrets
    try {
      const smtpRes = await fetch('/api/clinic/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: recipient, subject, html: htmlBody })
      });
      if (smtpRes.ok) {
        const smtpData = await smtpRes.json();
        if (smtpData.success) {
          return {
            success: true,
            messageId: smtpData.messageId,
            senderEmail: smtpData.senderEmail || 'dominiqueserrano100@gmail.com'
          };
        }
      }
    } catch {
      // Ignore network/SMTP check failure
    }

    // 3. No active OAuth token and no server SMTP configured: instruct user to click Sign in with Google first
    return {
      success: false,
      needsAuth: true,
      error: 'Please tap "Sign in with Google" at the top of this window first to connect dominiqueserrano100@gmail.com, then tap "Send Real Email Now".'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Unexpected error while sending email via Gmail.'
    };
  }
};
