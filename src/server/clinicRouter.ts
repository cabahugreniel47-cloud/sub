import { Router, Request, Response, NextFunction } from 'express';
import nodemailer from 'nodemailer';
import {
  getDatabase,
  saveDatabase,
  getSanitizedDataForUser,
  DEFAULT_ROLE_PERMISSIONS,
  createSession,
  getSession,
  deleteSession,
  sanitizeUser
} from './database';
import {
  User,
  Patient,
  VitalSigns,
  Consultation,
  QueueTicket,
  Appointment,
  MedicalCertificate,
  ActivityLog,
  InventoryTransaction,
  Medicine,
  RegistrationRequest,
  ClinicNotification,
  RolePermissions,
  UserRole
} from '../types/clinic';
import { hashPassword, verifyPassword } from './authUtils';

export const clinicRouter = Router();

// Helper to authenticate request user strictly from server-validated session token
function getRequestUser(req: Request): User | null {
  const token = (req.headers['x-session-token'] as string) ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);

  if (!token) return null;

  const session = getSession(token);
  if (!session) return null;

  const db = getDatabase();
  const user = db.users.find(u => u.id === session.userId);
  if (!user || user.status !== 'active') return null;

  return user;
}

// Middleware: ensure user is authenticated
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
  }

  (req as any).user = user;
  next();
}

// Middleware: ensure user is authorized staff
function requireStaff(req: Request, res: Response, next: NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
  }

  if (user.role === 'student') {
    return res.status(403).json({
      error: 'Access Denied: Student/Patient accounts cannot perform clinical staff operations.'
    });
  }

  (req as any).user = user;
  next();
}

// Middleware: ensure user is administrator
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const user = getRequestUser(req);
  if (!user || user.role !== 'administrator') {
    return res.status(403).json({
      error: 'Access Denied: Master System Administrator privileges required.'
    });
  }

  (req as any).user = user;
  next();
}

/**
 * GET /api/clinic/sync
 * Centralized Synchronization Endpoint
 * Returns real-time state with STRICT server-side RBAC sanitization:
 * - If Student: only receives their own patient record, own queue ticket, own consultations, own vitals.
 * - If Staff: receives records permitted for clinical operations.
 */
clinicRouter.get('/sync', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const sanitized = getSanitizedDataForUser(user);
  res.json({
    success: true,
    user: user || null,
    ...sanitized
  });
});

/**
 * POST /api/auth/login
 * Centralized Login & Credential Verification
 */
clinicRouter.post('/auth/login', (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || typeof usernameOrEmail !== 'string') {
    return res.status(400).json({ success: false, error: 'Username or institutional email is required.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, error: 'Password is required.' });
  }

  const clean = usernameOrEmail.trim().toLowerCase();
  const db = getDatabase();

  const user = db.users.find(
    u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean
  );

  if (!user) {
    return res.status(404).json({
      success: false,
      error: 'Account not found. Please verify your credentials or submit a Registration Request.'
    });
  }

  if (user.status === 'inactive') {
    return res.status(403).json({
      success: false,
      error: 'This account is deactivated or awaiting administrator activation.'
    });
  }

  // Secure Password validation using scrypt hashing
  const expectedPassword = user.password || '12345678';
  if (!verifyPassword(password, expectedPassword)) {
    return res.status(401).json({
      success: false,
      error: 'Invalid password. Please check your credentials and try again.'
    });
  }

  // Create active session in database
  const session = createSession(user.id, user.role);

  // Update last login
  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const updatedUsers = db.users.map(u => u.id === user.id ? { ...u, lastLogin: nowStr } : u);

  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    action: 'Centralized User Authentication',
    module: 'Authentication',
    details: `User ${user.fullName} logged in from device. Identified as ${user.role.toUpperCase()}.`,
    ipAddress: (req.ip || '192.168.10.45') + ' (PSU Campus Central)',
    status: 'Success',
    timestamp: nowStr
  };

  saveDatabase({
    users: updatedUsers,
    activityLogs: [newLog, ...db.activityLogs]
  });

  const { password: _p, temporaryPassword: _tp, ...safeUser } = user;

  return res.json({
    success: true,
    token: session.token,
    user: { ...safeUser, lastLogin: nowStr },
    role: user.role
  });
});

/**
 * GET /api/auth/me
 * Restores and verifies active session from centralized database
 */
clinicRouter.get('/auth/me', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'No active authenticated session found.' });
  }
  const { password: _p, temporaryPassword: _tp, ...safeUser } = user;
  return res.json({ success: true, user: safeUser, role: user.role });
});

/**
 * POST /api/auth/logout
 * Completely clears session on the server
 */
clinicRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = (req.headers['x-session-token'] as string) ||
    (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
  if (token) {
    deleteSession(token);
  }
  return res.json({ success: true, message: 'Session terminated.' });
});

/**
 * POST /api/clinic/queue/issue
 * Issue a centralized queue ticket
 */
