import React from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Stethoscope,
  Menu,
  Activity,
  ShieldCheck,
  FileClock,
  Settings,
  Calendar,
  Package
} from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    queue,
    setMobileMenuOpen,
    mobileMenuOpen,
    currentUser
  } = useClinic();

  const role = currentUser?.role || 'staff';
  const activeQueueCount = queue.filter(q => q.stage !== 'Completed' && q.stage !== 'Cancelled').length;

  const isStudent = role === 'student';
  const isAdmin = role === 'administrator';
  const isStaff = role === 'staff';

  if (isStaff) {
    return (
      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around select-none safe-area-bottom"
      >
        <button
          onClick={() => {
            setActiveTab('inventory');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'inventory' && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <Package className={`w-5 h-5 ${activeTab === 'inventory' && !mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
            {activeTab === 'inventory' && !mobileMenuOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7F1416] rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate">Supplies</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <Menu className={`w-5 h-5 ${mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
            {mobileMenuOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7F1416] rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate">Menu</span>
        </button>
      </nav>
    );
  }

  if (isAdmin) {
    return (
      <nav
        aria-label="Mobile Navigation Bar"
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around select-none safe-area-bottom"
      >
        <button
          onClick={() => {
            setActiveTab('dashboard');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'dashboard' && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate">Command</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('users');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'users' && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate">Accounts</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('logs');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'logs' && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <FileClock className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate">Audit Logs</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('settings');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'settings' && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate">Settings</span>
        </button>

        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 truncate">Menu</span>
        </button>
      </nav>
    );
  }

  return (
    <nav
      aria-label="Mobile Navigation Bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around select-none safe-area-bottom"
    >
      {/* 1. Dashboard */}
      <button
        onClick={() => {
          setActiveTab('dashboard');
          setMobileMenuOpen(false);
        }}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
          activeTab === 'dashboard' && !mobileMenuOpen
            ? 'text-[#7F1416] font-bold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <div className="relative">
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' && !mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
          {activeTab === 'dashboard' && !mobileMenuOpen && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7F1416] rounded-full" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 truncate">
          {isStudent ? 'Pass' : 'Dashboard'}
        </span>
      </button>

      {/* 2. Queue (or Appointment for student) */}
      {isStudent ? (
        <button
          onClick={() => {
            setActiveTab('appointments');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'appointments' && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <Calendar className={`w-5 h-5 ${activeTab === 'appointments' && !mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
            {activeTab === 'appointments' && !mobileMenuOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7F1416] rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate">Appointment</span>
        </button>
      ) : (
        <button
          onClick={() => {
            setActiveTab('queue');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'queue' && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <ClipboardList className={`w-5 h-5 ${activeTab === 'queue' && !mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
            {activeQueueCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] bg-amber-500 text-slate-950 font-mono font-bold text-[9px] rounded-full flex items-center justify-center shadow-xs">
                {activeQueueCount}
              </span>
            )}
            {activeTab === 'queue' && !mobileMenuOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7F1416] rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate">Queue</span>
        </button>
      )}

      {/* 3. Patients (or Vitals for student) */}
      {!isStudent ? (
        <button
          onClick={() => {
            setActiveTab('patients');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'patients' && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <Users className={`w-5 h-5 ${activeTab === 'patients' && !mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
            {activeTab === 'patients' && !mobileMenuOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7F1416] rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate">Patients</span>
        </button>
      ) : (
        <button
          onClick={() => {
            setActiveTab('consultations');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            activeTab === 'consultations' && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            <Stethoscope className={`w-5 h-5 ${activeTab === 'consultations' && !mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
            {activeTab === 'consultations' && !mobileMenuOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7F1416] rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate">My Records</span>
        </button>
      )}

      {/* 4. Clinical: Triage/Vitals or Consultations */}
      {!isStudent && (
        <button
          onClick={() => {
            setActiveTab(role === 'doctor' ? 'consultations' : 'vitals');
            setMobileMenuOpen(false);
          }}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
            (activeTab === 'vitals' || activeTab === 'consultations') && !mobileMenuOpen
              ? 'text-[#7F1416] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <div className="relative">
            {role === 'doctor' ? (
              <Stethoscope className={`w-5 h-5 ${activeTab === 'consultations' && !mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
            ) : (
              <Activity className={`w-5 h-5 ${activeTab === 'vitals' && !mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
            )}
            {(activeTab === 'vitals' || activeTab === 'consultations') && !mobileMenuOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7F1416] rounded-full" />
            )}
          </div>
          <span className="text-[10px] mt-0.5 truncate">
            {role === 'doctor' ? 'Consultation' : 'Triage'}
          </span>
        </button>
      )}

      {/* 5. More / Menu Drawer Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg transition-colors cursor-pointer ${
          mobileMenuOpen
            ? 'text-[#7F1416] font-bold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <div className="relative">
          <Menu className={`w-5 h-5 ${mobileMenuOpen ? 'stroke-[2.5]' : ''}`} />
          {mobileMenuOpen && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#7F1416] rounded-full" />
          )}
        </div>
        <span className="text-[10px] mt-0.5 truncate">All Menu</span>
      </button>
    </nav>
  );
};
