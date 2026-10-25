import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Patient,
  PatientHistoryRecord,
  VitalSigns,
  Consultation,
  Medicine,
  InventoryTransaction,
  QueueTicket,
  QueueStage,
  QueueCallStatus,
  QueuePriority,
  Appointment,
  MedicalCertificate,
  ActivityLog,
  ClinicNotification,
  ClinicModule,
  RolePermissions,
  RegistrationRequest,
  PasswordResetRequest,
  VerificationReceipt,
  NumberPopupData
} from '../types/clinic';
import { SMSNotificationService } from '../services/smsNotificationService';
import { ClinicApiService } from '../services/clinicApiService';
import {
  INITIAL_USERS,
  INITIAL_PATIENTS,
  INITIAL_VITALS,
  INITIAL_MEDICINES,
  INITIAL_TRANSACTIONS,
  INITIAL_QUEUE,
  INITIAL_CONSULTATIONS,
  INITIAL_CERTIFICATES,
  INITIAL_APPOINTMENTS,
  INITIAL_LOGS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REGISTRATION_REQUESTS
} from '../data/mockData';

export const DEFAULT_ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  administrator: {
    role: 'administrator',
    label: 'Master System Administrator',
    description: 'System governance: Controls user accounts & roles, permission switchboards, RA 10173 audit logs, and system settings without accessing private clinical records.',
    allowedModules: ['dashboard', 'users', 'logs', 'settings'],
    canEditRecords: false,
    canDispenseMeds: false,
    canPrescribeRx: false,
    canIssueMedCert: false,
    canManageUsers: true,
    canViewAuditLogs: true
  },
  doctor: {
    role: 'doctor',
    label: 'University Physician / Doctor',
    description: 'Reviewing clinical consultation records documented by triage nursing staff, examining finished appointments, and viewing electronic medical history.',
    allowedModules: ['dashboard', 'queue', 'consultations', 'patients', 'appointments'],
    canEditRecords: false,
    canDispenseMeds: false,
    canPrescribeRx: true,
    canIssueMedCert: true,
    canManageUsers: false,
    canViewAuditLogs: false
  },
  nurse: {
    role: 'nurse',
    label: 'University Nurse & Triage Officer',
    description: 'Vital signs assessment, triage prioritization, patient clinical consultations, intake registration, medication dispensing, and clinic inventory.',
    allowedModules: ['dashboard', 'queue', 'vitals', 'patients', 'consultations', 'dispensing', 'inventory', 'appointments'],
    canEditRecords: true,
    canDispenseMeds: true,
    canPrescribeRx: true,
    canIssueMedCert: true,
    canManageUsers: false,
    canViewAuditLogs: false
  },
  staff: {
    role: 'staff',
    label: 'Clinic Records & Reception Staff',
    description: 'Clinic supplies directory and inventory logging.',
    allowedModules: ['inventory'],
    canEditRecords: false,
    canDispenseMeds: false,
    canPrescribeRx: false,
    canIssueMedCert: false,
    canManageUsers: false,
    canViewAuditLogs: false
  },
  student: {
    role: 'student',
    label: 'Student / Patient Portal',
    description: 'Patient clinic pass, personal medical records, electronic prescription access, and booking visit.',
    allowedModules: ['dashboard', 'consultations', 'appointments'],
    canEditRecords: false,
    canDispenseMeds: false,
    canPrescribeRx: false,
    canIssueMedCert: false,
    canManageUsers: false,
    canViewAuditLogs: false
  }
};

interface ClinicContextType {
  isRestoringSession: boolean;
  currentUser: User | null;
  users: User[];
  addUser: (userData: Omit<User, 'id'>, options?: { sendActivationEmail?: boolean; accountStatus?: 'active' | 'pending_activation' }) => Promise<{ success: boolean; user?: User; receipt?: VerificationReceipt; error?: string }>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<boolean>;
  updateUserProfile: (userId: string, updates: Partial<User>) => Promise<void>;
  updateCurrentUserProfile: (updates: Partial<User>) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  updateUserRole: (userId: string, newRole: UserRole) => Promise<void>;
  deleteUser: (userId: string) => Promise<boolean>;
  resetUserPassword: (userId: string) => Promise<{ tempPass: string; message: string }>;
  login: (usernameOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
  logout: () => void;

  // Registration Receipts & Email Verification
  lastIssuedReceipt: VerificationReceipt | null;
  setLastIssuedReceipt: (receipt: VerificationReceipt | null) => void;
  getVerificationReceiptForUser: (userId: string) => VerificationReceipt | null;

  // Registration Requests & Self-Request Flow
  registrationRequests: RegistrationRequest[];
  submitRegistrationRequest: (data: Omit<RegistrationRequest, 'id' | 'submittedAt' | 'status' | 'activationToken'>) => Promise<RegistrationRequest>;
  approveRegistrationRequest: (requestId: string, adminNotes?: string) => Promise<{ success: boolean; user?: User; activationToken?: string; receipt?: VerificationReceipt; error?: string }>;
  rejectRegistrationRequest: (requestId: string, reason?: string) => void;
  requestAdditionalInfo: (requestId: string, inquiryText: string) => void;
  activateAccountWithToken: (token: string, newPassword: string) => Promise<{ success: boolean; message: string; user?: User }>;

  // Password Reset Flow
  requestPasswordReset: (usernameOrEmail: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  completePasswordReset: (token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;

  // Role & Permissions Master Control
  rolePermissions: Record<UserRole, RolePermissions>;
  updateRolePermissions: (role: UserRole, updates: Partial<RolePermissions>) => void;
  toggleModulePermission: (role: UserRole, module: ClinicModule) => void;
  resetRolePermissionsToDefault: () => void;
  
  // Patients
  patients: Patient[];
  addPatient: (patient: Omit<Patient, 'id' | 'registeredAt' | 'status'>) => Promise<Patient | null>;
  updatePatient: (id: string, updates: Partial<Patient>) => Promise<boolean>;
  archivePatient: (id: string, reason: string) => Promise<boolean>;
  restorePatient: (id: string) => Promise<boolean>;
  deletePatient: (id: string) => Promise<boolean>;
  getPatientHistory: (id: string) => Promise<PatientHistoryRecord | null>;
  selectedPatient: Patient | null;
  setSelectedPatient: (patient: Patient | null) => void;
  
  // Vital Signs
  vitalSigns: VitalSigns[];
  recordVitalSigns: (vitals: Omit<VitalSigns, 'id' | 'timestamp' | 'recordedByUserId' | 'recordedByName'>) => VitalSigns;
  getPatientVitals: (patientId: string) => VitalSigns[];
  
  // Queue
  queue: QueueTicket[];
  issueQueueTicket: (patientId: string, priority: QueuePriority, chiefComplaint?: string) => QueueTicket;
  updateQueueStage: (ticketId: string, stage: QueueStage, room?: string, persist?: boolean) => void;
  updateQueueCallStatus: (ticketId: string, callStatus: QueueCallStatus, room?: string, persist?: boolean) => Promise<void>;
  sendQueueSmsNotification: (ticketId: string, type: 'ready' | 'calling' | 'issued', room?: string) => Promise<boolean>;
  callNextInQueue: (currentStage: QueueStage, nextStage: QueueStage, targetRoom: string) => QueueTicket | null;
  recentSmsToast: { message: string; phone: string; type: string } | null;
  dismissSmsToast: () => void;
  
  // Consultations & Rx
  consultations: Consultation[];
  recordConsultation: (consultation: Omit<Consultation, 'id' | 'date' | 'time' | 'doctorId' | 'doctorName' | 'doctorLicense' | 'doctorPtr'>) => Consultation;
  updateConsultation: (id: string, updates: Partial<Consultation>) => void;
  approveConsultation: (consultationId: string, approvalNotes?: string) => Promise<boolean>;
  getPatientConsultations: (patientId: string) => Consultation[];
  
  // Inventory & Dispensing
  medicines: Medicine[];
  transactions: InventoryTransaction[];
  addMedicine: (medicine: Omit<Medicine, 'id' | 'status'>) => void;
  stockInMedicine: (medicineId: string, quantity: number, remarks: string, batchNumber?: string) => void;
  dispenseMedicine: (medicineId: string, quantity: number, reason: string, patientName?: string, referenceId?: string) => boolean;
  
  // Appointments
  appointments: Appointment[];
  addAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Appointment;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => void;
  
  // Medical Certificates
  certificates: MedicalCertificate[];
  issueMedicalCertificate: (certData: Omit<MedicalCertificate, 'id' | 'certificateNumber' | 'issuedAt' | 'doctorName' | 'doctorTitle' | 'doctorLicense' | 'doctorPtr'>) => MedicalCertificate;
  
  // Logs & Notifications
  activityLogs: ActivityLog[];
  notifications: ClinicNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Navigation & UI State
  activeTab: string;
  setActiveTab: (tab: string) => void;
  activeModal: string | null;
  setActiveModal: (modal: string | null) => void;
  modalPayload: any;
  setModalPayload: (payload: any) => void;
  
  // Device Mode & Responsive Fitting UI State
  deviceMode: 'auto' | 'pc' | 'mobile';
  setDeviceMode: (mode: 'auto' | 'pc' | 'mobile') => void;
  isMobile: boolean;
  screenCategory: 'mobile' | 'tablet' | 'laptop' | 'desktop';
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  deviceToast: string | null;
  dismissDeviceToast: () => void;
  toast: { message: string; type?: 'success' | 'warning' | 'info' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'warning' | 'info' | 'error') => void;
  dismissToast: () => void;
  
  // Queue TV Audio simulation
  playQueueChime: (ticketNumber: string, room: string) => void;
  recentCalledTicket: { number: string; room: string; time: string } | null;

  // System Synchronization & Auto-Refresh
  isSyncing: boolean;
  lastSyncTime: Date | null;
  autoSyncEnabled: boolean;
  toggleAutoSync: () => void;
  refreshSystem: (manual?: boolean) => Promise<boolean>;

  // Automatic Number Pop-up & Alerts
  activeNumberPopup: NumberPopupData | null;
  triggerNumberPopup: (data: Omit<NumberPopupData, 'id' | 'timestamp'>) => void;
  dismissNumberPopup: () => void;
  autoPopNumberEnabled: boolean;
  toggleAutoPopNumber: () => void;
  soundChimeEnabled: boolean;
  toggleSoundChime: () => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Authentication & Users
  const [isRestoringSession, setIsRestoringSession] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return Boolean(
      localStorage.getItem('psu_mcis_admin_session_token') ||
      localStorage.getItem('psu_mcis_admin_user_id') ||
      sessionStorage.getItem('psu_mcis_session_token') ||
      sessionStorage.getItem('psu_mcis_user_id')
    );
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null); // default to null to show pre-login landing page
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [rolePermissions, setRolePermissions] = useState<Record<UserRole, RolePermissions>>(DEFAULT_ROLE_PERMISSIONS);
  
  // Core Entities
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [vitalSigns, setVitalSigns] = useState<VitalSigns[]>(INITIAL_VITALS);
  const [consultations, setConsultations] = useState<Consultation[]>(INITIAL_CONSULTATIONS);
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>(INITIAL_TRANSACTIONS);
  const [queue, setQueue] = useState<QueueTicket[]>(INITIAL_QUEUE);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [certificates, setCertificates] = useState<MedicalCertificate[]>(INITIAL_CERTIFICATES);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(INITIAL_LOGS);
  const [notifications, setNotifications] = useState<ClinicNotification[]>(INITIAL_NOTIFICATIONS);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>(INITIAL_REGISTRATION_REQUESTS);
  const [passwordResetRequests, setPasswordResetRequests] = useState<PasswordResetRequest[]>([]);
  const [lastIssuedReceipt, setLastIssuedReceipt] = useState<VerificationReceipt | null>(null);
  
  // UI States
  const [activeTab, setActiveTabState] = useState<string>('dashboard');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [modalPayload, setModalPayload] = useState<any>(null);
  const [recentCalledTicket, setRecentCalledTicket] = useState<{ number: string; room: string; time: string } | null>(null);

  // System Synchronization & Auto-Refresh State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => new Date());
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('psu_mcis_auto_sync') !== 'false';
  });