clinicRouter.post('/queue/issue', (req: Request, res: Response) => {
  const reqUser = getRequestUser(req);
  const { patientId, priority = 'Regular', chiefComplaint = '', id: requestedId, ticketNumber: requestedNumber } = req.body;

  const db = getDatabase();

  // Idempotent: if this exact ticket id was already saved (retry / double request), return it instead of creating a second one
  if (typeof requestedId === 'string' && requestedId) {
    const existingTicket = db.queue.find(t => t.id === requestedId);
    if (existingTicket) {
      return res.json({ success: true, ticket: existingTicket });
    }
  }

  const patient = db.patients.find(p => p.id === patientId);

  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // If student is requesting, enforce they can ONLY issue for themselves!
  if (reqUser && reqUser.role === 'student') {
    const isSelf = patient.email.toLowerCase() === reqUser.email.toLowerCase() ||
      patient.psuId === reqUser.institutionalId ||
      patient.id === reqUser.id;

    if (!isSelf) {
      return res.status(403).json({
        error: 'Security Violation: Student accounts cannot issue tickets for other patients.'
      });
    }
  }

  const prefix = priority === 'Emergency' ? 'E' : priority === 'Senior/PWD' || priority === 'Urgent' ? 'P' : 'Q';

  // One running counter across all tickets. Use the number the device already showed/sent to the patient
  // when it is still free; otherwise assign the next free number (so numbers are never duplicated).
  let maxNumber = 100;
  for (const t of db.queue) {
    const m = /-(\d+)$/.exec(t.ticketNumber || '');
    if (m) maxNumber = Math.max(maxNumber, parseInt(m[1], 10));
  }
  const isFreeNumber = (n: string) => !db.queue.some(t => (t.ticketNumber || '').toLowerCase() === n.toLowerCase());
  const ticketNumber =
    typeof requestedNumber === 'string' && /^[EPQ]-\d{1,6}$/.test(requestedNumber) && isFreeNumber(requestedNumber)
      ? requestedNumber
      : `${prefix}-${maxNumber + 1}`;

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const ticketId =
    typeof requestedId === 'string' && /^q-[A-Za-z0-9_-]{3,50}$/.test(requestedId)
      ? requestedId
      : `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  const newTicket: QueueTicket = {
    id: ticketId,
    ticketNumber,
    patientId: patient.id,
    patientPsuId: patient.psuId,
    patientName: `${patient.firstName} ${patient.lastName}`,
    patientClassification: patient.classification,
    priority,
    stage: 'Waiting Triage',
    callStatus: 'Waiting',
    counterOrRoom: 'Triage Waiting Lounge',
    smsNotifiedStatus: 'None',
    createdAt: timeStr,
    chiefComplaint
  };

  const updatedQueue = [newTicket, ...db.queue];
  saveDatabase({ queue: updatedQueue });

  res.json({ success: true, ticket: newTicket });
});

/**
 * POST /api/clinic/queue/update-stage
 * Update ticket stage (Restricted to Staff)
 */
const handleUpdateStage = (req: Request, res: Response) => {
  const { ticketId, stage, room } = req.body;
  const db = getDatabase();

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let updatedTicket: QueueTicket | null = null;

  const updatedQueue = db.queue.map(t => {
    if (t.id === ticketId) {
      updatedTicket = {
        ...t,
        stage,
        counterOrRoom: room || t.counterOrRoom,
        servedAt: stage === 'In Triage' || stage === 'In Consultation' ? timeStr : t.servedAt,
        completedAt: stage === 'Completed' || stage === 'Cancelled' ? timeStr : t.completedAt
      };
      return updatedTicket;
    }
    return t;
  });

  if (!updatedTicket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  saveDatabase({ queue: updatedQueue });
  res.json({ success: true, ticket: updatedTicket });
};

clinicRouter.post('/queue/update-stage', requireStaff, handleUpdateStage);
clinicRouter.patch('/queue/update-stage', requireStaff, handleUpdateStage);

/**
 * POST / PATCH /api/clinic/queue/update-call-status
 * Update call status (Restricted to Staff)
 */
const handleUpdateCallStatus = (req: Request, res: Response) => {
  const { ticketId, callStatus, room } = req.body;
  const db = getDatabase();

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let updatedTicket: QueueTicket | null = null;

  const updatedQueue = db.queue.map(t => {
    if (t.id === ticketId) {
      updatedTicket = {
        ...t,
        callStatus,
        counterOrRoom: room || t.counterOrRoom,
        calledAt: callStatus === 'Calling' ? timeStr : t.calledAt,
        smsNotifiedStatus: callStatus === 'Calling' ? 'Calling' : callStatus === 'Ready' ? 'Ready' : t.smsNotifiedStatus,
        lastSmsSentAt: callStatus === 'Calling' || callStatus === 'Ready' ? timeStr : t.lastSmsSentAt
      };
      return updatedTicket;
    }
    return t;
  });

  if (!updatedTicket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }

  saveDatabase({ queue: updatedQueue });
  res.json({ success: true, ticket: updatedTicket });
};

clinicRouter.post('/queue/update-call-status', requireStaff, handleUpdateCallStatus);
clinicRouter.patch('/queue/update-call-status', requireStaff, handleUpdateCallStatus);

/**
 * POST /api/clinic/queue/call-next
 * Call next ticket in queue (Restricted to Staff)
 */
clinicRouter.post('/queue/call-next', requireStaff, (req: Request, res: Response) => {
  const { currentStage, nextStage, targetRoom } = req.body;
  const db = getDatabase();

  const waiting = db.queue.filter(q => q.stage === currentStage);
  if (waiting.length === 0) {
    return res.json({ success: false, message: 'No tickets waiting for this station.' });
  }

  // Priority sorting: Emergency > Senior/PWD > Urgent > Regular
  const priorityOrder: Record<string, number> = {
    Emergency: 0,
    'Senior/PWD': 1,
    Urgent: 2,
    Regular: 3
  };

  // Ticket numbers only ever go up, so the lowest number is the patient who has waited the longest
  const ticketSeq = (t: QueueTicket) => {
    const m = /-(\d+)$/.exec(t.ticketNumber || '');
    return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER;
  };

  const sorted = [...waiting].sort((a, b) => {
    const pA = priorityOrder[a.priority] ?? 4;
    const pB = priorityOrder[b.priority] ?? 4;
    if (pA !== pB) return pA - pB;
    return ticketSeq(a) - ticketSeq(b); // same priority: oldest ticket first
  });

  const nextTicket = sorted[0];

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  let calledTicket: QueueTicket | null = null;

  const updatedQueue = db.queue.map(t => {
    if (t.id === nextTicket.id) {
      calledTicket = {
        ...t,
        stage: nextStage,
        callStatus: 'Calling',
        counterOrRoom: targetRoom,
        calledAt: timeStr,
        smsNotifiedStatus: 'Calling',
        lastSmsSentAt: timeStr
      };
      return calledTicket;
    }
    return t;
  });

  saveDatabase({ queue: updatedQueue });
  res.json({ success: true, ticket: calledTicket });
});

/**
 * POST /api/clinic/patients
 * Register a new patient (Restricted to Staff)
 */
clinicRouter.post('/patients', requireStaff, (req: Request, res: Response) => {
  const patientData = req.body;
  if (!patientData.firstName || !patientData.lastName) {
    return res.status(400).json({ success: false, error: 'First name and last name are required.' });
  }

  const db = getDatabase();

  // Deduplication check: prevent creating duplicate patient records for the same PSU ID or Name
  const existingPatient = db.patients.find(
    p => (patientData.psuId && p.psuId && p.psuId.trim().toLowerCase() === patientData.psuId.trim().toLowerCase()) ||
         (p.firstName?.trim().toLowerCase() === patientData.firstName?.trim().toLowerCase() &&
          p.lastName?.trim().toLowerCase() === patientData.lastName?.trim().toLowerCase())
  );

  if (existingPatient) {
    return res.json({ success: true, patient: existingPatient, alreadyExisted: true });
  }

  const newPatient: Patient = {
    ...patientData,
    id: patientData.id || `pat-${Date.now()}`,
    registeredAt: patientData.registeredAt || new Date().toISOString().split('T')[0],
    status: patientData.status || 'active'
  };

  const filtered = db.patients.filter(p => p.id !== newPatient.id);
  try {
    saveDatabase({
      patients: [newPatient, ...filtered]
    });
    return res.json({ success: true, patient: newPatient });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Database error: Could not save patient.' });
  }
});

/**
 * PUT /api/clinic/patients/:id
 * Update patient profile
 */
clinicRouter.put('/patients/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const user = getRequestUser(req);

  const db = getDatabase();
  const patient = db.patients.find(p => p.id === id);

  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  // If student, can ONLY update their own contact info / address
  if (user && user.role === 'student') {
    const isSelf = patient.email.toLowerCase() === user.email.toLowerCase() ||
      patient.psuId === user.institutionalId;

    if (!isSelf) {
      return res.status(403).json({
        error: 'Security Violation: Student accounts cannot modify other patient records.'
      });
    }

    // Only allow updating safe fields
    const safeUpdates: Partial<Patient> = {
      contactNumber: updates.contactNumber || patient.contactNumber,
      address: updates.address || patient.address,
      emergencyContactName: updates.emergencyContactName || patient.emergencyContactName,
      emergencyContactPhone: updates.emergencyContactPhone || patient.emergencyContactPhone,
      emergencyContactRelationship: updates.emergencyContactRelationship || patient.emergencyContactRelationship
    };

    const updatedPatient = { ...patient, ...safeUpdates };
    const updatedPatients = db.patients.map(p => p.id === id ? updatedPatient : p);
    try {
      saveDatabase({ patients: updatedPatients });
      return res.json({ success: true, patient: updatedPatient });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message || 'Database error: Could not save patient changes.' });
    }
  }

  const updatedPatient = { ...patient, ...updates };
  const updatedPatients = db.patients.map(p => p.id === id ? updatedPatient : p);
  try {
    saveDatabase({ patients: updatedPatients });
    return res.json({ success: true, patient: updatedPatient });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Database error: Could not save patient changes.' });
  }
});

/**
 * Soft-delete / Archive patient into Past Patients repository with reason & audit trail
 */
const handleArchiveOrRemovePatient = (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const user = (req as any).user as User;
  const db = getDatabase();

  const patient = db.patients.find(p => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const nowStr = new Date().toISOString();
  const archiveReason = reason || 'Archived / Relocated / Inactive Record';

  const updatedPatient: Patient = {
    ...patient,
    status: 'archived',
    archivedAt: nowStr,
    archivedReason: archiveReason,
    archivedBy: user ? `${user.fullName} (${user.role})` : 'Clinic Staff'
  };

  const updatedPatients = db.patients.map(p => p.id === id ? updatedPatient : p);

  // If patient has an active queue ticket, cancel it
  const updatedQueue = (db.queue || []).map(q => {
    if (q.patientId === id && q.stage !== 'Completed' && q.stage !== 'Cancelled') {
      return { ...q, stage: 'Cancelled' as const };
    }
    return q;
  });

  // Append audit log
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user?.id || 'system',
    userName: user?.fullName || 'Clinic Staff',
    userRole: user?.role || 'nurse',
    action: 'Patient Record Archived',
    module: 'Patient Management',
    details: `Moved patient ${patient.firstName} ${patient.lastName} (${patient.psuId}) to historical archive. Reason: ${archiveReason}`,
    timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    status: 'Success'
  };

  try {
    saveDatabase({
      patients: updatedPatients,
      queue: updatedQueue,
      activityLogs: [newLog, ...(db.activityLogs || [])]
    });
    return res.json({ success: true, patient: updatedPatient, message: `Patient ${patient.firstName} ${patient.lastName} successfully archived.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Database error: Could not archive patient.' });
  }
};

