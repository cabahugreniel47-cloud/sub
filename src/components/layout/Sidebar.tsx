import React from 'react';
import { useClinic } from '../../context/ClinicContext';

import {
  LayoutDashboard,
  Users,
  Activity,
  ClipboardList,
  Stethoscope,
  Pill,
  Package,
  Calendar,
  BarChart3,
  ShieldCheck,
  FileClock,
  Settings,
  Database,
  LogOut,
  X,
  Laptop,
  Smartphone,
  Sparkles
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const {
    currentUser,
    activeTab,
    setActiveTab,
    setActiveModal,
    queue,
    medicines,
    logout,
    rolePermissions,
    isMobile,
    mobileMenuOpen,
    setMobileMenuOpen,
    deviceMode,
    setDeviceMode
  } = useClinic();

  const role = currentUser?.role || 'staff';

  const activeQueueCount = queue.filter(q => q.stage !== 'Completed' && q.stage !== 'Cancelled').length;
  const lowStockCount = medicines.filter(m => m.status === 'Low Stock' || m.status === 'Critical Stock').length;

  interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
  }

  // Construct role-specific navigation list
  let navItems: NavItem[] = [];

  if (role === 'administrator') {
    navItems = [
      { id: 'dashboard', label: 'Central Command', icon: LayoutDashboard },
      { id: 'users', label: 'User Accounts & Roles', icon: ShieldCheck },
      { id: 'logs', label: 'System Audit Logs', icon: FileClock },
      { id: 'settings', label: 'System Settings', icon: Settings }
    ];
  } else if (role === 'doctor') {
    navItems = [
      { id: 'dashboard', label: 'Doctor Dashboard', icon: LayoutDashboard },
      { id: 'queue', label: "Patient Queue", icon: ClipboardList, badge: activeQueueCount > 0 ? activeQueueCount : undefined, badgeColor: 'bg-amber-400 text-red-950' },
      { id: 'consultations', label: 'Consultation Records', icon: Stethoscope },
      { id: 'patients', label: 'Patient Medical History', icon: Users },
      { id: 'appointments', label: 'Appointments Schedule', icon: Calendar }
    ];
  } else if (role === 'nurse') {
    navItems = [
      { id: 'dashboard', label: 'Nurse Station', icon: LayoutDashboard },
      { id: 'queue', label: 'Queue Handling', icon: ClipboardList, badge: activeQueueCount > 0 ? activeQueueCount : undefined, badgeColor: 'bg-amber-400 text-red-950' },
      { id: 'vitals', label: 'Health Assessment', icon: Activity },
      { id: 'consultations', label: 'Clinical Consultations', icon: Stethoscope },
      { id: 'patients', label: 'Patient Registration', icon: Users },
      { id: 'dispensing', label: 'Dispensing Desk', icon: Pill },
      { id: 'inventory', label: 'Inventory Stock', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-rose-300 text-red-950' },
      { id: 'appointments', label: 'Appointments', icon: Calendar }
    ];
  } else if (role === 'staff') {
    navItems = [
      { id: 'inventory', label: 'Supplies Directory', icon: Package, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-rose-300 text-red-950' }
    ];
  } else if (role === 'student') {
    navItems = [
      { id: 'dashboard', label: 'Student Clinic Pass', icon: LayoutDashboard },
      { id: 'consultations', label: 'My Medical Records & Rx', icon: Stethoscope },
      { id: 'appointments', label: 'Appointment', icon: Calendar }
    ];
  }

  // Dynamically enforce Administrator module permissions
  if (role !== 'administrator' && rolePermissions?.[role]?.allowedModules) {
    const allowed = rolePermissions[role].allowedModules;
    navItems = navItems.filter(item => item.id === 'dashboard' || allowed.includes(item.id as any));
  }

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  // Reusable Sidebar Body Content
  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#7F1416] text-white select-none">
      {/* Clinic Brand Header */}
      <div className="p-4 border-b border-red-900/60 bg-[#721113]">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-extrabold text-sm tracking-wide text-white leading-tight truncate">
              Pampanga State University
            </h2>
            <div className="text-[11px] text-amber-300/90 font-semibold truncate mt-0.5">
              Medical Clinic · Bacolor Campus
            </div>
          </div>

          {/* Close button for Mobile Drawer */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg bg-red-900/80 hover:bg-red-800 text-red-200 hover:text-white transition-colors cursor-pointer"
              title="Close Menu"
              aria-label="Close Mobile Menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Current Role Tag */}
        <div className="mt-3 pt-2.5 border-t border-red-800/40 flex items-center justify-between text-[11px]">
          <span className="text-red-200/90 font-medium">Logged in as:</span>
          <span className="font-semibold px-2 py-0.5 bg-black/25 text-amber-200 rounded text-[10px] uppercase tracking-wider">
            {role}
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-red-300/70 flex items-center justify-between">
          <span>Navigation Menu</span>
          {isMobile && (
            <span className="text-[9px] font-normal text-amber-200/80">📱 Mobile Mode</span>
          )}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all duration-150 cursor-pointer text-left ${
                isActive
                  ? 'bg-white text-[#7F1416] font-bold shadow-sm'
                  : 'text-red-100 hover:bg-white/10 hover:text-white font-medium'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#7F1416]' : 'text-red-200'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-xs ${
                  isActive ? 'bg-red-800 text-white' : (item.badgeColor || 'bg-amber-400 text-red-950')
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}


        {/* Device Mode Switcher Inside Mobile Drawer */}
        {isMobile && (
          <div className="pt-3 pb-1 border-t border-red-900/50 mt-2">
            <div className="px-2 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-300/90 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Device Interface Mode</span>
            </div>
            <div className="grid grid-cols-3 gap-1 bg-black/30 p-1 rounded-lg text-[10px]">
              <button
                onClick={() => setDeviceMode('auto')}
                className={`py-1.5 px-1 rounded font-semibold text-center transition-colors cursor-pointer ${
                  deviceMode === 'auto'
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'text-red-200 hover:text-white hover:bg-white/10'
                }`}
              >
                ⚡ Auto
              </button>
              <button
                onClick={() => setDeviceMode('pc')}
                className={`py-1.5 px-1 rounded font-semibold text-center transition-colors cursor-pointer ${
                  deviceMode === 'pc'
                    ? 'bg-white text-[#7F1416] font-bold'
                    : 'text-red-200 hover:text-white hover:bg-white/10'
                }`}
              >
                💻 PC/Desk
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`py-1.5 px-1 rounded font-semibold text-center transition-colors cursor-pointer ${
                  deviceMode === 'mobile'
                    ? 'bg-white text-[#7F1416] font-bold'
                    : 'text-red-200 hover:text-white hover:bg-white/10'
                }`}
              >
                📱 Mobile
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* User Card & Capstone Reference Footer */}
      <div className="p-3 border-t border-red-900/60 bg-[#721113] space-y-2.5">
        {/* User Card with Profile Customization trigger */}
        <div className="flex items-center justify-between gap-2 bg-black/20 p-2 rounded-lg border border-white/5">
          <button
            onClick={() => {
              setActiveModal('user-profile');
              if (isMobile) setMobileMenuOpen(false);
            }}
            title="Click to customize profile picture and info"
            className="flex items-center gap-2 min-w-0 text-left hover:opacity-90 transition-opacity cursor-pointer group flex-1"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.fullName}
                className="w-7 h-7 rounded-full object-cover border border-amber-300 shrink-0 shadow-xs group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-amber-400 text-red-950 font-black text-xs flex items-center justify-center shrink-0 uppercase shadow-xs group-hover:scale-105 transition-transform">
                {currentUser?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <div className="min-w-0">
              <div className="font-bold text-white text-xs truncate group-hover:text-amber-200 flex items-center gap-1">
                <span>{currentUser?.fullName?.split(' ')[0]} {currentUser?.fullName?.split(' ')[1] || ''}</span>
              </div>
              <div className="text-[10px] text-red-200/80 truncate">
                {currentUser?.title || role}
              </div>
            </div>
          </button>

          <button
            onClick={() => logout()}
            title="Log out of session"
            className="p-1.5 text-red-200 hover:text-white hover:bg-red-800/80 rounded transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="text-[10px] text-center text-red-200/70 font-medium py-1">
          Medical Clinic Information System
        </div>

        <div className="text-[9px] text-center text-red-300/60 leading-tight">
          Pampanga State University Clinic · v2.0
        </div>
      </div>
    </div>
  );

  // If Mobile Mode: Render overlay drawer when mobileMenuOpen is true
  if (isMobile) {
    if (!mobileMenuOpen) return null;

    return (
      <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
        {/* Backdrop overlay */}
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        {/* Drawer panel */}
        <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] flex flex-col shadow-2xl z-50 animate-in slide-in-from-left duration-250 ease-out border-r border-red-950/50">
          {sidebarContent}
        </div>
      </div>
    );
  }

  // If PC / Laptop Mode: Render persistent desktop sidebar
  return (
    <aside className="w-64 bg-[#7F1416] text-white flex flex-col shrink-0 min-h-[calc(100vh-4rem)] border-r border-red-950/40 select-none shadow-md">
      {sidebarContent}
    </aside>
  );
};
