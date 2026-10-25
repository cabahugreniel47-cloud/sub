import {
  User,
  UserRole,
  Patient,
  PatientHistoryRecord,
  VitalSigns,
  Consultation,
  Medicine,
  QueueTicket,
  Appointment,
  MedicalCertificate,
  ActivityLog,
  ClinicNotification,
  RegistrationRequest,
  RolePermissions,
  QueueStage,
  QueueCallStatus,
  QueuePriority
} from '../types/clinic';

export interface ClinicSyncResponse {
  success: boolean;
  revision: number;
  lastUpdated: string;
  user?: User;
  users?: User[];
  patients?: Patient[];
  queue?: QueueTicket[];
  vitalSigns?: VitalSigns[];
  consultations?: Consultation[];
  medicines?: any[];
  transactions?: any[];
  appointments?: Appointment[];
  certificates?: MedicalCertificate[];
  activityLogs?: ActivityLog[];
  notifications?: ClinicNotification[];
  registrationRequests?: RegistrationRequest[];
  rolePermissions?: Record<UserRole, RolePermissions>;
}

function getAuthHeaders(currentUser?: User | null, sessionToken?: string | null): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const token = sessionToken ||
    (typeof window !== 'undefined'
      ? (localStorage.getItem('psu_mcis_session_token') ||
         sessionStorage.getItem('psu_mcis_session_token') ||
         localStorage.getItem('psu_mcis_admin_session_token'))
      : null);

  if (token) {
    headers['x-session-token'] = token;
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

export const ClinicApiService = {
  /**
   * Centralized sync: Pulls shared clinic state from backend
   */
  async sync(currentUser?: User | null, sessionToken?: string | null): Promise<ClinicSyncResponse | null> {
    try {
      const res = await fetch('/api/clinic/sync', {
        headers: getAuthHeaders(currentUser, sessionToken)
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.warn('[Clinic API] Sync error:', err);
      return null;
    }
  },

  /**
   * Centralized Authentication
   */
  async login(usernameOrEmail: string, password?: string): Promise<{ success: boolean; token?: string; user?: User; role?: UserRole; error?: string }> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password })
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Connection failed to centralized authentication service' };
    }
  },

  /**
   * Restore active session
   */
  async getCurrentUser(sessionToken?: string | null, userId?: string | null): Promise<{ success: boolean; user?: User; role?: UserRole; error?: string }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) {
        headers['x-session-token'] = sessionToken;
        headers['Authorization'] = `Bearer ${sessionToken}`;
      }
      if (userId) {
        headers['x-user-id'] = userId;
      }

      const res = await fetch('/api/auth/me', { headers });
      if (!res.ok) {
        return { success: false, error: 'Session expired or invalid' };
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to verify session' };
    }
  },

  /**
   * Log out session
   */
  async logout(sessionToken?: string | null): Promise<boolean> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (sessionToken) {
        headers['x-session-token'] = sessionToken;
      }
      await fetch('/api/auth/logout', { method: 'POST', headers });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Queue Management
   */
  async issueQueueTicket(
    data: { patientId: string; priority: QueuePriority; chiefComplaint?: string; id?: string; ticketNumber?: string },
    currentUser?: User | null
  ): Promise<QueueTicket | null> {
    try {
      const res = await fetch('/api/clinic/queue/issue', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.ticket;
    } catch {
      return null;
    }
  },

  async updateQueueStage(
    data: { ticketId: string; stage: QueueStage; room?: string },
    currentUser?: User | null
  ): Promise<QueueTicket | null> {
    try {
      const res = await fetch('/api/clinic/queue/update-stage', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.ticket;
    } catch {
      return null;
    }
  },

  async updateQueueCallStatus(
    data: { ticketId: string; callStatus: QueueCallStatus; room?: string },
    currentUser?: User | null
  ): Promise<QueueTicket | null> {
    try {
      const res = await fetch('/api/clinic/queue/update-call-status', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.ticket;
    } catch {
      return null;
    }
  },

  /**
   * Returns { ok: false } only when the request itself failed (network / server error).
   * { ok: true, ticket: null } means the request worked but nobody was waiting.
   */
  async callNextInQueue(
    data: { currentStage: QueueStage; nextStage: QueueStage; targetRoom: string },
    currentUser?: User | null
  ): Promise<{ ok: boolean; ticket: QueueTicket | null }> {
    try {
      const res = await fetch('/api/clinic/queue/call-next', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(data)
      });
      if (!res.ok) return { ok: false, ticket: null };
      const json = await res.json();
      return { ok: true, ticket: json.ticket || null };
    } catch {
      return { ok: false, ticket: null };
    }
  },

  /**
   * Patients
   */
  async addPatient(patient: any, currentUser?: User | null): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    try {
      const res = await fetch('/api/clinic/patients', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(patient)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to save patient (HTTP ${res.status})` };
      }
      return { success: true, patient: json.patient };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving patient to database' };
    }
  },

  async updatePatient(id: string, updates: Partial<Patient>, currentUser?: User | null): Promise<{ success: boolean; patient?: Patient; error?: string }> {
    try {
      const res = await fetch(`/api/clinic/patients/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(updates)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to update patient (HTTP ${res.status})` };
      }
      return { success: true, patient: json.patient };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating patient in database' };
    }
  },

  async archivePatient(id: string, reason: string, currentUser?: User | null): Promise<{ success: boolean; patient?: Patient; error?: string; message?: string }> {
    try {
      const res = await fetch(`/api/clinic/patients/${id}/archive`, {
        method: 'PUT',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify({ reason })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to archive patient (HTTP ${res.status})` };
      }
      return { success: true, patient: json.patient, message: json.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error archiving patient' };
    }
  },

  async restorePatient(id: string, currentUser?: User | null): Promise<{ success: boolean; patient?: Patient; error?: string; message?: string }> {
    try {
      const res = await fetch(`/api/clinic/patients/${id}/restore`, {
        method: 'PUT',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify({})
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to restore patient (HTTP ${res.status})` };
      }
      return { success: true, patient: json.patient, message: json.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error restoring patient' };
    }
  },

  async deletePatient(id: string, currentUser?: User | null): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const res = await fetch(`/api/clinic/patients/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(currentUser)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to delete patient (HTTP ${res.status})` };
      }
      return { success: true, message: json.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting patient' };
    }
  },

  async getPatientHistory(id: string, currentUser?: User | null): Promise<{ success: boolean; data?: PatientHistoryRecord; error?: string }> {
    try {
      const res = await fetch(`/api/clinic/patients/${id}/history`, {
        method: 'GET',
        headers: getAuthHeaders(currentUser)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to load patient history (HTTP ${res.status})` };
      }
      return { success: true, data: json.data };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error loading patient history' };
    }
  },

  /**
   * Vital Signs
   */
  async recordVitalSigns(vitals: any, currentUser?: User | null): Promise<VitalSigns | null> {
    try {
      const res = await fetch('/api/clinic/vitals', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(vitals)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.vitalSigns;
    } catch {
      return null;
    }
  },

  /**
   * Consultations
   */
  async recordConsultation(consultation: any, currentUser?: User | null): Promise<Consultation | null> {
    try {
      const res = await fetch('/api/clinic/consultations', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(consultation)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.consultation;
    } catch {
      return null;
    }
  },

  async updateConsultation(id: string, updates: Partial<Consultation>, currentUser?: User | null): Promise<Consultation | null> {
    try {
      const res = await fetch(`/api/clinic/consultations/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(updates)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.consultation;
    } catch {
      return null;
    }
  },

  async approveConsultation(id: string, notes?: string, currentUser?: User | null): Promise<{ success: boolean; consultation?: Consultation; error?: string }> {
    try {
      const res = await fetch(`/api/clinic/consultations/${id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify({ notes })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to approve consultation (HTTP ${res.status})` };
      }
      return { success: true, consultation: json.consultation };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error approving consultation' };
    }
  },

  /**
   * Pharmacy / Inventory
   */
  async stockInMedicine(data: any, currentUser?: User | null): Promise<boolean> {
    try {
      const res = await fetch('/api/clinic/inventory/stock-in', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async addMedicine(data: any, currentUser?: User | null): Promise<Medicine | null> {
    try {
      const res = await fetch('/api/clinic/inventory/medicines', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(data)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.medicine || null;
    } catch {
      return null;
    }
  },

  async markNotificationsRead(data: { id?: string; all?: boolean }, currentUser?: User | null): Promise<boolean> {
    try {
      const res = await fetch('/api/clinic/notifications/read', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async dispenseMedicine(data: any, currentUser?: User | null): Promise<boolean> {
    try {
      const res = await fetch('/api/clinic/inventory/dispense', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(data)
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Appointments
   */
  async addAppointment(appointment: any, currentUser?: User | null): Promise<Appointment | null> {
    try {
      const res = await fetch('/api/clinic/appointments', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(appointment)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.appointment;
    } catch {
      return null;
    }
  },

  async updateAppointmentStatus(id: string, status: string, currentUser?: User | null): Promise<boolean> {
    try {
      const res = await fetch(`/api/clinic/appointments/${id}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify({ status })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Medical Certificates
   */
  async issueMedicalCertificate(certData: any, currentUser?: User | null): Promise<MedicalCertificate | null> {
    try {
      const res = await fetch('/api/clinic/certificates', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(certData)
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.certificate;
    } catch {
      return null;
    }
  },

  /**
   * Users Management
   */
  async addUser(userData: any, currentUser?: User | null): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch('/api/clinic/users', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(userData)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to create user (HTTP ${res.status})` };
      }
      return { success: true, user: json.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error saving user to database' };
    }
  },

  async updateUser(id: string, updates: Partial<User>, currentUser?: User | null): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const res = await fetch(`/api/clinic/users/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(updates)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to update user in database (HTTP ${res.status})` };
      }
      return { success: true, user: json.user };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error updating user in database' };
    }
  },

  async deleteUser(id: string, currentUser?: User | null): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/clinic/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(currentUser)
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || `Failed to delete user (HTTP ${res.status})` };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error deleting user from database' };
    }
  },

  /**
   * Registration Requests & Activation
   */
  async submitRegistrationRequest(data: any): Promise<{ success: boolean; request?: RegistrationRequest; error?: string }> {
    try {
      const res = await fetch('/api/clinic/registration-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to submit registration request' };
    }
  },

  async processRegistrationRequest(id: string, updates: any, currentUser?: User | null): Promise<{ success: boolean; request?: RegistrationRequest; user?: User; error?: string }> {
    try {
      const res = await fetch(`/api/clinic/registration-requests/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(updates)
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to process request' };
    }
  },

  async activateAccount(token: string, newPassword: string): Promise<{ success: boolean; user?: User; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/clinic/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to activate account' };
    }
  },

  async requestPasswordReset(usernameOrEmail: string): Promise<{ success: boolean; token?: string; email?: string; error?: string }> {
    try {
      const res = await fetch('/api/clinic/auth/request-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail })
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to request password reset' };
    }
  },

  async completePasswordReset(token: string, newPassword: string, usernameOrEmail?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const res = await fetch('/api/clinic/auth/complete-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, usernameOrEmail })
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password' };
    }
  },

  /**
   * Role Permissions
   */
  async updateRolePermissions(role: UserRole, updates: Partial<RolePermissions>, currentUser?: User | null): Promise<boolean> {
    try {
      const res = await fetch('/api/clinic/roles/permissions', {
        method: 'PUT',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify({ role, updates })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * Audit Logs
   */
  async logActivity(logData: { action: string; module: string; details: string; status?: string }, currentUser?: User | null): Promise<void> {
    try {
      await fetch('/api/clinic/logs', {
        method: 'POST',
        headers: getAuthHeaders(currentUser),
        body: JSON.stringify(logData)
      });
    } catch {
      // Non-critical
    }
  }
};
