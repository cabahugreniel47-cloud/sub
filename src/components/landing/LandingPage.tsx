import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';
import { PsuUniversitySeal, MedicalClinicLogo, McisLogo } from '../common/OfficialLogos';
import { RegistrationRequestModal } from '../auth/RegistrationRequestModal';
import { ForgotPasswordModal } from '../auth/ForgotPasswordModal';
import {
  Heart,
  HeartPulse,
  Activity,
  User,
  FileText,
  Calendar,
  Pill,
  BarChart3,
  Bell,
  Shield,
  CheckCircle2,
  Clock,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Play,
  X,
  Menu,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  Sparkles,
  Users,
  Stethoscope,
  Building,
  Check,
  Tv,
  FileCheck,
  UserPlus
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { login, users, showToast } = useClinic();

  // Navigation & Scroll State
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modal States
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [learnMoreModalOpen, setLearnMoreModalOpen] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Login Form State inside modal
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('Clinic@2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Interactive "How It Works" active tab
  const [activeStep, setActiveStep] = useState(1);

  // Contact form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Detect scroll for sticky navbar blur and scroll spy
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Section scroll spy
      const sections = ['home', 'features', 'about', 'how-it-works', 'contact'];
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 120 && rect.bottom >= 120) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsSubmitting(true);

    try {
      const res = await login(username.trim(), password);
      setIsSubmitting(false);
      if (!res.success) {
        setLoginError(res.error || 'Invalid credentials or account not verified. Please check and try again.');
      } else {
        setLoginModalOpen(false);
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setLoginError(err.message || 'Authentication error. Please check connection.');
    }
  };

  const handleQuickCredentialSelect = (usernameVal: string) => {
    setUsername(usernameVal);
    setPassword('12345678');
    setLoginError(null);
  };

  const handleDirectDemoLogin = async (usernameVal: string) => {
    await login(usernameVal, '12345678');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContactSubmitted(true);
    showToast('Your message has been sent to the Clinic Information Desk!', 'success');
    setTimeout(() => {
      setContactName('');
      setContactEmail('');
      setContactMessage('');
      setContactSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-[#7F1416] selection:text-white">
      {/* ========================================================================= */}
      {/* 1. TOP NAVBAR (Matching Reference Image) */}
      {/* ========================================================================= */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-xs border-b border-red-100/60 py-3'
            : 'bg-white/90 backdrop-blur-xs py-4 border-b border-slate-100'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2.5 cursor-pointer group select-none"
          >
            <div className="flex items-center gap-1.5 shrink-0">
              <McisLogo size={36} showText={false} className="group-hover:scale-105 transition-transform" />
              <PsuUniversitySeal size={36} className="group-hover:scale-105 transition-transform shadow-2xs" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-900 tracking-tight text-base sm:text-lg leading-tight">
                Clinic Information System
              </span>
              <span className="text-[10px] text-slate-500 font-medium hidden sm:block">
                Pampanga State University Medical Services
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold">
            {[
              { id: 'home', label: 'Home' },
              { id: 'about', label: 'About' },
              { id: 'features', label: 'Features' },
              { id: 'how-it-works', label: 'How It Works' },
              { id: 'contact', label: 'Contact' }
            ].map(link => {
              const isActive = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  className={`relative py-1 transition-colors cursor-pointer select-none ${
                    isActive ? 'text-[#7F1416] font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {link.label}
                  {/* Red bottom underline indicator like in the screenshot */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7F1416] rounded-full animate-in fade-in" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Login button: Outline rounded pill with user icon */}
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-5 py-2 rounded-full border-2 border-[#CE1126] text-[#CE1126] hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs"
            >
              <User className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Login</span>
            </button>

            {/* Get Started button: Filled deep red rounded pill with arrow */}
            <button
              onClick={() => setLoginModalOpen(true)}
              className="px-5 py-2 rounded-full bg-[#7F1416] hover:bg-[#680F11] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer active:scale-95 group"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-700 hover:text-[#7F1416] rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-slate-200 px-6 py-4 space-y-3 animate-in slide-in-from-top-2 duration-150 shadow-lg">
            <div className="flex flex-col space-y-2.5 text-sm font-semibold">
              <button
                onClick={() => scrollToSection('home')}
                className={`text-left py-2 border-b border-slate-100 ${
                  activeSection === 'home' ? 'text-[#7F1416] font-bold' : 'text-slate-700'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => scrollToSection('about')}
                className={`text-left py-2 border-b border-slate-100 ${
                  activeSection === 'about' ? 'text-[#7F1416] font-bold' : 'text-slate-700'
                }`}
              >
                About
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className={`text-left py-2 border-b border-slate-100 ${
                  activeSection === 'features' ? 'text-[#7F1416] font-bold' : 'text-slate-700'
                }`}
              >
                Features
              </button>
              <button
                onClick={() => scrollToSection('how-it-works')}
                className={`text-left py-2 border-b border-slate-100 ${
                  activeSection === 'how-it-works' ? 'text-[#7F1416] font-bold' : 'text-slate-700'
                }`}
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('contact')}
                className={`text-left py-2 ${
                  activeSection === 'contact' ? 'text-[#7F1416] font-bold' : 'text-slate-700'
                }`}
              >
                Contact
              </button>
            </div>

            <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full py-2.5 rounded-full border-2 border-[#CE1126] text-[#CE1126] text-xs font-bold flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full py-2.5 rounded-full bg-[#7F1416] text-white text-xs font-bold flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ========================================================================= */}
      {/* 2. HERO SECTION (Exact Reference Replication) */}
      {/* ========================================================================= */}
      <section
        id="home"
        className="pt-24 sm:pt-28 pb-16 lg:pb-24 overflow-hidden relative bg-gradient-to-b from-red-50/30 via-white to-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: Headline & Value Proposition */}
            <div className="lg:col-span-6 space-y-6 z-10 text-center lg:text-left">
              {/* Badge: Red Heartbeat + Pampanga State University Medical Clinic */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-200/80 shadow-2xs">
                <div className="w-5 h-5 rounded-full bg-[#CE1126] flex items-center justify-center text-white">
                  <HeartPulse className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold text-[#7F1416] tracking-tight">
                  Pampanga State University Medical Clinic
                </span>
              </div>

              {/* Main Headline (Two lines: "Your Health," & "Our Priority") */}
              <div className="space-y-1">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.08]">
                  Your Health,
                </h1>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#7F1416] tracking-tight leading-[1.08]">
                  Our Priority
                </h1>
              </div>

              {/* Subtitle Description */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl mx-auto lg:mx-0">
                The Clinic Information System is a digital solution designed to streamline clinic operations, manage patient records, and provide quality healthcare services for the Pampanga State University community.
              </p>

              {/* Call-to-Action Buttons */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-2">
                {/* Get Started -> */}
                <button
                  onClick={() => setLoginModalOpen(true)}
                  className="px-7 py-3.5 rounded-full bg-[#7F1416] hover:bg-[#680F11] text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-md hover:shadow-lg cursor-pointer active:scale-95 group"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* Watch Overview */}
                <button
                  onClick={() => setVideoModalOpen(true)}
                  className="px-6 py-3.5 rounded-full bg-white hover:bg-red-50 text-[#7F1416] border-2 border-red-200 hover:border-red-300 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer active:scale-95 shadow-2xs group"
                >
                  <div className="w-5 h-5 rounded-full bg-[#7F1416] text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </div>
                  <span>Watch Overview</span>
                </button>
              </div>

              {/* Quick Persona Pills for instant preview */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center lg:justify-start gap-2 text-xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Quick Access Portal:
                </span>
                <button
                  onClick={() => handleDirectDemoLogin('administrator')}
                  className="px-2.5 py-1 bg-red-950 text-red-200 hover:bg-black rounded-full font-bold text-[11px] transition-colors cursor-pointer"
                >
                  👑 Admin
                </button>
                <button
                  onClick={() => handleDirectDemoLogin('doctor')}
                  className="px-2.5 py-1 bg-blue-100 text-blue-900 hover:bg-blue-200 rounded-full font-bold text-[11px] transition-colors cursor-pointer"
                >
                  🩺 Doctor
                </button>
                <button
                  onClick={() => handleDirectDemoLogin('nurse')}
                  className="px-2.5 py-1 bg-emerald-100 text-emerald-900 hover:bg-emerald-200 rounded-full font-bold text-[11px] transition-colors cursor-pointer"
                >
                  💉 Nurse
                </button>
                <button
                  onClick={() => handleDirectDemoLogin('staff')}
                  className="px-2.5 py-1 bg-amber-100 text-amber-900 hover:bg-amber-200 rounded-full font-bold text-[11px] transition-colors cursor-pointer"
                >
                  📋 Staff
                </button>
                <button
                  onClick={() => handleDirectDemoLogin('student')}
                  className="px-2.5 py-1 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-full font-bold text-[11px] transition-colors cursor-pointer"
                >
                  🎓 Student
                </button>
              </div>
            </div>

            {/* Right Column: Hero Visual with Stethoscope on Clipboard & Curved Crimson Graphics */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Curved crimson swoosh background shape */}
                <div className="absolute -inset-2 bg-gradient-to-tr from-[#7F1416] via-[#B91C1C] to-red-800 rounded-3xl sm:rounded-[2.5rem] transform rotate-1 opacity-90 blur-xs" />

                {/* Stethoscope & Clinic Photo Container */}
                <div className="relative rounded-3xl sm:rounded-[2.2rem] overflow-hidden shadow-2xl border-4 border-white bg-white group">
                  <img
                    src="/src/assets/images/clinic_hero_reception_1790494199483.jpg"
                    alt="PSU Medical Clinic with Stethoscope on Clipboard"
                    className="w-full h-[320px] sm:h-[400px] object-cover group-hover:scale-102 transition-transform duration-700"
                  />

                  {/* Gradient Curve Overlay on Right Side (Matching reference artwork) */}
                  <div className="absolute inset-y-0 right-0 w-2/5 bg-gradient-to-l from-[#7F1416] via-[#7F1416]/90 to-transparent flex flex-col justify-center items-end pr-6 sm:pr-8 text-right text-white">
                    <div className="space-y-1">
                      <div className="text-xs sm:text-sm font-bold tracking-tight text-red-100 drop-shadow-xs">
                        Efficient Systems.
                      </div>
                      <div className="text-sm sm:text-base font-black tracking-tight text-white drop-shadow-sm">
                        Better Care.
                      </div>

                      {/* Glowing ECG / Pulse line SVG */}
                      <div className="w-24 sm:w-28 h-6 flex items-center justify-end pt-1">
                        <svg viewBox="0 0 100 24" className="w-full h-full text-white fill-none stroke-current stroke-2">
                          <path
                            d="M0 12 L30 12 L38 2 L46 22 L54 6 L62 16 L70 12 L100 12"
                            className="animate-ecg"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Floating Live Badge */}
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md flex items-center gap-2 border border-slate-200/80 animate-float">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-slate-800">
                      Live Triage & Clinic EMR Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FLOATING 6 FEATURE CARDS STRIP (Matching Reference Image) */}
        {/* ========================================================================= */}
        <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 lg:mt-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              {
                icon: User,
                title: 'Patient Registration',
                desc: 'Easily register and manage patient information.'
              },
              {
                icon: FileText,
                title: 'Electronic Medical Records',
                desc: 'Access complete and secure medical history.'
              },
              {
                icon: Calendar,
                title: 'Queue & Appointment',
                desc: 'Set appointments and monitor queue in real-time.'
              },
              {
                icon: Pill,
                title: 'Inventory Management',
                desc: 'Track medicine and supplies with ease.'
              },
              {
                icon: BarChart3,
                title: 'Reports & Analytics',
                desc: 'Generate reports for better decision-making.'
              },
              {
                icon: Bell,
                title: 'Notifications',
                desc: 'Stay updated with important clinic alerts and reminders.'
              }
            ].map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  onClick={() => setLoginModalOpen(true)}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-red-300 transition-all duration-300 text-center flex flex-col items-center justify-between group cursor-pointer hover:-translate-y-1"
                >
                  <div className="w-12 h-12 rounded-full bg-red-50 text-[#CE1126] border border-red-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-[#7F1416] group-hover:text-white transition-all shadow-2xs">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#7F1416] transition-colors leading-snug mb-1">
                    {feat.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. "ABOUT US" SECTION (Exact Reference Replication) */}
      {/* ========================================================================= */}
      <section id="about" className="py-16 sm:py-24 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Clinic Exterior Building Image with Curved Red Accent */}
            <div className="lg:col-span-6 relative">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Curved crimson accent underneath */}
                <div className="absolute -bottom-3 -left-3 sm:-bottom-4 sm:-left-4 w-48 sm:w-64 h-36 sm:h-48 bg-gradient-to-tr from-[#7F1416] to-red-700 rounded-3xl -z-0 transform -rotate-3" />

                {/* Building Image Container */}
                <div className="relative z-10 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-white group">
                  <img
                    src="/src/assets/images/psu_medical_and_dental_clinic_real.jpg"
                    alt="Pampanga State University Medical and Dental Clinic Building Facade"
                    className="w-full h-[300px] sm:h-[380px] object-cover object-center group-hover:scale-103 transition-transform duration-700"
                  />
                  <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-[#7F1416]" />
                        <span>Medical and Dental Clinic Building</span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Bacolor Main Campus · Cabambangan, Bacolor, 2001 Pampanga
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active Facility
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Narrative, "Learn More" Button & 3 Highlight Stat Cards */}
            <div className="lg:col-span-6 space-y-6">
              {/* Tag: — About Us */}
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#7F1416]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#7F1416]">
                  About Us
                </span>
              </div>

              {/* Title */}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Pampanga State University Medical and Dental Clinic
              </h2>

              {/* Paragraph from screenshot */}
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                The Clinic Information System is created to support the Pampanga State University Medical and Dental Clinic in delivering accessible, efficient, and quality healthcare and dental services to students, faculty, staff, and the community.
              </p>

              {/* Learn More Button */}
              <div>
                <button
                  onClick={() => setLearnMoreModalOpen(true)}
                  className="px-6 py-2.5 rounded-full border-2 border-slate-300 hover:border-[#7F1416] text-slate-800 hover:text-[#7F1416] text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer active:scale-95 group shadow-2xs"
                >
                  <span>Learn More</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* 3 Highlight Cards (Stacked on the right as in the screenshot) */}
              <div className="pt-2 space-y-3.5">
                {/* Item 1: 1,000+ Registered Patients */}
                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 hover:bg-red-50/50 border border-slate-200/80 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-[#CE1126] flex items-center justify-center shrink-0 shadow-2xs">
                    <Users className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <div className="text-base sm:text-lg font-black text-[#7F1416] font-mono leading-tight">
                      1,000+
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      Registered Patients
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Students, faculty, administrative staff & dependents
                    </div>
                  </div>
                </div>

                {/* Item 2: Daily Consultations */}
                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 hover:bg-red-50/50 border border-slate-200/80 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-[#CE1126] flex items-center justify-center shrink-0 shadow-2xs">
                    <Calendar className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      Daily Consultations
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Servicing the PSU Community with licensed physicians & nurses
                    </div>
                  </div>
                </div>

                {/* Item 3: Secure & Reliable */}
                <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-slate-50 hover:bg-red-50/50 border border-slate-200/80 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-red-100 text-[#CE1126] flex items-center justify-center shrink-0 shadow-2xs">
                    <Shield className="w-6 h-6 stroke-[2]" />
                  </div>
                  <div>
                    <div className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      Secure & Reliable
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Your data is protected under Republic Act No. 10173 (Data Privacy Act)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. INTERACTIVE "HOW IT WORKS" WORKFLOW (Cool Scroll Animation Feature) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-slate-50/70 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-[#7F1416] text-xs font-bold">
              <Activity className="w-3.5 h-3.5" />
              <span>Smart Clinic Flow</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How the Clinic System Works
            </h2>
            <p className="text-sm text-slate-600">
              An automated, end-to-end clinical workflow connecting intake, triage, physician evaluation, and pharmacy dispensing.
            </p>
          </div>

          {/* Interactive Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: 1,
                title: 'Check-In & Queue Ticket',
                role: 'Student / Staff / Reception',
                icon: User,
                desc: 'Generate a digital queue ticket via student ID card barcode or clinic intake kiosk.'
              },
              {
                step: 2,
                title: 'Triage & Vital Signs',
                role: 'Triage Nurse Station',
                icon: HeartPulse,
                desc: 'Rapid vital signs evaluation (BP, HR, RR, Temp, SpO2) and pain severity assessment.'
              },
              {
                step: 3,
                title: 'Doctor SOAP Consultation',
                role: 'University Physician',
                icon: Stethoscope,
                desc: 'Comprehensive medical assessment, ICD-10 coding, and electronic prescription (Rx) formulation.'
              },
              {
                step: 4,
                title: 'Pharmacy & Clearance',
                role: 'Dispensary Desk',
                icon: Pill,
                desc: 'Seamless medicine dispensing, dosage instructions, and official medical certificates with university seals.'
              }
            ].map(item => {
              const Icon = item.icon;
              const isSelected = activeStep === item.step;
              return (
                <div
                  key={item.step}
                  onClick={() => setActiveStep(item.step)}
                  className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer relative group ${
                    isSelected
                      ? 'bg-white border-[#7F1416] shadow-xl ring-2 ring-red-700/20 -translate-y-2'
                      : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {/* Step Number Pill */}
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-mono font-black text-sm transition-colors ${
                        isSelected
                          ? 'bg-[#7F1416] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 group-hover:bg-red-50 group-hover:text-[#7F1416]'
                      }`}
                    >
                      0{item.step}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      STAGE {item.step}
                    </span>
                  </div>

                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#CE1126] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>

                  <h3 className="font-bold text-base text-slate-900 group-hover:text-[#7F1416] transition-colors mb-1">
                    {item.title}
                  </h3>
                  <div className="text-[11px] font-semibold text-slate-400 mb-2">
                    {item.role}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Interactive Live Preview Box */}
          <div className="mt-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7F1416] to-red-800 text-white flex items-center justify-center shrink-0 shadow-md">
                <Tv className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-base text-slate-900">
                    Live Waiting Area TV Display Board
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Real-time Audio Chime
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Synchronized queuing board with multi-station calling, voice synthesis announcements, and doctor room routing.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleDirectDemoLogin('administrator')}
              className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs shrink-0 cursor-pointer"
            >
              <span>Launch Clinic System</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. CONTACT & CLINIC HOURS SECTION */}
      {/* ========================================================================= */}
      <section id="contact" className="py-16 sm:py-24 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left: Contact Information & Location */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-2">
                <span className="w-6 h-0.5 bg-[#7F1416]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#7F1416]">
                  Contact & Hotlines
                </span>
              </div>

              <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                Get in Touch with PSU Medical Clinic
              </h2>

              <p className="text-sm text-slate-600 leading-relaxed">
                We are here to support your health and medical needs. Reach out to our campus healthcare personnel for consultations, medical clearances, and inquiries.
              </p>

              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <MapPin className="w-5 h-5 text-[#7F1416] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Clinic Location</div>
                    <div className="text-slate-600 mt-0.5">
                      Health & Medical Services Building, Bacolor Main Campus, Cabambangan, Bacolor, 2001 Pampanga
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Phone className="w-5 h-5 text-[#7F1416] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Direct Lines & Emergency Hotlines</div>
                    <div className="text-slate-600 font-mono mt-0.5">
                      Clinic Desk: (045) 901-0601 · Mobile: 0917-882-9011
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Clock className="w-5 h-5 text-[#7F1416] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">Clinic Operating Hours</div>
                    <div className="text-slate-600 mt-0.5">
                      Monday to Friday: 8:00 AM – 5:00 PM (Emergency First Aid On-Call)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Quick Message / Inquiry Form */}
            <div className="lg:col-span-7 bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-lg text-slate-900 mb-1">
                Send an Inquiry or Feedback
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Your message will be sent to the Clinic Information Desk.
              </p>

              <form onSubmit={handleContactSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="e.g. Juan D. Dela Cruz"
                      required
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. juan@student.psu.edu.ph"
                      required
                      className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Message or Medical Inquiry *</label>
                  <textarea
                    rows={4}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Enter your inquiry regarding medical clearance, consultation schedule, or prescription refills..."
                    required
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 text-xs leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-400">
                    Protected by Data Privacy Act of 2012
                  </span>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-full bg-[#7F1416] hover:bg-[#680F11] text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer active:scale-95"
                  >
                    {contactSubmitted ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span>Message Sent!</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Inquiry</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. FOOTER */}
      {/* ========================================================================= */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <McisLogo size={46} showText={false} />
                <PsuUniversitySeal size={46} />
              </div>
              <div>
                <div className="font-bold text-base text-white">
                  Pampanga State University
                </div>
                <div className="text-xs text-slate-400">
                  University Health & Medical Services Office (UHMS)
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setLoginModalOpen(true)}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Sign In to Portal
              </button>
              <button
                onClick={() => scrollToSection('home')}
                className="px-4 py-2 rounded-full bg-[#7F1416] hover:bg-[#680F11] text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Back to Top ↑
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div>
              © 2026 Pampanga State University Medical Clinic Information System. All Rights Reserved.
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Republic Act No. 10173</span>
              <span>·</span>
              <span>DOH Accredited</span>
              <span>·</span>
              <span>Bacolor Main Campus</span>
            </div>
          </div>
        </div>
      </footer>

      {/* ========================================================================= */}
      {/* 8. AUTHENTICATION / LOGIN MODAL */}
      {/* ========================================================================= */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-[#7F1416] to-[#5b0d0f] text-white p-6 pb-5 relative">
              <button
                onClick={() => setLoginModalOpen(false)}
                className="absolute top-4 right-4 text-red-200 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                  <HeartPulse className="w-6 h-6 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Sign In to Clinic EMR</h3>
                  <p className="text-xs text-red-200">Pampanga State University Health Services</p>
                </div>
              </div>
            </div>

            {/* Quick Fill Helper for Demo (No manual role dropdown needed) */}
            <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Quick Test Account Fill:
              </span>
              <div className="grid grid-cols-5 gap-1 text-center">
                {[
                  { u: 'admin', label: 'Admin', icon: '👑' },
                  { u: 'doctor.manalo', label: 'Doctor', icon: '🩺' },
                  { u: 'nurse.santos', label: 'Nurse', icon: '💉' },
                  { u: 'staff.david', label: 'Staff', icon: '📋' },
                  { u: 'student.delacruz', label: 'Student', icon: '🎓' }
                ].map(r => (
                  <button
                    key={r.u}
                    type="button"
                    onClick={() => handleQuickCredentialSelect(r.u)}
                    className="p-1 rounded-lg border text-[10px] font-bold bg-white text-slate-700 border-slate-200 hover:bg-slate-100 transition-all cursor-pointer truncate"
                  >
                    <div>{r.icon}</div>
                    <div className="truncate text-[9px]">{r.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Login Form (Clean: Username/Email + Password + Login + Forgot + Register) */}
            <form onSubmit={handleLoginSubmit} className="p-6 space-y-4 text-xs text-slate-800">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <label className="block font-bold text-slate-700">
                  Username or Registered Email *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin or doctor.manalo"
                    required
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Security Passcode *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginModalOpen(false);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] font-semibold text-red-700 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-600 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Identifying Role & Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Log In to Station</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="border-t border-slate-200 pt-3 text-center space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoginModalOpen(false);
                    setShowRegisterModal(true);
                  }}
                  className="w-full py-2 px-3 border border-red-700 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register / Request Account</span>
                </button>
                <div className="text-[11px] text-slate-400">
                  New Doctor, Nurse, Staff or Student? Submit request for admin approval.
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. WATCH OVERVIEW TOUR MODAL */}
      {/* ========================================================================= */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-red-500 fill-current" />
                <span className="font-bold text-sm">Interactive System Demonstration</span>
              </div>
              <button onClick={() => setVideoModalOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="aspect-video bg-slate-900 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center text-white text-center p-6 border border-slate-800">
                <div className="flex items-center gap-3 mb-3 animate-pulse-subtle">
                  <McisLogo size={64} showText={false} />
                  <PsuUniversitySeal size={64} />
                </div>
                <h4 className="text-lg font-bold text-white mb-1">
                  Pampanga State University Clinic EMR System
                </h4>
                <p className="text-xs text-slate-300 max-w-md">
                  Automated electronic medical records, automated queue calling, electronic prescription formulation, and morbidity analytics.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setVideoModalOpen(false);
                      handleDirectDemoLogin('administrator');
                    }}
                    className="px-4 py-2 rounded-full bg-[#7F1416] hover:bg-[#680F11] text-white font-bold text-xs flex items-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>Launch Live Interactive System</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Queue & Triage</div>
                  <div className="text-[10px] text-slate-500">Real-time TV screen display with audio chimes</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">Doctor SOAP EMR</div>
                  <div className="text-[10px] text-slate-500">ICD-10 clinical diagnoses & electronic Rx</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-900">DOH & Census</div>
                  <div className="text-[10px] text-slate-500">Vector PDF generation with university seals</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. LEARN MORE MODAL */}
      {/* ========================================================================= */}
      {learnMoreModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#7F1416] to-[#5a0c0e] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">About Pampanga State University Medical Clinic</h3>
                <p className="text-xs text-red-200">University Health & Medical Services Office (UHMS)</p>
              </div>
              <button onClick={() => setLearnMoreModalOpen(false)} className="text-red-200 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto">
              <p>
                The <strong>University Health & Medical Services Office (UHMS)</strong> of Pampanga State University operates to ensure the physical health, psychological well-being, and medical fitness of every member of the academic community across all campuses.
              </p>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 text-sm">Key Clinical Functions:</div>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Daily medical and dental consultations for students, faculty, and personnel</li>
                  <li>Emergency first aid response and emergency triage transport</li>
                  <li>Annual medical examinations and student admission health clearances</li>
                  <li>Issuance of official Medical Certificates, Excuses, and Clinical Clearances</li>
                  <li>Formulary medicine dispensing under the Generics Act of 1988 (RA 6675)</li>
                  <li>Infectious disease surveillance, health education, and DOH census reporting</li>
                </ul>
              </div>

              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-[#7F1416] text-[11px] font-semibold">
                🔒 Data Privacy Compliance: All electronic patient health records are encrypted and protected under Republic Act No. 10173 (Data Privacy Act of 2012).
              </div>

              <button
                onClick={() => {
                  setLearnMoreModalOpen(false);
                  setLoginModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#7F1416] hover:bg-[#680F11] text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <span>Access Clinic Information System</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
};