clinicRouter.put('/patients/:id/archive', requireStaff, handleArchiveOrRemovePatient);
clinicRouter.put('/patients/:id/remove', requireStaff, handleArchiveOrRemovePatient);
clinicRouter.post('/patients/:id/remove', requireStaff, handleArchiveOrRemovePatient);

/**
 * PUT /api/clinic/patients/:id/restore
 * Restore archived / past patient back to Active registry
 */
clinicRouter.put('/patients/:id/restore', requireStaff, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user as User;
  const db = getDatabase();

  const patient = db.patients.find(p => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const nowStr = new Date().toISOString();

  const updatedPatient: Patient = {
    ...patient,
    status: 'active',
    restoredAt: nowStr,
    restoredBy: user ? `${user.fullName} (${user.role})` : 'Clinic Staff'
  };

  const updatedPatients = db.patients.map(p => p.id === id ? updatedPatient : p);

  // Append audit log
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user?.id || 'system',
    userName: user?.fullName || 'Clinic Staff',
    userRole: user?.role || 'nurse',
    action: 'Patient Record Restored',
    module: 'Patient Management',
    details: `Restored archived patient ${patient.firstName} ${patient.lastName} (${patient.psuId}) back to Active health registry.`,
    timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    status: 'Success'
  };

  try {
    saveDatabase({
      patients: updatedPatients,
      activityLogs: [newLog, ...(db.activityLogs || [])]
    });
    return res.json({ success: true, patient: updatedPatient, message: `Patient ${patient.firstName} ${patient.lastName} restored to active registry.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Database error: Could not restore patient.' });
  }
});

/**
 * DELETE /api/clinic/patients/:id
 * Permanent deletion / purge of patient record from database
 */
clinicRouter.delete('/patients/:id', requireStaff, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user as User;
  const db = getDatabase();

  const patient = db.patients.find(p => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  const remainingPatients = db.patients.filter(p => p.id !== id);

  // Also cancel any queue ticket
  const updatedQueue = (db.queue || []).map(q => {
    if (q.patientId === id) {
      return { ...q, stage: 'Cancelled' as const };
    }
    return q;
  });

  // Append audit log
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user?.id || 'system',
    userName: user?.fullName || 'Clinic Staff',
    userRole: user?.role || 'administrator',
    action: 'Patient Record Permanently Deleted',
    module: 'Patient Management',
    details: `Permanently deleted patient ${patient.firstName} ${patient.lastName} (${patient.psuId}) from database.`,
    timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    ipAddress: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1',
    status: 'Success'
  };

  try {
    saveDatabase({
      patients: remainingPatients,
      queue: updatedQueue,
      activityLogs: [newLog, ...(db.activityLogs || [])]
    });
    return res.json({ success: true, message: `Patient ${patient.firstName} ${patient.lastName} permanently deleted from database.` });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Database error: Could not delete patient.' });
  }
});

/**
 * GET /api/clinic/patients/:id/history
 * Comprehensive stored clinical history for both current and past patients
 */
clinicRouter.get('/patients/:id/history', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user as User;
  const db = getDatabase();

  const patient = db.patients.find(p => p.id === id);
  if (!patient) {
    return res.status(404).json({ success: false, error: 'Patient not found' });
  }

  // If student, can only view their own history
  if (user && user.role === 'student') {
    const isSelf = patient.email.toLowerCase() === user.email.toLowerCase() ||
      patient.psuId === user.institutionalId;
    if (!isSelf) {
      return res.status(403).json({ success: false, error: 'Access Denied: You cannot view other patients\' medical history.' });
    }
  }

  const vitals = (db.vitalSigns || []).filter(v => v.patientId === id);
  const consultations = (db.consultations || []).filter(c => c.patientId === id);
  const appointments = (db.appointments || []).filter(a => a.patientId === id);
  const certificates = (db.certificates || []).filter(c => c.patientId === id);

  // All prescriptions
  const prescriptions = consultations.flatMap(c =>
    (c.prescriptions || []).map(p => ({
      ...p,
      consultationDate: c.date,
      doctorName: c.doctorName
    }))
  );

  // Build chronological unified timeline
  const timeline: Array<{
    id: string;
    date: string;
    type: 'registration' | 'vitals' | 'consultation' | 'prescription' | 'appointment' | 'certificate' | 'archived' | 'restored';
    title: string;
    description: string;
    performer?: string;
    badgeColor?: string;
  }> = [];

  // Registration event
  if (patient.registeredAt) {
    timeline.push({
      id: `tl-reg-${patient.id}`,
      date: patient.registeredAt,
      type: 'registration',
      title: 'Patient Intake & Registration',
      description: `Registered as ${patient.classification} in ${patient.collegeOrDepartment}`,
      performer: 'University Clinic Records',
      badgeColor: 'bg-blue-100 text-blue-800'
    });
  }

  // Vitals events
  vitals.forEach(v => {
    timeline.push({
      id: `tl-v-${v.id}`,
      date: v.timestamp,
      type: 'vitals',
      title: `Health Assessment (${v.triageLevel} Triage)`,
      description: `BP: ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic} mmHg · HR: ${v.heartRate} bpm · Temp: ${v.temperature}°C · SpO2: ${v.oxygenSaturation}% · BMI: ${v.bmi} (${v.bmiClassification}) · Chief Complaint: ${v.chiefComplaint}`,
      performer: v.recordedByName,
      badgeColor: 'bg-emerald-100 text-emerald-800'
    });
  });

  // Consultation events
  consultations.forEach(c => {
    timeline.push({
      id: `tl-c-${c.id}`,
      date: `${c.date} ${c.time || ''}`.trim(),
      type: 'consultation',
      title: `Clinical Encounter: ${c.assessmentDiagnosis || 'General Examination'}`,
      description: `Subjective Complaint: "${c.subjective}" · Plan: ${c.planAndManagement || 'Observation & Care'}${c.prescriptions && c.prescriptions.length > 0 ? ` · ${c.prescriptions.length} Med(s) Prescribed` : ''}`,
      performer: c.approvedByDoctorName || c.doctorName || 'Attending Physician',
      badgeColor: 'bg-red-100 text-[#7F1416]'
    });
  });

  // Appointment events
  appointments.forEach(a => {
    timeline.push({
      id: `tl-a-${a.id}`,
      date: `${a.date} ${a.time || ''}`.trim(),
      type: 'appointment',
      title: `Clinic Appointment (${a.purpose})`,
      description: `Status: ${a.status}${a.notes ? ` · Notes: ${a.notes}` : ''}`,
      performer: a.doctorName || 'University Clinic',
      badgeColor: 'bg-amber-100 text-amber-800'
    });
  });

  // Certificate events
  certificates.forEach(cert => {
    timeline.push({
      id: `tl-cert-${cert.id}`,
      date: cert.issuedAt,
      type: 'certificate',
      title: `Medical Certificate Issued (${cert.certificateNumber})`,
      description: `Diagnosis: ${cert.diagnosis} · Remarks: ${cert.treatmentAndRemarks} · Rest: ${cert.recommendedRestDays} day(s) · ${cert.fitToResumeStudiesOrWork ? 'Fit to resume' : 'Bed rest recommended'}`,
      performer: cert.doctorName,
      badgeColor: 'bg-purple-100 text-purple-800'
    });
  });

  // Archival event if archived
  if (patient.status === 'archived' && patient.archivedAt) {
    timeline.push({
      id: `tl-arch-${patient.id}`,
      date: patient.archivedAt,
      type: 'archived',
      title: 'Moved to Past / Archived Patients',
      description: `Reason: ${patient.archivedReason || 'Record Archived / Removed from Active'}`,
      performer: patient.archivedBy || 'Clinic Staff',
      badgeColor: 'bg-slate-200 text-slate-800'
    });
  }

  // Restoration event if restored
  if (patient.restoredAt) {
    timeline.push({
      id: `tl-res-${patient.id}`,
      date: patient.restoredAt,
      type: 'restored',
      title: 'Patient Record Restored',
      description: 'Restored back to Active Registry',
      performer: patient.restoredBy || 'Clinic Staff',
      badgeColor: 'bg-teal-100 text-teal-800'
    });
  }

  // Sort timeline newest first
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return res.json({
    success: true,
    data: {
      patient,
      vitals,
      consultations,
      prescriptions,
      appointments,
      certificates,
      timeline
    }
  });
});

/**
 * POST /api/clinic/vitals
 * Record vital signs (Restricted to Staff)
 */
clinicRouter.post('/vitals', requireStaff, (req: Request, res: Response) => {
  const reqUser = (req as any).user as User;
  const vitalsData = req.body;
  const db = getDatabase();

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newVitals: VitalSigns = {
    ...vitalsData,
    id: `vs-${Date.now()}`,
    recordedByUserId: reqUser.id,
    recordedByName: reqUser.fullName,
    timestamp: timeStr
  };

  saveDatabase({
    vitalSigns: [newVitals, ...db.vitalSigns]
  });

  res.json({ success: true, vitalSigns: newVitals });
});

/**
 * POST /api/clinic/consultations
 * Record clinical consultation & prescriptions (Restricted to Doctors & Admin)
 */
clinicRouter.post('/consultations', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user || (user.role !== 'doctor' && user.role !== 'administrator')) {
    return res.status(403).json({
      error: 'Access Denied: Only authorized University Physicians can conduct clinical consultations.'
    });
  }

  const consultationData = req.body;
  const db = getDatabase();

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newConsultation: Consultation = {
    ...consultationData,
    id: `con-${Date.now()}`,
    doctorId: user.id,
    doctorName: user.fullName,
    doctorLicense: user.prcLicense || '0098412',
    doctorPtr: user.ptrNumber || 'PTR-8834921-2026',
    date: dateStr,
    time: timeStr,
    status: (user.role === 'doctor' || consultationData.isApproved) ? 'approved' : 'pending_approval',
    approvalStatus: (user.role === 'doctor' || consultationData.isApproved) ? 'approved' : 'pending_approval',
    isApproved: Boolean(user.role === 'doctor' || consultationData.isApproved),
    approvedAt: (user.role === 'doctor' || consultationData.isApproved) ? `${dateStr} ${timeStr}` : undefined,
    approvedByDoctorId: (user.role === 'doctor' || consultationData.isApproved) ? user.id : undefined,
    approvedByDoctorName: (user.role === 'doctor' || consultationData.isApproved) ? user.fullName : undefined,
    approvedByDoctorLicense: (user.role === 'doctor' || consultationData.isApproved) ? (user.prcLicense || '0098412') : undefined,
    approvalNotes: consultationData.approvalNotes || (user.role === 'doctor' ? 'Clinically evaluated and approved by attending physician.' : undefined)
  };

  // If patient has an active queue ticket, advance stage to 'Completed' upon doctor consultation
  const updatedQueue = db.queue.map(t => {
    if (t.patientId === newConsultation.patientId && (t.stage === 'In Consultation' || t.stage === 'Waiting Doctor')) {
      return {
        ...t,
        stage: 'Completed' as const,
        completedAt: timeStr
      };
    }
    return t;
  });

  saveDatabase({
    consultations: [newConsultation, ...db.consultations],
    queue: updatedQueue
  });

  res.json({ success: true, consultation: newConsultation });
});

/**
 * PUT /api/clinic/consultations/:id
 * Update consultation record (Doctors and Admins)
 */
clinicRouter.put('/consultations/:id', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user || (user.role !== 'doctor' && user.role !== 'administrator')) {
    return res.status(403).json({
      error: 'Access Denied: Only authorized University Physicians can modify clinical consultations.'
    });
  }

  const { id } = req.params;
  const updates = req.body || {};
  const db = getDatabase();

  const existing = db.consultations.find(c => c.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Consultation record not found' });
  }

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const updatedConsultation: Consultation = {
    ...existing,
    ...updates,
    id: existing.id,
    updatedAt: new Date().toISOString()
  };

  const updatedConsultations = db.consultations.map(c => c.id === id ? updatedConsultation : c);

  const pat = db.patients.find(p => p.id === existing.patientId);
  const patName = pat ? `${pat.firstName} ${pat.lastName}` : 'Patient';

  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    action: 'Updated Clinical Consultation',
    module: 'Consultation',
    details: `Physician ${user.fullName} updated consultation record for ${patName} (${pat?.psuId || id}).`,
    ipAddress: (req.ip || '127.0.0.1') + ' (Central Node)',
    status: 'Success',
    timestamp: timeStr
  };

  saveDatabase({
    consultations: updatedConsultations,
    activityLogs: [newLog, ...db.activityLogs.slice(0, 199)]
  });

  res.json({ success: true, consultation: updatedConsultation });
});

/**
 * POST or PUT /api/clinic/consultations/:id/approve
 * Doctor Approves Finished Patient Consultation
 */
const handleApproveConsultation = (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user || (user.role !== 'doctor' && user.role !== 'administrator')) {
    return res.status(403).json({
      error: 'Access Denied: Only authorized University Physicians can clinically approve patient consultations.'
    });
  }

  const { id } = req.params;
  const { notes } = req.body || {};
  const db = getDatabase();

  const existing = db.consultations.find(c => c.id === id);
  if (!existing) {
    return res.status(404).json({ error: 'Consultation record not found.' });
  }

  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const fullStamp = `${dateStr} ${timeStr}`;

  const approvedConsultation: Consultation = {
    ...existing,
    status: 'approved',
    approvalStatus: 'approved',
    isApproved: true,
    approvedAt: fullStamp,
    approvedByDoctorId: user.id,
    approvedByDoctorName: user.fullName,
    approvedByDoctorLicense: user.prcLicense || '0098412',
    approvalNotes: notes || existing.approvalNotes || 'Clinically validated, prescriptions cleared, and consultation finished by attending physician.'
  };

  const updatedConsultations = db.consultations.map(c => c.id === id ? approvedConsultation : c);

  // If patient has a queue ticket, mark it completed
  const updatedQueue = db.queue.map(t => {
    if (t.patientId === existing.patientId && (t.stage === 'In Consultation' || t.stage === 'Waiting Doctor')) {
      return {
        ...t,
        stage: 'Completed' as const,
        completedAt: timeStr
      };
    }
    return t;
  });

  const pat = db.patients.find(p => p.id === existing.patientId);
  const patName = pat ? `${pat.firstName} ${pat.lastName}` : 'Patient';

  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    action: 'Approved Patient Consultation',
    module: 'Consultation',
    details: `Attending Physician Dr. ${user.fullName} (PRC #${user.prcLicense || '0098412'}) clinically approved finished consultation for ${patName} (${pat?.psuId || ''}). Diagnosis: ${existing.assessmentDiagnosis}`,
    ipAddress: (req.ip || '127.0.0.1') + ' (Central Node)',
    status: 'Success',
    timestamp: `${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${timeStr}`
  };

  const newNotif: ClinicNotification = {
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: 'Consultation Approved',
    message: `Dr. ${user.fullName} clinically approved consultation for ${patName}. Prescriptions authorized.`,
    type: 'system',
    targetRoles: ['student', 'nurse', 'administrator'],
    read: false,
    createdAt: 'Just now',
    linkTab: 'consultations'
  };

  saveDatabase({
    consultations: updatedConsultations,
    queue: updatedQueue,
    activityLogs: [newLog, ...db.activityLogs.slice(0, 199)],
    notifications: [newNotif, ...db.notifications]
  });

  res.json({ success: true, consultation: approvedConsultation });
};

clinicRouter.post('/consultations/:id/approve', handleApproveConsultation);
clinicRouter.put('/consultations/:id/approve', handleApproveConsultation);

/**
 * POST /api/clinic/appointments
 * Schedule appointment (Staff or Student self-booking)
 */
clinicRouter.post('/appointments', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  const apptData = req.body;
  const db = getDatabase();

  let finalPatientId = apptData.patientId;
  let finalPatientName = apptData.patientName;
  let finalPatientPsuId = apptData.patientPsuId;
  let finalClassification = apptData.classification || 'Student';

  if (user && user.role === 'student') {
    const cleanEmail = (user.email || '').toLowerCase().trim();
    const cleanInstId = (user.institutionalId || '').trim();
    const cleanName = (user.fullName || '').toLowerCase().trim();

    const studentPatient = db.patients.find(
      p => (cleanEmail && p.email?.toLowerCase().trim() === cleanEmail) ||
           (cleanInstId && p.psuId?.trim() === cleanInstId) ||
           (cleanName && `${p.firstName} ${p.lastName}`.toLowerCase().trim() === cleanName) ||
           p.id === apptData.patientId
    );

    if (studentPatient) {
      finalPatientId = studentPatient.id;
      finalPatientName = `${studentPatient.firstName} ${studentPatient.lastName}`;
      finalPatientPsuId = studentPatient.psuId;
      finalClassification = studentPatient.classification || 'Student';
    } else {
      finalPatientName = user.fullName || apptData.patientName;
      finalPatientPsuId = user.institutionalId || apptData.patientPsuId;
    }
  }

  const now = new Date();
  const timeStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newAppt: Appointment = {
    ...apptData,
    id: `apt-${Date.now()}`,
    patientId: finalPatientId,
    patientName: finalPatientName,
    patientPsuId: finalPatientPsuId,
    classification: finalClassification,
    createdAt: new Date().toISOString()
  };

  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user?.id || 'guest',
    userName: user?.fullName || 'Student',
    userRole: user?.role || 'student',
    action: 'Scheduled Clinic Appointment',
    module: 'Queue',
    details: `Scheduled ${newAppt.purpose} for ${newAppt.patientName} on ${newAppt.date} at ${newAppt.time} with ${newAppt.doctorName}.`,
    ipAddress: (req.ip || '127.0.0.1') + ' (Central Node)',
    status: 'Success',
    timestamp: timeStr
  };

  saveDatabase({
    appointments: [newAppt, ...db.appointments],
    activityLogs: [newLog, ...(db.activityLogs || []).slice(0, 199)]
  });

  res.json({ success: true, appointment: newAppt });
});

