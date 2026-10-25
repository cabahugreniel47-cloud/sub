import React, { useState, useRef, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { UserRole } from '../../types/clinic';
import { PsuUniversitySeal, McisLogo } from '../common/OfficialLogos';
import {
  Bell,
  LogOut,
  User as UserIcon,
  Search,
  Tv,
  CheckCircle,
  ChevronDown,
  X,
  Menu,
  Monitor,
  Smartphone,
  Laptop,
  Zap,
  SlidersHorizontal,
  Shield
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    logout,
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setActiveModal,
    setActiveTab,
    queue,
    patients,
    medicines,
    setSelectedPatient,
    isMobile,
    mobileMenuOpen,
    setMobileMenuOpen,
    deviceMode,
    setDeviceMode,
    screenCategory
  } = useClinic();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showDeviceMenu, setShowDeviceMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mobileSearchVisible, setMobileSearchVisible] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const deviceMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Filter notifications strictly according to the active user's role
  const visibleNotifications = notifications.filter(n => {
    if (!currentUser) return false;
    // Administrator manages system governance (users, security logs, settings) and strictly receives administrator-targeted alerts
    if (currentUser.role === 'administrator') {
      return Boolean(n.targetRoles && n.targetRoles.includes('administrator'));
    }
    // Clinic staff strictly receives medicine inventory stock alerts
    if (currentUser.role === 'staff') {
      return n.type === 'low_stock' || (n.linkTab === 'inventory' && n.targetRoles?.includes('staff'));
    }
    if (n.targetRoles && n.targetRoles.length > 0) {
      return n.targetRoles.includes(currentUser.role);
    }
    // Clinic staff announcements fallback to non-student roles
    return currentUser.role !== 'student';
  });

  const unreadNotifs = visibleNotifications.filter(n => !n.read);

  const handleNotificationClick = (n: { id: string; linkTab?: string; type?: string }) => {
    markNotificationRead(n.id);
    setShowNotifications(false);

    if (n.linkTab) {
      setActiveTab(n.linkTab);
      return;
    }

    if (n.type === 'low_stock') {
      setActiveTab('inventory');
    } else if (n.type === 'queue_alert') {
      setActiveTab('queue');
    } else if (n.type === 'appointment') {
      setActiveTab('appointments');
    } else if (n.type === 'system') {
      if (currentUser?.role === 'administrator') {
        setActiveTab('users');
      } else {
        setActiveTab('dashboard');
      }
    }
  };

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchResults(false);
      }
      if (deviceMenuRef.current && !deviceMenuRef.current.contains(target)) {
        setShowDeviceMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered search results
  const filteredPatients = searchQuery.trim()
    ? patients.filter(p =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.psuId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.collegeOrDepartment.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 4)
    : [];

  const filteredQueue = searchQuery.trim()
    ? queue.filter(q =>
        q.ticketNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.patientName.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const filteredMeds = searchQuery.trim()
    ? medicines.filter(m =>
        m.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.brandName.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 3)
    : [];

  const hasResults = filteredPatients.length > 0 || filteredQueue.length > 0 || filteredMeds.length > 0;

  // Current formatted date in Philippine time
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/80 shadow-xs">
      <div className="w-full px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left Zone: Hamburger for Mobile + Welcome & Date */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Mobile Menu Hamburger Button */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-[#7F1416]" />
            </button>
          )}

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
              <McisLogo size={32} showText={false} />
              <PsuUniversitySeal size={32} className="shadow-2xs" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-bold text-slate-900 text-xs sm:text-base leading-tight truncate max-w-[170px] xs:max-w-[220px] sm:max-w-none">
                  {currentUser?.role === 'administrator' && (isMobile ? 'Admin Station' : 'Clinic Administration Dashboard')}
                  {currentUser?.role === 'doctor' && (isMobile ? 'Doctor Station' : "Doctor's Consultation Station")}
                  {currentUser?.role === 'nurse' && (isMobile ? 'Nurse Station' : 'Nurse Triage & Dispensing Station')}
                  {currentUser?.role === 'staff' && (isMobile ? 'Reception Station' : 'Reception & Intake Station')}
                  {currentUser?.role === 'student' && (isMobile ? 'Student Health' : 'PSU Student Health Portal')}
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-700 border border-red-200">
                  Live System
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                <span className="hidden xs:inline">{dateStr}</span>
                <span className="hidden xs:inline">·</span>
                <span className="font-mono text-slate-600 font-medium truncate">Bacolor Main Campus</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Zone: Desktop Global Search Bar */}
        {currentUser?.role !== 'student' && currentUser?.role !== 'administrator' ? (
          <div ref={searchRef} className="hidden md:block flex-1 max-w-md relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              placeholder="Search patient, PSU ID (e.g. 2023313334), ticket #, or medicine..."
              className="w-full pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-700/20 focus:border-red-700 transition-all text-slate-900 placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && searchQuery.trim() && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-slate-100 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
              {!hasResults ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No matching records found for "{searchQuery}"
                </div>
              ) : (
                <>
                  {filteredPatients.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Patients ({filteredPatients.length})
                      </div>
                      {filteredPatients.map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setSelectedPatient(p);
                            setActiveModal('patient-profile');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="px-2 py-1.5 hover:bg-red-50 rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{p.firstName} {p.lastName}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{p.psuId} · {p.collegeOrDepartment}</div>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {p.classification}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredQueue.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Queue Tickets ({filteredQueue.length})
                      </div>
                      {filteredQueue.map(q => (
                        <div
                          key={q.id}
                          onClick={() => {
                            setActiveTab('queue');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="px-2 py-1.5 hover:bg-amber-50 rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-red-800">{q.ticketNumber}</span>
                            <span className="text-slate-800 font-medium">{q.patientName}</span>
                          </div>
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                            {q.stage}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {filteredMeds.length > 0 && (
                    <div className="p-2">
                      <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Medicine Formulary ({filteredMeds.length})
                      </div>
                      {filteredMeds.map(m => (
                        <div
                          key={m.id}
                          onClick={() => {
                            setActiveTab('inventory');
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="px-2 py-1.5 hover:bg-emerald-50 rounded-lg cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{m.genericName}</div>
                            <div className="text-[10px] text-slate-500">{m.brandName} · {m.dosageStrength}</div>
                          </div>
                          <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                            m.status === 'Critical Stock' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {m.currentStock} {m.unit}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
        ) : currentUser?.role === 'administrator' ? (
          <div className="hidden md:flex flex-1 max-w-md items-center justify-center">
            <span className="text-xs text-slate-700 font-semibold bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-2xs">
              <Shield className="w-3.5 h-3.5 text-[#7F1416] shrink-0" />
              <span>RA 10173 Privacy Protected · System Governance Only</span>
            </span>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 max-w-md items-center justify-center">
            <span className="text-xs text-slate-600 font-medium bg-slate-50 px-3.5 py-1.5 rounded-full border border-slate-200 flex items-center gap-2 shadow-2xs">
              <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Student Medical Portal · {currentUser?.fullName}</span>
            </span>
          </div>
        )}

        {/* Right Zone: Controls (Device Mode Switcher, Role, Notifs, Action) */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Mobile Search Toggle Icon */}
          {currentUser?.role !== 'student' && currentUser?.role !== 'administrator' && (
            <div className="md:hidden">
              <button
                onClick={() => setMobileSearchVisible(!mobileSearchVisible)}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Search"
                aria-label="Search Records"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* DEVICE MODE SWITCHER (Auto / PC / Mobile) */}
          <div ref={deviceMenuRef} className="relative">
            <button
              onClick={() => setShowDeviceMenu(!showDeviceMenu)}
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                deviceMode === 'auto'
                  ? 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-900 border-amber-200'
                  : deviceMode === 'mobile'
                  ? 'bg-blue-50/80 hover:bg-blue-100/80 text-blue-900 border-blue-200'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
              title="Toggle PC/Laptop vs Mobile Device UI Mode"
            >
              {deviceMode === 'auto' ? (
                <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              ) : deviceMode === 'mobile' ? (
                <Smartphone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              ) : (
                <Monitor className="w-3.5 h-3.5 text-slate-700 shrink-0" />
              )}
              
              <span className="hidden sm:inline text-[11px]">
                {deviceMode === 'auto' && `Auto (${isMobile ? 'Mobile' : 'PC'})`}
                {deviceMode === 'mobile' && 'Mobile Mode'}
                {deviceMode === 'pc' && 'PC/Laptop Mode'}
              </span>
              <span className="sm:hidden text-[10px] font-bold">
                {deviceMode === 'auto' ? (isMobile ? '📱' : '💻') : deviceMode === 'mobile' ? '📱' : '💻'}
              </span>

              <ChevronDown className="w-3 h-3 text-slate-500 shrink-0" />
            </button>

            {/* Device Mode Selector Menu */}
            {showDeviceMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                  <span>Device Interface Mode</span>
                  <span className="text-[9px] text-[#7F1416] font-semibold">{screenCategory.toUpperCase()}</span>
                </div>

                <div className="p-1 space-y-0.5">
                  {/* Option 1: Auto */}
                  <button
                    onClick={() => {
                      setDeviceMode('auto');
                      setShowDeviceMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                      deviceMode === 'auto' ? 'bg-amber-50 text-amber-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                      <Zap className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">⚡ Auto-Detect (Live)</span>
                        {deviceMode === 'auto' && <CheckCircle className="w-3.5 h-3.5 text-amber-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                        Adapts layout smoothly as you resize or rotate on PC or Phone (currently: {isMobile ? 'Mobile' : 'PC/Laptop'}).
                      </p>
                    </div>
                  </button>

                  {/* Option 2: PC / Laptop Mode */}
                  <button
                    onClick={() => {
                      setDeviceMode('pc');
                      setShowDeviceMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                      deviceMode === 'pc' ? 'bg-red-50 text-red-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-red-100 text-[#7F1416] shrink-0 mt-0.5">
                      <Laptop className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">💻 PC / Laptop Mode</span>
                        {deviceMode === 'pc' && <CheckCircle className="w-3.5 h-3.5 text-[#7F1416]" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                        Expanded PSU crimson sidebar, multi-column desktop grid, and wide data tables.
                      </p>
                    </div>
                  </button>

                  {/* Option 3: Mobile Device Mode */}
                  <button
                    onClick={() => {
                      setDeviceMode('mobile');
                      setShowDeviceMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded-lg flex items-start gap-2.5 transition-colors cursor-pointer ${
                      deviceMode === 'mobile' ? 'bg-blue-50 text-blue-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="p-1.5 rounded-md bg-blue-100 text-blue-800 shrink-0 mt-0.5">
                      <Smartphone className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">📱 Mobile Device Mode</span>
                        {deviceMode === 'mobile' && <CheckCircle className="w-3.5 h-3.5 text-blue-600" />}
                      </div>
                      <p className="text-[10px] text-slate-500 font-normal leading-tight mt-0.5">
                        Fitted mobile layout with slide-out drawer, bottom thumb nav bar, and touch cards.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Live TV Waiting Board (Exclusively online on Nurse tab) */}
          {currentUser?.role === 'nurse' && (
            <button
              onClick={() => setActiveModal('tv-queue')}
              className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-xs font-semibold text-amber-900 transition-colors cursor-pointer"
              title="Open Live TV Waiting Board"
            >
              <Tv className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden sm:inline text-[11px]">Live TV</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            </button>
          )}

          {/* Notifications Dropdown */}
          <div ref={notifMenuRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Clinic Notifications"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 w-2 h-2 bg-red-600 rounded-full animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span>Notifications</span>
                    {unreadNotifs.length > 0 && (
                      <span className="px-1.5 py-0.2 bg-red-100 text-red-700 font-mono text-[10px] font-bold rounded-full">
                        {unreadNotifs.length}
                      </span>
                    )}
                  </div>
                  {unreadNotifs.length > 0 && (
                    <button
                      onClick={() => {
                        visibleNotifications.forEach(n => {
                          if (!n.read) markNotificationRead(n.id);
                        });
                      }}
                      className="text-[11px] text-red-700 hover:underline font-medium cursor-pointer"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {visibleNotifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No notifications
                    </div>
                  ) : (
                    visibleNotifications.slice(0, 6).map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n)}
                        className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer ${
                          !n.read ? 'bg-red-50/30' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`font-semibold ${!n.read ? 'text-red-900' : 'text-slate-800'}`}>
                            {n.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                            {n.createdAt.split(' ')[1] || n.createdAt}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-tight">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar with Customization Trigger */}
          <div ref={userMenuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
              title="Click to customize profile picture and information"
            >
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-amber-300 shadow-2xs"
                />
              ) : (
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#7F1416] text-amber-300 font-bold text-xs flex items-center justify-center shadow-2xs uppercase">
                  {currentUser?.fullName?.charAt(0) || 'U'}
                </div>
              )}
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>

            {/* Profile Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                {/* Header User Card */}
                <div className="px-4 py-2 border-b border-slate-100 flex items-center gap-3">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullName}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#7F1416] to-red-800 text-white font-black text-sm flex items-center justify-center shrink-0 uppercase">
                      {currentUser?.fullName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">
                      {currentUser?.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {currentUser?.title || currentUser?.role}
                    </div>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-red-100 text-[#7F1416] rounded text-[9px] font-bold uppercase tracking-wider">
                      {currentUser?.role}
                    </span>
                  </div>
                </div>

                {/* Primary Action: Customize Profile */}
                <div className="p-1">
                  <button
                    onClick={() => {
                      setActiveModal('user-profile');
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-[#7F1416] font-bold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserIcon className="w-4 h-4 text-[#7F1416]" />
                    <span>Customize Profile & Photo</span>
                  </button>

                  {currentUser?.role === 'administrator' && (
                    <button
                      onClick={() => {
                        setActiveTab('settings');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                      <span>Clinic System Preferences</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-1 mt-1 p-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-rose-50 text-rose-600 font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out of Session</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Overlay Bar */}
      {mobileSearchVisible && (
        <div className="md:hidden px-3 py-2 bg-slate-50 border-t border-slate-200 animate-in slide-in-from-top-1 duration-150">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              placeholder="Search PSU ID (e.g. 2023313334), Patient..."
              className="w-full pl-9 pr-8 py-2 bg-white text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-700/20 text-slate-900"
              autoFocus
            />
            <button
              onClick={() => {
                setMobileSearchVisible(false);
                setSearchQuery('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Search Results */}
          {searchQuery.trim() && (
            <div className="mt-2 bg-white border border-slate-200 rounded-lg shadow-md max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
              {!hasResults ? (
                <div className="p-3 text-center text-slate-400 text-xs">
                  No records matching "{searchQuery}"
                </div>
              ) : (
                <>
                  {filteredPatients.map(p => (
                    <div
                      key={p.id}
                      onClick={() => {
                        setSelectedPatient(p);
                        setActiveModal('patient-profile');
                        setMobileSearchVisible(false);
                        setSearchQuery('');
                      }}
                      className="p-2 hover:bg-red-50 flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{p.firstName} {p.lastName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{p.psuId}</div>
                      </div>
                      <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {p.classification}
                      </span>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
