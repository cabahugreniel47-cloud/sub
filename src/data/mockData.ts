import {
  User,
  Patient,
  VitalSigns,
  Consultation,
  Medicine,
  InventoryTransaction,
  QueueTicket,
  Appointment,
  MedicalCertificate,
  ActivityLog,
  ClinicNotification
} from '../types/clinic';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-1790827896796',
    username: 'vincent.123',
    fullName: 'Vincent Tungul',
    email: 'vincenttungul05@gmail.com',
    role: 'administrator',
    title: 'Master System Administrator',
    department: 'PSU Health & Medical Services Office',
    status: 'active',
    accountStatus: 'active',
    password: '12345678',
    isEmailVerified: true,
    lastLogin: '2026-10-01 08:30 AM'
  },
  {
    id: 'usr-admin-1',
    username: 'admin',
    fullName: 'Jon Dominique Serrano',
    email: 'admin.clinic@psu.edu.ph',
    role: 'administrator',
    title: 'Clinic Information System Administrator',
    department: 'PSU Health & Medical Services Office',
    status: 'active',
    accountStatus: 'active',
    password: '12345678',
    isEmailVerified: true,
    lastLogin: '2026-09-26 08:30 AM'
  },
  {
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
    password: 'doctor123',
    isEmailVerified: true,
    lastLogin: 'Never (Newly Created)'
  },
  {
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
    password: 'nurse123',
    isEmailVerified: true,
    lastLogin: 'Never (Newly Created)'
  },
  {
    id: 'usr-role-staff',
    username: 'staff',
    fullName: 'Nicole D. Balingit',
    email: 'staff@psu.edu.ph',
    role: 'staff',
    title: 'Clinic Records & Reception Staff',
    department: 'Patient Intake & Queue Desk',
    status: 'active',
    accountStatus: 'active',
    password: 'staff123',
    isEmailVerified: true,
    lastLogin: 'Never (Newly Created)'
  },
  {
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
    password: 'patient123',
    isEmailVerified: true,
    lastLogin: 'Never (Newly Created)',
    createdAt: '2026-09-01'
  }
];

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: 'pat-student-1',
    psuId: '2024-00123-BC',
    firstName: 'Darwin',
    middleName: 'Bello',
    lastName: 'Morales',
    classification: 'Student',
    collegeOrDepartment: 'College of Computing Studies',
    courseAndYear: 'BS Information Systems - 4rth Year',
    birthDate: '2003-08-15',
    age: 23,
    gender: 'Male',
    civilStatus: 'Single',
    contactNumber: '+63 917 123 4567',
    email: 'darwinmorales123@psu.edu.ph',
    address: 'Bacolor, Pampanga',
    emergencyContactName: 'Maria D. Cruz',
    emergencyContactRelationship: 'Mother',
    emergencyContactPhone: '+63 918 234 5678',
    bloodType: 'O+',
    knownAllergies: ['Penicillin (Moderate rash)'],
    chronicConditions: ['Allergic Rhinitis (Seasonal)'],
    philHealthNumber: '12-054921938-1',
    registeredAt: '2026-09-01 09:00 AM',
    status: 'active'
  }
];