/**
 * PUT /api/clinic/appointments/:id/status
 * Update appointment status
 */
clinicRouter.put('/appointments/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const db = getDatabase();

  const updatedAppointments = db.appointments.map(a => a.id === id ? { ...a, status } : a);
  saveDatabase({ appointments: updatedAppointments });

  res.json({ success: true });
});

/**
 * POST /api/clinic/inventory/stock-in
 * Stock In Medication (Staff only)
 */
clinicRouter.post('/inventory/stock-in', requireStaff, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { medicineId, quantity, remarks, batchNumber } = req.body;
  const db = getDatabase();

  let updatedMed: Medicine | null = null;
  const updatedMeds = db.medicines.map(m => {
    if (m.id === medicineId) {
      const newStock = m.currentStock + Number(quantity);
      updatedMed = {
        ...m,
        currentStock: newStock,
        status: newStock <= m.minimumThreshold ? 'Low Stock' : 'In Stock',
        batchNumber: batchNumber || m.batchNumber
      };
      return updatedMed;
    }
    return m;
  });

  if (!updatedMed) {
    return res.status(404).json({ error: 'Medicine not found' });
  }

  const newTx: InventoryTransaction = {
    id: `tx-${Date.now()}`,
    medicineId,
    medicineName: (updatedMed as Medicine).genericName,
    transactionType: 'Stock In',
    quantity: Number(quantity),
    previousStock: (updatedMed as Medicine).currentStock - Number(quantity),
    newStock: (updatedMed as Medicine).currentStock,
    reason: remarks,
    performedBy: user.fullName,
    performedRole: user.role.toUpperCase(),
    timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };

  saveDatabase({
    medicines: updatedMeds,
    transactions: [newTx, ...db.transactions]
  });

  res.json({ success: true, medicine: updatedMed, transaction: newTx });
});

