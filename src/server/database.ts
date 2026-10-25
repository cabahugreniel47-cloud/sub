import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  User,
  UserRole,
  Patient,
  VitalSigns,
  Consultation,
  Medicine,
  InventoryTransaction,
  QueueTicket,
  Appointment,
  MedicalCertificate,
  ActivityLog,
  ClinicNotification,
  RegistrationRequest,
  RolePermissions
} from '../types/clinic';
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
import {
  ARRAY_KEYS,
  connectFirestore,
  loadFromFirestore,
  persistKeys,
  persistEverything,
  waitForPersist,
  isFirestoreEnabled
} from './firestorePersistence';
import { hashPassword, verifyPassword } from './authUtils';

export function ensureStandardRoleAccounts(users: User[]): { users: User[]; modified: boolean } {
  let modified = false;
  const list = [...users];

  // Helper to ensure password is encrypted with scrypt
  const ensureHashed = (pwd?: string) => {
    if (!pwd) return hashPassword('12345678');
    if (pwd.startsWith('scrypt:')) return pwd;
    modified = true;
    return hashPassword(pwd);
  };

  // 1. Preserve existing Admin account (vincent.123 and admin)
  const vincentIdx = list.findIndex(
    u => u.username.toLowerCase() === 'vincent.123' || u.email.toLowerCase() === 'vincenttungul05@gmail.com'
  );
  if (vincentIdx >= 0) {
    const existingVincent = list[vincentIdx];
    const hashedPassword = ensureHashed(existingVincent.password || '12345678');
    list[vincentIdx] = {
      ...existingVincent,
      username: 'vincent.123',
      fullName: existingVincent.fullName || 'Vincent Tungul',
      email: existingVincent.email || 'vincenttungul05@gmail.com',
      role: 'administrator',
      title: 'Master System Administrator',
      department: 'PSU Health & Medical Services Office',
      status: 'active',
      accountStatus: 'active',
      password: hashedPassword,
      isEmailVerified: true
    };
  } else {
    modified = true;
    list.unshift({
      id: 'usr-vincent-admin',
      username: 'vincent.123',
      fullName: 'Vincent Tungul',
      email: 'vincenttungul05@gmail.com',
      role: 'administrator',
      title: 'Master System Administrator',
      department: 'PSU Health & Medical Services Office',
      status: 'active',
      accountStatus: 'active',
      password: hashPassword('12345678'),
      isEmailVerified: true,
      createdAt: 'Oct 1, 2026',
      lastLogin: '2026-10-01 08:30 AM'
    });
  }

  // 2. Doctor: username 'doctor', password 'doctor123'
  const doctorIdx = list.findIndex(u => u.username.toLowerCase() === 'doctor');
  if (doctorIdx >= 0) {
    const doc = list[doctorIdx];
    if (doc.role !== 'doctor' || !verifyPassword('doctor123', doc.password || '')) {
      list[doctorIdx] = {
        ...doc,
        role: 'doctor',
        password: hashPassword('doctor123'),
        status: 'active',
        accountStatus: 'active'
      };
      modified = true;
    }
  } else {
    modified = true;
    list.push({
      id: 'usr-role-doctor',
      username: 'doctor',
      fullName: 'Dr. Reniel V. Cabahug, MD, FPCP',
      email: 'doctor@psu.edu.ph',
      role: 'doctor',
      title: 'University Physician & Internist',
      prcLicense: '0098412',
      ptrNumber: 'PTR-8834921-2026',
      department: 'University Medical Clinic - Physician Office',
      status: 'active',
      accountStatus: 'active',
      password: hashPassword('doctor123'),
      isEmailVerified: true,
      createdAt: '2026-10-22',
      lastLogin: 'Never (Newly Created)'
    });
  }

  // 3. Nurse: username 'nurse', password 'nurse123'
  const nurseIdx = list.findIndex(u => u.username.toLowerCase() === 'nurse');
  if (nurseIdx >= 0) {
    const n = list[nurseIdx];
    if (n.role !== 'nurse' || !verifyPassword('nurse123', n.password || '')) {
      list[nurseIdx] = {
        ...n,
        role: 'nurse',
        password: hashPassword('nurse123'),
        status: 'active',
        accountStatus: 'active'
      };
      modified = true;
    }
  } else {
    modified = true;
    list.push({
      id: 'usr-role-nurse',
      username: 'nurse',
      fullName: 'Jan Nicole F. Santos, RN, MAN',
      email: 'nurse@psu.edu.ph',
      role: 'nurse',
      title: 'Head University Nurse / Triage Officer',
      prcLicense: '0471203',
      department: 'Triage & Vital Signs Station',
      status: 'active',
      accountStatus: 'active',
      password: hashPassword('nurse123'),
      isEmailVerified: true,
      createdAt: '2026-10-22',
      lastLogin: 'Never (Newly Created)'
    });
  }

  // 4. Staff: username 'staff', password 'staff123'
  const staffIdx = list.findIndex(u => u.username.toLowerCase() === 'staff');
  if (staffIdx >= 0) {
    const s = list[staffIdx];
    if (s.role !== 'staff' || !verifyPassword('staff123', s.password || '')) {
      list[staffIdx] = {
        ...s,
        role: 'staff',
        password: hashPassword('staff123'),
        status: 'active',
        accountStatus: 'active'
      };
      modified = true;
    }
  } else {
    modified = true;
    list.push({
      id: 'usr-role-staff',
      username: 'staff',
      fullName: 'Nicole D. Balingit',
      email: 'staff@psu.edu.ph',
      role: 'staff',
      title: 'Clinic Records & Reception Staff',
      department: 'Patient Intake & Queue Desk',
      status: 'active',
      accountStatus: 'active',
      password: hashPassword('staff123'),
      isEmailVerified: true,
      createdAt: '2026-10-22',
      lastLogin: 'Never (Newly Created)'
    });
  }

  // 5. Student/Teacher/Patient: username 'patient', password 'patient123'
  const patientIdx = list.findIndex(u => u.username.toLowerCase() === 'patient');
  if (patientIdx >= 0) {
    const p = list[patientIdx];
    if (p.role !== 'student' || !verifyPassword('patient123', p.password || '')) {
      list[patientIdx] = {
        ...p,
        role: 'student',
        password: hashPassword('patient123'),
        status: 'active',
        accountStatus: 'active'
      };
      modified = true;
    }
  } else {
    modified = true;
    list.push({
      id: 'usr-role-patient',
      username: 'patient',
      fullName: 'Darwin B. Morales',
      email: 'patient@psu.edu.ph',
      role: 'student',
      title: 'University Student / Patient',
      institutionalId: '2024-00123-BC',
      department: 'College of Computing Studies (BSIS-4B)',
      contactNumber: '+63 917 123 4567',
      status: 'active',
      accountStatus: 'active',
      password: hashPassword('patient123'),
      isEmailVerified: true,
      createdAt: '2026-10-22',
      lastLogin: 'Never (Newly Created)'
    });
  }

  // Ensure all passwords in user list are hashed with scrypt
  const sanitizedList = list.map(u => {
    if (u.password && !u.password.startsWith('scrypt:')) {
      modified = true;
      return { ...u, password: hashPassword(u.password) };
    }
    return u;
  });

  return { users: sanitizedList, modified };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Centralized Data Directory
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'clinic-database.json');

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
    canViewAuditLogs: true,
    canApproveConsultation: true
  },
  doctor: {
    role: 'doctor',
    label: 'University Physician / Doctor',
    description: 'Reviewing clinical consultation records documented by triage nursing staff, examining finished appointments, clinically approving patient consultations, and issuing electronic medical records.',
    allowedModules: ['dashboard', 'queue', 'consultations', 'patients', 'appointments'],
    canEditRecords: true,
    canDispenseMeds: false,
    canPrescribeRx: true,
    canIssueMedCert: true,
    canManageUsers: false,
    canViewAuditLogs: false,
    canApproveConsultation: true
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
    canViewAuditLogs: false,
    canApproveConsultation: false
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
    canViewAuditLogs: false,
    canApproveConsultation: false
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
    canViewAuditLogs: false,
    canApproveConsultation: false
  }
};