export const INITIAL_VITALS: VitalSigns[] = [];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-0',
    code: 'MED-000',
    genericName: 'Isopropyl Alcohol 70% Solution',
    brandName: 'Green Cross / Biogenic',
    category: 'Topical / Antiseptic',
    dosageStrength: '70% Isopropyl Alcohol',
    dosageForm: 'Bottle (500 mL)',
    currentStock: 12,
    minimumThreshold: 100,
    unit: 'bottles',
    unitCostPhp: 85.00,
    batchNumber: 'BAT-2026-001',
    expiryDate: '2028-06-30',
    storageLocation: 'Disinfection Supply Room A',
    status: 'Critical Stock'
  },
  {
    id: 'med-1',
    code: 'MED-001',
    genericName: 'Paracetamol',
    brandName: 'Biogesic / Rexidol',
    category: 'Analgesic / Antipyretic',
    dosageStrength: '500 mg',
    dosageForm: 'Tablet',
    currentStock: 85,
    minimumThreshold: 100,
    unit: 'tabs',
    unitCostPhp: 4.50,
    batchNumber: 'BAT-2026-041',
    expiryDate: '2027-10-31',
    storageLocation: 'Pharmacy Cabinet A, Shelf 1',
    status: 'Low Stock'
  },
  {
    id: 'med-2',
    code: 'MED-002',
    genericName: 'Mefenamic Acid',
    brandName: 'Ponstan / Dolfenal',
    category: 'Analgesic / Antipyretic',
    dosageStrength: '500 mg',
    dosageForm: 'Capsule',
    currentStock: 45,
    minimumThreshold: 50,
    unit: 'caps',
    unitCostPhp: 8.75,
    batchNumber: 'BAT-2025-119',
    expiryDate: '2027-04-15',
    storageLocation: 'Pharmacy Cabinet A, Shelf 2',
    status: 'Low Stock'
  },
  {
    id: 'med-3',
    code: 'MED-003',
    genericName: 'Cetirizine Dihydrochloride',
    brandName: 'Alnix / Virlix',
    category: 'Antihistamine / Antiallergy',
    dosageStrength: '10 mg',
    dosageForm: 'Film-coated Tablet',
    currentStock: 180,
    minimumThreshold: 50,
    unit: 'tabs',
    unitCostPhp: 12.00,
    batchNumber: 'BAT-2026-008',
    expiryDate: '2028-01-30',
    storageLocation: 'Pharmacy Cabinet A, Shelf 3',
    status: 'In Stock'
  },
  {
    id: 'med-4',
    code: 'MED-004',
    genericName: 'Aluminum Hydroxide + Magnesium Hydroxide + Simethicone',
    brandName: 'Kremil-S',
    category: 'Gastrointestinal',
    dosageStrength: '178mg / 233mg / 30mg',
    dosageForm: 'Chewable Tablet',
    currentStock: 220,
    minimumThreshold: 60,
    unit: 'tabs',
    unitCostPhp: 9.50,
    batchNumber: 'BAT-2026-022',
    expiryDate: '2027-08-20',
    storageLocation: 'Pharmacy Cabinet B, Shelf 1',
    status: 'In Stock'
  },
  {
    id: 'med-5',
    code: 'MED-005',
    genericName: 'Amoxicillin Trihydrate',
    brandName: 'Amoxil',
    category: 'Antibiotic',
    dosageStrength: '500 mg',
    dosageForm: 'Capsule',
    currentStock: 40,
    minimumThreshold: 100,
    unit: 'caps',
    unitCostPhp: 6.25,
    batchNumber: 'BAT-2026-015',
    expiryDate: '2027-06-30',
    storageLocation: 'Antibiotic Vault 1',
    status: 'Low Stock'
  },
  {
    id: 'med-6',
    code: 'MED-006',
    genericName: 'Oral Rehydration Salts (ORS)',
    brandName: 'Hydrite',
    category: 'Gastrointestinal',
    dosageStrength: 'Standard WHO Formulation',
    dosageForm: 'Sachet Powder',
    currentStock: 85,
    minimumThreshold: 30,
    unit: 'sachets',
    unitCostPhp: 15.00,
    batchNumber: 'BAT-2025-099',
    expiryDate: '2027-12-15',
    storageLocation: 'Cabinet B, Shelf 2',
    status: 'In Stock'
  },
  {
    id: 'med-7',
    code: 'MED-007',
    genericName: 'Salbutamol Sulfate 1mg/mL',
    brandName: 'Ventolin Nebules',
    category: 'Bronchodilator / Respiratory',
    dosageStrength: '2.5 mg / 2.5 mL',
    dosageForm: 'Nebule',
    currentStock: 14,
    minimumThreshold: 20,
    unit: 'nebules',
    unitCostPhp: 38.50,
    batchNumber: 'BAT-2025-067',
    expiryDate: '2026-11-30',
    storageLocation: 'Emergency Triage Tray',
    status: 'Critical Stock'
  },
  {
    id: 'med-8',
    code: 'MED-008',
    genericName: 'Povidone-Iodine 10%',
    brandName: 'Betadine Solution',
    category: 'Topical / Antiseptic',
    dosageStrength: '100 mg / mL',
    dosageForm: 'Topical Liquid Bottle (60mL)',
    currentStock: 18,
    minimumThreshold: 10,
    unit: 'bottles',
    unitCostPhp: 145.00,
    batchNumber: 'BAT-2025-201',
    expiryDate: '2028-05-15',
    storageLocation: 'First Aid Dressing Station',
    status: 'In Stock'
  },
  {
    id: 'med-9',
    code: 'MED-009',
    genericName: 'Sterile Gauze Pads 4x4',
    brandName: 'Curad / Indoplas',
    category: 'Medical Supply & Consumable',
    dosageStrength: '100s box',
    dosageForm: 'Individually Wrapped Pack',
    currentStock: 320,
    minimumThreshold: 100,
    unit: 'packs',
    unitCostPhp: 3.50,
    batchNumber: 'BAT-2025-180',
    expiryDate: '2029-01-01',
    storageLocation: 'Dressing Supply Cart',
    status: 'In Stock'
  }
];