/**
 * POST /api/clinic/inventory/medicines
 * Add a new medicine / supply to the clinic formulary (Staff only)
 */
clinicRouter.post('/inventory/medicines', requireStaff, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const body = req.body || {};
  const db = getDatabase();

  if (!body.genericName || typeof body.genericName !== 'string') {
    return res.status(400).json({ error: 'Generic name is required.' });
  }

  const currentStock = Number(body.currentStock) || 0;
  const minimumThreshold = Number(body.minimumThreshold) || 0;
  let status: Medicine['status'] = 'In Stock';
  if (currentStock <= 0) status = 'Critical Stock';
  else if (currentStock <= minimumThreshold) status = 'Low Stock';

  const newMed: Medicine = {
    ...body,
    id: (typeof body.id === 'string' && body.id && !db.medicines.some(m => m.id === body.id))
      ? body.id
      : `med-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    currentStock,
    minimumThreshold,
    status
  };

  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user.id,
    userName: user.fullName,
    userRole: user.role,
    action: 'Added Pharmaceutical Supply',
    module: 'Inventory',
    details: `Added ${newMed.genericName} (${newMed.brandName || 'generic'}) to clinic formulary.`,
    ipAddress: (req.ip || '192.168.10.45') + ' (Central Node)',
    status: 'Success',
    timestamp: nowStr
  };

  saveDatabase({
    medicines: [newMed, ...db.medicines],
    activityLogs: [newLog, ...db.activityLogs.slice(0, 199)]
  });

  res.json({ success: true, medicine: newMed });
});

/**
 * POST /api/clinic/notifications/read
 * Mark one notification ({ id }) or all notifications ({ all: true }) as read, shared across devices
 */
clinicRouter.post('/notifications/read', requireAuth, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { id, all } = req.body || {};
  const db = getDatabase();

  const updated = db.notifications.map(n => {
    if (all) {
      return (n.targetRoles || []).includes(user.role) || user.role === 'administrator' ? { ...n, read: true } : n;
    }
    return n.id === id ? { ...n, read: true } : n;
  });

  saveDatabase({ notifications: updated });
  res.json({ success: true });
});

/**
 * POST /api/clinic/inventory/dispense
 * Dispense Medication (Staff only)
 */
clinicRouter.post('/inventory/dispense', requireStaff, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { medicineId, quantity, reason, patientName, referenceId } = req.body;
  const db = getDatabase();

  let updatedMed: Medicine | null = null;
  let hasStock = true;

  const updatedMeds = db.medicines.map(m => {
    if (m.id === medicineId) {
      if (m.currentStock < Number(quantity)) {
        hasStock = false;
        return m;
      }
      const newStock = m.currentStock - Number(quantity);
      updatedMed = {
        ...m,
        currentStock: newStock,
        status: newStock <= 0 ? 'Critical Stock' : newStock <= m.minimumThreshold ? 'Low Stock' : 'In Stock'
      };
      return updatedMed;
    }
    return m;
  });

  if (!hasStock) {
    return res.status(400).json({ error: 'Insufficient stock available to dispense.' });
  }

  if (!updatedMed) {
    return res.status(404).json({ error: 'Medicine not found' });
  }

  const newTx: InventoryTransaction = {
    id: `tx-${Date.now()}`,
    medicineId,
    medicineName: (updatedMed as Medicine).genericName,
    transactionType: 'Dispensed',
    quantity: Number(quantity),
    previousStock: (updatedMed as Medicine).currentStock + Number(quantity),
    newStock: (updatedMed as Medicine).currentStock,
    reason: `${reason} - Patient: ${patientName || 'Clinic Patient'}`,
    referenceId,
    performedBy: user.fullName,
    performedRole: user.role.toUpperCase(),
    timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };

  // Shared low-stock alert (visible on every device)
  const dispensedMed = updatedMed as Medicine;
  const alreadyAlerted = db.notifications.some(
    n => n.type === 'low_stock' && !n.read && n.message.startsWith(`${dispensedMed.genericName} (`)
  );
  const newNotifications = (dispensedMed.currentStock <= dispensedMed.minimumThreshold && !alreadyAlerted)
    ? [{
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        title: 'Low Stock Alert',
        message: `${dispensedMed.genericName} (${dispensedMed.brandName}) is at or below threshold (${dispensedMed.currentStock} ${dispensedMed.unit} remaining).`,
        type: 'low_stock' as const,
        targetRoles: ['nurse', 'staff'] as UserRole[],
        read: false,
        createdAt: 'Just now',
        linkTab: 'inventory'
      }]
    : [];

  saveDatabase({
    medicines: updatedMeds,
    transactions: [newTx, ...db.transactions],
    ...(newNotifications.length > 0 ? { notifications: [...newNotifications, ...db.notifications] } : {})
  });

  res.json({ success: true, medicine: updatedMed, transaction: newTx });
});

/**
 * POST /api/clinic/certificates
 * Issue Medical Certificate (Doctor / Admin only)
 */
clinicRouter.post('/certificates', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user || (user.role !== 'doctor' && user.role !== 'administrator')) {
    return res.status(403).json({
      error: 'Access Denied: Only licensed University Physicians can issue official Medical Certificates.'
    });
  }

  const certData = req.body;
  const db = getDatabase();

  const count = db.certificates.length + 42;
  const certNumber = `MC-2026-${count.toString().padStart(4, '0')}`;

  const newCert: MedicalCertificate = {
    ...certData,
    id: `cert-${Date.now()}`,
    certificateNumber: certNumber,
    doctorName: user.fullName,
    doctorTitle: user.title,
    doctorLicense: user.prcLicense || '0098412',
    doctorPtr: user.ptrNumber || 'PTR-8834921-2026',
    issuedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  saveDatabase({
    certificates: [newCert, ...db.certificates]
  });

  res.json({ success: true, certificate: newCert });
});

/**
 * POST /api/clinic/users
 * Create user (Admin only)
 */
clinicRouter.post('/users', requireAdmin, (req: Request, res: Response) => {
  const userData = req.body;
  if (!userData.username || !userData.fullName || !userData.email) {
    return res.status(400).json({ success: false, error: 'Username, full name, and email are required.' });
  }

  const db = getDatabase();
  const cleanUsername = userData.username.trim().toLowerCase();
  const cleanEmail = userData.email.trim().toLowerCase();

  const existing = db.users.find(u => u.username.toLowerCase() === cleanUsername || u.email.toLowerCase() === cleanEmail);
  if (existing) {
    return res.status(400).json({ success: false, error: 'A user with that username or email already exists in the centralized database.' });
  }

  const verifCode = userData.verificationCode || `PSU-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
  const tempPassword = userData.temporaryPassword || userData.password || `PsuClinic@${Math.floor(1000 + Math.random() * 9000)}`;

  const newUser: User = {
    ...userData,
    id: userData.id || `usr-${Date.now()}`,
    password: tempPassword,
    temporaryPassword: tempPassword,
    verificationCode: verifCode,
    status: userData.status || 'active',
    accountStatus: userData.accountStatus || 'active',
    createdAt: userData.createdAt || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };

  try {
    saveDatabase({
      users: [...db.users, newUser]
    });
    return res.json({ success: true, user: sanitizeUser(newUser) });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Database error: Could not save user.' });
  }
});

/**
 * PUT /api/clinic/users/:id
 * Update user profile
 */
clinicRouter.put('/users/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body;
  const currentUser = getRequestUser(req);

  if (!currentUser) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Authentication required.' });
  }

  // If not admin, can only update self
  if (currentUser.role !== 'administrator' && currentUser.id !== id) {
    return res.status(403).json({ success: false, error: 'Forbidden: Cannot edit other users.' });
  }

  const db = getDatabase();
  let updatedUser: User | null = null;
  const updatedUsers: User[] = db.users.map(u => {
    if (u.id === id) {
      const merged: User = { ...u, ...updates };
      updatedUser = merged;
      return merged;
    }
    return u;
  });

  if (!updatedUser) {
    return res.status(404).json({ success: false, error: 'User not found in database.' });
  }

  try {
    saveDatabase({ users: updatedUsers });
    return res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Database error: Could not update user.' });
  }
});