export interface SessionRecord {
  token: string;
  userId: string;
  role: UserRole;
  createdAt: string;
  lastActive: string;
}

export interface ClinicDatabaseState {
  revision: number;
  lastUpdated: string;
  users: User[];
  sessions?: SessionRecord[];
  patients: Patient[];
  vitalSigns: VitalSigns[];
  medicines: Medicine[];
  transactions: InventoryTransaction[];
  queue: QueueTicket[];
  consultations: Consultation[];
  certificates: MedicalCertificate[];
  appointments: Appointment[];
  activityLogs: ActivityLog[];
  notifications: ClinicNotification[];
  registrationRequests: RegistrationRequest[];
  rolePermissions: Record<UserRole, RolePermissions>;
}

// In-Memory Cached State
let dbState: ClinicDatabaseState;

function initializeDatabase(): ClinicDatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.patients)) {
        // Ensure sessions array exists
        parsed.sessions = parsed.sessions || [];

        // Ensure all standard role accounts exist and have secure hashed passwords
        const ensured = ensureStandardRoleAccounts(parsed.users);
        parsed.users = ensured.users;

        if (!parsed.rolePermissions) {
          parsed.rolePermissions = DEFAULT_ROLE_PERMISSIONS;
        } else {
          parsed.rolePermissions.administrator = DEFAULT_ROLE_PERMISSIONS.administrator;
          parsed.rolePermissions.doctor = DEFAULT_ROLE_PERMISSIONS.doctor;
        }

        // Safeguard: Ensure no duplicate patient entries exist in the database
        const seenPKeys = new Set<string>();
        parsed.patients = (parsed.patients || []).filter((p: Patient) => {
          const key = (p.psuId && p.psuId.trim()) || `${p.firstName || ''} ${p.lastName || ''}`.trim().toLowerCase();
          if (seenPKeys.has(key)) return false;
          seenPKeys.add(key);
          return true;
        });

        fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
        console.log(`[Clinic DB] Loaded existing centralized database from ${DB_FILE} (rev ${parsed.revision || 1}) with ${parsed.users.length} users`);
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[Clinic DB] Failed to read database file, seeding defaults:', err);
  }

  // Seed default dataset
  const initialData: ClinicDatabaseState = {
    revision: 1,
    lastUpdated: new Date().toISOString(),
    users: INITIAL_USERS,
    sessions: [],
    patients: INITIAL_PATIENTS,
    vitalSigns: INITIAL_VITALS,
    medicines: INITIAL_MEDICINES,
    transactions: INITIAL_TRANSACTIONS,
    queue: INITIAL_QUEUE,
    consultations: INITIAL_CONSULTATIONS,
    certificates: INITIAL_CERTIFICATES,
    appointments: INITIAL_APPOINTMENTS,
    activityLogs: INITIAL_LOGS,
    notifications: INITIAL_NOTIFICATIONS,
    registrationRequests: INITIAL_REGISTRATION_REQUESTS,
    rolePermissions: DEFAULT_ROLE_PERMISSIONS
  };

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    console.log(`[Clinic DB] Seeded fresh centralized database to ${DB_FILE}`);
  } catch (err) {
    console.error('[Clinic DB] Error saving initial database:', err);
  }

  return initialData;
}