export const INITIAL_TRANSACTIONS: InventoryTransaction[] = [
  {
    id: 'tx-1',
    medicineId: 'med-1',
    medicineName: 'Paracetamol 500mg',
    transactionType: 'Dispensed',
    quantity: 6,
    previousStock: 356,
    newStock: 350,
    reason: 'Nurse Triage Dispense - Student Headache & Low-grade Fever',
    referenceId: 'TR-2026-0926-01',
    performedBy: 'Mary Jane P. Santos, RN',
    performedRole: 'Nurse',
    timestamp: '2026-09-26 09:25 AM'
  },
  {
    id: 'tx-2',
    medicineId: 'med-7',
    medicineName: 'Salbutamol Nebules 2.5mg',
    transactionType: 'Dispensed',
    quantity: 2,
    previousStock: 16,
    newStock: 14,
    reason: 'Emergency nebulization in clinic triage room',
    referenceId: 'EM-2026-0925-04',
    performedBy: 'Mary Jane P. Santos, RN',
    performedRole: 'Nurse',
    timestamp: '2026-09-25 03:10 PM'
  },
  {
    id: 'tx-3',
    medicineId: 'med-4',
    medicineName: 'Kremil-S Chewable Tabs',
    transactionType: 'Stock In',
    quantity: 100,
    previousStock: 120,
    newStock: 220,
    reason: 'Quarterly University Health Office replenishment (PO-2026-881)',
    referenceId: 'PO-2026-881',
    performedBy: 'Engr. Ferdinand G. Reyes',
    performedRole: 'Administrator',
    timestamp: '2026-09-24 11:00 AM'
  }
];

export const INITIAL_QUEUE: QueueTicket[] = [];

export const INITIAL_CONSULTATIONS: Consultation[] = [];

export const INITIAL_CERTIFICATES: MedicalCertificate[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];


