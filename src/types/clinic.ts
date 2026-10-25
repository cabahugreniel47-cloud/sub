export type UserRole = 'administrator' | 'doctor' | 'nurse' | 'staff' | 'student';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  title: string;
  institutionalId?: string;
  prcLicense?: string;
  ptrNumber?: string;
  s2License?: string;
  contactNumber?: string;
  department: string;
  officeLocation?: string;
  bio?: string;
  avatar?: string;
  digitalSignature?: string; // Base64 data URL or digital sign
  status: 'active' | 'inactive';
  accountStatus?: 'active' | 'pending_activation' | 'inactive';
  activationToken?: string;
  verificationCode?: string;
  temporaryPassword?: string;
  isEmailVerified?: boolean;
  lastLogin?: string;
  createdAt?: string;
  password?: string;
}

export type ExportFileType = 'pdf' | 'print' | 'csv' | 'json';

export type ClinicModule =
  | 'dashboard'
  | 'patients'
  | 'vitals'
  | 'queue'
  | 'consultations'
  | 'inventory'
  | 'dispensing'
  | 'appointments'
  | 'reports'
  | 'users'
  | 'logs'
  | 'settings';

export interface RolePermissions {
  role: UserRole;
  label: string;
  description: string;
  allowedModules: ClinicModule[];
  canEditRecords: boolean;
  canDispenseMeds: boolean;
  canPrescribeRx: boolean;
  canIssueMedCert: boolean;
  canManageUsers: boolean;
  canViewAuditLogs: boolean;
  canApproveConsultation?: boolean;
}

export interface DocumentExportOptions {
  includeUniversityLogo: boolean;
  includePhilippineSeal: boolean;
  includeWatermark: boolean;
  includeDoctorSignature: boolean;
  includeSecurityQr: boolean;
  watermarkText?: string;
}

export type PatientClassification = 'Student' | 'Faculty' | 'Administrative Staff' | 'Dependent';

export interface Patient {
  id: string;
  psuId: string; // e.g. 2023-01842-BC
  firstName: string;
  middleName?: string;
  lastName: string;
  suffix?: string;
  classification: PatientClassification;
  collegeOrDepartment: string; // e.g. College of Computing Studies, College of Engineering
  courseAndYear?: string; // e.g. BS Information Technology - 3rd Year
  birthDate: string; // YYYY-MM-DD
  age: number;
  gender: 'Male' | 'Female';
  civilStatus: 'Single' | 'Married' | 'Widowed' | 'Separated';
  contactNumber: string; // Philippine mobile e.g. +63 917 123 4567
  email: string;
  address: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  bloodType: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  knownAllergies: string[];
  chronicConditions: string[];
  philHealthNumber?: string;
  registeredAt: string;
  status: 'active' | 'archived' | 'deleted';
  archivedAt?: string;
  archivedReason?: string;
  archivedBy?: string;
  deletedAt?: string;
  deletedReason?: string;
  deletedBy?: string;
  restoredAt?: string;
  restoredBy?: string;
}

export interface PatientHistoryRecord {
  patient: Patient;
  vitals: VitalSigns[];
  consultations: Consultation[];
  prescriptions: Array<{
    medicineId: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
    consultationDate: string;
    doctorName: string;
  }>;
  appointments: Appointment[];
  certificates: MedicalCertificate[];
  timeline: Array<{
    id: string;
    date: string;
    type: 'registration' | 'vitals' | 'consultation' | 'prescription' | 'appointment' | 'certificate' | 'archived' | 'restored';
    title: string;
    description: string;
    performer?: string;
    badgeColor?: string;
  }>;
}

export type TriageLevel = 'Emergency' | 'Urgent' | 'Standard';

export interface VitalSigns {
  id: string;
  patientId: string;
  recordedByUserId: string;
  recordedByName: string;
  timestamp: string;
  bloodPressureSystolic: number; // mmHg
  bloodPressureDiastolic: number; // mmHg
  heartRate: number; // bpm
  respiratoryRate: number; // cpm
  temperature: number; // °C
  oxygenSaturation: number; // % SpO2
  heightCm: number;
  weightKg: number;
  bmi: number;
  bmiClassification: 'Underweight' | 'Normal' | 'Overweight' | 'Obese Class I' | 'Obese Class II';
  painScale: number; // 0-10
  chiefComplaint: string;
  triageLevel: TriageLevel;
  nurseNotes?: string;
}

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  genericName: string;
  brandName?: string;
  dosageStrength: string;
  dosageForm: string; // tablet, capsule, syrup
  frequency: string; // e.g. Every 8 hours after meals
  durationDays: number;
  quantity: number;
  instructions: string;
  dispensed: boolean;
  dispensedAt?: string;
  dispensedBy?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  doctorLicense: string;
  doctorPtr: string;
  vitalSignsId?: string;
  vitalSigns?: VitalSigns;
  date: string;
  time: string;
  subjective: string; // Chief complaint & History of Present Illness
  physicalExamFindings: {
    generalSurvey: string;
    heent: string;
    chestLungs: string;
    cardiovascular: string;
    abdomen: string;
    extremities: string;
  };
  assessmentDiagnosis: string;
  icd10Code?: string;
  planAndManagement: string;
  recommendations: string;
  followUpDate?: string;
  prescriptions: PrescriptionItem[];
  medicalCertificateIssued?: boolean;
  medicalCertificateId?: string;
  status?: 'pending_approval' | 'approved' | 'completed' | 'draft';
  approvalStatus?: 'pending_approval' | 'approved';
  isApproved?: boolean;
  approvedAt?: string;
  approvedByDoctorId?: string;
  approvedByDoctorName?: string;
  approvedByDoctorLicense?: string;
  approvalNotes?: string;
}

export type ConsultationApprovalStatus = 'pending_approval' | 'approved';