dbState = initializeDatabase();

export function getDatabase(): ClinicDatabaseState {
  return dbState;
}

export function saveDatabase(updates: Partial<ClinicDatabaseState>): ClinicDatabaseState {
  if (updates.users) {
    updates.users = updates.users.map(u => {
      if (u.password && !u.password.startsWith('scrypt:')) {
        return { ...u, password: hashPassword(u.password) };
      }
      return u;
    });
  }

  dbState = {
    ...dbState,
    ...updates,
    revision: (dbState.revision || 0) + 1,
    lastUpdated: new Date().toISOString()
  };

  // Durable cloud copy (Firestore) - written in the background, never blocks the request
  persistKeys(Object.keys(updates));

  // Local file copy (backup / local development). If Firestore is active, a disk failure is not fatal.
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[Clinic DB] Error persisting database to disk:', err);
    if (!isFirestoreEnabled()) {
      throw new Error('Failed to persist centralized database to storage disk.');
    }
  }

  return dbState;
}

/**
 * Connects to Firestore and loads the shared database from it (call once before the server starts listening).
 * - If Firestore already has data, it becomes the live state (this survives host restarts/redeploys).
 * - If Firestore is empty, the current state (local file or seed data) is uploaded to it.
 * - If Firestore is unreachable, the server keeps working with the local file.
 */