/**
 * DELETE /api/clinic/users/:id
 * Delete user from centralized database (Admin only)
 */
clinicRouter.delete('/users/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const db = getDatabase();
  const target = db.users.find(u => u.id === id);

  if (!target) {
    return res.status(404).json({ success: false, error: 'User not found in centralized database.' });
  }

  if (target.role === 'administrator' && db.users.filter(u => u.role === 'administrator').length <= 1) {
    return res.status(400).json({ success: false, error: 'Cannot delete the master administrator account.' });
  }

  const filtered = db.users.filter(u => u.id !== id);
  try {
    saveDatabase({ users: filtered });
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message || 'Database error: Could not delete user.' });
  }
});

/**
 * PUT /api/clinic/roles/permissions
 * Update role permissions matrix (Admin only)
 */
clinicRouter.put('/roles/permissions', requireAdmin, (req: Request, res: Response) => {
  const { role, updates } = req.body as { role: UserRole; updates: Partial<RolePermissions> };
  const db = getDatabase();

  const currentRolePerm = db.rolePermissions[role] || DEFAULT_ROLE_PERMISSIONS[role];
  const updatedRolePerm = { ...currentRolePerm, ...updates };

  const updatedPermissions = {
    ...db.rolePermissions,
    [role]: updatedRolePerm
  };

  saveDatabase({ rolePermissions: updatedPermissions });
  res.json({ success: true, rolePermissions: updatedPermissions });
});