export type MedicineCategory = 
  | 'Analgesic / Antipyretic'
  | 'Antibiotic'
  | 'Antihistamine / Antiallergy'
  | 'Gastrointestinal'
  | 'Antihypertensive'
  | 'Bronchodilator / Respiratory'
  | 'Topical / Antiseptic'
  | 'Medical Supply & Consumable'
  | 'Emergency & First Aid';

export interface Medicine {
  id: string;
  code: string; // MED-001
  genericName: string;
  brandName: string;
  category: MedicineCategory;
  dosageStrength: string; // 500 mg
  dosageForm: string; // Tablet, Capsule, Ampoule, Bottle
  currentStock: number;
  minimumThreshold: number;
  stockQuantity?: number;
  reorderLevel?: number;
  unit: string; // tabs, caps, bottles, pcs
  unitCostPhp: number;
  batchNumber: string;
  expiryDate: string; // YYYY-MM-DD
  storageLocation: string; // Cabinet A, Shelf 2
  status: 'In Stock' | 'Low Stock' | 'Critical Stock' | 'Expired';
}

export interface InventoryTransaction {
  id: string;
  medicineId: string;
  medicineName: string;
  transactionType: 'Stock In' | 'Dispensed' | 'Disposed / Expired' | 'Adjustment' | 'Transfer';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string;
  referenceId?: string; // prescription or PO number
  performedBy: string;
  performedRole: string;
  timestamp: string;
}

export type QueueStage = 'Waiting Triage' | 'In Triage' | 'Waiting Doctor' | 'In Consultation' | 'Completed' | 'Cancelled';
export type QueueCallStatus = 'Waiting' | 'Ready' | 'Calling' | 'In Service' | 'Completed' | 'Cancelled';
export type QueuePriority = 'Regular' | 'Senior/PWD' | 'Urgent' | 'Emergency';

export interface QueueTicket {
  id: string;
  ticketNumber: string; // Q-001, P-002, E-001
  patientId: string;
  patientPsuId: string;
  patientName: string;
  patientClassification: PatientClassification;
  priority: QueuePriority;
  stage: QueueStage;
  callStatus?: QueueCallStatus;
  smsNotifiedStatus?: 'None' | 'Ready' | 'Calling' | 'Delivered' | 'Failed';
  lastSmsSentAt?: string;
  counterOrRoom?: string; // Triage Station 1, Doctor Clinic Room 1
  assignedTo?: string;
  calledAt?: string;
  servedAt?: string;
  completedAt?: string;
  createdAt: string;
  chiefComplaint?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPsuId: string;
  classification: PatientClassification;
  purpose: 'Physician Consultation' | 'Annual Physical Exam' | 'Medical Clearance' | 'Dental Assessment' | 'Follow-up' | 'Vaccination';
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  doctorName?: string;
  notes?: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Cancelled' | 'No-Show';
  createdAt: string;
}

export interface MedicalCertificate {
  id: string;
  certificateNumber: string; // MC-2026-0042
  patientId: string;
  patientName: string;
  patientPsuId: string;
  patientAge: number;
  patientGender: string;
  patientAddress: string;
  consultationDate: string;
  diagnosis: string;
  treatmentAndRemarks: string;
  recommendedRestDays: number;
  restFromDate: string;
  restToDate: string;
  fitToResumeStudiesOrWork: boolean;
  fitDate: string;
  doctorName: string;
  doctorTitle: string;
  doctorLicense: string;
  doctorPtr: string;
  issuedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  module: 'Authentication' | 'Patient Management' | 'Vital Signs / Assessment' | 'Queue' | 'Consultation' | 'Prescription' | 'Inventory' | 'Dispensing' | 'Reports' | 'Security';
  details: string;
  ipAddress: string;
  status: 'Success' | 'Warning' | 'Error';
  timestamp: string;
}

export type RegistrationRequestStatus = 'Pending' | 'Approved' | 'Rejected' | 'Needs Information';

export interface RegistrationRequest {
  id: string;
  fullName: string;
  institutionalId?: string;
  email: string;
  contactNumber: string;
  requestedRole: UserRole;
  department: string;
  reason: string;
  submittedAt: string;
  status: RegistrationRequestStatus;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  activationToken?: string;
  verificationCode?: string;
  temporaryPassword?: string;
  isActivated?: boolean;
}

export interface PasswordResetRequest {
  id: string;
  usernameOrEmail: string;
  email: string;
  userFullName: string;
  userRole: UserRole;
  requestedAt: string;
  token: string;
  status: 'Pending' | 'Completed' | 'Expired';
}

export interface ClinicNotification {
  id: string;
  title: string;
  message: string;
  type: 'urgent_triage' | 'low_stock' | 'queue_alert' | 'appointment' | 'system';
  targetRoles: UserRole[];
  read: boolean;
  createdAt: string;
  linkTab?: string;
}

export interface VerificationReceipt {
  id: string;
  recipientName: string;
  recipientEmail: string;
  recipientPhone?: string;
  username: string;
  assignedRole: UserRole;
  institutionalId?: string;
  department: string;
  accountStatus: 'active' | 'pending_activation' | 'inactive';
  activationToken: string;
  verificationCode?: string;
  temporaryPassword?: string;
  activationUrl: string;
  issuedAt: string;
  issuedBy: string;
  referenceNumber: string;
  emailDispatchedFrom?: string;
  emailDispatchedAt?: string;
}

export interface NumberPopupData {
  id: string;
  type: 'queue' | 'consultation' | 'rx' | 'appointment' | 'medcert' | 'patient';
  number: string;
  title: string;
  patientName: string;
  patientId?: string;
  department?: string;
  details?: string;
  timestamp: string;
  actionLabel?: string;
  linkTab?: string;
}