export async function initPersistence(): Promise<void> {
  const connected = await connectFirestore(() => dbState);
  if (!connected) return;

  try {
    const remote = await loadFromFirestore();
    if (remote && Array.isArray(remote.users) && Array.isArray(remote.patients)) {
      const merged: any = { ...dbState };
      for (const key of ARRAY_KEYS) {
        if (Array.isArray(remote[key])) merged[key] = remote[key];
      }
      if (remote.rolePermissions) merged.rolePermissions = remote.rolePermissions;
      if (typeof remote.revision === 'number') merged.revision = remote.revision;
      if (remote.lastUpdated) merged.lastUpdated = remote.lastUpdated;

      merged.sessions = merged.sessions || [];
      merged.rolePermissions = merged.rolePermissions || DEFAULT_ROLE_PERMISSIONS;

      // Ensure standard role accounts exist and have secure hashed passwords
      let updatedFirestoreKeys: string[] = [];
      const ensured = ensureStandardRoleAccounts(merged.users);
      merged.users = ensured.users;
      if (ensured.modified) {
        updatedFirestoreKeys.push('users');
      }

      if (!merged.patients || merged.patients.length === 0) {
        if (INITIAL_PATIENTS.length > 0) {
          merged.patients = [...INITIAL_PATIENTS];
          updatedFirestoreKeys.push('patients');
        }
      }
      if (!merged.queue.some((q: QueueTicket) => q.id === 'q-student-1')) {
        if (INITIAL_QUEUE.length > 0) {
          merged.queue.push(...INITIAL_QUEUE);
          updatedFirestoreKeys.push('queue');
        }
      }
      if (!merged.consultations.some((c: Consultation) => c.id === 'con-student-1')) {
        if (INITIAL_CONSULTATIONS.length > 0) {
          merged.consultations.push(...INITIAL_CONSULTATIONS);
          updatedFirestoreKeys.push('consultations');
        }
      }
      if (!merged.vitalSigns.some((v: VitalSigns) => v.id === 'vs-student-1')) {
        if (INITIAL_VITALS.length > 0) {
          merged.vitalSigns.push(...INITIAL_VITALS);
          updatedFirestoreKeys.push('vitalSigns');
        }
      }
      if (!merged.certificates.some((c: MedicalCertificate) => c.id === 'cert-student-1')) {
        if (INITIAL_CERTIFICATES.length > 0) {
          merged.certificates.push(...INITIAL_CERTIFICATES);
          updatedFirestoreKeys.push('certificates');
        }
      }
      if (!merged.appointments.some((a: Appointment) => a.id === 'apt-student-1')) {
        if (INITIAL_APPOINTMENTS.length > 0) {
          merged.appointments.push(...INITIAL_APPOINTMENTS);
          updatedFirestoreKeys.push('appointments');
        }
      }

      dbState = merged;
      console.log(`[Clinic DB] Loaded shared database from Firestore (rev ${dbState.revision}, ${dbState.users.length} users, ${dbState.patients.length} patients).`);
      
      if (updatedFirestoreKeys.length > 0) {
        persistKeys(updatedFirestoreKeys);
      }
    } else {
      console.log('[Clinic DB] Firestore is empty, uploading current database to Firestore.');
      persistEverything();
      await waitForPersist();
    }
  } catch (err) {
    console.error('[Clinic DB] Could not load from Firestore, continuing with local data:', err);
  }
}

// Session Helpers
export function createSession(userId: string, role: UserRole): SessionRecord {
  const token = `mcis_sess_${Date.now()}_${Math.random().toString(36).substring(2, 14)}`;
  const session: SessionRecord = {
    token,
    userId,
    role,
    createdAt: new Date().toISOString(),
    lastActive: new Date().toISOString()
  };

  const currentSessions = (dbState.sessions || []).filter(s => s.userId !== userId || role !== 'administrator');
  saveDatabase({ sessions: [...currentSessions, session] });
  return session;
}

export function getSession(token: string): SessionRecord | null {
  if (!token) return null;
  const db = getDatabase();
  const found = (db.sessions || []).find(s => s.token === token);
  if (!found) return null;
  return found;
}

export function deleteSession(token: string): void {
  if (!token) return;
  const db = getDatabase();
  const filtered = (db.sessions || []).filter(s => s.token !== token);
  saveDatabase({ sessions: filtered });
}

export function sanitizeUsers(users: User[]): User[] {
  return users.map(u => {
    const { password, temporaryPassword, ...safe } = u;
    return safe as User;
  });
}

export function sanitizeUser(user: User): User {
  const { password, temporaryPassword, ...safe } = user;
  return safe as User;
}

/**
 * STRICT ROLE-BASED ACCESS CONTROL (RBAC) DATA SANITIZER
 * Enforces privacy at the server/data-access layer:
 * - Student/Patient accounts NEVER receive other patients' records, names, PSU IDs, queue tickets, or complaints.
 * - Authorized clinic staff receive clinic records appropriate to their role.
 * - Never returns password hashes to client.
 */