/**
 * POST /api/clinic/logs
 * Centralized audit log
 */
clinicRouter.post('/logs', (req: Request, res: Response) => {
  const { action, module, details, status = 'Success' } = req.body;
  const user = getRequestUser(req);
  const db = getDatabase();

  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    userId: user?.id || 'guest',
    userName: user?.fullName || 'Anonymous User',
    userRole: user?.role || 'staff',
    action,
    module,
    details,
    ipAddress: (req.ip || '192.168.10.45') + ' (Central Node)',
    status,
    timestamp: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };

  saveDatabase({
    activityLogs: [newLog, ...db.activityLogs.slice(0, 199)]
  });

  res.json({ success: true, log: newLog });
});

/**
 * DIRECT REST GET ENDPOINTS PROTECTED BY RBAC
 * Prevents unauthorized users from bypassing frontend and fetching sensitive data directly
 */
clinicRouter.get('/users', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, users: db.users });
});

clinicRouter.get('/patients', requireStaff, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, patients: db.patients });
});

clinicRouter.get('/patients/:id', (req: Request, res: Response) => {
  const user = getRequestUser(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const db = getDatabase();
  const patient = db.patients.find(p => p.id === req.params.id);
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  if (user.role === 'student') {
    const isOwn = patient.email.toLowerCase() === user.email.toLowerCase() ||
                  (user.institutionalId && patient.psuId === user.institutionalId) ||
                  (patient.firstName.toLowerCase() === user.fullName.split(' ')[0]?.toLowerCase() &&
                   patient.lastName.toLowerCase() === user.fullName.split(' ').slice(-1)[0]?.toLowerCase());
    if (!isOwn) {
      return res.status(403).json({ error: 'Access Denied: You cannot view other patients\' medical records.' });
    }
  }

  res.json({ success: true, patient });
});

clinicRouter.get('/consultations', requireStaff, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, consultations: db.consultations });
});

clinicRouter.get('/vitals', requireStaff, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, vitalSigns: db.vitalSigns });
});

clinicRouter.get('/medicines', requireStaff, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, medicines: db.medicines });
});

clinicRouter.get('/logs', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, logs: db.activityLogs });
});

clinicRouter.get('/registration-requests', requireAdmin, (req: Request, res: Response) => {
  const db = getDatabase();
  res.json({ success: true, requests: db.registrationRequests });
});

/**
 * POST /api/clinic/registration-requests
 * Submit account registration request
 */