export const INITIAL_LOGS: ActivityLog[] = [
  {
    id: 'log-1',
    userId: 'usr-doc-1',
    userName: 'Dr. Roberto M. Manalo, MD',
    userRole: 'doctor',
    action: 'Completed Consultation & Issued Rx',
    module: 'Consultation',
    details: 'Completed physical examination and medical clearance for Reynaldo Villar (2020310182).',
    ipAddress: '192.168.10.42 (PSU Clinic Intranet)',
    status: 'Success',
    timestamp: '2026-09-26 09:15 AM'
  },
  {
    id: 'log-2',
    userId: 'usr-nurse-1',
    userName: 'Mary Jane P. Santos, RN',
    userRole: 'nurse',
    action: 'Recorded Vital Signs & Triage',
    module: 'Vital Signs / Assessment',
    details: 'Captured vitals for Kristine Joy Dela Cruz (2023313334). BP: 110/70, Temp: 37.8°C.',
    ipAddress: '192.168.10.35 (PSU Triage Station)',
    status: 'Success',
    timestamp: '2026-09-26 09:20 AM'
  },
  {
    id: 'log-3',
    userId: 'usr-staff-1',
    userName: 'Angelica C. David',
    userRole: 'staff',
    action: 'Issued Queue Ticket',
    module: 'Queue',
    details: 'Generated Ticket P-102 (Urgent) for Mark Anthony Tolentino (Ankle Sprain).',
    ipAddress: '192.168.10.20 (PSU Reception Counter)',
    status: 'Success',
    timestamp: '2026-09-26 09:35 AM'
  },
  {
    id: 'log-4',
    userId: 'usr-admin-1',
    userName: 'Engr. Ferdinand G. Reyes',
    userRole: 'administrator',
    action: 'Authenticated to System',
    module: 'Authentication',
    details: 'Admin session initialized from Administrative Terminal. Two-factor role verification passed.',
    ipAddress: '192.168.10.10 (Admin Office)',
    status: 'Success',
    timestamp: '2026-09-26 08:30 AM'
  },
  {
    id: 'log-5',
    userId: 'usr-nurse-1',
    userName: 'Mary Jane P. Santos, RN',
    userRole: 'nurse',
    action: 'Dispensed OTC Medication',
    module: 'Dispensing',
    details: 'Dispensed 6 tabs Paracetamol 500mg. Inventory deducted automatically.',
    ipAddress: '192.168.10.35 (PSU Triage Station)',
    status: 'Success',
    timestamp: '2026-09-26 09:25 AM'
  }
];

export const INITIAL_NOTIFICATIONS: ClinicNotification[] = [
  {
    id: 'notif-1',
    title: 'New Account Registration Pending Review',
    message: 'A new user registration application (Dr. Jennifer R. Galang) has been submitted for administrative review.',
    type: 'system',
    targetRoles: ['administrator'],
    read: false,
    createdAt: 'Just now',
    linkTab: 'users'
  },
  {
    id: 'notif-2',
    title: 'Critical Inventory Stock Warning',
    message: 'Salbutamol Nebules 2.5mg is below minimum threshold (14 remaining, threshold 20).',
    type: 'low_stock',
    targetRoles: ['nurse', 'staff'],
    read: false,
    createdAt: '35 mins ago',
    linkTab: 'inventory'
  },
  {
    id: 'notif-3',
    title: 'Student Health & Clinic Pass Active',
    message: 'Your official PSU student health record and digital clinic pass are verified and ready for consultations.',
    type: 'system',
    targetRoles: ['student'],
    read: false,
    createdAt: 'Today',
    linkTab: 'dashboard'
  },
  {
    id: 'notif-queue-waiting',
    title: 'Patient Waiting in Queue',
    message: 'Ticket P-102 (Mark Anthony Tolentino) is waiting for triage / consultation assessment.',
    type: 'queue_alert',
    targetRoles: ['doctor', 'nurse'],
    read: false,
    createdAt: '10 mins ago',
    linkTab: 'queue'
  },
  {
    id: 'notif-4',
    title: 'Clinic Appointment',
    message: 'You can schedule and manage your consultations and annual clinic check-ups online.',
    type: 'appointment',
    targetRoles: ['student'],
    read: false,
    createdAt: '1 hr ago',
    linkTab: 'appointments'
  }
];

export const INITIAL_REGISTRATION_REQUESTS = [
  {
    id: 'req-001',
    fullName: 'Dr. Jennifer R. Galang, MD',
    institutionalId: 'PSU-FAC-2024-009',
    email: 'j.galang@psu.edu.ph',
    contactNumber: '+63 918 223 4567',
    requestedRole: 'doctor' as const,
    department: 'University Medical Services - Internal Medicine',
    reason: 'Newly appointed visiting campus physician for afternoon shift.',
    submittedAt: '2026-10-14 09:15 AM',
    status: 'Pending' as const,
    activationToken: 'act_token_galang_982'
  }
];