export function getSanitizedDataForUser(user: User | null): Partial<ClinicDatabaseState> {
  const currentDb = getDatabase();

  if (!user) {
    // Unauthenticated: Only safe public queue display status & role definitions
    return {
      revision: currentDb.revision,
      lastUpdated: currentDb.lastUpdated,
      rolePermissions: currentDb.rolePermissions,
      queue: currentDb.queue.map(q => ({
        ...q,
        patientName: 'Patient in Queue',
        patientPsuId: '******',
        chiefComplaint: undefined
      }))
    };
  }

  if (user.role === 'student') {
    // 1. Locate the student's own patient record
    const studentPatient = currentDb.patients.find(
      p => p.email.toLowerCase() === user.email.toLowerCase() ||
           (user.institutionalId && p.psuId === user.institutionalId) ||
           (p.firstName.toLowerCase() === user.fullName.split(' ')[0]?.toLowerCase() &&
            p.lastName.toLowerCase() === user.fullName.split(' ').slice(-1)[0]?.toLowerCase())
    );

    const studentPatientId = studentPatient ? studentPatient.id : null;
    const studentPsuId = studentPatient ? studentPatient.psuId : (user.institutionalId || null);

    // 2. Strict Queue Sanitization:
    // Student can ONLY see their own ticket(s). Cannot see general queue list, other names, PSU IDs, or complaints!
    const sanitizedQueue = currentDb.queue.filter(t => {
      if (studentPatientId && t.patientId === studentPatientId) return true;
      if (studentPsuId && t.patientPsuId === studentPsuId) return true;
      if (t.patientName.toLowerCase() === user.fullName.toLowerCase()) return true;
      return false;
    });

    // 3. Strict Patient Record Sanitization:
    // Student can ONLY access their own patient record
    const sanitizedPatients = studentPatient ? [studentPatient] : [];

    // 4. Strict Consultations & Rx:
    // Student can ONLY access their own consultations
    const sanitizedConsultations = currentDb.consultations.filter(
      c => studentPatientId && c.patientId === studentPatientId
    );

    // 5. Strict Vital Signs:
    // Student can ONLY access their own vitals
    const sanitizedVitals = currentDb.vitalSigns.filter(
      v => studentPatientId && v.patientId === studentPatientId
    );

    // 6. Strict Certificates:
    // Student can ONLY access their own medical certificates
    const sanitizedCertificates = currentDb.certificates.filter(
      cert => (studentPatientId && cert.patientId === studentPatientId) ||
              (studentPsuId && cert.patientPsuId === studentPsuId)
    );

    // 7. Strict Appointments:
    // Student can ONLY access their own appointments
    const sanitizedAppointments = currentDb.appointments.filter(
      a => (studentPatientId && a.patientId === studentPatientId) ||
           (studentPsuId && a.patientPsuId === studentPsuId)
    );

    // 8. Notifications for students
    const sanitizedNotifications = currentDb.notifications.filter(
      n => n.targetRoles && n.targetRoles.includes('student')
    );

    return {
      revision: currentDb.revision,
      lastUpdated: currentDb.lastUpdated,
      users: sanitizeUsers([user]),
      patients: sanitizedPatients,
      queue: sanitizedQueue,
      vitalSigns: sanitizedVitals,
      consultations: sanitizedConsultations,
      medicines: [], // Not exposed to students
      transactions: [], // Not exposed to students
      appointments: sanitizedAppointments,
      certificates: sanitizedCertificates,
      activityLogs: currentDb.activityLogs.filter(l => l.userId === user.id),
      notifications: sanitizedNotifications,
      registrationRequests: [],
      rolePermissions: currentDb.rolePermissions
    };
  }

  if (user.role === 'administrator') {
    // Privacy Shield (RA 10173): Administrator manages system accounts, roles, audit logs, and settings
    // without receiving private patient medical records, diagnoses, or clinical inputs.
    return {
      revision: currentDb.revision,
      lastUpdated: currentDb.lastUpdated,
      users: sanitizeUsers(currentDb.users),
      patients: [],
      queue: [],
      vitalSigns: [],
      consultations: [],
      medicines: [],
      transactions: [],
      appointments: [],
      certificates: [],
      activityLogs: currentDb.activityLogs,
      notifications: currentDb.notifications.filter(n => n.targetRoles && n.targetRoles.includes('administrator')),
      registrationRequests: currentDb.registrationRequests,
      rolePermissions: currentDb.rolePermissions
    };
  }

  // Authorized Clinical Staff: Doctor, Nurse, Staff
  // Return the full centralized clinic data
  return {
    revision: currentDb.revision,
    lastUpdated: currentDb.lastUpdated,
    users: sanitizeUsers(currentDb.users),
    patients: currentDb.patients,
    queue: currentDb.queue,
    vitalSigns: currentDb.vitalSigns,
    consultations: currentDb.consultations,
    medicines: currentDb.medicines,
    transactions: currentDb.transactions,
    appointments: currentDb.appointments,
    certificates: currentDb.certificates,
    activityLogs: currentDb.activityLogs.slice(0, 50),
    notifications: currentDb.notifications,
    registrationRequests: currentDb.registrationRequests,
    rolePermissions: currentDb.rolePermissions
  };
}