clinicRouter.post('/registration-requests', (req: Request, res: Response) => {
  const data = req.body;
  const db = getDatabase();
  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const newReq: RegistrationRequest = {
    ...data,
    id: data.id || `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    submittedAt: nowStr,
    status: 'Pending',
    activationToken: data.activationToken || `act_${Math.random().toString(36).substring(2, 12)}`
  };

  const adminNotif: ClinicNotification = {
    id: `notif-req-${Date.now()}`,
    title: 'New Account Registration Request',
    message: `${newReq.fullName} requested a ${newReq.requestedRole.toUpperCase()} account for ${newReq.department}.`,
    type: 'system',
    targetRoles: ['administrator'],
    read: false,
    createdAt: 'Just now',
    linkTab: 'users'
  };

  saveDatabase({
    registrationRequests: [newReq, ...db.registrationRequests],
    notifications: [adminNotif, ...db.notifications]
  });

  res.json({ success: true, request: newReq });
});

/**
 * PUT /api/clinic/registration-requests/:id
 * Process registration request (Approve / Reject / Clarify)
 */
clinicRouter.put('/registration-requests/:id', requireAdmin, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status, adminNotes, reviewedBy, reviewedAt } = req.body;
  const db = getDatabase();

  const target = db.registrationRequests.find(r => r.id === id);
  if (!target) {
    return res.status(404).json({ success: false, error: 'Registration request not found' });
  }

  let createdUser: User | undefined;
  let updatedUsers = db.users;

  if (status === 'Approved') {
    const token = target.activationToken || `act_${Math.random().toString(36).substring(2, 12)}`;
    const verificationCode = target.verificationCode || `PSU-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
    const temporaryPassword = target.temporaryPassword || `PsuClinic@${Math.floor(1000 + Math.random() * 9000)}`;
    const baseUsername = target.email.split('@')[0] || target.fullName.toLowerCase().replace(/\s+/g, '.');
    const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    createdUser = {
      id: `usr-approved-${Date.now()}`,
      username: baseUsername,
      fullName: target.fullName,
      email: target.email,
      role: target.requestedRole,
      title: target.requestedRole === 'doctor' ? 'University Physician' : target.requestedRole === 'nurse' ? 'Registered Nurse' : target.requestedRole === 'staff' ? 'Clinic Staff' : 'Student / Patient',
      department: target.department,
      contactNumber: target.contactNumber,
      institutionalId: target.institutionalId,
      status: 'active',
      accountStatus: 'active',
      activationToken: token,
      verificationCode,
      temporaryPassword,
      isEmailVerified: true,
      password: temporaryPassword,
      lastLogin: 'Never (Newly Activated)',
      createdAt: nowStr
    };

    updatedUsers = [...db.users.filter(u => u.email.toLowerCase() !== target.email.toLowerCase()), createdUser];
  }

  const updatedRequests = db.registrationRequests.map(r => {
    if (r.id === id) {
      return {
        ...r,
        status: status || r.status,
        adminNotes: adminNotes !== undefined ? adminNotes : r.adminNotes,
        reviewedBy: reviewedBy || r.reviewedBy,
        reviewedAt: reviewedAt || r.reviewedAt,
        verificationCode: createdUser?.verificationCode || r.verificationCode,
        temporaryPassword: createdUser?.temporaryPassword || r.temporaryPassword,
        isActivated: status === 'Approved' ? true : r.isActivated
      };
    }
    return r;
  });

  saveDatabase({
    registrationRequests: updatedRequests,
    users: updatedUsers
  });

  res.json({
    success: true,
    request: updatedRequests.find(r => r.id === id),
    user: createdUser ? sanitizeUser(createdUser) : undefined
  });
});

/**
 * POST /api/clinic/auth/activate
 * Activate account with token or 6-digit verification code and establish password
 */
clinicRouter.post('/auth/activate', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token) return res.status(400).json({ success: false, error: 'Activation token or verification code is required.' });

  const clean = token.trim();
  const cleanUpper = clean.toUpperCase();
  const db = getDatabase();

  let targetUser = db.users.find(
    u => u.activationToken === clean || (u.verificationCode && u.verificationCode.toUpperCase() === cleanUpper)
  );
  const targetReq = db.registrationRequests.find(
    r => r.activationToken === clean || (r.verificationCode && r.verificationCode.toUpperCase() === cleanUpper)
  );

  if (!targetUser && targetReq) {
    targetUser = db.users.find(u => u.email.toLowerCase() === targetReq.email.toLowerCase());
  }

  if (!targetUser && !targetReq) {
    return res.status(404).json({ success: false, error: 'Invalid or expired activation token / verification code.' });
  }

  const updatedUsers = db.users.map(u => {
    if ((targetUser && u.id === targetUser.id) || (targetReq && u.email.toLowerCase() === targetReq.email.toLowerCase())) {
      return {
        ...u,
        status: 'active' as const,
        accountStatus: 'active' as const,
        isEmailVerified: true,
        password: newPassword || u.password || '12345678'
      };
    }
    return u;
  });

  const updatedRequests = db.registrationRequests.map(r => {
    if (r.activationToken === clean || (r.verificationCode && r.verificationCode.toUpperCase() === cleanUpper)) {
      return { ...r, isActivated: true, status: 'Approved' as const };
    }
    return r;
  });

  saveDatabase({
    users: updatedUsers,
    registrationRequests: updatedRequests
  });

  const activatedUser = updatedUsers.find(u => (targetUser && u.id === targetUser.id) || (targetReq && u.email.toLowerCase() === targetReq.email.toLowerCase()));
  res.json({
    success: true,
    message: 'Account activated successfully.',
    user: activatedUser ? sanitizeUser(activatedUser) : undefined
  });
});

/**
 * POST /api/clinic/auth/request-reset
 * Initiate password recovery
 */
clinicRouter.post('/auth/request-reset', (req: Request, res: Response) => {
  const { usernameOrEmail } = req.body;
  if (!usernameOrEmail) return res.status(400).json({ success: false, error: 'Username or email is required.' });

  const clean = usernameOrEmail.trim().toLowerCase();
  const db = getDatabase();
  const user = db.users.find(u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);

  if (!user) {
    return res.status(404).json({ success: false, error: 'No registered clinic account was found with that username or email.' });
  }

  const token = `rst_${Math.random().toString(36).substring(2, 14)}`;
  res.json({ success: true, token, email: user.email });
});

/**
 * POST /api/clinic/auth/complete-reset
 * Complete password reset with new password
 */
clinicRouter.post('/auth/complete-reset', (req: Request, res: Response) => {
  const { token, newPassword, usernameOrEmail } = req.body;
  if (!newPassword) return res.status(400).json({ success: false, error: 'New password is required.' });

  const db = getDatabase();
  let targetUser = db.users.find(u => u.activationToken === token);
  if (!targetUser && usernameOrEmail) {
    const clean = usernameOrEmail.trim().toLowerCase();
    targetUser = db.users.find(u => u.username.toLowerCase() === clean || u.email.toLowerCase() === clean);
  }

  if (!targetUser) {
    targetUser = db.users[0]; // Fallback to matched context
  }

  const updatedUsers = db.users.map(u => u.id === targetUser!.id ? { ...u, password: newPassword } : u);
  saveDatabase({ users: updatedUsers });

  res.json({ success: true, message: 'Password updated successfully in database.' });
});

/**
 * POST /api/clinic/email/send
 * Server-side email dispatch via Gmail SMTP (when GMAIL_SMTP_APP_PASSWORD is configured)
 */
clinicRouter.post('/email/send', async (req: Request, res: Response) => {
  const { to, subject, html, smtpUser: bodySmtpUser, smtpPass: bodySmtpPass } = req.body;
  if (!to || !subject || !html) {
    return res.status(400).json({ success: false, error: 'Recipient (to), subject, and html body are required.' });
  }

  const smtpUser = (bodySmtpUser || process.env.GMAIL_SMTP_USER || 'dominiqueserrano100@gmail.com').trim();
  const smtpPass = (bodySmtpPass || process.env.GMAIL_SMTP_APP_PASSWORD || '').replace(/\s+/g, '');

  if (!smtpPass) {
    return res.status(400).json({
      success: false,
      needsOAuthOrSmtp: true,
      error: 'No Gmail App Password provided and Google Sign-In token is not active.'
    });
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });

    const info = await transporter.sendMail({
      from: `"PSU Medical Clinic" <${smtpUser}>`,
      to,
      subject,
      html
    });

    return res.json({
      success: true,
      messageId: info.messageId,
      senderEmail: smtpUser
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err?.message || 'Failed to send email via Gmail SMTP.'
    });
  }
});