  const toggleAutoSync = () => {
    setAutoSyncEnabled(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('psu_mcis_auto_sync', String(next));
      showToast(next ? '⚡ Auto-Sync enabled (continuous live sync)' : '⏸️ Auto-Sync paused (manual Refresh available)', 'info');
      return next;
    });
  };

  // Automatic Number Pop-up & Audio Chime State
  const [activeNumberPopup, setActiveNumberPopup] = useState<NumberPopupData | null>(null);
  const [autoPopNumberEnabled, setAutoPopNumberEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('psu_mcis_auto_pop_number') !== 'false';
  });
  const [soundChimeEnabled, setSoundChimeEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('psu_mcis_sound_chime') !== 'false';
  });

  const toggleAutoPopNumber = () => {
    setAutoPopNumberEnabled(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('psu_mcis_auto_pop_number', String(next));
      showToast(next ? '🔔 Automatic Number Pop-up enabled' : '🔕 Automatic Number Pop-up muted', 'info');
      return next;
    });
  };

  const toggleSoundChime = () => {
    setSoundChimeEnabled(prev => {
      const next = !prev;
      if (typeof window !== 'undefined') localStorage.setItem('psu_mcis_sound_chime', String(next));
      return next;
    });
  };

  const playSynthesizedChime = () => {
    if (!soundChimeEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.25); // A5

      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 1.2);
      osc2.stop(audioCtx.currentTime + 1.2);
    } catch {
      // Audio context may require user interaction
    }
  };

  const triggerNumberPopup = (data: Omit<NumberPopupData, 'id' | 'timestamp'>) => {
    if (!autoPopNumberEnabled) return;
    const popup: NumberPopupData = {
      ...data,
      id: `popup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setActiveNumberPopup(popup);
    playSynthesizedChime();
  };

  const dismissNumberPopup = () => setActiveNumberPopup(null);

  // Track known IDs to detect real-time incoming records
  const knownTicketIdsRef = React.useRef<Set<string>>(new Set());
  const knownConsultationIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    queue.forEach(q => knownTicketIdsRef.current.add(q.id));
    consultations.forEach(c => knownConsultationIdsRef.current.add(c.id));
  }, []);

  // Enforce role-based module navigation guard (cannot be bypassed by URL or direct tab triggers)
  const setActiveTab = (tab: string) => {
    if (currentUser?.role === 'student') {
      const allowed = ['dashboard', 'consultations', 'appointments'];
      if (!allowed.includes(tab)) {
        showToast('🔒 Access Denied: Students/Patients cannot access administrative or staff-only clinic modules.', 'warning');
        setActiveTabState('dashboard');
        return;
      }
    }
    if (currentUser?.role === 'administrator') {
      const adminAllowed = ['dashboard', 'users', 'logs', 'settings'];
      if (!adminAllowed.includes(tab)) {
        showToast('🔒 Privacy Guard (RA 10173): System Administrators are restricted to Central Command, User Accounts & Roles, Audit Logs, and System Settings.', 'warning');
        setActiveTabState('dashboard');
        return;
      }
    }
    if (currentUser?.role === 'doctor') {
      const doctorAllowed = ['dashboard', 'queue', 'consultations', 'patients', 'appointments'];
      if (!doctorAllowed.includes(tab)) {
        showToast('🔒 Clinical Scope: This module is managed by Nursing/Reception staff.', 'info');
        setActiveTabState('dashboard');
        return;
      }
    }
    if (currentUser?.role === 'staff') {
      const staffAllowed = ['inventory'];
      if (!staffAllowed.includes(tab)) {
        setActiveTabState('inventory');
        return;
      }
    }
    setActiveTabState(tab);
  };

  // 1. Initial Session Restore & Centralized DB Sync on Mount
  useEffect(() => {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('psu_mcis_admin_session_token') : null;
    const adminUserId = typeof window !== 'undefined' ? localStorage.getItem('psu_mcis_admin_user_id') : null;
    const nonAdminToken = typeof window !== 'undefined' ? sessionStorage.getItem('psu_mcis_session_token') : null;
    const nonAdminUserId = typeof window !== 'undefined' ? (sessionStorage.getItem('psu_mcis_user_id') || localStorage.getItem('psu_mcis_active_user_id')) : null;

    const activeToken = adminToken || nonAdminToken;
    const activeUserId = adminUserId || nonAdminUserId;

    if (activeToken || activeUserId) {
      ClinicApiService.getCurrentUser(activeToken, activeUserId)
        .then(async meRes => {
          if (meRes && meRes.success && meRes.user) {
            setCurrentUser(meRes.user);
            if (meRes.user.role === 'administrator') {
              setActiveTabState('dashboard');
            }
            // Pull full centralized database with verified credentials
            const res = await ClinicApiService.sync(meRes.user, activeToken);
            if (res && res.success) {
              if (res.patients) setPatients(res.patients);
              if (res.queue) setQueue(res.queue);
              if (res.vitalSigns) setVitalSigns(res.vitalSigns);
              if (res.consultations) setConsultations(res.consultations);
              if (res.medicines && res.medicines.length > 0) setMedicines(res.medicines);
              if (res.transactions && res.transactions.length > 0) setTransactions(res.transactions);
              if (res.appointments) setAppointments(res.appointments);
              if (res.certificates) setCertificates(res.certificates);
              if (res.users && res.users.length > 0) setUsers(res.users);
              if (res.activityLogs && res.activityLogs.length > 0) setActivityLogs(res.activityLogs);
              if (res.notifications) setNotifications(res.notifications);
              if (res.registrationRequests && res.registrationRequests.length > 0) setRegistrationRequests(res.registrationRequests);
              if (res.rolePermissions) setRolePermissions(res.rolePermissions);
            }
          } else {
            // If session expired or invalid, clear stored session keys
            if (typeof window !== 'undefined') {
              localStorage.removeItem('psu_mcis_admin_session_token');
              localStorage.removeItem('psu_mcis_admin_user_id');
              localStorage.removeItem('psu_mcis_active_user_id');
              sessionStorage.removeItem('psu_mcis_session_token');
              sessionStorage.removeItem('psu_mcis_user_id');
            }
            setCurrentUser(null);
            const res = await ClinicApiService.sync(null);
            if (res && res.success) {
              if (res.queue) setQueue(res.queue);
              if (res.rolePermissions) setRolePermissions(res.rolePermissions);
            }
          }
        })
        .catch(async () => {
          setCurrentUser(null);
          const res = await ClinicApiService.sync(null);
          if (res && res.success) {
            if (res.queue) setQueue(res.queue);
            if (res.rolePermissions) setRolePermissions(res.rolePermissions);
          }
        })
        .finally(() => {
          setIsRestoringSession(false);
        });
    } else {
      // Unauthenticated visitor view
      ClinicApiService.sync(null)
        .then(res => {
          if (res && res.success) {
            if (res.queue) setQueue(res.queue);
            if (res.rolePermissions) setRolePermissions(res.rolePermissions);
          }
        })
        .finally(() => {
          setIsRestoringSession(false);
        });
    }
  }, []);

  // 2. Continuous Background Polling Synchronization (Laptop <-> PC <-> Phone share live data)
  // - Pauses while the browser tab is hidden (no needless requests / battery use)
  // - Skips re-applying data when the shared database has not changed (no needless re-rendering)
  useEffect(() => {
    let lastRevision: number | null = null;
    let pollCount = 0;

    const runSync = async () => {
      if (!autoSyncEnabled) return;
      if (typeof document !== 'undefined' && document.hidden) return;
      try {
        const res = await ClinicApiService.sync(currentUser);
        if (res && res.success) {
          pollCount++;
          const hasRevision = typeof res.revision === 'number';
          // Always do a full refresh every 12th poll (~30s) as a safety net
          const unchanged = hasRevision && res.revision === lastRevision && pollCount % 12 !== 0;
          if (hasRevision) lastRevision = res.revision;
          if (unchanged) return;
          applySyncData(res);
        }
      } catch {
        // Silently tolerate momentary network disconnects
      }
    };

    const timer = setInterval(runSync, 2500);
    const onVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden && autoSyncEnabled) runSync();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [currentUser, autoSyncEnabled]);

  // Device Mode & Responsive Screen Adaptation State
  const [deviceMode, setDeviceModeState] = useState<'auto' | 'pc' | 'mobile'>('auto');
  const [windowWidth, setWindowWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [deviceToast, setDeviceToast] = useState<string | null>(null);

  // Auto-detect window resize and orientation change
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setWindowWidth(width);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Compute screen category
  const screenCategory: 'mobile' | 'tablet' | 'laptop' | 'desktop' =
    windowWidth < 640 ? 'mobile' : windowWidth < 1024 ? 'tablet' : windowWidth < 1440 ? 'laptop' : 'desktop';

  // Compute resolved isMobile boolean based on auto or manual override
  const isMobile =
    deviceMode === 'mobile'
      ? true
      : deviceMode === 'pc'
      ? false
      : windowWidth < 1024; // In auto mode: screens < 1024px adapt to mobile layout

  // When device mode is changed
  const setDeviceMode = (mode: 'auto' | 'pc' | 'mobile') => {
    setDeviceModeState(mode);
    if (mode === 'pc') {
      setMobileMenuOpen(false);
      setDeviceToast('🖥️ PC / Laptop Mode Active — Interface expanded with fixed PSU sidebar and wide multi-column layout');
    } else if (mode === 'mobile') {
      setDeviceToast('📱 Mobile Device Mode Active — Interface fitted with slide-out drawer & thumb navigation');
    } else {
      const willBeMobile = windowWidth < 1024;
      setDeviceToast(
        willBeMobile
          ? `⚡ Auto-Detected Mobile View (${windowWidth}px) — Interface auto-fitted for phone/tablet touch screen`
          : `⚡ Auto-Detected PC/Laptop View (${windowWidth}px) — Interface auto-fitted for wide display`
      );
    }
  };

  // Close mobile drawer when activeTab changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [activeTab]);

  // Auto-dismiss device mode toast after 4s
  useEffect(() => {
    if (deviceToast) {
      const timer = setTimeout(() => {
        setDeviceToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [deviceToast]);

  const dismissDeviceToast = () => setDeviceToast(null);

  // General In-App Notification Toast (Replaces window.alert for mobile & iframe compliance)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'warning' | 'info' | 'error' } | null>(null);
  const [recentSmsToast, setRecentSmsToast] = useState<{ message: string; phone: string; type: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
  };

  // Puts the shared database's data on screen and detects real-time events for auto-popup numbers
  const applySyncData = (res: any) => {
    // Detect new incoming queue tickets for automatic number popup
    if (res.queue && Array.isArray(res.queue)) {
      if (knownTicketIdsRef.current.size > 0 && autoPopNumberEnabled) {
        for (const t of res.queue) {
          if (!knownTicketIdsRef.current.has(t.id)) {
            // Check role-based interest
            if (currentUser?.role === 'doctor') {
              triggerNumberPopup({
                type: 'queue',
                number: t.ticketNumber,
                title: 'New Patient Ready for Consultation',
                patientName: t.patientName,
                patientId: t.patientId,
                department: t.department,
                details: `Priority: ${t.priority} · Station: ${t.counterOrRoom || 'Consultation Room'} · Status: ${t.stage}`,
                actionLabel: 'Open Consultation Record',
                linkTab: 'consultations'
              });
            } else if (currentUser?.role === 'nurse') {
              triggerNumberPopup({
                type: 'queue',
                number: t.ticketNumber,
                title: 'Live Queue Ticket Alert',
                patientName: t.patientName,
                patientId: t.patientId,
                department: t.department,
                details: `Ticket #${t.ticketNumber} registered at ${t.stage} (${t.priority})`,
                actionLabel: 'View Queue',
                linkTab: 'queue'
              });
            }
          }
        }
      }
      res.queue.forEach((t: QueueTicket) => knownTicketIdsRef.current.add(t.id));
    }

    // Detect new incoming consultation records
    if (res.consultations && Array.isArray(res.consultations)) {
      if (knownConsultationIdsRef.current.size > 0 && autoPopNumberEnabled) {
        for (const c of res.consultations) {
          if (!knownConsultationIdsRef.current.has(c.id)) {
            const pat = res.patients?.find((p: any) => p.id === c.patientId);
            if (currentUser?.role === 'doctor' || currentUser?.role === 'nurse') {
              triggerNumberPopup({
                type: 'consultation',
                number: (c.id || 'CR').toUpperCase(),
                title: 'New Clinical Consultation Record Synced',
                patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Patient File',
                patientId: c.patientId,
                details: `Diagnosis: ${c.assessmentDiagnosis || 'Clinical Assessment Updated'}`,
                actionLabel: 'Inspect Consultation Record',
                linkTab: 'consultations'
              });
            }
          }
        }
      }
      res.consultations.forEach((c: Consultation) => knownConsultationIdsRef.current.add(c.id));
    }

    if (res.patients) setPatients(res.patients);
    if (res.queue) setQueue(res.queue);
    if (res.vitalSigns) setVitalSigns(res.vitalSigns);
    if (res.consultations) setConsultations(res.consultations);
    if (res.medicines && res.medicines.length > 0) setMedicines(res.medicines);
    if (res.transactions && res.transactions.length > 0) setTransactions(res.transactions);
    if (res.appointments) setAppointments(res.appointments);
    if (res.certificates) setCertificates(res.certificates);
    if (res.users && res.users.length > 0) setUsers(res.users);
    if (res.activityLogs && res.activityLogs.length > 0) setActivityLogs(res.activityLogs);
    if (res.notifications) setNotifications(res.notifications);
    if (res.registrationRequests && res.registrationRequests.length > 0) setRegistrationRequests(res.registrationRequests);
    if (res.rolePermissions) setRolePermissions(res.rolePermissions);
  };

  // Centralized System Refresh (Manual button & Automatic synchronization)
  const refreshSystem = async (manual: boolean = false): Promise<boolean> => {
    setIsSyncing(true);
    try {
      const res = await ClinicApiService.sync(currentUser);
      if (res && res.success) {
        applySyncData(res);
        setLastSyncTime(new Date());
        if (manual) {
          showToast('✓ Clinic system refreshed! All records and queue numbers updated.', 'success');
        }
        return true;
      }
      if (manual) showToast('System synced with live server.', 'info');
      return false;
    } catch {
      if (manual) showToast('Failed to refresh clinic system. Check network connection.', 'error');
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Immediately reloads everything from the shared database
  const refreshFromServer = async () => {
    await refreshSystem(false);
  };

  // When a change could not be saved: tell the person right away AND remove the unsaved record from the screen
  // straight away (instead of leaving it there until the next background refresh).
  const reportSaveResult = (saved: unknown, what: string) => {
    if (!saved) {
      showToast(`Could not save ${what} to the shared database. The change was undone - please check your connection and try again.`, 'error');
      refreshFromServer();
    }
  };

  const dismissToast = () => setToast(null);
  const dismissSmsToast = () => setRecentSmsToast(null);

  useEffect(() => {
    if (recentSmsToast) {
      const timer = setTimeout(() => {
        setRecentSmsToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [recentSmsToast]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Helper for logging audit events (Republic Act No. 10173 compliance)
  const logActivity = (
    action: string,
    module: ActivityLog['module'],
    details: string,
    status: 'Success' | 'Warning' | 'Error' = 'Success',
    saveToServer: boolean = true
  ) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: currentUser?.id || 'guest',
      userName: currentUser?.fullName || 'Anonymous / Guest',
      userRole: currentUser?.role || 'staff',
      action,
      module,
      details,
      ipAddress: '192.168.10.' + (Math.floor(Math.random() * 80) + 10) + ' (PSU Campus Intranet)',
      status,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setActivityLogs(prev => [newLog, ...prev]);
    // Save to the shared database so audit logs are the same on every device
    if (saveToServer) {
      ClinicApiService.logActivity({ action, module, details, status }, currentUser).catch(() => {});
    }
  };

  // Centralized Database Login Handler
  const login = async (usernameOrEmail: string, password?: string): Promise<{ success: boolean; error?: string; role?: UserRole }> => {
    const cleanInput = usernameOrEmail.trim().toLowerCase();
    if (!cleanInput) {
      return { success: false, error: 'Please enter your username or registered institutional email.' };
    }

    // Authenticate against centralized backend database
    const res = await ClinicApiService.login(cleanInput, password);
    if (!res.success || !res.user) {
      return {
        success: false,
        error: res.error || 'Authentication failed. Please verify credentials or submit a Registration Request.'
      };
    }

    const authenticatedUser = res.user;
    setCurrentUser(authenticatedUser);

    if (typeof window !== 'undefined') {
      if (authenticatedUser.role === 'administrator') {
        // Admin session: stored in localStorage so it strictly persists across refresh, reopening site, and navigation
        localStorage.setItem('psu_mcis_admin_session_token', res.token || '');
        localStorage.setItem('psu_mcis_admin_user_id', authenticatedUser.id);
        sessionStorage.removeItem('psu_mcis_session_token');
        sessionStorage.removeItem('psu_mcis_user_id');
      } else {
        // Non-admin users keep standard session storage
        sessionStorage.setItem('psu_mcis_session_token', res.token || '');
        sessionStorage.setItem('psu_mcis_user_id', authenticatedUser.id);
        localStorage.setItem('psu_mcis_active_user_id', authenticatedUser.id);
        localStorage.removeItem('psu_mcis_admin_session_token');
        localStorage.removeItem('psu_mcis_admin_user_id');
      }
    }

    setActiveTab(authenticatedUser.role === 'staff' ? 'inventory' : 'dashboard');
    logActivity('User Authentication', 'Authentication', `User ${authenticatedUser.fullName} logged into station. Role identified as ${authenticatedUser.role.toUpperCase()}`, 'Success', false);

    // Re-fetch all fresh records from centralized database
    const syncRes = await ClinicApiService.sync(authenticatedUser, res.token);
    if (syncRes && syncRes.success) {
      if (syncRes.patients) setPatients(syncRes.patients);
      if (syncRes.queue) setQueue(syncRes.queue);
      if (syncRes.vitalSigns) setVitalSigns(syncRes.vitalSigns);
      if (syncRes.consultations) setConsultations(syncRes.consultations);
      if (syncRes.medicines && syncRes.medicines.length > 0) setMedicines(syncRes.medicines);
      if (syncRes.transactions && syncRes.transactions.length > 0) setTransactions(syncRes.transactions);
      if (syncRes.appointments) setAppointments(syncRes.appointments);
      if (syncRes.certificates) setCertificates(syncRes.certificates);
      if (syncRes.users && syncRes.users.length > 0) setUsers(syncRes.users);
      if (syncRes.activityLogs && syncRes.activityLogs.length > 0) setActivityLogs(syncRes.activityLogs);
      if (syncRes.notifications) setNotifications(syncRes.notifications);
      if (syncRes.registrationRequests && syncRes.registrationRequests.length > 0) setRegistrationRequests(syncRes.registrationRequests);
      if (syncRes.rolePermissions) setRolePermissions(syncRes.rolePermissions);
    }

    return { success: true, role: authenticatedUser.role };
  };

  // Logout handler
  const logout = () => {
    const adminToken = typeof window !== 'undefined'
      ? (localStorage.getItem('psu_mcis_admin_session_token') || sessionStorage.getItem('psu_mcis_session_token'))
      : null;

    if (adminToken) {
      ClinicApiService.logout(adminToken).catch(() => {});
    }

    if (currentUser) {
      logActivity('User Logout', 'Authentication', `User ${currentUser.fullName} explicitly terminated session.`);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('psu_mcis_admin_session_token');
      localStorage.removeItem('psu_mcis_admin_user_id');
      localStorage.removeItem('psu_mcis_active_user_id');
      sessionStorage.removeItem('psu_mcis_session_token');
      sessionStorage.removeItem('psu_mcis_user_id');
    }

    setCurrentUser(null);
    setActiveTabState('dashboard');
  };

  const getVerificationReceiptForUser = (userId: string): VerificationReceipt | null => {
    const user = users.find(u => u.id === userId);
    if (!user) return null;
    const token = user.activationToken || `act_${user.id.replace('usr-', '')}`;
    const verifCode = user.verificationCode || `PSU-${user.id.slice(-3).padStart(3, '8')}-204`;
    const tempPass = user.temporaryPassword || user.password || '12345678';
    return {
      id: `rec-${user.id}`,
      recipientName: user.fullName,
      recipientEmail: user.email,
      recipientPhone: user.contactNumber,
      username: user.username,
      assignedRole: user.role,
      institutionalId: user.institutionalId,
      department: user.department,
      accountStatus: user.accountStatus || 'active',
      activationToken: token,
      verificationCode: verifCode,
      temporaryPassword: tempPass,
      activationUrl: `https://clinic.psu.edu.ph/activate?token=${token}`,
      issuedAt: user.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      issuedBy: currentUser?.fullName || 'Master Administrator Ferdinand',
      referenceNumber: `REC-${user.id.slice(-6).toUpperCase()}`
    };
  };

  const addUser = async (
    userData: Omit<User, 'id'>, 
    options?: { sendActivationEmail?: boolean; accountStatus?: 'active' | 'pending_activation' }
  ): Promise<{ success: boolean; user?: User; receipt?: VerificationReceipt; error?: string }> => {
    const activationToken = `act_${Math.random().toString(36).substring(2, 12)}`;
    const verificationCode = `PSU-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    const temporaryPassword = (userData as any).password || `PsuClinic@${Math.floor(1000 + Math.random() * 9000)}`;
    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const initialStatus = options?.accountStatus === 'pending_activation' ? 'inactive' : (userData.status || 'active');
    const newUserPayload = {
      ...userData,
      status: initialStatus,
      accountStatus: options?.accountStatus || 'active',
      activationToken,
      verificationCode,
      temporaryPassword,
      isEmailVerified: true,
      password: temporaryPassword,
      createdAt: nowStr
    };

    // Save directly to centralized database
    const apiResult = await ClinicApiService.addUser(newUserPayload, currentUser);
    if (!apiResult.success || !apiResult.user) {
      const errMsg = apiResult.error || 'Failed to save new user to database.';
      showToast(`❌ ${errMsg}`, 'error');
      return { success: false, error: errMsg };
    }

    const savedUser = apiResult.user;
    setUsers(prev => [savedUser, ...prev.filter(u => u.id !== savedUser.id)]);

    const receipt: VerificationReceipt = {
      id: `rec-${savedUser.id}`,
      recipientName: savedUser.fullName,
      recipientEmail: savedUser.email,
      recipientPhone: savedUser.contactNumber,
      username: savedUser.username,
      assignedRole: savedUser.role,
      institutionalId: savedUser.institutionalId,
      department: savedUser.department,
      accountStatus: options?.accountStatus || 'active',
      activationToken: savedUser.activationToken || activationToken,
      verificationCode: savedUser.verificationCode || verificationCode,
      temporaryPassword: savedUser.temporaryPassword || temporaryPassword,
      activationUrl: `https://clinic.psu.edu.ph/activate?token=${savedUser.activationToken || activationToken}`,
      issuedAt: nowStr,
      issuedBy: currentUser?.fullName || 'Master Clinic Administrator',
      referenceNumber: `REC-${Date.now().toString().slice(-6)}`
    };

    setLastIssuedReceipt(receipt);

    logActivity(
      'Admin Registered User', 
      'Security', 
      `Administrator created ${savedUser.role.toUpperCase()} account for ${savedUser.fullName} (${savedUser.email}). Saved to centralized database.`
    );

    // Re-sync all users from centralized database
    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes && syncRes.users) {
      setUsers(syncRes.users);
    }

    if (options?.sendActivationEmail !== false) {
      showToast(
        `✓ Account created for ${savedUser.fullName} and saved in centralized database!`, 
        'success'
      );
    }

    return { success: true, user: savedUser, receipt };
  };

  const updateUser = async (userId: string, updates: Partial<User>): Promise<boolean> => {
    const apiResult = await ClinicApiService.updateUser(userId, updates, currentUser);
    if (!apiResult.success) {
      showToast(`❌ Database error: ${apiResult.error || 'Failed to update user'}`, 'error');
      return false;
    }

    const updated = apiResult.user || updates;
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updated } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, ...updated } : null);
    }

    // Re-fetch from database to guarantee truth
    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes && syncRes.users) {
      setUsers(syncRes.users);
    }

    logActivity('User Profile Edited', 'Security', `Administrator updated profile data and credentials for user ID ${userId}`);
    showToast('✓ User credentials and information updated in database.', 'success');
    return true;
  };

  // Registration Request Flow
  const submitRegistrationRequest = async (
    data: Omit<RegistrationRequest, 'id' | 'submittedAt' | 'status' | 'activationToken'>
  ): Promise<RegistrationRequest> => {
    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    const newReq: RegistrationRequest = {
      ...data,
      id: `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      submittedAt: nowStr,
      status: 'Pending',
      activationToken: `act_${Math.random().toString(36).substring(2, 12)}`
    };

    setRegistrationRequests(prev => [newReq, ...prev]);

    // Save to database
    await ClinicApiService.submitRegistrationRequest(newReq);

    logActivity(
      'Submitted Registration Request', 
      'Authentication', 
      `Applicant ${newReq.fullName} submitted registration request for role [${newReq.requestedRole.toUpperCase()}]`
    );

    return newReq;
  };

  const approveRegistrationRequest = async (
    requestId: string, 
    adminNotes?: string
  ): Promise<{ success: boolean; user?: User; activationToken?: string; receipt?: VerificationReceipt; error?: string }> => {
    const res = await ClinicApiService.processRegistrationRequest(requestId, {
      status: 'Approved',
      adminNotes: adminNotes || 'Verified and approved by Master System Administrator.',
      reviewedBy: currentUser?.fullName || 'Administrator',
      reviewedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }, currentUser);

    if (!res.success) {
      showToast(`❌ Database Error: ${res.error || 'Failed to approve request'}`, 'error');
      return { success: false, error: res.error };
    }

    const createdUser = res.user;
    const target = res.request;

    // Refresh data from database
    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes) {
      if (syncRes.users) setUsers(syncRes.users);
      if (syncRes.registrationRequests) setRegistrationRequests(syncRes.registrationRequests);
    }

    let receipt: VerificationReceipt | undefined;
    if (createdUser) {
      receipt = {
        id: `rec-${createdUser.id}`,
        recipientName: createdUser.fullName,
        recipientEmail: createdUser.email,
        recipientPhone: createdUser.contactNumber,
        username: createdUser.username,
        assignedRole: createdUser.role,
        institutionalId: createdUser.institutionalId,
        department: createdUser.department,
        accountStatus: 'active',
        activationToken: createdUser.activationToken || `act_${Date.now()}`,
        verificationCode: createdUser.verificationCode || `PSU-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`,
        temporaryPassword: createdUser.temporaryPassword || createdUser.password || `PsuClinic@${Math.floor(1000 + Math.random() * 9000)}`,
        activationUrl: `https://clinic.psu.edu.ph/activate?token=${createdUser.activationToken}`,
        issuedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        issuedBy: currentUser?.fullName || 'Master Clinic Administrator',
        referenceNumber: `REC-${Date.now().toString().slice(-6)}`
      };
      setLastIssuedReceipt(receipt);
    }

    showToast(
      `✓ Request approved! Account created in centralized database and official activation dispatched to ${target?.email || 'user'}.`,
      'success'
    );

    return { success: true, user: createdUser, activationToken: createdUser?.activationToken, receipt };
  };

  const rejectRegistrationRequest = (requestId: string, reason?: string) => {
    const target = registrationRequests.find(r => r.id === requestId);
    if (!target) return;

    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setRegistrationRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'Rejected',
          adminNotes: reason || 'Application could not be verified with university records.',
          reviewedBy: currentUser?.fullName || 'Administrator',
          reviewedAt: nowStr
        };
      }
      return r;
    }));

    logActivity(
      'Rejected Registration Request',
      'Security',
      `Administrator rejected account request for ${target.fullName}. Reason: ${reason || 'Unverified credentials'}`
    );

    showToast(`Account request for ${target.fullName} was rejected. Applicant notified.`, 'info');
  };

  const requestAdditionalInfo = (requestId: string, inquiryText: string) => {
    const target = registrationRequests.find(r => r.id === requestId);
    if (!target) return;

    setRegistrationRequests(prev => prev.map(r => {
      if (r.id === requestId) {
        return {
          ...r,
          status: 'Needs Information',
          adminNotes: inquiryText,
          reviewedBy: currentUser?.fullName || 'Administrator'
        };
      }
      return r;
    }));

    showToast(`Clarification request sent to ${target.email}.`, 'info');
  };

  const activateAccountWithToken = async (token: string, newPassword: string): Promise<{ success: boolean; message: string; user?: User }> => {
    const res = await ClinicApiService.activateAccount(token, newPassword);
    if (!res.success) {
      return { success: false, message: res.error || 'Invalid or expired activation link.' };
    }

    // Refresh state from database
    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes) {
      if (syncRes.users) setUsers(syncRes.users);
      if (syncRes.registrationRequests) setRegistrationRequests(syncRes.registrationRequests);
    }

    return { 
      success: true, 
      message: 'Your account is now fully active in the centralized database! You can now log in using your credentials.',
      user: res.user
    };
  };

  // Password Reset Flow
  const requestPasswordReset = async (usernameOrEmail: string): Promise<{ success: boolean; message: string; resetToken?: string }> => {
    const res = await ClinicApiService.requestPasswordReset(usernameOrEmail);
    if (!res.success) {
      return {
        success: false,
        message: res.error || 'No registered clinic account was found with that username or email address.'
      };
    }

    return {
      success: true,
      message: `Password reset verification link successfully sent to ${res.email}. Please check your inbox.`,
      resetToken: res.token
    };
  };

  const completePasswordReset = async (token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const res = await ClinicApiService.completePasswordReset(token, newPassword);
    if (!res.success) {
      return { success: false, message: res.error || 'Invalid, already completed, or expired password reset token.' };
    }

    return { success: true, message: 'Your password has been successfully reset in the centralized database! You may now log in.' };
  };

  const updateUserProfile = async (userId: string, updates: Partial<User>) => {
    await updateUser(userId, updates);
  };

  const updateCurrentUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    await updateUserProfile(currentUser.id, updates);
  };

  const toggleUserStatus = async (userId: string) => {
    const u = users.find(x => x.id === userId);
    if (!u) return;
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    await updateUser(userId, { status: newStatus });
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    await updateUser(userId, { role: newRole });
  };

  const deleteUser = async (userId: string): Promise<boolean> => {
    const target = users.find(u => u.id === userId);
    if (!target) return false;
    if (target.role === 'administrator' && users.filter(u => u.role === 'administrator').length <= 1) {
      showToast('Cannot delete the primary master administrator account.', 'error');
      return false;
    }

    const res = await ClinicApiService.deleteUser(userId, currentUser);
    if (!res.success) {
      showToast(`❌ Database error: ${res.error || 'Failed to delete user'}`, 'error');
      return false;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    logActivity('User Account Deletion', 'Security', `Administrator purged user account: ${target.fullName} (${target.username})`);
    showToast(`✓ Account for ${target.fullName} removed from centralized database.`, 'info');

    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes && syncRes.users) {
      setUsers(syncRes.users);
    }
    return true;
  };

  const resetUserPassword = async (userId: string): Promise<{ tempPass: string; message: string }> => {
    const target = users.find(u => u.id === userId);
    const tempPass = `PSU-${Math.floor(100000 + Math.random() * 900000)}`;
    const updateRes = await ClinicApiService.updateUser(userId, { password: tempPass }, currentUser);
    if (!updateRes.success) {
      showToast(`❌ Database error: ${updateRes.error || 'Failed to update user password'}`, 'error');
      return {
        tempPass: '',
        message: 'Failed to update user password in centralized database.'
      };
    }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, password: tempPass } : u));
    logActivity('Password Reset Key Generated', 'Security', `Administrator generated temporary one-time password for user ${target?.username || userId}`);
    showToast(`One-time temporary password generated for ${target?.fullName || 'User'}: ${tempPass}`, 'success');
    return {
      tempPass,
      message: `Temporary password '${tempPass}' issued for ${target?.fullName}. Must be updated on next sign-in.`
    };
  };

  const updateRolePermissions = (role: UserRole, updates: Partial<RolePermissions>) => {
    setRolePermissions(prev => ({
      ...prev,
      [role]: { ...prev[role], ...updates }
    }));
    logActivity('Role Permissions Configured', 'Security', `Administrator updated system access permissions for ${role.toUpperCase()}`);
    ClinicApiService.updateRolePermissions(role, updates, currentUser).then(r => reportSaveResult(r, 'the permissions')).catch(() => {});
    showToast(`Permissions updated for ${role.toUpperCase()} role.`, 'success');
  };

  const toggleModulePermission = (role: UserRole, module: ClinicModule) => {
    setRolePermissions(prev => {
      const currentAllowed = prev[role]?.allowedModules || [];
      const isAllowed = currentAllowed.includes(module);
      const updatedAllowed = isAllowed
        ? currentAllowed.filter(m => m !== module)
        : [...currentAllowed, module];
      return {
        ...prev,
        [role]: {
          ...prev[role],
          allowedModules: updatedAllowed
        }
      };
    });
    logActivity('Module Access Toggled', 'Security', `Administrator modified module '${module}' access for role ${role}`);
  };

  const resetRolePermissionsToDefault = () => {
    setRolePermissions(DEFAULT_ROLE_PERMISSIONS);
    logActivity('Permissions Reset', 'Security', 'Administrator restored all default system role permissions');
    showToast('Role permissions restored to system defaults.', 'info');
  };

  // Patients
  const addPatient = async (patientData: Omit<Patient, 'id' | 'registeredAt' | 'status'>): Promise<Patient | null> => {
    const existing = patients.find(
      p => (patientData.psuId && p.psuId && p.psuId.trim().toLowerCase() === patientData.psuId.trim().toLowerCase()) ||
           (p.firstName?.trim().toLowerCase() === patientData.firstName?.trim().toLowerCase() &&
            p.lastName?.trim().toLowerCase() === patientData.lastName?.trim().toLowerCase())
    );
    if (existing) {
      showToast(`Notice: Patient record for ${existing.firstName} ${existing.lastName} already exists in database.`, 'info');
      return existing;
    }

    const res = await ClinicApiService.addPatient(patientData, currentUser);
    if (!res.success || !res.patient) {
      showToast(`❌ Database Error: ${res.error || 'Failed to save patient to centralized database'}`, 'error');
      return null;
    }

    const newPatient = res.patient;
    setPatients(prev => [newPatient, ...prev.filter(p => p.id !== newPatient.id)]);
    logActivity(
      'Patient Registration',
      'Patient Management',
      `Registered ${newPatient.classification} ${newPatient.firstName} ${newPatient.lastName} (ID: ${newPatient.psuId}) in centralized database`
    );

    // Re-sync all patients from database to guarantee freshness
    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes && syncRes.patients) {
      setPatients(syncRes.patients);
    }

    return newPatient;
  };

  const updatePatient = async (id: string, updates: Partial<Patient>): Promise<boolean> => {
    const res = await ClinicApiService.updatePatient(id, updates, currentUser);
    if (!res.success) {
      showToast(`❌ Database Error: ${res.error || 'Failed to update patient in centralized database'}`, 'error');
      return false;
    }

    const updated = res.patient || updates;
    setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    if (selectedPatient?.id === id) {
      setSelectedPatient(prev => prev ? { ...prev, ...updated } : null);
    }

    logActivity('Patient Record Update', 'Patient Management', `Updated medical profile for patient ID ${id}`);

    // Re-sync from database
    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes && syncRes.patients) {
      setPatients(syncRes.patients);
    }

    return true;
  };

  const archivePatient = async (id: string, reason: string): Promise<boolean> => {
    const res = await ClinicApiService.archivePatient(id, reason, currentUser);
    if (!res.success) {
      showToast(`Database Error: ${res.error || 'Failed to archive patient'}`, 'error');
      return false;
    }

    setPatients(prev => prev.map(p => p.id === id ? (res.patient || { ...p, status: 'archived', archivedReason: reason, archivedAt: new Date().toISOString() }) : p));
    if (selectedPatient?.id === id) {
      setSelectedPatient(prev => prev ? (res.patient || { ...prev, status: 'archived', archivedReason: reason, archivedAt: new Date().toISOString() }) : null);
    }

    showToast(`Patient successfully archived and moved to Past Patients repository.`, 'success');

    // Re-sync from database
    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes && syncRes.patients) {
      setPatients(syncRes.patients);
    }

    return true;
  };

  const restorePatient = async (id: string): Promise<boolean> => {
    const res = await ClinicApiService.restorePatient(id, currentUser);
    if (!res.success) {
      showToast(`Database Error: ${res.error || 'Failed to restore patient'}`, 'error');
      return false;
    }

    setPatients(prev => prev.map(p => p.id === id ? (res.patient || { ...p, status: 'active', restoredAt: new Date().toISOString() }) : p));
    if (selectedPatient?.id === id) {
      setSelectedPatient(prev => prev ? (res.patient || { ...prev, status: 'active', restoredAt: new Date().toISOString() }) : null);
    }

    showToast(`Patient successfully restored back to Active health registry.`, 'success');

    // Re-sync from database
    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes && syncRes.patients) {
      setPatients(syncRes.patients);
    }

    return true;
  };

  const deletePatient = async (id: string): Promise<boolean> => {
    const res = await ClinicApiService.deletePatient(id, currentUser);
    if (!res.success) {
      showToast(`Database Error: ${res.error || 'Failed to delete patient'}`, 'error');
      return false;
    }

    setPatients(prev => prev.filter(p => p.id !== id));
    if (selectedPatient?.id === id) {
      setSelectedPatient(null);
    }

    showToast(`Patient record permanently deleted from database.`, 'success');

    // Re-sync from database
    const syncRes = await ClinicApiService.sync(currentUser);
    if (syncRes && syncRes.patients) {
      setPatients(syncRes.patients);
    }

    return true;
  };

  const getPatientHistory = async (id: string): Promise<PatientHistoryRecord | null> => {
    const res = await ClinicApiService.getPatientHistory(id, currentUser);
    if (!res.success || !res.data) {
      showToast(`Could not load full patient history: ${res.error || 'Unknown error'}`, 'error');
      return null;
    }
    return res.data;
  };

  // Vital Signs
  const recordVitalSigns = (vitalsData: Omit<VitalSigns, 'id' | 'timestamp' | 'recordedByUserId' | 'recordedByName'>): VitalSigns => {
    const newVitals: VitalSigns = {
      ...vitalsData,
      id: `vit-${Date.now()}`,
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      recordedByUserId: currentUser?.id || 'usr-nurse-1',
      recordedByName: currentUser?.fullName || 'Mary Jane P. Santos, RN'
    };
    setVitalSigns(prev => [newVitals, ...prev]);

    // If patient is in queue at triage, advance to 'Waiting Doctor'
    setQueue(prev => prev.map(t => {
      if (t.patientId === vitalsData.patientId && (t.stage === 'In Triage' || t.stage === 'Waiting Triage')) {
        return {
          ...t,
          stage: 'Waiting Doctor',
          counterOrRoom: 'Waiting Doctor Room 1',
          chiefComplaint: vitalsData.chiefComplaint || t.chiefComplaint
        };
      }
      return t;
    }));

    // Notification if urgent or emergency triage
    if (vitalsData.triageLevel === 'Emergency' || vitalsData.triageLevel === 'Urgent') {
      const targetPatient = patients.find(p => p.id === vitalsData.patientId);
      const newNotif: ClinicNotification = {
        id: `notif-${Date.now()}`,
        title: `${vitalsData.triageLevel.toUpperCase()} Triage Flag`,
        message: `${targetPatient?.firstName} ${targetPatient?.lastName} flagged with ${vitalsData.chiefComplaint}. BP: ${vitalsData.bloodPressureSystolic}/${vitalsData.bloodPressureDiastolic}.`,
        type: 'urgent_triage',
        targetRoles: ['doctor', 'nurse', 'administrator'],
        read: false,
        createdAt: 'Just now',
        linkTab: 'queue'
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    logActivity('Recorded Vital Signs & Triage', 'Vital Signs / Assessment', `Recorded clinical vitals for patient (BP: ${vitalsData.bloodPressureSystolic}/${vitalsData.bloodPressureDiastolic} mmHg, Temp: ${vitalsData.temperature}°C)`);
    ClinicApiService.recordVitalSigns(vitalsData, currentUser).then(r => reportSaveResult(r, 'vital signs')).catch(() => {});
    return newVitals;
  };

  const getPatientVitals = (patientId: string) => {
    // Strict RBAC: Students can ONLY query their own vitals
    if (currentUser?.role === 'student') {
      const myPat = patients.find(p => p.email.toLowerCase() === currentUser.email.toLowerCase() || p.psuId === currentUser.institutionalId);
      if (!myPat || myPat.id !== patientId) {
        return [];
      }
    }
    return vitalSigns.filter(v => v.patientId === patientId);
  };

  // Queue Operations
  // Ticket numbers are one running counter (E-/P-/Q- prefix by priority). The server uses the same rule and is the
  // final authority; if two devices pick the same number at the same moment the server assigns the next free one.
  const getNextTicketNumber = (priority: QueuePriority): string => {
    const prefix = priority === 'Emergency' ? 'E' : priority === 'Urgent' || priority === 'Senior/PWD' ? 'P' : 'Q';
    let max = 100;
    for (const t of queue) {
      const m = /-(\d+)$/.exec(t.ticketNumber || '');
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
    return `${prefix}-${max + 1}`;
  };

  const issueQueueTicket = (patientId: string, priority: QueuePriority, chiefComplaint?: string): QueueTicket => {
    const patient = patients.find(p => p.id === patientId);
    const ticketNumber = getNextTicketNumber(priority);

    const newTicket: QueueTicket = {
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketNumber,
      patientId,
      patientPsuId: patient?.psuId || 'N/A',
      patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Walk-in Patient',
      patientClassification: patient?.classification || 'Student',
      priority,
      stage: 'Waiting Triage',
      callStatus: 'Waiting',
      counterOrRoom: 'Triage Waiting Hall',
      createdAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      chiefComplaint: chiefComplaint || 'Routine clinic checkup'
    };

    setQueue(prev => [newTicket, ...prev]);
    logActivity('Queue Ticket Issued', 'Queue', `Issued ticket ${ticketNumber} (${priority}) for ${newTicket.patientName}`);

    // Centralized API Persistence: the server database is the single source of truth for the queue.
    // The same ticket id is sent so a repeated request can never create a second ticket.
    ClinicApiService.issueQueueTicket({ patientId, priority, chiefComplaint, id: newTicket.id, ticketNumber }, currentUser)
      .then(saved => {
        reportSaveResult(saved, 'the queue ticket');
        if (saved && saved.ticketNumber && saved.ticketNumber !== ticketNumber) {
          // Another device took this number first: show the number the server assigned
          setQueue(prev => prev.map(t => (t.id === newTicket.id ? { ...t, ticketNumber: saved.ticketNumber } : t)));
          showToast(`Ticket number updated to ${saved.ticketNumber} (${ticketNumber} was already taken).`, 'warning');
        }
      })
      .catch(() => {});

    // Automated trigger on ticket issuance
    if (patient && patient.contactNumber) {
      const config = SMSNotificationService.getConfig();
      if (config.enabled && config.autoSendOnTicketIssued) {
        SMSNotificationService.sendQueueIssuedNotification(patient, newTicket);
      }
    }

    triggerNumberPopup({
      type: 'queue',
      number: ticketNumber,
      title: 'Queue Ticket Issued',
      patientName: newTicket.patientName,
      patientId: newTicket.patientId,
      department: patient?.collegeOrDepartment,
      details: `Ticket #${ticketNumber} (${priority}) issued. Stage: ${newTicket.stage}`,
      actionLabel: 'View Queue',
      linkTab: 'queue'
    });

    const queueNotif: ClinicNotification = {
      id: `notif-q-${Date.now()}`,
      title: priority === 'Emergency' || priority === 'Urgent' ? '🚨 Priority Patient in Queue' : 'Patient Waiting in Queue',
      message: `Ticket #${ticketNumber} (${newTicket.patientName}) is waiting for ${newTicket.stage}.${chiefComplaint ? ` Complaint: ${chiefComplaint}` : ''}`,
      type: 'queue_alert',
      targetRoles: ['doctor', 'nurse'],
      read: false,
      createdAt: 'Just now',
      linkTab: 'queue'
    };
    setNotifications(prev => [queueNotif, ...prev]);

    return newTicket;
  };

  const updateQueueStage = (ticketId: string, stage: QueueStage, room?: string, persist: boolean = true) => {
    const existingTicket = queue.find(t => t.id === ticketId);
    setQueue(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          stage,
          counterOrRoom: room || t.counterOrRoom,
          servedAt: stage === 'In Triage' || stage === 'In Consultation' ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : t.servedAt,
          completedAt: stage === 'Completed' ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : t.completedAt
        };
      }
      return t;
    }));
    if (existingTicket) {
      logActivity('Queue Stage Updated', 'Queue', `Ticket ${existingTicket.ticketNumber} moved to [${stage}] in ${room || existingTicket.counterOrRoom}`);
    }

    // Centralized API Persistence
    if (persist) {
      ClinicApiService.updateQueueStage({ ticketId, stage, room }, currentUser).then(r => reportSaveResult(r, 'the queue update')).catch(() => {});
    }
  };

  /**
   * Automated trigger whenever a patient's queue status changes to 'Ready' or 'Calling'
   */
  const updateQueueCallStatus = async (ticketId: string, callStatus: QueueCallStatus, room?: string, persist: boolean = true) => {
    const targetTicket = queue.find(t => t.id === ticketId);
    if (!targetTicket) return;

    const patient = patients.find(p => p.id === targetTicket.patientId);
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const targetRoom = room || targetTicket.counterOrRoom || (callStatus === 'Calling' ? 'Doctor Consultation Room 1' : 'Triage Waiting Hall');

    let smsSent = false;
    let notifiedStatus: 'None' | 'Ready' | 'Calling' = 'None';

    if (patient && patient.contactNumber) {
      const config = SMSNotificationService.getConfig();
      if (config.enabled) {
        if (callStatus === 'Ready' && config.autoSendOnReady) {
          const res = await SMSNotificationService.sendQueueReadyNotification(patient, targetTicket, targetRoom);
          smsSent = res.success;
          notifiedStatus = 'Ready';
          setRecentSmsToast({
            message: `📱 SMS Ready Alert sent to ${patient.firstName} (${patient.contactNumber})!`,
            phone: patient.contactNumber,
            type: 'ready'
          });
        } else if (callStatus === 'Calling' && config.autoSendOnCalling) {
          playQueueChime(targetTicket.ticketNumber, targetRoom);
          const res = await SMSNotificationService.sendQueueCallingNotification(patient, targetTicket, targetRoom);
          smsSent = res.success;
          notifiedStatus = 'Calling';
          setRecentSmsToast({
            message: `📱 SMS Calling Alert sent to ${patient.firstName} (${patient.contactNumber})!`,
            phone: patient.contactNumber,
            type: 'calling'
          });
        }
      }
    }

    if (callStatus === 'Calling') {
      playQueueChime(targetTicket.ticketNumber, targetRoom);
      triggerNumberPopup({
        type: 'queue',
        number: targetTicket.ticketNumber,
        title: `Now Calling: Ticket #${targetTicket.ticketNumber}`,
        patientName: patient ? `${patient.firstName} ${patient.lastName}` : targetTicket.patientName,
        patientId: targetTicket.patientId,
        department: patient?.collegeOrDepartment,
        details: `Calling to: ${targetRoom} · Stage: ${targetTicket.stage}`,
        actionLabel: 'Inspect Patient File',
        linkTab: 'consultations'
      });
    }

    setQueue(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          callStatus,
          counterOrRoom: targetRoom,
          calledAt: callStatus === 'Calling' ? nowTime : t.calledAt,
          smsNotifiedStatus: smsSent ? notifiedStatus : t.smsNotifiedStatus,
          lastSmsSentAt: smsSent ? nowTime : t.lastSmsSentAt
        };
      }
      return t;
    }));

    // Centralized API Persistence
    if (persist) {
      ClinicApiService.updateQueueCallStatus({ ticketId, callStatus, room: targetRoom }, currentUser).then(r => reportSaveResult(r, 'the queue call status')).catch(() => {});
    }

    logActivity(
      `Queue Status Changed: ${callStatus}`,
      'Queue',
      `Ticket #${targetTicket.ticketNumber} (${targetTicket.patientName}) updated to status [${callStatus}] in ${targetRoom}. ${smsSent ? `SMS notification dispatched to ${patient?.contactNumber}.` : ''}`
    );
  };

  const sendQueueSmsNotification = async (ticketId: string, type: 'ready' | 'calling' | 'issued', room?: string): Promise<boolean> => {
    const targetTicket = queue.find(t => t.id === ticketId);
    if (!targetTicket) return false;
    const patient = patients.find(p => p.id === targetTicket.patientId);
    if (!patient || !patient.contactNumber) return false;

    const targetRoom = room || targetTicket.counterOrRoom || 'Clinic Station';
    let result: { success: boolean };

    if (type === 'ready') {
      result = await SMSNotificationService.sendQueueReadyNotification(patient, targetTicket, targetRoom);
    } else if (type === 'calling') {
      result = await SMSNotificationService.sendQueueCallingNotification(patient, targetTicket, targetRoom);
    } else {
      result = await SMSNotificationService.sendQueueIssuedNotification(patient, targetTicket);
    }

    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setQueue(prev => prev.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          smsNotifiedStatus: type === 'ready' ? 'Ready' : type === 'calling' ? 'Calling' : 'Delivered',
          lastSmsSentAt: nowTime
        };
      }
      return t;
    }));

    setRecentSmsToast({
      message: `📱 SMS [${type.toUpperCase()}] manually triggered for Ticket #${targetTicket.ticketNumber}!`,
      phone: patient.contactNumber,
      type
    });

    return result.success;
  };

  const playQueueChime = (ticketNumber: string, room: string) => {
    setRecentCalledTicket({
      number: ticketNumber,
      room,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    });
    // Web Audio synthesizer for pleasant dual-tone hospital chime
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc1.connect(gain);
      gain.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 1.2);
    } catch {
      // Audio not permitted or running without interaction
    }
  };

  const callNextInQueue = (currentStage: QueueStage, nextStage: QueueStage, targetRoom: string): QueueTicket | null => {
    // Pick the same patient the server will pick: highest priority first (Emergency > Senior/PWD > Urgent > Regular),
    const priorityOrder: Record<string, number> = { Emergency: 0, 'Senior/PWD': 1, Urgent: 2, Regular: 3 };
    // Same priority: the patient who has waited the longest (lowest ticket number) goes first
    const ticketSeq = (t: QueueTicket) => {
      const m = /-(\d+)$/.exec(t.ticketNumber || '');
      return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
    };
    const candidate = [...queue.filter(t => t.stage === currentStage)]
      .sort((a, b) => {
        const pA = priorityOrder[a.priority] ?? 4;
        const pB = priorityOrder[b.priority] ?? 4;
        if (pA !== pB) return pA - pB;
        return ticketSeq(a) - ticketSeq(b);
      })[0];
    if (!candidate) return null;

    // Update this screen only. The single "call next" request below moves the stage AND marks the patient as
    // Calling on the server in one step (separate requests could make the server call a second patient too).
    updateQueueStage(candidate.id, nextStage, targetRoom, false);
    updateQueueCallStatus(candidate.id, 'Calling', targetRoom, false);

    ClinicApiService.callNextInQueue({ currentStage, nextStage, targetRoom }, currentUser)
      .then(result => {
        reportSaveResult(result.ok, 'the call to the next patient');
        if (result.ok && result.ticket && result.ticket.id !== candidate.id) {
          // The server called a different patient than this screen expected (the queue changed) - show the real one
          refreshFromServer();
        }
      })
      .catch(() => {});
    return candidate;
  };

  // Consultations
  const recordConsultation = (consultationData: Omit<Consultation, 'id' | 'date' | 'time' | 'doctorId' | 'doctorName' | 'doctorLicense' | 'doctorPtr'>): Consultation => {
    const isDoc = currentUser?.role === 'doctor';
    const isApproved = (consultationData as any).isApproved !== undefined ? Boolean((consultationData as any).isApproved) : isDoc;
    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fullDate = new Date().toISOString().split('T')[0];
    const fullStamp = `${fullDate} ${nowTime}`;

    const newConsultation: Consultation = {
      ...consultationData,
      id: `con-${Date.now()}`,
      doctorId: currentUser?.id || 'usr-doc-1',
      doctorName: currentUser?.fullName || 'Dr. Roberto M. Manalo, MD, FPCP',
      doctorLicense: currentUser?.prcLicense || '0098412',
      doctorPtr: currentUser?.ptrNumber || 'PTR-8834921-2026',
      date: fullDate,
      time: nowTime,
      status: isApproved ? 'approved' : 'pending_approval',
      approvalStatus: isApproved ? 'approved' : 'pending_approval',
      isApproved,
      approvedAt: isApproved ? fullStamp : undefined,
      approvedByDoctorId: isApproved ? (currentUser?.id || 'usr-doc-1') : undefined,
      approvedByDoctorName: isApproved ? (currentUser?.fullName || 'Dr. Roberto M. Manalo, MD, FPCP') : undefined,
      approvedByDoctorLicense: isApproved ? (currentUser?.prcLicense || '0098412') : undefined,
      approvalNotes: (consultationData as any).approvalNotes || (isApproved ? 'Consultation completed and approved by attending physician.' : undefined)
    };

    setConsultations(prev => [newConsultation, ...prev]);

    // Mark patient's queue ticket as 'Completed'
    setQueue(prev => prev.map(t => {
      if (t.patientId === consultationData.patientId && (t.stage === 'In Consultation' || t.stage === 'Waiting Doctor')) {
        return {
          ...t,
          stage: 'Completed',
          completedAt: nowTime
        };
      }
      return t;
    }));

    // If prescription items exist, auto-create dispensing transactions or queue them
    logActivity(
      isApproved ? 'Doctor Documented & Approved Consultation' : 'Recorded Consultation', 
      'Consultation', 
      `Physician ${newConsultation.doctorName} recorded consultation for patient. Diagnosis: ${consultationData.assessmentDiagnosis}. ${isApproved ? 'Status: Approved by Doctor.' : ''}`
    );
    ClinicApiService.recordConsultation(newConsultation, currentUser).then(r => reportSaveResult(r, 'the consultation')).catch(() => {});

    const pat = patients.find(p => p.id === consultationData.patientId);
    triggerNumberPopup({
      type: 'consultation',
      number: newConsultation.id.toUpperCase(),
      title: isApproved ? 'Consultation Approved by Attending Doctor' : 'Consultation Record Documented',
      patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Patient File',
      patientId: consultationData.patientId,
      department: pat?.collegeOrDepartment,
      details: `Diagnosis: ${consultationData.assessmentDiagnosis}${isApproved ? ' · Clinically Approved' : ''}`,
      actionLabel: 'Inspect Consultation Record',
      linkTab: 'consultations'
    });

    return newConsultation;
  };

  const updateConsultation = (id: string, updates: Partial<Consultation>) => {
    setConsultations(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          ...updates,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));
    logActivity('Updated Consultation', 'Consultation', `Consultation ${id} updated by ${currentUser?.fullName || 'Physician'}`);

    ClinicApiService.updateConsultation(id, updates, currentUser).then(r => reportSaveResult(Boolean(r), 'consultation updates')).catch(() => {});

    const target = consultations.find(c => c.id === id);
    const pat = patients.find(p => p.id === target?.patientId);
    triggerNumberPopup({
      type: 'consultation',
      number: id.toUpperCase(),
      title: 'Consultation Record Saved & Updated',
      patientName: pat ? `${pat.firstName} ${pat.lastName}` : 'Patient File',
      patientId: target?.patientId,
      department: pat?.collegeOrDepartment,
      details: updates.assessmentDiagnosis ? `Diagnosis: ${updates.assessmentDiagnosis}` : 'Clinical records updated.',
      actionLabel: 'Inspect Consultation Record',
      linkTab: 'consultations'
    });
  };

  /**
   * Doctor approves finished patient consultation
   */
  const approveConsultation = async (consultationId: string, approvalNotes?: string): Promise<boolean> => {
    if (currentUser?.role !== 'doctor' && currentUser?.role !== 'administrator') {
      showToast('Only licensed attending physicians can clinically approve patient consultations.', 'warning');
      return false;
    }

    const target = consultations.find(c => c.id === consultationId);
    if (!target) {
      showToast('Consultation record not found.', 'error');
      return false;
    }

    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fullDate = new Date().toISOString().split('T')[0];
    const fullStamp = `${fullDate} ${nowTime}`;
    const doctorName = currentUser?.fullName || target.doctorName || 'Dr. Roberto M. Manalo, MD, FPCP';
    const doctorLicense = currentUser?.prcLicense || target.doctorLicense || '0098412';
    const finalNotes = approvalNotes || target.approvalNotes || 'Clinically evaluated, prescriptions authorized, and consultation finalized by attending physician.';

    // Update state
    setConsultations(prev => prev.map(c => {
      if (c.id === consultationId) {
        return {
          ...c,
          status: 'approved',
          approvalStatus: 'approved',
          isApproved: true,
          approvedAt: fullStamp,
          approvedByDoctorId: currentUser?.id || 'usr-doc-1',
          approvedByDoctorName: doctorName,
          approvedByDoctorLicense: doctorLicense,
          approvalNotes: finalNotes,
          updatedAt: new Date().toISOString()
        };
      }
      return c;
    }));

    // If patient has a queue ticket in progress, advance it to Completed
    setQueue(prev => prev.map(t => {
      if (t.patientId === target.patientId && (t.stage === 'In Consultation' || t.stage === 'Waiting Doctor')) {
        return {
          ...t,
          stage: 'Completed',
          completedAt: nowTime
        };
      }
      return t;
    }));

    const pat = patients.find(p => p.id === target.patientId);
    const patName = pat ? `${pat.firstName} ${pat.lastName}` : 'Patient';

    logActivity(
      'Doctor Approved Consultation',
      'Consultation',
      `Attending Physician Dr. ${doctorName} (PRC #${doctorLicense}) approved finished consultation for ${patName} (${pat?.psuId || target.patientId}). Diagnosis: ${target.assessmentDiagnosis}`
    );

    triggerNumberPopup({
      type: 'consultation',
      number: consultationId.toUpperCase(),
      title: 'Consultation Approved by Attending Doctor',
      patientName: patName,
      patientId: target.patientId,
      department: pat?.collegeOrDepartment,
      details: `Diagnosis: ${target.assessmentDiagnosis} · Approved & Signed by Dr. ${doctorName}`,
      actionLabel: 'Inspect Consultation Dossier',
      linkTab: 'consultations'
    });

    showToast(`✓ Consultation for ${patName} officially approved and signed by Dr. ${doctorName}!`, 'success');

    // Persist to central database
    const apiRes = await ClinicApiService.approveConsultation(consultationId, finalNotes, currentUser);
    if (!apiRes.success) {
      showToast(`Warning on cloud sync: ${apiRes.error || 'Local update saved'}`, 'info');
    }

    return true;
  };

  const getPatientConsultations = (patientId: string) => {
    // Strict RBAC: Students can ONLY view their own consultations
    if (currentUser?.role === 'student') {
      const myPat = patients.find(p => p.email.toLowerCase() === currentUser.email.toLowerCase() || p.psuId === currentUser.institutionalId);
      if (!myPat || myPat.id !== patientId) {
        return [];
      }
    }
    return consultations.filter(c => c.patientId === patientId);
  };

  // Inventory Management
  const addMedicine = (medicineData: Omit<Medicine, 'id' | 'status'>) => {
    let status: Medicine['status'] = 'In Stock';
    if (medicineData.currentStock <= 0) status = 'Critical Stock';
    else if (medicineData.currentStock <= medicineData.minimumThreshold) status = 'Low Stock';

    const newMed: Medicine = {
      ...medicineData,
      id: `med-${Date.now()}`,
      status
    };

    setMedicines(prev => [newMed, ...prev]);
    // Save to the shared database (the server records the audit log for this action itself)
    ClinicApiService.addMedicine(newMed, currentUser)
      .then(saved => {
        reportSaveResult(saved, 'the new medicine');
        if (saved) {
          setMedicines(prev => prev.map(m => (m.id === newMed.id ? saved : m)));
        }
      })
      .catch(() => {});
  };

  const stockInMedicine = (medicineId: string, quantity: number, remarks: string, batchNumber?: string) => {
    const med = medicines.find(m => m.id === medicineId);
    if (!med) return;

    const previousStock = med.currentStock;
    const newStock = previousStock + quantity;
    let status: Medicine['status'] = 'In Stock';
    if (newStock <= med.minimumThreshold) status = 'Low Stock';

    // Add inventory transaction
    const tx: InventoryTransaction = {
      id: `tx-${Date.now()}`,
      medicineId: med.id,
      medicineName: `${med.genericName} ${med.dosageStrength}`,
      transactionType: 'Stock In',
      quantity,
      previousStock,
      newStock,
      reason: remarks || 'Restock / Purchase Delivery',
      performedBy: currentUser?.fullName || 'System Admin',
      performedRole: currentUser?.role || 'administrator',
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMedicines(prev => prev.map(m => (
      m.id === medicineId
        ? { ...m, currentStock: newStock, batchNumber: batchNumber || m.batchNumber, status }
        : m
    )));
    setTransactions(t => [tx, ...t]);
    logActivity('Stock-In Transaction', 'Inventory', `Restocked ${quantity} ${med.unit} of ${med.genericName}. Balance: ${newStock}.`);

    ClinicApiService.stockInMedicine({ medicineId, quantity, remarks, batchNumber }, currentUser).then(r => reportSaveResult(r, 'the stock-in')).catch(() => {});
  };

  const dispenseMedicine = (
    medicineId: string,
    quantity: number,
    reason: string,
    patientName?: string,
    referenceId?: string
  ): boolean => {
    const med = medicines.find(m => m.id === medicineId);
    if (!med) return false;
    if (med.currentStock < quantity) {
      showToast(`Insufficient stock! Available: ${med.currentStock} ${med.unit}, Requested: ${quantity}`, 'warning');
      return false;
    }

    const previousStock = med.currentStock;
    const newStock = previousStock - quantity;
    let status: Medicine['status'] = 'In Stock';
    if (newStock <= 0) status = 'Critical Stock';
    else if (newStock <= med.minimumThreshold) status = 'Low Stock';

    // Create transaction record
    const tx: InventoryTransaction = {
      id: `tx-${Date.now()}`,
      medicineId: med.id,
      medicineName: `${med.genericName} ${med.dosageStrength}`,
      transactionType: 'Dispensed',
      quantity,
      previousStock,
      newStock,
      reason: `${reason} ${patientName ? `(Patient: ${patientName})` : ''}`,
      referenceId: referenceId || `DSP-${Date.now().toString().slice(-6)}`,
      performedBy: currentUser?.fullName || 'Mary Jane P. Santos, RN',
      performedRole: currentUser?.role || 'nurse',
      timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };

    setMedicines(prev => prev.map(m => (m.id === medicineId ? { ...m, currentStock: newStock, status } : m)));
    setTransactions(t => [tx, ...t]);

    // Low stock warning notification
    if (newStock <= med.minimumThreshold) {
      const warningNotif: ClinicNotification = {
        id: `notif-${Date.now()}`,
        title: 'Low Stock Alert',
        message: `${med.genericName} (${med.brandName}) is at or below threshold (${newStock} ${med.unit} remaining).`,
        type: 'low_stock',
        targetRoles: ['nurse', 'staff'],
        read: false,
        createdAt: 'Just now',
        linkTab: 'inventory'
      };
      setNotifications(n => [warningNotif, ...n]);
    }

    logActivity('Dispensed Medication', 'Dispensing', `Dispensed ${quantity} ${med.unit} of ${med.genericName} to ${patientName || 'patient'}`);

    ClinicApiService.dispenseMedicine({ medicineId, quantity, reason, patientName, referenceId }, currentUser).then(r => reportSaveResult(r, 'the dispensing record')).catch(() => {});
    return true;
  };

  // Appointments
  const addAppointment = (appointmentData: Omit<Appointment, 'id' | 'createdAt'>): Appointment => {
    const newApt: Appointment = {
      ...appointmentData,
      id: `apt-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setAppointments(prev => [newApt, ...prev]);
    logActivity('Created Appointment', 'Queue', `Scheduled ${newApt.purpose} for ${newApt.patientName} on ${newApt.date} at ${newApt.time}`);
    ClinicApiService.addAppointment(appointmentData, currentUser).then(r => reportSaveResult(r, 'the appointment')).catch(() => {});
    return newApt;
  };

  const updateAppointmentStatus = (id: string, status: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    logActivity('Updated Appointment', 'Queue', `Appointment status updated to ${status}`);
    ClinicApiService.updateAppointmentStatus(id, status, currentUser).then(r => reportSaveResult(r, 'the appointment update')).catch(() => {});
  };

  // Medical Certificates
  const issueMedicalCertificate = (certData: Omit<MedicalCertificate, 'id' | 'certificateNumber' | 'issuedAt' | 'doctorName' | 'doctorTitle' | 'doctorLicense' | 'doctorPtr'>): MedicalCertificate => {
    const certNum = `MC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;
    const newCert: MedicalCertificate = {
      ...certData,
      id: `mc-${Date.now()}`,
      certificateNumber: certNum,
      issuedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      doctorName: currentUser?.fullName || 'Dr. Roberto M. Manalo, MD, FPCP',
      doctorTitle: 'University Physician & Medical Officer',
      doctorLicense: currentUser?.prcLicense || '0098412',
      doctorPtr: currentUser?.ptrNumber || 'PTR-8834921-2026'
    };

    setCertificates(prev => [newCert, ...prev]);
    logActivity('Issued Medical Certificate', 'Consultation', `Generated certificate ${certNum} for ${newCert.patientName}`);
    ClinicApiService.issueMedicalCertificate(certData, currentUser).then(r => reportSaveResult(r, 'the medical certificate')).catch(() => {});
    return newCert;
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    ClinicApiService.markNotificationsRead({ id }, currentUser).then(r => reportSaveResult(r, 'the notification update')).catch(() => {});
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    ClinicApiService.markNotificationsRead({ all: true }, currentUser).then(r => reportSaveResult(r, 'the notification update')).catch(() => {});
  };

  return (
    <ClinicContext.Provider
      value={{
        isRestoringSession,
        currentUser,
        users,
        addUser,
        updateUser,
        updateUserProfile,
        updateCurrentUserProfile,
        toggleUserStatus,
        updateUserRole,
        deleteUser,
        resetUserPassword,
        login,
        logout,
        lastIssuedReceipt,
        setLastIssuedReceipt,
        getVerificationReceiptForUser,
        registrationRequests,
        submitRegistrationRequest,
        approveRegistrationRequest,
        rejectRegistrationRequest,
        requestAdditionalInfo,
        activateAccountWithToken,
        requestPasswordReset,
        completePasswordReset,
        rolePermissions,
        updateRolePermissions,
        toggleModulePermission,
        resetRolePermissionsToDefault,
        patients,
        addPatient,
        updatePatient,
        archivePatient,
        restorePatient,
        deletePatient,
        getPatientHistory,
        selectedPatient,
        setSelectedPatient,
        vitalSigns,
        recordVitalSigns,
        getPatientVitals,
        queue,
        issueQueueTicket,
        updateQueueStage,
        updateQueueCallStatus,
        sendQueueSmsNotification,
        callNextInQueue,
        recentSmsToast,
        dismissSmsToast,
        consultations,
        recordConsultation,
        updateConsultation,
        approveConsultation,
        getPatientConsultations,
        medicines,
        transactions,
        addMedicine,
        stockInMedicine,
        dispenseMedicine,
        appointments,
        addAppointment,
        updateAppointmentStatus,
        certificates,
        issueMedicalCertificate,
        activityLogs,
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        activeTab,
        setActiveTab,
        activeModal,
        setActiveModal,
        modalPayload,
        setModalPayload,
        deviceMode,
        setDeviceMode,
        isMobile,
        screenCategory,
        mobileMenuOpen,
        setMobileMenuOpen,
        deviceToast,
        dismissDeviceToast,
        toast,
        showToast,
        dismissToast,
        playQueueChime,
        recentCalledTicket,
        isSyncing,
        lastSyncTime,
        autoSyncEnabled,
        toggleAutoSync,
        refreshSystem,
        activeNumberPopup,
        triggerNumberPopup,
        dismissNumberPopup,
        autoPopNumberEnabled,
        toggleAutoPopNumber,
        soundChimeEnabled,
        toggleSoundChime
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
