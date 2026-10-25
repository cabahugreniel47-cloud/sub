import React, { useState, useRef, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { McisLogo, PsuUniversitySeal, ClinClinMascot } from '../common/OfficialLogos';
import { ClinClinAIService } from '../../services/clinClinAIService';
import { RegistrationRequestModal } from './RegistrationRequestModal';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { AccountActivationModal } from './AccountActivationModal';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  UserPlus,
  Shield,
  AlertCircle,
  MessageCircle,
  X,
  Send,
  KeyRound,
  CheckCircle2,
  HelpCircle,
  PhoneCall
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, users } = useClinic();
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Clin Clin Interactive Assistant State on Login Page
  const [clinClinOpen, setClinClinOpen] = useState(false);
  const [clinClinQuery, setClinClinQuery] = useState('');
  const [isClinClinTyping, setIsClinClinTyping] = useState(false);
  const [clinClinChat, setClinClinChat] = useState<Array<{ sender: 'clinclin' | 'user'; text: string }>>([
    {
      sender: 'clinclin',
      text: "Hello! I'm **Clin Clin**, your AI clinic assistant for Pampanga State University Medical Clinic. You can ask me **any questions** about clinic services, health guidelines, appointments, medicines, or medical certificates!"
    }
  ]);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (clinClinOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [clinClinChat, isClinClinTyping, clinClinOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!usernameOrEmail.trim()) {
      setErrorMessage('Please enter your username or registered institutional email.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await login(usernameOrEmail, password);
      setIsSubmitting(false);

      if (!result.success) {
        setErrorMessage(result.error || 'Authentication failed. Please verify credentials or request an authorized account.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Authentication failed. Please check network connection.');
    }
  };

  const handleAskClinClin = async (questionText?: string) => {
    const q = (questionText || clinClinQuery).trim();
    if (!q) return;

    const userMsg = { sender: 'user' as const, text: q };
    setClinClinChat(prev => [...prev, userMsg]);
    setClinClinQuery('');
    setIsClinClinTyping(true);

    try {
      const reply = await ClinClinAIService.chat(
        q,
        'student',
        'Visitor or student asking questions on the PSU Clinic Portal',
        clinClinChat
      );
      setClinClinChat(prev => [...prev, { sender: 'clinclin', text: reply }]);
    } catch {
      setClinClinChat(prev => [
        ...prev,
        {
          sender: 'clinclin',
          text: "I am here to assist you with any questions regarding Pampanga State University Medical Clinic! How can I help?"
        }
      ]);
    } finally {
      setIsClinClinTyping(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden bg-slate-50 font-sans selection:bg-red-200 selection:text-red-900">
      {/* Background Architectural & Clinic Atmosphere Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Clinic Reception Photography */}
        <img
          src="/src/assets/images/clinic_hero_reception_1790494199483.jpg"
          alt="Pampanga State University Medical Clinic"
          className="w-full h-full object-cover object-center opacity-30 filter saturate-75"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/60" />
      </div>

      {/* Top Left Crimson Curved Accent Wave (Matches Mockup) */}
      <div className="absolute -top-10 -left-10 w-96 h-64 pointer-events-none z-10">
        <svg viewBox="0 0 450 300" fill="none" className="w-full h-full text-[#A31D1D]">
          <path
            d="M0 0 H450 C380 90 280 180 160 170 C60 160 20 220 0 280 Z"
            fill="currentColor"
            opacity="0.95"
          />
          <path
            d="M0 0 H360 C300 70 210 140 120 130 C40 120 15 170 0 220 Z"
            fill="#B91C1C"
            opacity="0.7"
          />
        </svg>
      </div>

      {/* Main Grid Content */}
      <div className="relative z-20 flex-1 max-w-7xl w-full mx-auto px-6 py-8 sm:py-12 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-14">
        {/* Left Side: MCIS & University Brand + 5 Core Highlights */}
        <div className="flex-1 max-w-2xl w-full pt-4 lg:pt-0">
          {/* Dual Brand Logos: MCIS Medical Cross + PSU Seal */}
          <div className="flex items-center gap-6 mb-7">
            <McisLogo size={82} showText={true} />
            <div className="h-16 w-px bg-slate-300/80" />
            <div className="flex flex-col items-center">
              <PsuUniversitySeal size={82} className="shadow-xs" />
              <div className="text-center mt-1">
                <span className="block text-[8px] font-bold text-slate-800 tracking-wider uppercase">
                  Pampanga State
                </span>
                <span className="block text-[8px] font-bold text-slate-800 tracking-wider uppercase">
                  University
                </span>
              </div>
            </div>
          </div>

          {/* System Welcome Headline */}
          <div className="space-y-1 mb-5">
            <div className="text-xl sm:text-2xl font-bold text-[#A31D1D] tracking-tight">
              Welcome to the
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#A31D1D] tracking-tight leading-tight">
              Clinic Information System
            </h1>
            <p className="text-base sm:text-lg font-bold text-slate-700 pt-1">
              Pampanga State University Medical Clinic
            </p>
            <p className="text-sm font-semibold text-slate-500 italic">
              Your Health. Our Priority.
            </p>
          </div>
        </div>

        {/* Right Side: Clean Login Card Exactly Matching User Mockup */}
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/80 p-8 sm:p-10 relative z-30">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Log In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Access your account to continue
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username or Email */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameOrEmail}
                  onChange={(e) => setUsernameOrEmail(e.target.value)}
                  placeholder="Username or Email"
                  required
                  className="w-full pl-10 pr-3.5 py-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#A31D1D] focus:border-transparent transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full pl-10 pr-10 py-3 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#A31D1D] focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Log In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#A31D1D] hover:bg-[#8B1818] active:bg-[#721113] text-white text-sm font-bold rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-70 active:scale-98"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Identifying Role & Signing In...</span>
                </>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Forgot Password? Link */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs font-semibold text-[#A31D1D] hover:text-[#721113] hover:underline cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            {/* OR Separator */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-3 bg-white text-slate-400 uppercase tracking-wider font-semibold">
                  OR
                </span>
              </div>
            </div>

            {/* Request Account Button */}
            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-[#A31D1D] text-[#A31D1D] hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Request Account</span>
            </button>

            {/* Account Activation Helper */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setShowActivationModal(true)}
                className="text-[11px] font-medium text-slate-500 hover:text-[#A31D1D] transition-colors cursor-pointer"
              >
                Received activation link? <span className="font-bold underline text-[#A31D1D]">Activate Account</span>
              </button>
            </div>

            {/* Footer Support Note */}
            <div className="pt-2 text-center text-[11px] text-slate-400">
              Need help? Contact the clinic staff or ask Clin Clin AI below.
            </div>
          </form>
        </div>
      </div>

      {/* Floating Clin Clin Mascot & Interactive Speech Bubble on Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40 flex items-end gap-3 select-none">
        {/* Speech Bubble */}
        {!clinClinOpen && (
          <div
            onClick={() => setClinClinOpen(true)}
            className="hidden sm:flex flex-col bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xl text-xs max-w-xs cursor-pointer hover:shadow-2xl transition-all duration-200 relative group animate-bounce-subtle"
          >
            <div className="font-bold text-slate-900 flex items-center justify-between">
              <span>
                Hi! I'm <strong className="text-[#A31D1D]">Clin Clin!</strong>
              </span>
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            </div>
            <div className="text-slate-500 text-[11px] mt-0.5 leading-snug">
              Your AI clinic assistant. How can I help you today?
            </div>
            {/* Speech bubble pointer arrow */}
            <div className="absolute -right-2 bottom-6 w-3 h-3 bg-white border-t border-r border-slate-200 rotate-45" />
          </div>
        )}

        {/* Mascot Avatar Trigger */}
        <div
          onClick={() => setClinClinOpen(true)}
          className="relative cursor-pointer group"
          title="Click to talk with Clin Clin AI"
        >
          <ClinClinMascot size={105} animated={true} />
          {/* Floating red message dot */}
          <span className="absolute -top-1 right-2 w-7 h-7 bg-red-600 rounded-full text-white flex items-center justify-center shadow-md animate-pulse">
            <MessageCircle className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Interactive Clin Clin AI Assistant Modal on Login Screen */}
      {clinClinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-[#A31D1D] to-[#721113] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ClinClinMascot size={46} />
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-1.5">
                    <span>Clin Clin AI Assistant</span>
                    <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-mono">Online</span>
                  </h3>
                  <p className="text-[11px] text-red-200">
                    Pampanga State University Medical Clinic
                  </p>
                </div>
              </div>
              <button
                onClick={() => setClinClinOpen(false)}
                className="text-white/80 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3 text-xs bg-slate-50">
              {clinClinChat.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#A31D1D] text-white rounded-br-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-2xs'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{
                      __html: msg.text
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br/>')
                    }} />
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isClinClinTyping && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="bg-white border border-slate-200 text-slate-500 rounded-2xl rounded-bl-none p-3 shadow-2xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#A31D1D] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#A31D1D] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#A31D1D] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-[11px] font-medium text-slate-500 ml-1">Clin Clin is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Suggested Questions */}
            <div className="p-3 bg-white border-t border-slate-100 flex flex-wrap gap-1.5 text-[11px]">
              {[
                '⏰ Clinic hours & location?',
                '📝 How to request account?',
                '🎓 Are students required to register?',
                '🎫 How does the queue work?',
                '💊 Are medicines free?'
              ].map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAskClinClin(q)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-[#A31D1D] text-slate-700 rounded-full font-medium transition-colors cursor-pointer border border-slate-200"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Chat Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAskClinClin();
              }}
              className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
            >
              <input
                type="text"
                value={clinClinQuery}
                onChange={(e) => setClinClinQuery(e.target.value)}
                placeholder="Ask Clin Clin anything about the clinic..."
                className="flex-1 px-3.5 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#A31D1D] focus:bg-white"
              />
              <button
                type="submit"
                disabled={!clinClinQuery.trim()}
                className="p-2 bg-[#A31D1D] hover:bg-[#8B1818] text-white rounded-xl cursor-pointer disabled:opacity-40 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Crimson Wave & Security Badge (Matches Mockup) */}
      <div className="relative z-10 w-full">
        {/* Curving Bottom Wave */}
        <div className="w-full h-24 sm:h-28 overflow-hidden pointer-events-none">
          <svg viewBox="0 0 1440 180" fill="none" className="w-full h-full text-[#A31D1D] preserve-3d">
            <path
              d="M0 120 C320 40 720 180 1440 60 V180 H0 Z"
              fill="currentColor"
            />
            <path
              d="M0 140 C400 80 800 170 1440 90 V180 H0 Z"
              fill="#721113"
              opacity="0.8"
            />
          </svg>
        </div>

        {/* University Security Bar in Crimson Red */}
        <footer className="w-full bg-[#721113] text-white px-6 py-3 text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left: Shield & Security Motto (Matches Mockup exactly) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-white" />
              <span className="font-semibold text-white">Secure</span>
            </div>
            <span className="text-red-300">|</span>
            <span className="font-semibold text-white">Reliable</span>
            <span className="text-red-300">|</span>
            <span className="font-semibold text-white">Efficient</span>
          </div>

          {/* Center/Right: Legal & University Accreditation */}
          <div className="flex items-center gap-2 text-red-200 text-[11px]">
            <span>Republic Act No. 10173 (Data Privacy Act of 2012)</span>
            <span>·</span>
            <span className="text-white font-medium">Pampanga State University</span>
          </div>
        </footer>
      </div>

      {/* Registration Request Modal */}
      <RegistrationRequestModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
      />

      {/* Account Activation Modal */}
      <AccountActivationModal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        onActivatedSuccess={(targetUser) => {
          setUsernameOrEmail(targetUser);
          setPassword('');
          setErrorMessage(null);
        }}
      />
    </div>
  );
};
