import React, { useState, useEffect, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Patient, PrescriptionItem, Consultation } from '../../types/clinic';
import { ClinClinAIService } from '../../services/clinClinAIService';
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Users,
  Printer,
  Clock,
  CheckCircle,
  ShieldCheck,
  Search,
  Edit3,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Thermometer,
  Pill,
  Droplet,
  UserCheck,
  RotateCcw,
  User as UserIcon,
  Tag,
  Ticket,
  BellRing
} from 'lucide-react';

export const ConsultationRoom: React.FC = () => {
  const {
    currentUser,
    patients,
    vitalSigns,
    medicines,
    consultations,
    recordConsultation,
    updateConsultation,
    approveConsultation,
    issueMedicalCertificate,
    setActiveModal,
    setModalPayload,
    selectedPatient,
    setSelectedPatient,
    showToast,
    queue,
    updateQueueStage,
    updateQueueCallStatus,
    playQueueChime,
    setActiveTab
  } = useClinic();

  // Consultation Queue Resolution
  const inConsultationTicket = queue.find(q => q.stage === 'In Consultation');
  const waitingDoctorTickets = queue.filter(q => q.stage === 'Waiting Doctor');
  const doctorQueueTickets = queue.filter(q => q.stage === 'In Consultation' || q.stage === 'Waiting Doctor');

  // Active patient logic:
  // 1. Explicitly selected patient
  // 2. Patient currently In Consultation
  // 3. First patient Waiting for Doctor in queue
  // 4. First registered patient in database fallback
  const currentPatient: Patient | undefined =
    selectedPatient ||
    (inConsultationTicket ? patients.find(p => p.id === inConsultationTicket.patientId) : undefined) ||
    (waitingDoctorTickets.length > 0 ? patients.find(p => p.id === waitingDoctorTickets[0].patientId) : undefined) ||
    (patients.length > 0 ? patients[0] : undefined);

  const currentQueueTicket = currentPatient
    ? queue.find(q => q.patientId === currentPatient.id && (q.stage === 'In Consultation' || q.stage === 'Waiting Doctor'))
    : undefined;

  const patientVitals = currentPatient ? vitalSigns.filter(v => v.patientId === currentPatient.id) : [];
  const latestVitals = patientVitals[0];

  // Call queued patient handlers
  const handleCallQueuedPatient = (ticket: (typeof queue)[0]) => {
    const pat = patients.find(p => p.id === ticket.patientId);
    if (!pat) return;
    updateQueueStage(ticket.id, 'In Consultation', 'Physician Clinic Room 1', true);
    updateQueueCallStatus(ticket.id, 'Calling', 'Physician Clinic Room 1', true);
    playQueueChime(ticket.ticketNumber, 'Physician Clinic Room 1');
    setSelectedPatient(pat);
    showToast(`✓ Ticket #${ticket.ticketNumber} (${pat.firstName} ${pat.lastName}) called into Consultation Room!`, 'success');
  };

  const handleCallNextQueuedPatient = () => {
    if (waitingDoctorTickets.length === 0) {
      showToast('No triaged patients are currently waiting in the consultation queue.', 'info');
      return;
    }
    const priorityWeight: Record<string, number> = {
      'Emergency': 4,
      'Urgent': 3,
      'Senior/PWD': 2,
      'Regular': 1
    };
    const sorted = [...waitingDoctorTickets].sort((a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1));
    handleCallQueuedPatient(sorted[0]);
  };

  // SOAP State
  const [subjective, setSubjective] = useState(
    latestVitals?.chiefComplaint || 'Patient presents with symptoms for evaluation.'
  );

  // Sync subjective complaint when active patient changes
  useEffect(() => {
    if (latestVitals?.chiefComplaint) {
      setSubjective(latestVitals.chiefComplaint);
    } else if (currentPatient) {
      setSubjective('Patient presents for physician consultation and clinical assessment.');
    }
  }, [currentPatient?.id, latestVitals?.chiefComplaint]);

  const [physicalExam, setPhysicalExam] = useState({
    generalSurvey: 'Conscious, coherent, ambulatory, not in acute cardiopulmonary distress',
    heent: 'Anicteric sclerae, pink conjunctivae, non-hyperemic posterior pharyngeal wall',
    chestLungs: 'Symmetrical chest expansion, clear breath sounds, no rales or rhonchi',
    cardiovascular: 'Regular rate and rhythm, distinct S1/S2, no cardiac murmurs',
    abdomen: 'Soft, non-tender, normoactive bowel sounds, no palpable mass',
    extremities: 'Full equal pulses, no cyanosis, no bipedal edema, normal range of motion'
  });

  const [diagnosis, setDiagnosis] = useState('Acute Upper Respiratory Tract Infection (URTI)');
  const [icd10, setIcd10] = useState('J06.9');
  const [plan, setPlan] = useState('Increase oral fluid intake. Adequate bed rest. Warm saline gargle 3x daily. Symptomatic pharmacotherapy.');
  const [recommendations, setRecommendations] = useState('Avoid cold beverages and prolonged direct dust exposure. Return if fever persists > 48 hours.');
  const [followUpDate, setFollowUpDate] = useState('2026-10-03');

  // E-Prescriptions List
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: 'rx-item-temp-1',
      medicineId: medicines[0]?.id || 'med-1',
      genericName: 'Paracetamol',
      brandName: 'Biogesic',
      dosageStrength: '500 mg',
      dosageForm: 'Tablet',
      frequency: 'Every 6 hours as needed for fever or headache',
      durationDays: 3,
      quantity: 10,
      instructions: 'Take after meals with water. Do not exceed 8 tablets daily.',
      dispensed: false
    }
  ]);

  // Med Certificate Checkbox
  const [issueMedCert, setIssueMedCert] = useState(false);
  const [restDays, setRestDays] = useState(2);
  const [fitToResume, setFitToResume] = useState(false);

  const commonDiagnoses = [
    { title: 'Acute Upper Respiratory Tract Infection (URTI)', icd: 'J06.9' },
    { title: 'Tension-type Headache', icd: 'G44.2' },
    { title: 'Acute Gastroenteritis (AGE) with Mild Dehydration', icd: 'A09' },
    { title: 'Allergic Rhinitis', icd: 'J30.4' },
    { title: 'Primary Arterial Hypertension, Uncomplicated', icd: 'I10' },
    { title: 'Acute Musculoskeletal Sprain / Strain', icd: 'S93.4' },
    { title: 'Contact Dermatitis / Urticaria', icd: 'L23.9' }
  ];

  const handleAddMedication = () => {
    const med = medicines[0] || {
      id: 'med-1',
      genericName: 'Paracetamol',
      brandName: 'Biogesic',
      dosageStrength: '500 mg',
      dosageForm: 'Tablet'
    };
    const newRx: PrescriptionItem = {
      id: `rx-item-${Date.now()}`,
      medicineId: med.id,
      genericName: med.genericName,
      brandName: med.brandName,
      dosageStrength: med.dosageStrength,
      dosageForm: med.dosageForm,
      frequency: 'Every 8 hours after meals',
      durationDays: 5,
      quantity: 15,
      instructions: 'Take with full glass of water.',
      dispensed: false
    };
    setPrescriptions([...prescriptions, newRx]);
  };

  const handleRemoveMedication = (id: string) => {
    setPrescriptions(prescriptions.filter(p => p.id !== id));
  };

  const handleUpdateMedication = (id: string, updates: Partial<PrescriptionItem>) => {
    setPrescriptions(prescriptions.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleSubmitConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) {
      showToast('Please select a patient before saving consultation.', 'warning');
      return;
    }

    if (!diagnosis) {
      showToast('Please enter a clinical diagnosis.', 'warning');
      return;
    }

    let certificateId: string | undefined = undefined;

    if (issueMedCert) {
      const fromDate = new Date().toISOString().split('T')[0];
      const toDate = new Date(Date.now() + restDays * 86400000).toISOString().split('T')[0];

      const cert = issueMedicalCertificate({
        patientId: currentPatient.id,
        patientName: `${currentPatient.firstName} ${currentPatient.lastName}`,
        patientPsuId: currentPatient.psuId,
        patientAge: currentPatient.age,
        patientGender: currentPatient.gender,
        patientAddress: currentPatient.address,
        consultationDate: fromDate,
        diagnosis,
        treatmentAndRemarks: recommendations || 'Medical evaluation and rest advised.',
        recommendedRestDays: restDays,
        restFromDate: fromDate,
        restToDate: toDate,
        fitToResumeStudiesOrWork: fitToResume,
        fitDate: toDate
      });

      certificateId = cert.certificateNumber;
    }

    const recorded = recordConsultation({
      patientId: currentPatient.id,
      vitalSignsId: latestVitals?.id,
      vitalSigns: latestVitals,
      subjective,
      physicalExamFindings: physicalExam,
      assessmentDiagnosis: diagnosis,
      icd10Code: icd10,
      planAndManagement: plan,
      recommendations,
      followUpDate,
      prescriptions,
      medicalCertificateIssued: issueMedCert,
      medicalCertificateId: certificateId
    });

    setModalPayload({
      consultation: recorded,
      patient: currentPatient
    });

    // Advance and complete queue ticket for the patient
    if (currentPatient) {
      const activeTicket = queue.find(q => q.patientId === currentPatient.id && (q.stage === 'In Consultation' || q.stage === 'Waiting Doctor'));
      if (activeTicket) {
        updateQueueStage(activeTicket.id, 'Completed', 'Physician Clinic Room 1', true);
        updateQueueCallStatus(activeTicket.id, 'Completed', 'Physician Clinic Room 1', true);
      }
    }

    showToast('Consultation documented successfully! Patient queue ticket marked as Completed.', 'success');
    setActiveModal('print-rx');
  };

  if (!currentPatient) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Physician Clinical Decision & Consultation</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Consultation Room</h1>
          <p className="text-xs text-slate-500 mt-1">
            Streamlined physician diagnosis, 1-click clinical findings, E-Prescription (Rx), and Medical Certificate issuance.
          </p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 space-y-3 shadow-2xs">
          <Users className="w-10 h-10 mx-auto text-slate-300" />
          <h3 className="font-bold text-slate-700 text-sm">No Patients in Consultation Queue</h3>
          <p className="text-xs max-w-sm mx-auto text-slate-500">
            There are currently no patients registered or waiting for examination. Please check the Patient Queue or admit a patient.
          </p>
        </div>
      </div>
    );
  }

  // Doctor Messenger & Consultation Workspace State
  const messengerScrollRef = useRef<HTMLDivElement>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'queue' | 'vitals' | 'consulted'>('all');
  const [doctorConsultMode, setDoctorConsultMode] = useState<'view' | 'edit'>('view');
  const [activeEditingConsultationId, setActiveEditingConsultationId] = useState<string | null>(null);

  // Doctor Editable Consultation Fields
  const [docDiagnosis, setDocDiagnosis] = useState('Acute Upper Respiratory Tract Infection (URTI)');
  const [docIcd10, setDocIcd10] = useState('J06.9');
  const [docSubjective, setDocSubjective] = useState('');
  const [docPhysicalExam, setDocPhysicalExam] = useState({
    generalSurvey: 'Conscious, coherent, ambulatory, not in acute cardiopulmonary distress',
    heent: 'Anicteric sclerae, pink conjunctivae, non-hyperemic posterior pharyngeal wall',
    chestLungs: 'Symmetrical chest expansion, clear breath sounds, no rales or rhonchi',
    cardiovascular: 'Regular rate and rhythm, distinct S1/S2, no cardiac murmurs',
    abdomen: 'Soft, non-tender, normoactive bowel sounds, no palpable mass',
    extremities: 'Full equal pulses, no cyanosis, no bipedal edema, normal range of motion'
  });
  const [docPlan, setDocPlan] = useState('Increase oral fluid intake. Adequate bed rest. Warm saline gargle 3x daily. Symptomatic pharmacotherapy.');
  const [docRecommendations, setDocRecommendations] = useState('Avoid cold beverages and prolonged direct dust exposure. Return if fever persists > 48 hours.');
  const [docFollowUpDate, setDocFollowUpDate] = useState('');
  const [docPrescriptions, setDocPrescriptions] = useState<PrescriptionItem[]>([
    {
      id: 'rx-doc-default',
      medicineId: medicines[0]?.id || 'med-1',
      genericName: 'Paracetamol',
      brandName: 'Biogesic',
      dosageStrength: '500 mg',
      dosageForm: 'Tablet',
      frequency: 'Every 6 hours as needed for fever or headache',
      durationDays: 3,
      quantity: 10,
      instructions: 'Take after meals with water. Do not exceed 8 tablets daily.',
      dispensed: false
    }
  ]);
  const [docIssueMedCert, setDocIssueMedCert] = useState(false);
  const [docRestDays, setDocRestDays] = useState(2);
  const [docFitToResume, setDocFitToResume] = useState(false);
  const [docApprovalChecked, setDocApprovalChecked] = useState(true);
  const [docApprovalRemarks, setDocApprovalRemarks] = useState('Consultation finished and approved by attending doctor.');

  // Approval Modal State
  const [approvalModalConsultation, setApprovalModalConsultation] = useState<Consultation | null>(null);
  const [approvalRemarksInput, setApprovalRemarksInput] = useState('');
  const [isApprovingLoading, setIsApprovingLoading] = useState(false);

  // Sync doctor editable fields whenever current patient changes
  useEffect(() => {
    if (!currentPatient) return;
    const patientCons = consultations.filter(c => c.patientId === currentPatient.id);
    if (patientCons.length > 0) {
      const latest = patientCons[0];
      setActiveEditingConsultationId(latest.id);
      setDocDiagnosis(latest.assessmentDiagnosis || 'Acute Upper Respiratory Tract Infection (URTI)');
      setDocIcd10(latest.icd10Code || 'J06.9');
      setDocSubjective(latest.subjective || latestVitals?.chiefComplaint || 'Patient presents for physician consultation and clinical assessment.');
      setDocPhysicalExam(latest.physicalExamFindings || {
        generalSurvey: 'Conscious, coherent, ambulatory, not in acute cardiopulmonary distress',
        heent: 'Anicteric sclerae, pink conjunctivae, non-hyperemic posterior pharyngeal wall',
        chestLungs: 'Symmetrical chest expansion, clear breath sounds, no rales or rhonchi',
        cardiovascular: 'Regular rate and rhythm, distinct S1/S2, no cardiac murmurs',
        abdomen: 'Soft, non-tender, normoactive bowel sounds, no palpable mass',
        extremities: 'Full equal pulses, no cyanosis, no bipedal edema, normal range of motion'
      });
      setDocPlan(latest.planAndManagement || 'Increase oral fluid intake. Adequate bed rest. Warm saline gargle 3x daily.');
      setDocRecommendations(latest.recommendations || 'Return if symptoms worsen.');
      setDocFollowUpDate(latest.followUpDate || '');
      setDocPrescriptions(latest.prescriptions ? [...latest.prescriptions] : []);
      setDocIssueMedCert(!!latest.medicalCertificateIssued);
      setDocApprovalChecked(latest.isApproved !== undefined ? Boolean(latest.isApproved) : true);
      setDocApprovalRemarks(latest.approvalNotes || 'Consultation finished and approved by attending doctor.');
    } else {
      setActiveEditingConsultationId(null);
      setDocDiagnosis('Acute Upper Respiratory Tract Infection (URTI)');
      setDocIcd10('J06.9');
      setDocSubjective(latestVitals?.chiefComplaint || 'Patient presents for physician consultation and clinical assessment.');
      setDocPhysicalExam({
        generalSurvey: 'Conscious, coherent, ambulatory, not in acute cardiopulmonary distress',
        heent: 'Anicteric sclerae, pink conjunctivae, non-hyperemic posterior pharyngeal wall',
        chestLungs: 'Symmetrical chest expansion, clear breath sounds, no rales or rhonchi',
        cardiovascular: 'Regular rate and rhythm, distinct S1/S2, no cardiac murmurs',
        abdomen: 'Soft, non-tender, normoactive bowel sounds, no palpable mass',
        extremities: 'Full equal pulses, no cyanosis, no bipedal edema, normal range of motion'
      });
      setDocPlan('Increase oral fluid intake. Adequate bed rest. Warm saline gargle 3x daily. Symptomatic pharmacotherapy.');
      setDocRecommendations('Avoid cold beverages and prolonged direct dust exposure. Return if fever persists > 48 hours.');
      setDocFollowUpDate('');
      setDocPrescriptions([
        {
          id: `rx-doc-${Date.now()}`,
          medicineId: medicines[0]?.id || 'med-1',
          genericName: 'Paracetamol',
          brandName: 'Biogesic',
          dosageStrength: '500 mg',
          dosageForm: 'Tablet',
          frequency: 'Every 6 hours as needed for fever or headache',
          durationDays: 3,
          quantity: 10,
          instructions: 'Take after meals with water. Do not exceed 8 tablets daily.',
          dispensed: false
        }
      ]);
      setDocIssueMedCert(false);
      setDocApprovalChecked(true);
      setDocApprovalRemarks('Consultation finished and approved by attending doctor.');
    }
  }, [currentPatient?.id, consultations.length]);

  const scrollMessenger = (direction: 'left' | 'right') => {
    if (messengerScrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      messengerScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleAddDocMedication = () => {
    const med = medicines[0] || {
      id: 'med-1',
      genericName: 'Paracetamol',
      brandName: 'Biogesic',
      dosageStrength: '500 mg',
      dosageForm: 'Tablet'
    };
    const newRx: PrescriptionItem = {
      id: `rx-doc-item-${Date.now()}`,
      medicineId: med.id,
      genericName: med.genericName,
      brandName: med.brandName,
      dosageStrength: med.dosageStrength,
      dosageForm: med.dosageForm,
      frequency: 'Every 8 hours after meals',
      durationDays: 5,
      quantity: 15,
      instructions: 'Take with full glass of water.',
      dispensed: false
    };
    setDocPrescriptions([...docPrescriptions, newRx]);
  };

  const handleRemoveDocMedication = (id: string) => {
    setDocPrescriptions(docPrescriptions.filter(p => p.id !== id));
  };

  const handleUpdateDocMedication = (id: string, updates: Partial<PrescriptionItem>) => {
    setDocPrescriptions(docPrescriptions.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const handleSaveDoctorConsultation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentPatient) {
      showToast('Please select a patient.', 'warning');
      return;
    }
    if (!docDiagnosis.trim()) {
      showToast('Please enter a clinical diagnosis.', 'warning');
      return;
    }

    let certificateId: string | undefined = undefined;
    if (docIssueMedCert) {
      const fromDate = new Date().toISOString().split('T')[0];
      const toDate = new Date(Date.now() + docRestDays * 86400000).toISOString().split('T')[0];
      const cert = issueMedicalCertificate({
        patientId: currentPatient.id,
        patientName: `${currentPatient.firstName} ${currentPatient.lastName}`,
        patientPsuId: currentPatient.psuId,
        patientAge: currentPatient.age,
        patientGender: currentPatient.gender,
        patientAddress: currentPatient.address,
        consultationDate: fromDate,
        diagnosis: docDiagnosis,
        treatmentAndRemarks: docRecommendations || 'Medical evaluation and rest advised.',
        recommendedRestDays: docRestDays,
        restFromDate: fromDate,
        restToDate: toDate,
        fitToResumeStudiesOrWork: docFitToResume,
        fitDate: toDate
      });
      certificateId = cert.certificateNumber;
    }

    const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const fullDate = new Date().toISOString().split('T')[0];
    const fullStamp = `${fullDate} ${nowTime}`;

    if (activeEditingConsultationId) {
      updateConsultation(activeEditingConsultationId, {
        assessmentDiagnosis: docDiagnosis,
        icd10Code: docIcd10,
        subjective: docSubjective,
        physicalExamFindings: docPhysicalExam,
        planAndManagement: docPlan,
        recommendations: docRecommendations,
        followUpDate: docFollowUpDate,
        prescriptions: docPrescriptions,
        medicalCertificateIssued: docIssueMedCert,
        medicalCertificateId: certificateId,
        status: docApprovalChecked ? 'approved' : 'pending_approval',
        approvalStatus: docApprovalChecked ? 'approved' : 'pending_approval',
        isApproved: docApprovalChecked,
        approvedAt: docApprovalChecked ? fullStamp : undefined,
        approvedByDoctorId: docApprovalChecked ? (currentUser?.id || 'usr-doc-1') : undefined,
        approvedByDoctorName: docApprovalChecked ? (currentUser?.fullName || 'Dr. Roberto M. Manalo, MD') : undefined,
        approvedByDoctorLicense: docApprovalChecked ? (currentUser?.prcLicense || '0098412') : undefined,
        approvalNotes: docApprovalChecked ? (docApprovalRemarks || 'Consultation clinically approved and finished by attending doctor.') : undefined
      });
      showToast(
        docApprovalChecked
          ? '✓ Consultation finished and officially approved by attending physician!'
          : '✓ Consultation updated and saved successfully by attending doctor!',
        'success'
      );
    } else {
      const recorded = recordConsultation({
        patientId: currentPatient.id,
        vitalSignsId: latestVitals?.id,
        vitalSigns: latestVitals,
        subjective: docSubjective,
        physicalExamFindings: docPhysicalExam,
        assessmentDiagnosis: docDiagnosis,
        icd10Code: docIcd10,
        planAndManagement: docPlan,
        recommendations: docRecommendations,
        followUpDate: docFollowUpDate,
        prescriptions: docPrescriptions,
        medicalCertificateIssued: docIssueMedCert,
        medicalCertificateId: certificateId,
        isApproved: docApprovalChecked,
        approvalNotes: docApprovalRemarks
      } as any);
      setActiveEditingConsultationId(recorded.id);
      showToast(
        docApprovalChecked
          ? '✓ Consultation documented, finished, and officially approved by attending physician!'
          : '✓ Consultation documented and saved successfully!',
        'success'
      );
    }

    // Mark patient's queue ticket as 'Completed'
    if (currentPatient) {
      const activeTicket = queue.find(q => q.patientId === currentPatient.id && (q.stage === 'In Consultation' || q.stage === 'Waiting Doctor'));
      if (activeTicket) {
        updateQueueStage(activeTicket.id, 'Completed', 'Physician Clinic Room 1', true);
        updateQueueCallStatus(activeTicket.id, 'Completed', 'Physician Clinic Room 1', true);
      }
    }

    setDoctorConsultMode('view');
  };

  const handleOpenApproveModal = (con: Consultation) => {
    setApprovalModalConsultation(con);
    setApprovalRemarksInput(con.approvalNotes || 'Clinically evaluated, prescriptions authorized, and consultation finalized.');
  };

  const handleConfirmApproveModal = async () => {
    if (!approvalModalConsultation) return;
    setIsApprovingLoading(true);
    try {
      await approveConsultation(approvalModalConsultation.id, approvalRemarksInput);
      setApprovalModalConsultation(null);
    } finally {
      setIsApprovingLoading(false);
    }
  };

  const renderApprovalModal = () => {
    if (!approvalModalConsultation) return null;
    const pat = patients.find(p => p.id === approvalModalConsultation.patientId) || currentPatient;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-5 bg-gradient-to-r from-red-900 via-[#7F1416] to-amber-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <ShieldCheck className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-base">Physician Consultation Approval</h3>
                <p className="text-[11px] text-amber-100">
                  Official Clinical Validation & E-Prescription Authorization
                </p>
              </div>
            </div>
            <button
              onClick={() => setApprovalModalConsultation(null)}
              className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
            {/* Patient Pill */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  {pat?.firstName} {pat?.lastName}
                </div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  {pat?.classification} · {pat?.courseAndYear || pat?.collegeOrDepartment}
                </div>
              </div>
              <span className="font-mono text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                {pat?.psuId}
              </span>
            </div>

            {/* Assessment & Plan */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Clinical Diagnosis:
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-sm text-red-950">
                  {approvalModalConsultation.assessmentDiagnosis}
                </div>
                {approvalModalConsultation.icd10Code && (
                  <div className="font-mono text-[11px] text-slate-500">
                    ICD-10: {approvalModalConsultation.icd10Code}
                  </div>
                )}
                {approvalModalConsultation.planAndManagement && (
                  <div className="text-slate-600 text-[11px] pt-1 border-t border-slate-200 mt-1">
                    <strong>Plan:</strong> {approvalModalConsultation.planAndManagement}
                  </div>
                )}
              </div>
            </div>

            {/* Prescriptions */}
            {approvalModalConsultation.prescriptions && approvalModalConsultation.prescriptions.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Prescribed Formulary Medications ({approvalModalConsultation.prescriptions.length} items):
                </div>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {approvalModalConsultation.prescriptions.map((rx, idx) => (
                    <div key={rx.id || idx} className="p-2.5 flex items-center justify-between text-[11px]">
                      <div>
                        <strong className="text-slate-900">{rx.genericName}</strong> {rx.brandName && `(${rx.brandName})`} · {rx.dosageStrength}
                        <div className="text-slate-500">{rx.frequency} · {rx.durationDays} day(s) · {rx.instructions}</div>
                      </div>
                      <span className="font-mono font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Qty: {rx.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attending Physician Credentials Stamp */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-300 rounded-xl space-y-2">
              <div className="text-[11px] font-bold text-amber-950 flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Authorized Signatory Credentials</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500 block">Attending Physician:</span>
                  <strong className="text-slate-900 font-serif">Dr. {currentUser?.fullName || 'Roberto M. Manalo, MD'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">PRC License No.:</span>
                  <strong className="font-mono text-red-900">{currentUser?.prcLicense || '0098412'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">PTR Number:</span>
                  <span className="font-mono text-slate-700">{currentUser?.ptrNumber || 'PTR-8834921-2026'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Designation:</span>
                  <span className="text-slate-700">{currentUser?.title || 'University Physician'}</span>
                </div>
              </div>
            </div>

            {/* Remarks Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                Physician Clearance Remarks / Discharge Notes *
              </label>
              <textarea
                rows={2}
                value={approvalRemarksInput}
                onChange={(e) => setApprovalRemarksInput(e.target.value)}
                placeholder="e.g. Clinically evaluated, prescriptions authorized, and student cleared for symptomatic self-care."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
              />
            </div>

            {approvalModalConsultation.isApproved ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  This consultation was already officially approved on <strong>{approvalModalConsultation.approvedAt}</strong>. You can update clearance remarks if needed.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  Upon approval, the patient consultation is finalized, the queue ticket is marked Completed, and official electronic clearances become available.
                </span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setApprovalModalConsultation(null)}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={isApprovingLoading}
              onClick={handleConfirmApproveModal}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              {isApprovingLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing Approval...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-200" />
                  <span>Sign & Clinically Approve Consultation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (currentUser?.role === 'doctor') {
    const patientConsultations = consultations.filter(c => c.patientId === currentPatient.id);

    // Filter patients for Messenger horizontal rail
    const filteredMessengerPatients = patients.filter(p => {
      const query = patientSearch.toLowerCase().trim();
      const matchesSearch = !query ||
        p.firstName.toLowerCase().includes(query) ||
        p.lastName.toLowerCase().includes(query) ||
        p.psuId.toLowerCase().includes(query) ||
        p.collegeOrDepartment.toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (filterMode === 'queue') {
        return queue.some(q => q.patientId === p.id && q.stage !== 'Completed');
      }
      if (filterMode === 'vitals') {
        return vitalSigns.some(v => v.patientId === p.id);
      }
      if (filterMode === 'consulted') {
        return consultations.some(c => c.patientId === p.id);
      }
      return true;
    });

    const queueWaitingCount = patients.filter(p => queue.some(q => q.patientId === p.id && q.stage !== 'Completed')).length;
    const withVitalsCount = patients.filter(p => vitalSigns.some(v => v.patientId === p.id)).length;
    const consultedCount = patients.filter(p => consultations.some(c => c.patientId === p.id)).length;

    return (
      <div className="space-y-6">
        {/* Top Physician Banner */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
              <Stethoscope className="w-4 h-4" />
              <span>Physician Consultation Room</span>
            </div>
            <h1 className="text-xl font-bold text-slate-900">
              Consultation Room & Patient Medical Dossier
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any patient horizontally like in Messenger to view full information and vitals. Review and edit clinical consultations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 bg-red-50 text-red-800 rounded-lg border border-red-200">
              Dr. {currentUser?.fullName || 'Physician'} · PRC #{currentUser?.prcLicense || '0098412'}
            </span>
          </div>
        </div>

        {/* LIVE DOCTOR CONSULTATION QUEUE PRIORITY BAR */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-red-100 text-red-900 rounded-lg">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                    Live Doctor Consultation Queue
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                    {waitingDoctorTickets.length} waiting
                  </span>
                  {currentQueueTicket && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                      <span>Now in Room: Ticket #{currentQueueTicket.ticketNumber}</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Triaged walk-in and scheduled patients ready for physician clinical examination.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {waitingDoctorTickets.length > 0 && (
                <button
                  type="button"
                  onClick={handleCallNextQueuedPatient}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                >
                  <BellRing className="w-3.5 h-3.5" />
                  <span>Call Next Queued Patient</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('queue')}
                className="text-xs font-semibold text-red-800 hover:underline flex items-center gap-1"
              >
                <span>Full Queue Board</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Queued Patients Badges */}
          {doctorQueueTickets.length === 0 ? (
            <div className="p-3 text-center bg-slate-50 border border-slate-100 rounded-xl text-slate-400 text-xs">
              No patients waiting in queue right now. Arriving patients triaged by nursing staff will appear here immediately.
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {doctorQueueTickets.map(ticket => {
                const pat = patients.find(p => p.id === ticket.patientId);
                const isCurrent = currentPatient?.id === ticket.patientId;
                const isInExam = ticket.stage === 'In Consultation';
                const v = vitalSigns.find(v => v.patientId === ticket.patientId);

                return (
                  <button
                    key={ticket.id}
                    type="button"
                    onClick={() => handleCallQueuedPatient(ticket)}
                    className={`px-3 py-2 rounded-xl border text-left transition-all shrink-0 cursor-pointer flex items-center gap-3 ${
                      isCurrent
                        ? 'bg-red-50 border-red-300 ring-2 ring-red-700/20 shadow-xs'
                        : isInExam
                        ? 'bg-blue-50 border-blue-200 hover:bg-blue-100/60'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-red-900 text-xs">
                          {ticket.ticketNumber}
                        </span>
                        {ticket.priority !== 'Regular' && (
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            ticket.priority === 'Emergency' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ticket.priority}
                          </span>
                        )}
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-semibold ${
                          isInExam ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ticket.stage}
                        </span>
                      </div>
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[130px]">
                        {pat ? `${pat.firstName} ${pat.lastName}` : ticket.patientName}
                      </span>
                      {v && (
                        <span className="text-[10px] font-mono text-slate-500">
                          BP: {v.bloodPressureSystolic}/{v.bloodPressureDiastolic} · {v.temperature}°C
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* MESSENGER HORIZONTALLY CLICKABLE PATIENTS RAIL */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Patient Active List
              </span>
              <span className="text-[11px] text-slate-400">
                (Click any patient to inspect information)
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Filter name or ID..."
                  className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-red-700 w-36 sm:w-48 text-slate-800"
                />
                {patientSearch && (
                  <button
                    onClick={() => setPatientSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Scroll Arrow Buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollMessenger('left')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Scroll Left"
                  aria-label="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollMessenger('right')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Scroll Right"
                  aria-label="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filter Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap text-[11px] ${
                filterMode === 'all'
                  ? 'bg-red-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Patients ({patients.length})
            </button>
            <button
              onClick={() => setFilterMode('queue')}
              className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap text-[11px] flex items-center gap-1.5 ${
                filterMode === 'queue'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
              <span>In Queue ({queueWaitingCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('vitals')}
              className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap text-[11px] flex items-center gap-1.5 ${
                filterMode === 'vitals'
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>With Nurse Vitals ({withVitalsCount})</span>
            </button>
            <button
              onClick={() => setFilterMode('consulted')}
              className={`px-2.5 py-1 rounded-full font-semibold transition-all cursor-pointer whitespace-nowrap text-[11px] flex items-center gap-1.5 ${
                filterMode === 'consulted'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              <span>Consulted Records ({consultedCount})</span>
            </button>
          </div>

          {/* MESSENGER HORIZONTAL SCROLL RAIL */}
          <div
            ref={messengerScrollRef}
            className="flex items-center gap-3 overflow-x-auto py-2 px-1 scroll-smooth select-none focus:outline-none"
            style={{ scrollbarWidth: 'thin' }}
          >
            {filteredMessengerPatients.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400 w-full">
                No patients match the search or filter criteria.
              </div>
            ) : (
              filteredMessengerPatients.map(p => {
                const isSelected = currentPatient?.id === p.id;
                const queueTicket = queue.find(q => q.patientId === p.id && q.stage !== 'Completed');
                const hasVitals = vitalSigns.some(v => v.patientId === p.id);
                const hasAllergy = p.knownAllergies && p.knownAllergies.length > 0 && p.knownAllergies[0] !== 'None declared';
                const hasConsult = consultations.some(c => c.patientId === p.id);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPatient(p);
                      setDoctorConsultMode('view');
                    }}
                    className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all cursor-pointer min-w-[84px] max-w-[96px] shrink-0 text-center relative group ${
                      isSelected
                        ? 'bg-red-50/90 border-2 border-red-800 shadow-sm scale-105'
                        : 'bg-white hover:bg-slate-50 border border-slate-200/90 hover:scale-102 hover:shadow-2xs'
                    }`}
                    title={`Click to view information for ${p.firstName} ${p.lastName} (${p.psuId})`}
                  >
                    {/* Queue Ticket Badge if in Queue */}
                    {queueTicket && (
                      <span className="absolute -top-1.5 -right-1 bg-amber-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-xs uppercase tracking-tighter z-10 font-mono">
                        {queueTicket.ticketNumber}
                      </span>
                    )}

                    {/* Messenger Circular Avatar */}
                    <div className="relative mb-1.5">
                      <div
                        className={`w-13 h-13 rounded-full flex items-center justify-center font-bold text-sm text-white transition-transform ${
                          isSelected
                            ? 'ring-3 ring-red-800 ring-offset-2 ring-offset-white shadow-md'
                            : 'ring-1 ring-slate-200'
                        } ${
                          p.gender === 'Female'
                            ? 'bg-gradient-to-tr from-pink-600 to-rose-400'
                            : 'bg-gradient-to-tr from-[#7F1416] to-amber-700'
                        }`}
                      >
                        {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                      </div>

                      {/* Messenger Active/Status Indicator Dot */}
                      <span
                        className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-2xs ${
                          queueTicket
                            ? 'bg-emerald-500 animate-pulse'
                            : hasVitals
                            ? 'bg-blue-600'
                            : hasConsult
                            ? 'bg-purple-600'
                            : 'bg-slate-400'
                        }`}
                        title={
                          queueTicket
                            ? 'In Queue (Active Now)'
                            : hasVitals
                            ? 'Triage Vitals Ready'
                            : hasConsult
                            ? 'Has Documented Consultations'
                            : 'Registered Patient'
                        }
                      />
                    </div>

                    {/* Patient Name like Messenger */}
                    <span className={`text-[11px] font-bold leading-tight truncate w-full px-1 ${
                      isSelected ? 'text-red-900' : 'text-slate-800'
                    }`}>
                      {p.firstName} {p.lastName.charAt(0)}.
                    </span>

                    {/* Subtitle / Classification */}
                    <span className="text-[10px] text-slate-400 truncate w-full font-mono mt-0.5">
                      {p.classification === 'Student' ? 'Student' : p.classification === 'Faculty' ? 'Faculty' : 'Staff'}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* PATIENT INFORMATION & OTHER DETAILS (Selected Patient Dossier) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-red-900 to-amber-700 text-white font-extrabold text-xl flex items-center justify-center shadow-xs shrink-0">
                {currentPatient.firstName.charAt(0)}{currentPatient.lastName.charAt(0)}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-black text-slate-900">
                    {currentPatient.firstName} {currentPatient.middleName ? `${currentPatient.middleName.charAt(0)}.` : ''} {currentPatient.lastName} {currentPatient.suffix || ''}
                  </h2>
                  <span className="font-mono text-xs font-bold text-red-800 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                    {currentPatient.psuId}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md font-semibold">
                    {currentPatient.classification}
                  </span>
                  {currentPatient.civilStatus && (
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                      {currentPatient.civilStatus}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>{currentPatient.collegeOrDepartment}</span>
                  {currentPatient.courseAndYear && (
                    <>
                      <span>·</span>
                      <span className="font-medium text-slate-700">{currentPatient.courseAndYear}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{currentPatient.age} years old · {currentPatient.gender}</span>
                  <span>·</span>
                  <span className="font-bold text-red-900">Blood Type {currentPatient.bloodType}</span>
                </div>
              </div>
            </div>

            {/* Quick Contact & Emergency Card */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Mobile & Email</div>
                <div className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>{currentPatient.contactNumber}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate max-w-[180px]">
                  {currentPatient.email}
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="text-[10px] text-slate-400 font-semibold uppercase">Emergency Contact</div>
                <div className="font-bold text-slate-800 mt-0.5">
                  {currentPatient.emergencyContactName} ({currentPatient.emergencyContactRelationship || 'Guardian'})
                </div>
                <div className="text-[11px] text-slate-500">
                  {currentPatient.emergencyContactPhone}
                </div>
              </div>
            </div>
          </div>

          {/* High-Alert Drug Allergy Banner */}
          {currentPatient.knownAllergies && currentPatient.knownAllergies.length > 0 && currentPatient.knownAllergies[0] !== 'None declared' ? (
            <div className="p-3 bg-red-100/90 border border-red-300 rounded-xl text-xs text-red-900 font-bold flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                <span>HIGH-ALERT DRUG ALLERGIES: {currentPatient.knownAllergies.join(', ')}</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 bg-red-200 text-red-900 rounded font-black uppercase">
                Contraindicated
              </span>
            </div>
          ) : (
            <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>No known drug allergies reported.</span>
            </div>
          )}

          {/* NURSE TRIAGE & VITAL SIGNS (Kay nurse lahat ang trabaho for patient intake) */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5 text-emerald-800 font-bold">
                <Activity className="w-3.5 h-3.5" />
                <span>
                  {latestVitals
                    ? `Nurse Triage Intake (Recorded by Nurse ${latestVitals.recordedByName} at ${latestVitals.timestamp})`
                    : 'Nurse Triage Vital Signs'}
                </span>
              </span>
              {latestVitals && (
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  latestVitals.triageLevel === 'Emergency' ? 'bg-red-100 text-red-800' :
                  latestVitals.triageLevel === 'Urgent' ? 'bg-amber-100 text-amber-800' :
                  'bg-emerald-100 text-emerald-800'
                }`}>
                  {latestVitals.triageLevel} Priority
                </span>
              )}
            </div>

            {latestVitals ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-sans">Blood Pressure</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic} <span className="text-[10px] text-slate-400 font-normal">mmHg</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-sans">Heart Rate</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {latestVitals.heartRate} <span className="text-[10px] text-slate-400 font-normal">bpm</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-sans">Body Temp</div>
                    <div className={`font-bold text-sm ${latestVitals.temperature >= 37.8 ? 'text-red-700' : 'text-slate-900'}`}>
                      {latestVitals.temperature} <span className="text-[10px] text-slate-400 font-normal">°C</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-sans">Oxygen SpO2</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {latestVitals.oxygenSaturation} <span className="text-[10px] text-slate-400 font-normal">%</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-sans">BMI & Category</div>
                    <div className="font-bold text-slate-900 text-sm">
                      {latestVitals.bmi} <span className="text-[10px] text-slate-500 font-normal">({latestVitals.bmiClassification})</span>
                    </div>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[10px] text-slate-400 font-sans">Pain Score</div>
                    <div className="font-bold text-red-700 text-sm">
                      {latestVitals.painScale} / 10
                    </div>
                  </div>
                </div>

                {/* Nurse Recorded Chief Complaint */}
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs">
                  <div className="font-bold text-emerald-950 mb-0.5">
                    Nurse Recorded Chief Complaint / Triage Reason:
                  </div>
                  <div className="text-emerald-900 font-medium">
                    {latestVitals.chiefComplaint || 'Patient walked in for health evaluation.'}
                  </div>
                  {latestVitals.nurseNotes && (
                    <div className="text-[11px] text-emerald-700 mt-1 italic">
                      Nurse Note: {latestVitals.nurseNotes}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>No vital signs recorded yet for this patient today. Triage intake will be handled by the clinic nurse.</span>
                <span className="font-semibold text-amber-900 text-[11px] bg-amber-100 px-2 py-0.5 rounded">Pending Triage</span>
              </div>
            )}
          </div>
        </div>

        {/* CLINICAL CONSULTATION WORKSPACE (DOCTOR SEES AND EDITS) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-red-800" />
                <h3 className="font-bold text-slate-900 text-base">
                  Physician Consultation & Clinical Decision
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                The doctor reviews documented consultations and can edit findings, diagnosis, plan, and prescriptions.
              </p>
            </div>

            {/* Mode Toggle: View Mode vs Edit Mode */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setDoctorConsultMode('view')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  doctorConsultMode === 'view'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-blue-700" />
                <span>View Records</span>
              </button>
              <button
                type="button"
                onClick={() => setDoctorConsultMode('edit')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  doctorConsultMode === 'edit'
                    ? 'bg-red-800 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Consultation</span>
              </button>
            </div>
          </div>

          {/* VIEW MODE: SEE THE CONSULTATION */}
          {doctorConsultMode === 'view' && (
            <div className="space-y-4">
              {patientConsultations.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs space-y-3 bg-slate-50 rounded-xl border border-slate-200">
                  <FileText className="w-8 h-8 mx-auto text-slate-300" />
                  <div className="font-bold text-slate-700">No Consultation Documented for {currentPatient.firstName} Yet</div>
                  <p className="max-w-md mx-auto text-slate-500">
                    The clinic nurse documents initial triage intake. You can edit and record a consultation right now.
                  </p>
                  <button
                    type="button"
                    onClick={() => setDoctorConsultMode('edit')}
                    className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create / Edit Consultation Now</span>
                  </button>
                </div>
              ) : (
                patientConsultations.map(con => (
                  <div key={con.id} className="p-5 bg-slate-50/70 border border-slate-200 rounded-xl space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">Consultation Record</span>
                          <span className="font-mono text-xs text-slate-500">{con.date} {con.time}</span>
                          {con.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Approved by Physician</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              <Clock className="w-3.5 h-3.5 text-amber-700" />
                              <span>Pending Physician Approval</span>
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Attending Physician: <strong>{con.approvedByDoctorName || con.doctorName || currentUser?.fullName}</strong> (PRC #{con.approvedByDoctorLicense || con.doctorLicense || currentUser?.prcLicense || '0098412'})
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* If not approved, high visibility Doctor Approve button */}
                        {!con.isApproved && (currentUser?.role === 'doctor' || currentUser?.role === 'administrator') ? (
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(con)}
                            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ring-2 ring-emerald-500/30"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-200" />
                            <span>Approve Consultation</span>
                          </button>
                        ) : con.isApproved ? (
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(con)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                            title="View official physician approval details"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Approval Details</span>
                          </button>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => {
                            setActiveEditingConsultationId(con.id);
                            setDocDiagnosis(con.assessmentDiagnosis);
                            setDocIcd10(con.icd10Code || '');
                            setDocSubjective(con.subjective);
                            setDocPhysicalExam(con.physicalExamFindings || docPhysicalExam);
                            setDocPlan(con.planAndManagement || '');
                            setDocRecommendations(con.recommendations || '');
                            setDocFollowUpDate(con.followUpDate || '');
                            setDocPrescriptions(con.prescriptions ? [...con.prescriptions] : []);
                            setDocIssueMedCert(!!con.medicalCertificateIssued);
                            setDocApprovalChecked(con.isApproved !== undefined ? Boolean(con.isApproved) : true);
                            setDocApprovalRemarks(con.approvalNotes || 'Consultation finished and approved by attending doctor.');
                            setDoctorConsultMode('edit');
                          }}
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-red-800" />
                          <span>Edit This Record</span>
                        </button>

                        {con.prescriptions && con.prescriptions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalPayload({ consultation: con, patient: currentPatient });
                              setActiveModal('print-rx');
                            }}
                            className="px-3 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-300" />
                            <span>Print Rx Slip</span>
                          </button>
                        )}

                        {con.medicalCertificateIssued && (
                          <button
                            type="button"
                            onClick={() => {
                              setModalPayload({ consultation: con, patient: currentPatient });
                              setActiveModal('print-med-cert');
                            }}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5 text-red-800" />
                            <span>Print Med Cert</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Official Physician Approval Banner if Approved */}
                    {con.isApproved ? (
                      <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50/60 to-emerald-50 border border-emerald-300 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0 font-bold shadow-xs">
                            <ShieldCheck className="w-5 h-5 text-emerald-100" />
                          </div>
                          <div>
                            <div className="font-bold text-emerald-950 flex flex-wrap items-center gap-1.5">
                              <span>Officially Approved & Clinically Signed by {con.approvedByDoctorName || con.doctorName}</span>
                              <span className="text-[10px] font-mono bg-white text-emerald-900 px-1.5 py-0.5 rounded border border-emerald-300 font-bold">
                                PRC #{con.approvedByDoctorLicense || con.doctorLicense || '0098412'}
                              </span>
                            </div>
                            <div className="text-[11px] text-emerald-800 mt-0.5 flex flex-wrap items-center gap-2">
                              <span>Validated: <strong className="font-mono">{con.approvedAt || `${con.date} ${con.time}`}</strong></span>
                              {con.approvalNotes && <span className="italic">— "{con.approvalNotes}"</span>}
                            </div>
                          </div>
                        </div>
                        <div className="self-end sm:self-center font-mono text-[10px] font-bold text-emerald-900 bg-white border border-emerald-300 px-2.5 py-1 rounded-md shadow-2xs">
                          CLINICAL CLEARANCE GRANTED
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Consultation documented. Awaiting physician clinical approval and official sign-off.</span>
                        </div>
                        {(currentUser?.role === 'doctor' || currentUser?.role === 'administrator') && (
                          <button
                            type="button"
                            onClick={() => handleOpenApproveModal(con)}
                            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer self-end sm:self-center shrink-0"
                          >
                            Sign & Approve Now
                          </button>
                        )}
                      </div>
                    )}

                    {/* SOAP Details Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block">Clinical Diagnosis & Assessment</span>
                        <div className="text-slate-800 font-bold text-sm text-red-900">{con.assessmentDiagnosis}</div>
                        {con.icd10Code && <div className="font-mono text-slate-500 text-[11px]">ICD-10 Code: {con.icd10Code}</div>}
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                        <span className="font-bold text-slate-900 block">Subjective (Chief Complaint & HPI)</span>
                        <div className="text-slate-700">{con.subjective || 'Evaluated for clinical symptoms.'}</div>
                      </div>

                      {con.physicalExamFindings && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1.5 md:col-span-2">
                          <span className="font-bold text-slate-900 block">Physical Examination Findings</span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-slate-600">
                            <div><strong className="text-slate-800">General:</strong> {con.physicalExamFindings.generalSurvey}</div>
                            <div><strong className="text-slate-800">HEENT:</strong> {con.physicalExamFindings.heent}</div>
                            <div><strong className="text-slate-800">Chest & Lungs:</strong> {con.physicalExamFindings.chestLungs}</div>
                            <div><strong className="text-slate-800">Cardiovascular:</strong> {con.physicalExamFindings.cardiovascular}</div>
                            <div><strong className="text-slate-800">Abdomen:</strong> {con.physicalExamFindings.abdomen}</div>
                            <div><strong className="text-slate-800">Extremities:</strong> {con.physicalExamFindings.extremities}</div>
                          </div>
                        </div>
                      )}

                      {con.planAndManagement && (
                        <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1 md:col-span-2">
                          <span className="font-bold text-slate-900 block">Management Plan & Instructions</span>
                          <div className="text-slate-700 leading-relaxed">{con.planAndManagement}</div>
                          {con.recommendations && (
                            <div className="text-slate-600 mt-1 italic text-[11px]">
                              Recommendations: {con.recommendations}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Prescriptions */}
                    {con.prescriptions && con.prescriptions.length > 0 && (
                      <div className="space-y-2 pt-2 border-t border-slate-200">
                        <span className="font-bold text-slate-900 text-xs">Prescriptions (Rx)</span>
                        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                          {con.prescriptions.map((rx, idx) => (
                            <div key={rx.id || idx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div>
                                <div className="font-bold text-slate-900">
                                  {rx.genericName} {rx.brandName ? `(${rx.brandName})` : ''} · {rx.dosageStrength} · {rx.dosageForm}
                                </div>
                                <div className="text-slate-500 text-[11px] mt-0.5">
                                  {rx.frequency} · {rx.durationDays} day(s) · {rx.instructions}
                                </div>
                              </div>
                              <span className="font-mono font-bold text-red-800 bg-red-50 px-2 py-0.5 rounded border border-red-200 text-xs shrink-0">
                                Qty: {rx.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* EDIT MODE: EDIT THE CONSULTATION */}
          {doctorConsultMode === 'edit' && (
            <form onSubmit={handleSaveDoctorConsultation} className="space-y-5 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
                <span className="font-semibold">
                  ✏️ Editing Clinical Consultation for <strong>{currentPatient.firstName} {currentPatient.lastName}</strong> ({currentPatient.psuId})
                </span>
                <span className="text-[11px] text-amber-700">
                  {activeEditingConsultationId ? 'Updating existing consultation' : 'Creating new consultation'}
                </span>
              </div>

              {/* 1. Clinical Diagnosis & Morbidity Code */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    1. Clinical Diagnosis (Assessment)
                  </span>
                  <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ⚡ 1-Click Templates
                  </span>
                </div>

                {/* Common Morbidity Quick Pickers */}
                <div className="flex flex-wrap gap-1.5">
                  {commonDiagnoses.map(d => (
                    <button
                      key={d.title}
                      type="button"
                      onClick={() => {
                        setDocDiagnosis(d.title);
                        setDocIcd10(d.icd);
                        if (d.icd === 'J06.9') {
                          setDocPlan('Increase oral fluid intake. Adequate bed rest. Warm saline gargle 3x daily. Symptomatic pharmacotherapy.');
                          setDocRecommendations('Avoid cold beverages and dust exposure. Return if fever persists > 48 hours.');
                        } else if (d.icd === 'G44.2') {
                          setDocPlan('Analgesic therapy as needed. Screen rest & hydration. Stress counseling.');
                          setDocRecommendations('Rest in a quiet room. Avoid skipping meals.');
                        } else if (d.icd === 'A09') {
                          setDocPlan('Oral rehydration salts (ORS) after each loose stool. Bland BRAT diet.');
                          setDocRecommendations('Strict hand hygiene and safe water intake.');
                        } else if (d.icd === 'J30.4') {
                          setDocPlan('Antihistamine therapy. Nasal saline spray. Allergen avoidance.');
                          setDocRecommendations('Wear face mask in dusty areas.');
                        } else if (d.icd === 'I10') {
                          setDocPlan('Low-sodium diet. Maintenance antihypertensive regimen. Daily BP monitoring.');
                          setDocRecommendations('Avoid strenuous exertion. Re-check BP in 1 week.');
                        } else if (d.icd === 'S93.4') {
                          setDocPlan('R.I.C.E. protocol (Rest, Ice 15 mins q4h, Compression, Elevation).');
                          setDocRecommendations('Avoid weight-bearing sports until pain subsides.');
                        }
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                        docDiagnosis === d.title
                          ? 'bg-red-800 text-white border-red-800 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-red-50 hover:text-red-900'
                      }`}
                    >
                      {d.title} ({d.icd})
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <div className="sm:col-span-3">
                    <label className="block font-semibold mb-1 text-slate-700">Diagnosis Description *</label>
                    <input
                      type="text"
                      value={docDiagnosis}
                      onChange={(e) => setDocDiagnosis(e.target.value)}
                      placeholder="e.g. Acute Upper Respiratory Tract Infection"
                      required
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">ICD-10 Code</label>
                    <input
                      type="text"
                      value={docIcd10}
                      onChange={(e) => setDocIcd10(e.target.value)}
                      placeholder="e.g. J06.9"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono font-bold text-blue-900 text-xs focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Subjective & Physical Findings */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide block">
                  2. Subjective & Physical Examination (SOAP)
                </span>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Chief Complaint & History of Present Illness (Subjective)</label>
                  <textarea
                    rows={2}
                    value={docSubjective}
                    onChange={(e) => setDocSubjective(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700">Physical Exam Findings (Objective)</label>
                    <button
                      type="button"
                      onClick={() => setDocPhysicalExam({
                        generalSurvey: 'Conscious, coherent, ambulatory, not in acute cardiopulmonary distress',
                        heent: 'Anicteric sclerae, pink conjunctivae, non-hyperemic posterior pharyngeal wall',
                        chestLungs: 'Symmetrical chest expansion, clear breath sounds, no rales or rhonchi',
                        cardiovascular: 'Regular rate and rhythm, distinct S1/S2, no cardiac murmurs',
                        abdomen: 'Soft, non-tender, normoactive bowel sounds, no palpable mass',
                        extremities: 'Full equal pulses, no cyanosis, no bipedal edema, normal range of motion'
                      })}
                      className="text-[11px] text-blue-700 font-bold hover:underline cursor-pointer"
                    >
                      Fill Normal Findings Template
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">General Survey:</span>
                      <input
                        type="text"
                        value={docPhysicalExam.generalSurvey}
                        onChange={(e) => setDocPhysicalExam({ ...docPhysicalExam, generalSurvey: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">HEENT:</span>
                      <input
                        type="text"
                        value={docPhysicalExam.heent}
                        onChange={(e) => setDocPhysicalExam({ ...docPhysicalExam, heent: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Chest & Lungs:</span>
                      <input
                        type="text"
                        value={docPhysicalExam.chestLungs}
                        onChange={(e) => setDocPhysicalExam({ ...docPhysicalExam, chestLungs: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Cardiovascular:</span>
                      <input
                        type="text"
                        value={docPhysicalExam.cardiovascular}
                        onChange={(e) => setDocPhysicalExam({ ...docPhysicalExam, cardiovascular: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Abdomen:</span>
                      <input
                        type="text"
                        value={docPhysicalExam.abdomen}
                        onChange={(e) => setDocPhysicalExam({ ...docPhysicalExam, abdomen: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium">Extremities:</span>
                      <input
                        type="text"
                        value={docPhysicalExam.extremities}
                        onChange={(e) => setDocPhysicalExam({ ...docPhysicalExam, extremities: e.target.value })}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Management Plan & Recommendations */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <span className="font-bold text-slate-900 text-xs uppercase tracking-wide block">
                  3. Management Plan & Recommendations
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Clinical Management Plan</label>
                    <textarea
                      rows={2}
                      value={docPlan}
                      onChange={(e) => setDocPlan(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold mb-1 text-slate-700">Recommendations & Patient Advice</label>
                    <textarea
                      rows={2}
                      value={docRecommendations}
                      onChange={(e) => setDocRecommendations(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1 text-slate-700">Follow-up Date (Optional)</label>
                  <input
                    type="date"
                    value={docFollowUpDate}
                    onChange={(e) => setDocFollowUpDate(e.target.value)}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium"
                  />
                </div>
              </div>

              {/* 4. Prescriptions (Rx) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs uppercase tracking-wide">
                    4. Electronic Prescriptions (Rx)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddDocMedication}
                    className="px-2.5 py-1 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {docPrescriptions.length === 0 ? (
                    <div className="p-3 text-center text-slate-400 text-xs bg-white rounded-lg border border-slate-200">
                      No prescriptions added. Click "Add Medicine" to prescribe medication.
                    </div>
                  ) : (
                    docPrescriptions.map((rx) => (
                      <div key={rx.id} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold">Select Medicine</span>
                            <select
                              value={rx.medicineId}
                              onChange={(e) => {
                                const med = medicines.find(m => m.id === e.target.value);
                                if (med) {
                                  handleUpdateDocMedication(rx.id, {
                                    medicineId: med.id,
                                    genericName: med.genericName,
                                    brandName: med.brandName,
                                    dosageStrength: med.dosageStrength,
                                    dosageForm: med.dosageForm
                                  });
                                }
                              }}
                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-bold cursor-pointer"
                            >
                              {medicines.map(m => (
                                <option key={m.id} value={m.id}>
                                  {m.genericName} ({m.brandName}) - {m.dosageStrength}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-bold">Frequency</span>
                            <input
                              type="text"
                              value={rx.frequency}
                              onChange={(e) => handleUpdateDocMedication(rx.id, { frequency: e.target.value })}
                              placeholder="e.g. Every 8 hours"
                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                            />
                          </div>

                          <div>
                            <span className="text-[10px] text-slate-400 font-bold">Duration (Days)</span>
                            <input
                              type="number"
                              min={1}
                              value={rx.durationDays}
                              onChange={(e) => handleUpdateDocMedication(rx.id, { durationDays: Number(e.target.value) })}
                              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono"
                            />
                          </div>

                          <div className="flex items-end gap-1.5">
                            <div className="flex-1">
                              <span className="text-[10px] text-slate-400 font-bold">Quantity</span>
                              <input
                                type="number"
                                min={1}
                                value={rx.quantity}
                                onChange={(e) => handleUpdateDocMedication(rx.id, { quantity: Number(e.target.value) })}
                                className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-mono font-bold"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocMedication(rx.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Remove medication"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 font-bold">Instructions</span>
                          <input
                            type="text"
                            value={rx.instructions}
                            onChange={(e) => handleUpdateDocMedication(rx.id, { instructions: e.target.value })}
                            placeholder="e.g. Take after meals with full glass of water."
                            className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-xs"
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 5. Medical Certificate Option */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-xs">
                  <input
                    type="checkbox"
                    checked={docIssueMedCert}
                    onChange={(e) => setDocIssueMedCert(e.target.checked)}
                    className="w-4 h-4 text-red-800 rounded focus:ring-red-600 cursor-pointer"
                  />
                  <span>Issue / Update Official Medical Certificate & Absence Clearance</span>
                </label>

                {docIssueMedCert && (
                  <div className="pl-6 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">Recommended Rest Days</span>
                      <input
                        type="number"
                        value={docRestDays}
                        onChange={(e) => setDocRestDays(Number(e.target.value))}
                        min={0}
                        max={30}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-600 block mb-1">Fit to Resume</span>
                      <select
                        value={docFitToResume ? 'yes' : 'no'}
                        onChange={(e) => setDocFitToResume(e.target.value === 'yes')}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs font-bold cursor-pointer"
                      >
                        <option value="no">Needs Bed Rest / Excused Leave</option>
                        <option value="yes">Fit to Resume Studies & Duties</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Physician Approval & Clinical Sign-off (Finished Consultation) */}
              <div className="p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-800" />
                    <span className="font-bold text-emerald-950 text-xs uppercase tracking-wide">
                      6. Physician Clinical Approval & Final Clearance
                    </span>
                  </div>
                  <span className="text-[10px] font-bold font-mono bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                    Attending Physician Authority
                  </span>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer font-bold text-slate-900 text-xs">
                  <input
                    type="checkbox"
                    checked={docApprovalChecked}
                    onChange={(e) => setDocApprovalChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-emerald-950 font-bold">
                      Officially approve this patient consultation upon finishing
                    </span>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                      Applies Dr. {currentUser?.fullName || 'Attending Physician'}'s digital clinical signature (PRC #{currentUser?.prcLicense || '0098412'}), validates prescriptions, and marks consultation completed for the patient.
                    </p>
                  </div>
                </label>

                {docApprovalChecked && (
                  <div className="pl-6 pt-1 space-y-1.5">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Physician Clearance Remarks / Discharge Notes:
                    </label>
                    <input
                      type="text"
                      value={docApprovalRemarks}
                      onChange={(e) => setDocApprovalRemarks(e.target.value)}
                      placeholder="e.g. Clinically evaluated, prescriptions authorized, and patient cleared."
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                )}
              </div>

              {/* Submit & Cancel Actions */}
              <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setDoctorConsultMode('view')}
                  className="px-4 py-2 bg-white hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs border border-slate-300 transition-colors cursor-pointer"
                >
                  Cancel / Return to View
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDocApprovalChecked(false);
                      handleSaveDoctorConsultation();
                    }}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-bold text-xs transition-colors cursor-pointer"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-200" />
                    <span>{docApprovalChecked ? '✓ Approve & Finish Consultation' : 'Save & Update Consultation'}</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* APPROVAL CONFIRMATION MODAL */}
        {renderApprovalModal()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Nurse Clinical Documentation & Assessment</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Consultation Documentation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Streamlined clinical documentation, 1-click clinical findings, E-Prescription (Rx), and Medical Certificate issuance.
          </p>
        </div>

        {/* Patient Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600">Active Patient:</label>
          <select
            value={currentPatient.id}
            onChange={(e) => {
              const p = patients.find(pat => pat.id === e.target.value);
              if (p) setSelectedPatient(p);
            }}
            className="p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 cursor-pointer"
          >
            {patients.map(p => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName} ({p.psuId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Clinical Overview Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-lg">
                {currentPatient.firstName} {currentPatient.lastName}
              </span>
              <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                {currentPatient.psuId}
              </span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                {currentPatient.classification}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {currentPatient.courseAndYear || currentPatient.collegeOrDepartment} · {currentPatient.age} yrs · {currentPatient.gender} · Blood Type {currentPatient.bloodType}
            </div>
          </div>

          {/* High Alert Allergies */}
          {currentPatient.knownAllergies && currentPatient.knownAllergies.length > 0 && currentPatient.knownAllergies[0] !== 'None declared' ? (
            <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-xs text-red-800 font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
              <span>DRUG ALLERGIES: {currentPatient.knownAllergies.join(', ')}</span>
            </div>
          ) : (
            <div className="text-xs text-slate-400">No known drug allergies</div>
          )}
        </div>

        {/* Preliminary Triage Vitals Captured by Nurse */}
        {latestVitals ? (
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
              <span className="flex items-center gap-1.5 text-emerald-800">
                <Activity className="w-3.5 h-3.5" />
                <span>Triage Vital Signs Recorded ({latestVitals.timestamp} by {latestVitals.recordedByName})</span>
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                latestVitals.triageLevel === 'Emergency' ? 'bg-red-100 text-red-800' :
                latestVitals.triageLevel === 'Urgent' ? 'bg-amber-100 text-amber-800' :
                'bg-slate-100 text-slate-800'
              }`}>
                {latestVitals.triageLevel} Priority
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs font-mono">
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-400">BP</div>
                <div className="font-bold text-slate-900">{latestVitals.bloodPressureSystolic}/{latestVitals.bloodPressureDiastolic} mmHg</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-400">Heart Rate</div>
                <div className="font-bold text-slate-900">{latestVitals.heartRate} bpm</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-400">Temp</div>
                <div className="font-bold text-slate-900">{latestVitals.temperature}°C</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-400">SpO2</div>
                <div className="font-bold text-slate-900">{latestVitals.oxygenSaturation}%</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-400">BMI</div>
                <div className="font-bold text-slate-900">{latestVitals.bmi} ({latestVitals.bmiClassification})</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-200 rounded">
                <div className="text-[10px] text-slate-400">Pain Score</div>
                <div className="font-bold text-red-700">{latestVitals.painScale} / 10</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
            No vital signs recorded for this patient today. You may proceed or send patient to triage desk first.
          </div>
        )}
      </div>

      {/* Streamlined Consultation Decision Form */}
      <form onSubmit={handleSubmitConsultation} className="space-y-5 text-xs text-slate-700">
        {/* 1. CLINICAL DIAGNOSIS & QUICK TEMPLATES (Primary Doctor Decision) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
                1
              </span>
              <span>Clinical Diagnosis & Assessment (1-Click Templates)</span>
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              ⚡ Auto-Fills Findings & Care Plan
            </span>
          </div>

          {/* Quick Common University Morbidity Selector */}
          <div>
            <span className="text-[11px] text-slate-500 font-semibold block mb-1.5">
              Select a Common Condition to Auto-Populate Diagnosis, ICD-10 & Plan:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {commonDiagnoses.map(d => (
                <button
                  key={d.title}
                  type="button"
                  onClick={() => {
                    setDiagnosis(d.title);
                    setIcd10(d.icd);
                    if (d.icd === 'J06.9') {
                      setPlan('Increase oral fluid intake. Adequate bed rest. Warm saline gargle 3x daily. Symptomatic pharmacotherapy.');
                      setRecommendations('Avoid cold beverages and dust exposure. Return if fever persists > 48 hours.');
                    } else if (d.icd === 'G44.2') {
                      setPlan('Analgesic therapy as needed. Screen rest & hydration. Stress and sleep hygiene counseling.');
                      setRecommendations('Rest in a quiet room. Avoid skipping meals. Follow up if headache worsens.');
                    } else if (d.icd === 'A09') {
                      setPlan('Oral rehydration salts (ORS) after each loose stool. Bland BRAT diet. Symptomatic relief.');
                      setRecommendations('Strict hand hygiene and safe water intake. Return immediately if signs of dehydration occur.');
                    } else if (d.icd === 'J30.4') {
                      setPlan('Antihistamine therapy. Nasal saline spray. Allergen avoidance education.');
                      setRecommendations('Wear face mask in dusty areas. Maintain clean sleeping environment.');
                    } else if (d.icd === 'I10') {
                      setPlan('Low-sodium, heart-healthy diet. Continue maintenance antihypertensive regimen. Daily BP monitoring.');
                      setRecommendations('Avoid strenuous exertion and high-caffeine intake. Re-check BP in 1 week.');
                    } else if (d.icd === 'S93.4') {
                      setPlan('R.I.C.E. protocol (Rest, Ice compress 15 mins q4h, Compression, Elevation). Analgesic/anti-inflammatory.');
                      setRecommendations('Avoid weight-bearing sports until pain subsides. Use supportive footwear.');
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    diagnosis === d.title
                      ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                      : 'bg-slate-50 hover:bg-red-50 hover:text-red-800 text-slate-700 border-slate-200'
                  }`}
                >
                  {d.title} ({d.icd})
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            <div className="sm:col-span-3">
              <label className="block font-semibold mb-1 text-slate-600">Selected Clinical Diagnosis *</label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                placeholder="Select template above or type custom diagnosis..."
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 text-sm focus:ring-2 focus:ring-red-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1 text-slate-600">ICD-10 Code</label>
              <input
                type="text"
                value={icd10}
                onChange={(e) => setIcd10(e.target.value)}
                placeholder="e.g. J06.9"
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-blue-900 text-sm focus:ring-2 focus:ring-red-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Pre-filled Clinical Summary & Optional Remarks */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-700">
                Clinical Findings & Care Plan (Pre-filled from Nurse Triage & Template):
              </span>
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-600">Follow-up Date:</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Management Plan (Auto-filled, editable if needed)</label>
                <input
                  type="text"
                  value={plan}
                  onChange={(e) => setPlan(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Home Care / Remarks (Auto-filled, editable if needed)</label>
                <input
                  type="text"
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ELECTRONIC PRESCRIPTION (Rx) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="text-red-700 font-serif font-black text-lg">Rx</span>
              <span>Electronic Medical Prescription</span>
            </h3>
            <button
              type="button"
              onClick={handleAddMedication}
              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Medication</span>
            </button>
          </div>

          <div className="space-y-3">
            {prescriptions.map((rx, idx) => (
              <div key={rx.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Item #{idx + 1}</span>
                  {prescriptions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMedication(rx.id)}
                      className="text-red-600 hover:text-red-800 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold mb-1">Formulary Medicine</label>
                    <select
                      value={rx.medicineId}
                      onChange={(e) => {
                        const m = medicines.find(med => med.id === e.target.value);
                        if (m) {
                          handleUpdateMedication(rx.id, {
                            medicineId: m.id,
                            genericName: m.genericName,
                            brandName: m.brandName,
                            dosageStrength: m.dosageStrength,
                            dosageForm: m.dosageForm
                          });
                        }
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded cursor-pointer font-medium"
                    >
                      {medicines.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.genericName} ({m.brandName}) - {m.dosageStrength} [Stock: {m.currentStock}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1">Frequency & Timing</label>
                    <input
                      type="text"
                      value={rx.frequency}
                      onChange={(e) => handleUpdateMedication(rx.id, { frequency: e.target.value })}
                      placeholder="e.g. Every 8 hours after meals"
                      className="w-full p-2 bg-white border border-slate-300 rounded font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold mb-1">Days</label>
                      <input
                        type="number"
                        value={rx.durationDays}
                        onChange={(e) => handleUpdateMedication(rx.id, { durationDays: Number(e.target.value) })}
                        min={1}
                        className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">Quantity</label>
                      <input
                        type="number"
                        value={rx.quantity}
                        onChange={(e) => handleUpdateMedication(rx.id, { quantity: Number(e.target.value) })}
                        min={1}
                        className="w-full p-2 bg-white border border-slate-300 rounded font-mono font-bold text-red-800"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold mb-1">Instructions to Patient</label>
                  <input
                    type="text"
                    value={rx.instructions}
                    onChange={(e) => handleUpdateMedication(rx.id, { instructions: e.target.value })}
                    placeholder="e.g. Complete antibiotic course. Do not skip doses."
                    className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MEDICAL CERTIFICATE / CLEARANCE OPTION */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-3">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900 text-sm">
            <input
              type="checkbox"
              checked={issueMedCert}
              onChange={(e) => setIssueMedCert(e.target.checked)}
              className="w-4 h-4 text-red-700 rounded focus:ring-red-600 cursor-pointer"
            />
            <span>Issue Official Medical Certificate / Student Excused Absence Clearance</span>
          </label>

          {issueMedCert && (
            <div className="pl-6 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100">
              <div>
                <label className="block font-semibold mb-1">Recommended Medical Rest Days</label>
                <input
                  type="number"
                  value={restDays}
                  onChange={(e) => setRestDays(Number(e.target.value))}
                  min={0}
                  max={30}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold text-slate-900"
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  0 days = Fit to resume immediately; &gt; 0 = Excused medical leave.
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Fit to Resume Studies / Work</label>
                <select
                  value={fitToResume ? 'yes' : 'no'}
                  onChange={(e) => setFitToResume(e.target.value === 'yes')}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-bold cursor-pointer"
                >
                  <option value="no">Needs Bed Rest / Medical Excuse</option>
                  <option value="yes">Fit to Resume Duties & Classes</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            Attending Physician: <strong>{currentUser?.fullName}</strong> (PRC No: {currentUser?.prcLicense || '0098412'})
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-red-800 hover:bg-red-900 text-white rounded-lg font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Complete Consultation & Print Rx</span>
          </button>
        </div>
      </form>

      {/* APPROVAL CONFIRMATION MODAL */}
      {renderApprovalModal()}
    </div>
  );
};
