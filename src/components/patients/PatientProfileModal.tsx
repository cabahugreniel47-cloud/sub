import React, { useState, useEffect, useMemo } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Patient } from '../../types/clinic';
import {
  X,
  Users,
  Activity,
  Stethoscope,
  FileText,
  AlertTriangle,
  Clock,
  Pill,
  Download,
  ShieldCheck,
  CheckCircle2,
  Archive,
  RotateCcw,
  Trash2,
  History,
  Calendar,
  MapPin,
  Phone,
  Mail,
  AlertCircle,
  Filter,
  CheckCircle,
  FileClock
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  date: string;
  type: 'registration' | 'vitals' | 'consultation' | 'prescription' | 'appointment' | 'certificate' | 'archived' | 'restored';
  title: string;
  description: string;
  performer?: string;
  badgeColor?: string;
  data?: any;
}

export const PatientProfileModal: React.FC = () => {
  const {
    currentUser,
    selectedPatient,
    setSelectedPatient,
    setActiveModal,
    setModalPayload,
    vitalSigns,
    consultations,
    approveConsultation,
    certificates,
    appointments,
    archivePatient,
    restorePatient,
    deletePatient,
    getPatientHistory,
    showToast
  } = useClinic();

  const [activeProfileTab, setActiveProfileTab] = useState<'timeline' | 'vitals' | 'consultations' | 'prescriptions' | 'certificates' | 'demographics'>('timeline');
  const [timelineFilter, setTimelineFilter] = useState<'all' | 'consultations' | 'vitals' | 'prescriptions' | 'certificates' | 'lifecycle'>('all');

  // Action modals within profile
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [archiveReasonCategory, setArchiveReasonCategory] = useState<string>('Graduated');
  const [archiveReasonNotes, setArchiveReasonNotes] = useState<string>('');

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmationPsuId, setDeleteConfirmationPsuId] = useState<string>('');

  const [isProcessing, setIsProcessing] = useState(false);

  if (!selectedPatient) return null;

  const isArchived = selectedPatient.status === 'archived';

  const patientVitals = vitalSigns.filter(v => v.patientId === selectedPatient.id);
  const patientConsultations = consultations.filter(c => c.patientId === selectedPatient.id);
  const patientCertificates = certificates.filter(c => c.patientId === selectedPatient.id);
  const patientAppointments = appointments.filter(a => a.patientId === selectedPatient.id);

  // Collect all prescriptions
  const allPrescriptions = patientConsultations.flatMap(c =>
    (c.prescriptions || []).map(p => ({
      ...p,
      consultationDate: c.date,
      doctorName: c.approvedByDoctorName || c.doctorName || 'Clinic Physician'
    }))
  );

  // Unified Chronological Lifetime Clinical History Timeline
  const rawTimeline: TimelineEvent[] = useMemo(() => {
    const list: TimelineEvent[] = [];

    // 1. Intake / Registration Event
    if (selectedPatient.registeredAt) {
      list.push({
        id: `tl-reg-${selectedPatient.id}`,
        date: selectedPatient.registeredAt,
        type: 'registration',
        title: 'Initial Intake & Patient Registration',
        description: `Enrolled into Central Health Registry as ${selectedPatient.classification} (${selectedPatient.courseAndYear || selectedPatient.collegeOrDepartment}).`,
        performer: 'University Clinic Records',
        badgeColor: 'bg-blue-100 text-blue-900 border-blue-200'
      });
    }

    // 2. Vital Signs Events
    patientVitals.forEach(v => {
      list.push({
        id: `tl-v-${v.id}`,
        date: v.timestamp,
        type: 'vitals',
        title: `Health Assessment (${v.triageLevel} Triage)`,
        description: `BP: ${v.bloodPressureSystolic}/${v.bloodPressureDiastolic} mmHg · HR: ${v.heartRate} bpm · Temp: ${v.temperature}°C · SpO2: ${v.oxygenSaturation}% · BMI: ${v.bmi} (${v.bmiClassification}). Chief Complaint: "${v.chiefComplaint}"`,
        performer: v.recordedByName,
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
        data: v
      });
    });

    // 3. Physician Consultations
    patientConsultations.forEach(c => {
      list.push({
        id: `tl-c-${c.id}`,
        date: `${c.date} ${c.time || ''}`.trim(),
        type: 'consultation',
        title: `Clinical Consultation: ${c.assessmentDiagnosis || 'General Examination'}`,
        description: `Chief Complaint: "${c.subjective}" · Plan: ${c.planAndManagement || 'Observation & Care'}${c.prescriptions && c.prescriptions.length > 0 ? ` · (${c.prescriptions.length} Meds Prescribed)` : ''}`,
        performer: c.approvedByDoctorName || c.doctorName || 'Attending Physician',
        badgeColor: 'bg-red-100 text-[#7F1416] border-red-200',
        data: c
      });
    });

    // 4. Prescriptions Dispensing
    allPrescriptions.forEach((p, idx) => {
      list.push({
        id: `tl-rx-${p.id || idx}`,
        date: p.consultationDate,
        type: 'prescription',
        title: `Prescribed Medication: ${p.genericName} ${p.dosageStrength}`,
        description: `Dosage: ${p.frequency} for ${p.durationDays} day(s) (Qty: ${p.quantity} ${p.dosageForm}s). Instructions: ${p.instructions}. Dispense status: ${p.dispensed ? 'Dispensed' : 'Pending Pharmacy'}`,
        performer: p.doctorName,
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
        data: p
      });
    });

    // 5. Appointments
    patientAppointments.forEach(a => {
      list.push({
        id: `tl-apt-${a.id}`,
        date: `${a.date} ${a.time || ''}`.trim(),
        type: 'appointment',
        title: `Clinic Appointment (${a.purpose})`,
        description: `Scheduled slot: ${a.date} at ${a.time}. Status: ${a.status}${a.notes ? ` · Notes: ${a.notes}` : ''}`,
        performer: a.doctorName || 'University Clinic Staff',
        badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200',
        data: a
      });
    });

    // 6. Medical Certificates
    patientCertificates.forEach(cert => {
      list.push({
        id: `tl-cert-${cert.id}`,
        date: cert.issuedAt,
        type: 'certificate',
        title: `Medical Certificate Issued (${cert.certificateNumber})`,
        description: `Diagnosis: ${cert.diagnosis} · Remarks: ${cert.treatmentAndRemarks} · Rest: ${cert.recommendedRestDays} day(s) · ${cert.fitToResumeStudiesOrWork ? 'Fit to resume duties' : 'Bed rest recommended'}`,
        performer: cert.doctorName,
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
        data: cert
      });
    });

    // 7. Archival Event (Past Patient)
    if (selectedPatient.status === 'archived' && selectedPatient.archivedAt) {
      list.push({
        id: `tl-arch-${selectedPatient.id}`,
        date: selectedPatient.archivedAt,
        type: 'archived',
        title: 'Patient Record Moved to Past / Archived Database',
        description: `Reason: ${selectedPatient.archivedReason || 'Archived record'}. Previous medical encounters preserved.`,
        performer: selectedPatient.archivedBy || 'Clinic Staff',
        badgeColor: 'bg-amber-200 text-amber-950 border-amber-300'
      });
    }

    // 8. Restoration Event
    if (selectedPatient.restoredAt) {
      list.push({
        id: `tl-res-${selectedPatient.id}`,
        date: selectedPatient.restoredAt,
        type: 'restored',
        title: 'Patient Record Restored to Active Health Registry',
        description: 'Profile and medical encounters reactivated in active clinic roster.',
        performer: selectedPatient.restoredBy || 'Clinic Staff',
        badgeColor: 'bg-emerald-200 text-emerald-950 border-emerald-300'
      });
    }

    // Sort descending (most recent first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedPatient, patientVitals, patientConsultations, allPrescriptions, patientAppointments, patientCertificates]);

  // Filtered timeline
  const filteredTimeline = rawTimeline.filter(item => {
    if (timelineFilter === 'all') return true;
    if (timelineFilter === 'consultations') return item.type === 'consultation';
    if (timelineFilter === 'vitals') return item.type === 'vitals';
    if (timelineFilter === 'prescriptions') return item.type === 'prescription';
    if (timelineFilter === 'certificates') return item.type === 'certificate';
    if (timelineFilter === 'lifecycle') return item.type === 'registration' || item.type === 'archived' || item.type === 'restored' || item.type === 'appointment';
    return true;
  });

  // Action handlers
  const handleConfirmArchiveFromProfile = async () => {
    setIsProcessing(true);
    const finalReason = archiveReasonNotes.trim()
      ? `${archiveReasonCategory} - ${archiveReasonNotes.trim()}`
      : archiveReasonCategory;

    const ok = await archivePatient(selectedPatient.id, finalReason);
    setIsProcessing(false);
    if (ok) {
      setShowArchiveDialog(false);
      setArchiveReasonNotes('');
    }
  };

  const handleConfirmRestoreFromProfile = async () => {
    setIsProcessing(true);
    await restorePatient(selectedPatient.id);
    setIsProcessing(false);
  };

  const handleConfirmDeleteFromProfile = async () => {
    if (deleteConfirmationPsuId.trim() !== selectedPatient.psuId) return;
    setIsProcessing(true);
    const ok = await deletePatient(selectedPatient.id);
    setIsProcessing(false);
    if (ok) {
      setShowDeleteDialog(false);
      setDeleteConfirmationPsuId('');
      setSelectedPatient(null);
      setActiveModal(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* ========================================================================= */}
        {/* MODAL HEADER: Patient Identity, Status Badge, Quick Global Export */}
        {/* ========================================================================= */}
        <div className="p-5 md:p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black text-amber-300 bg-red-950/90 px-2.5 py-0.5 rounded border border-red-800/80">
                {selectedPatient.psuId}
              </span>
              <span className="text-xs bg-slate-800 text-slate-200 px-2.5 py-0.5 rounded font-semibold border border-slate-700">
                {selectedPatient.classification}
              </span>
              <span className="text-xs font-bold bg-white text-slate-900 px-2 py-0.5 rounded">
                Blood {selectedPatient.bloodType}
              </span>

              {isArchived ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-xs">
                  <Archive className="w-3 h-3" />
                  <span>PAST / ARCHIVED PATIENT</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span>CURRENT ACTIVE PATIENT</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white">
              {selectedPatient.firstName} {selectedPatient.middleName ? `${selectedPatient.middleName} ` : ''}{selectedPatient.lastName} {selectedPatient.suffix || ''}
            </h2>

            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-medium text-amber-200/90">{selectedPatient.courseAndYear || selectedPatient.collegeOrDepartment}</span>
              <span>·</span>
              <span>{selectedPatient.age} years old ({selectedPatient.gender})</span>
              <span>·</span>
              <span className="font-mono">Contact: {selectedPatient.contactNumber}</span>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {currentUser?.role !== 'doctor' && currentUser?.role !== 'administrator' && !isArchived && (
              <button
                onClick={() => {
                  setModalPayload({ patient: selectedPatient });
                  setActiveModal('record-vitals');
                }}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Record Vitals</span>
              </button>
            )}

            <button
              onClick={() => {
                setModalPayload({
                  patient: selectedPatient,
                  consultation: patientConsultations[0],
                  certificate: patientCertificates[0]
                });
                setActiveModal('export-record');
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Print, download PDF with official PSU seals and MCIS logo"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export History (PDF)</span>
            </button>

            <button
              onClick={() => {
                setSelectedPatient(null);
                setActiveModal(null);
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              title="Close Profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* STATUS BANNER: ARCHIVED VS ACTIVE LIFECYCLE CONTROLS */}
        {/* ========================================================================= */}
        {isArchived ? (
          <div className="bg-amber-500/10 border-b border-amber-300/80 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs text-amber-950">
              <Archive className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold flex items-center gap-2">
                  <span>This record is stored in the Past Patients Repository.</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 bg-amber-200 text-amber-900 rounded font-bold">
                    Archived Status
                  </span>
                </div>
                <div className="text-[11px] text-amber-900 mt-0.5">
                  <strong>Reason:</strong> {selectedPatient.archivedReason || 'Inactive / Past record'}
                  {selectedPatient.archivedAt && (
                    <span className="text-amber-800 ml-2">
                      · Archived on {selectedPatient.archivedAt.split('T')[0]} {selectedPatient.archivedBy ? `by ${selectedPatient.archivedBy}` : ''}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {currentUser?.role !== 'student' && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmRestoreFromProfile}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  title="Restore this patient back to Active Health Registry"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isProcessing ? 'Restoring...' : 'Restore to Active'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(true)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Permanently purge this record from database"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-900">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Active Health Registry Record:</strong> Enrolled in campus clinic since{' '}
                <span className="font-mono">{selectedPatient.registeredAt ? selectedPatient.registeredAt.split('T')[0] : 'Intake'}</span>.
              </span>
            </div>

            {currentUser?.role !== 'student' && (
              <button
                type="button"
                onClick={() => setShowArchiveDialog(true)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
                title="Archive / Remove patient to Past Patients repository"
              >
                <Archive className="w-3.5 h-3.5 text-amber-700" />
                <span>Remove / Move to Past Patients</span>
              </button>
            )}
          </div>
        )}

        {/* Allergy Alert Banner */}
        {selectedPatient.knownAllergies && selectedPatient.knownAllergies.length > 0 && selectedPatient.knownAllergies[0] !== 'None declared' && (
          <div className="bg-red-50 border-b border-red-200 px-6 py-2 flex items-center gap-2 text-xs text-red-900">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>CRITICAL DRUG ALLERGIES:</strong> {selectedPatient.knownAllergies.join(', ')}
            </span>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRIMARY TAB NAVIGATION */}
        {/* ========================================================================= */}
        <div className="flex items-center gap-1 px-5 pt-2.5 border-b border-slate-200 bg-slate-50 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveProfileTab('timeline')}
            className={`px-3.5 py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeProfileTab === 'timeline'
                ? 'border-red-700 text-[#7F1416] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5 text-[#7F1416]" />
            <span>Stored Clinical History ({rawTimeline.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('vitals')}
            className={`px-3.5 py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeProfileTab === 'vitals'
                ? 'border-red-700 text-[#7F1416] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Vital Signs ({patientVitals.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('consultations')}
            className={`px-3.5 py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeProfileTab === 'consultations'
                ? 'border-red-700 text-[#7F1416] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>Consultations ({patientConsultations.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('prescriptions')}
            className={`px-3.5 py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeProfileTab === 'prescriptions'
                ? 'border-red-700 text-[#7F1416] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Pill className="w-3.5 h-3.5 text-amber-600" />
            <span>Medications ({allPrescriptions.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('certificates')}
            className={`px-3.5 py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeProfileTab === 'certificates'
                ? 'border-red-700 text-[#7F1416] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-purple-600" />
            <span>Clearances ({patientCertificates.length})</span>
          </button>

          <button
            onClick={() => setActiveProfileTab('demographics')}
            className={`px-3.5 py-2 font-bold border-b-2 flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeProfileTab === 'demographics'
                ? 'border-red-700 text-[#7F1416] bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>Demographics</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB BODY */}
        {/* ========================================================================= */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 text-xs text-slate-700 bg-slate-50/40">
          
          {/* ===================================================================== */}
          {/* TAB: COMPREHENSIVE STORED CLINICAL HISTORY & TIMELINE */}
          {/* ===================================================================== */}
          {activeProfileTab === 'timeline' && (
            <div className="space-y-4">
              {/* Timeline Header & Filter Pills */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <FileClock className="w-4 h-4 text-[#7F1416]" />
                    <span>Stored Historical Health Record & Encounters</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chronological lifecycle data of current and past visits, checkups, physician assessments, prescriptions, and status transitions.
                  </p>
                </div>

                {/* Filter buttons */}
                <div className="flex items-center gap-1 flex-wrap bg-slate-100 p-1 rounded-lg">
                  <button
                    onClick={() => setTimelineFilter('all')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      timelineFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({rawTimeline.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter('consultations')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      timelineFilter === 'consultations' ? 'bg-white text-red-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Consults ({patientConsultations.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter('vitals')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      timelineFilter === 'vitals' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Vitals ({patientVitals.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter('prescriptions')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      timelineFilter === 'prescriptions' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Rx ({allPrescriptions.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter('certificates')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      timelineFilter === 'certificates' ? 'bg-white text-purple-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Certs ({patientCertificates.length})
                  </button>
                  <button
                    onClick={() => setTimelineFilter('lifecycle')}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                      timelineFilter === 'lifecycle' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Lifecycle
                  </button>
                </div>
              </div>

              {/* Timeline Items */}
              {filteredTimeline.length === 0 ? (
                <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400">
                  <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">No events found matching this filter.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Switch filter to "All" to view the full clinical record.</p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-3.5 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {filteredTimeline.map((item) => (
                    <div key={item.id} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-6 top-3 w-5 h-5 rounded-full bg-white border-2 border-[#7F1416] flex items-center justify-center shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-[#7F1416]" />
                      </span>

                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs">
                              {item.title}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.badgeColor || 'bg-slate-100 text-slate-700'}`}>
                              {item.type.toUpperCase()}
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-slate-400">
                            {item.date}
                          </div>
                        </div>

                        <p className="text-slate-600 text-xs leading-relaxed">
                          {item.description}
                        </p>

                        {item.performer && (
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100 flex items-center justify-between">
                            <span>Recorded / Attended by: <strong className="text-slate-600">{item.performer}</strong></span>
                            <span className="font-mono text-slate-400">ID: {item.id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB: VITAL SIGNS */}
          {/* ===================================================================== */}
          {activeProfileTab === 'vitals' && (
            <div className="space-y-4">
              {patientVitals.length === 0 ? (
                <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400">
                  No vital signs recorded yet for this patient.
                </div>
              ) : (
                patientVitals.map(v => (
                  <div key={v.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900">{v.timestamp}</span>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        v.triageLevel === 'Emergency' ? 'bg-red-100 text-red-800' :
                        v.triageLevel === 'Urgent' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {v.triageLevel} Triage
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 font-mono">
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Blood Pressure</div>
                        <div className="font-bold text-slate-900">{v.bloodPressureSystolic}/{v.bloodPressureDiastolic} mmHg</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Heart Rate</div>
                        <div className="font-bold text-slate-900">{v.heartRate} bpm</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Temp (°C)</div>
                        <div className="font-bold text-slate-900">{v.temperature}°C</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">SpO2</div>
                        <div className="font-bold text-slate-900">{v.oxygenSaturation}%</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">Height / Weight</div>
                        <div className="font-bold text-slate-900">{v.heightCm}cm / {v.weightKg}kg</div>
                      </div>
                      <div className="bg-slate-50 p-2 rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">BMI</div>
                        <div className="font-bold text-slate-900">{v.bmi} ({v.bmiClassification})</div>
                      </div>
                    </div>

                    <div className="text-slate-600 pt-1">
                      <strong>Chief Complaint:</strong> {v.chiefComplaint}
                    </div>
                    {v.nurseNotes && (
                      <div className="text-slate-500 italic">
                        <strong>Nurse Notes:</strong> {v.nurseNotes} · Recorded by {v.recordedByName}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB: CONSULTATIONS */}
          {/* ===================================================================== */}
          {activeProfileTab === 'consultations' && (
            <div className="space-y-4">
              {patientConsultations.length === 0 ? (
                <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400">
                  No physician consultation records documented yet.
                </div>
              ) : (
                patientConsultations.map(c => (
                  <div key={c.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900">{c.date} · {c.time}</span>
                          {c.isApproved ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                              <span>Approved by Physician</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Pending Doctor Approval</span>
                            </span>
                          )}
                          {c.icd10Code && (
                            <span className="font-mono bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">
                              ICD-10: {c.icd10Code}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Attending: {c.approvedByDoctorName || c.doctorName} (PRC: {c.approvedByDoctorLicense || c.doctorLicense || '0098412'})
                          {c.approvedAt && <span className="text-emerald-700 ml-1 font-semibold">· Approved on {c.approvedAt}</span>}
                        </div>
                      </div>

                      {/* Doctor quick approval button */}
                      {!c.isApproved && (currentUser?.role === 'doctor' || currentUser?.role === 'administrator') && (
                        <button
                          type="button"
                          onClick={async () => {
                            await approveConsultation(c.id, 'Clinically validated and approved via Patient Profile EMR.');
                          }}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Approve Consultation</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <div className="font-bold text-slate-800 text-xs mb-0.5">Clinical Assessment & Diagnosis:</div>
                      <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">{c.assessmentDiagnosis}</p>
                    </div>

                    <div>
                      <div className="font-bold text-slate-800 text-xs mb-0.5">Management & Clinical Plan:</div>
                      <p className="text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">{c.planAndManagement}</p>
                    </div>

                    {c.prescriptions && c.prescriptions.length > 0 && (
                      <div>
                        <div className="font-bold text-slate-800 text-xs mb-1">Prescribed Items:</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {c.prescriptions.map(p => (
                            <li key={p.id}>
                              <strong>{p.genericName} {p.dosageStrength}</strong> ({p.dosageForm}) - Qty: {p.quantity}. Instructions: {p.instructions}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB: PRESCRIPTIONS */}
          {/* ===================================================================== */}
          {activeProfileTab === 'prescriptions' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 text-xs">Prescribed Medications</span>
                {allPrescriptions.length > 0 && (
                  <button
                    onClick={() => {
                      setModalPayload({
                        patient: selectedPatient,
                        consultation: patientConsultations[0]
                      });
                      setActiveModal('print-rx');
                    }}
                    className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print / Download Rx (PDF)</span>
                  </button>
                )}
              </div>

              {allPrescriptions.length === 0 ? (
                <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400">
                  No medication records on file.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl shadow-2xs">
                  {allPrescriptions.map((p, idx) => (
                    <div key={p.id || idx} className="p-3.5 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-slate-900 text-xs">
                          {p.genericName} {p.dosageStrength}
                          {p.brandName && <span className="font-normal text-slate-500 ml-1">({p.brandName})</span>}
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          {p.frequency} · Duration: {p.durationDays} days · Qty: {p.quantity} {p.dosageForm}s
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Prescribed: {p.consultationDate} by {p.doctorName}
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        p.dispensed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {p.dispensed ? 'Dispensed' : 'Pending Pharmacy'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB: MEDICAL CLEARANCES */}
          {/* ===================================================================== */}
          {activeProfileTab === 'certificates' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 text-xs">Medical Certificates & Clearances</span>
                {patientCertificates.length > 0 && (
                  <button
                    onClick={() => {
                      setModalPayload({
                        patient: selectedPatient,
                        certificate: patientCertificates[0],
                        consultation: patientConsultations[0]
                      });
                      setActiveModal('print-med-cert');
                    }}
                    className="px-2.5 py-1 bg-red-700 hover:bg-red-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Print / Download Certificate (PDF)</span>
                  </button>
                )}
              </div>

              {patientCertificates.length === 0 ? (
                <div className="bg-white p-10 rounded-xl border border-slate-200 text-center text-slate-400">
                  No medical certificates or health clearances issued.
                </div>
              ) : (
                patientCertificates.map(cert => (
                  <div key={cert.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-red-800">{cert.certificateNumber}</span>
                      <span className="text-slate-400 text-xs">{cert.issuedAt}</span>
                    </div>
                    <div><strong>Diagnosis:</strong> {cert.diagnosis}</div>
                    <div><strong>Evaluation:</strong> {cert.treatmentAndRemarks}</div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      {cert.fitToResumeStudiesOrWork ? '✓ Fit to resume academic / work activities' : 'Recommended medical bed rest'}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TAB: DEMOGRAPHICS & BACKGROUND */}
          {/* ===================================================================== */}
          {activeProfileTab === 'demographics' && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-xs border-b border-slate-100 pb-2">
                Personal Demographics & Official PSU University Records
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">PSU Student / Employee ID</div>
                  <div className="font-mono font-bold text-[#7F1416] text-sm">{selectedPatient.psuId}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Classification</div>
                  <div className="font-bold text-slate-900">{selectedPatient.classification}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">College / Department</div>
                  <div className="font-semibold text-slate-800">{selectedPatient.collegeOrDepartment}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Course & Year Level</div>
                  <div className="font-semibold text-slate-800">{selectedPatient.courseAndYear || 'N/A'}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Date of Birth & Age</div>
                  <div className="font-semibold text-slate-800">{selectedPatient.birthDate} ({selectedPatient.age} years old)</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Gender & Civil Status</div>
                  <div className="font-semibold text-slate-800">{selectedPatient.gender} · {selectedPatient.civilStatus}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Philippine Contact Number</div>
                  <div className="font-mono text-slate-800">{selectedPatient.contactNumber}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Institutional Email</div>
                  <div className="font-mono text-slate-800">{selectedPatient.email}</div>
                </div>

                <div>
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">Residential Address</div>
                  <div className="text-slate-800">{selectedPatient.address}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs mb-2">Emergency Contact Person</h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Full Name:</span>
                    <strong className="text-slate-900">{selectedPatient.emergencyContactName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Relationship:</span>
                    <span className="text-slate-700">{selectedPatient.emergencyContactRelationship}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Emergency Phone:</span>
                    <span className="font-mono text-slate-900 font-bold">{selectedPatient.emergencyContactPhone}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h4 className="font-bold text-slate-800 text-xs mb-2">Medical Profile & Chronic Conditions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Known Drug & Environmental Allergies</span>
                    <span className="text-slate-800 font-medium">{selectedPatient.knownAllergies?.join(', ') || 'None declared'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block font-semibold uppercase">Chronic Medical Conditions</span>
                    <span className="text-slate-800 font-medium">{selectedPatient.chronicConditions?.join(', ') || 'None reported'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* ARCHIVE / REMOVE DIALOG MODAL */}
        {/* ========================================================================= */}
        {showArchiveDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Archive className="w-5 h-5" />
                  <h3 className="font-bold text-sm">Remove & Archive Patient</h3>
                </div>
                <button
                  onClick={() => setShowArchiveDialog(false)}
                  className="text-amber-100 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs text-slate-700">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </div>
                  <div className="text-[11px] font-mono text-amber-800">
                    PSU ID: {selectedPatient.psuId} · {selectedPatient.classification}
                  </div>
                  <p className="text-[11px] text-amber-900 leading-tight pt-1">
                    Archiving moves this patient to the <strong>Past Patients Repository</strong>. All previous encounters, consultations, prescriptions, and vital signs remain stored permanently and can be restored at any time.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Reason for Removal / Archival:
                  </label>
                  <select
                    value={archiveReasonCategory}
                    onChange={(e) => setArchiveReasonCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer text-xs"
                  >
                    <option value="Graduated">Graduated / Alumni</option>
                    <option value="Transferred to Other Campus">Transferred to Other Campus</option>
                    <option value="Transferred to Other University">Transferred to Other University</option>
                    <option value="Withdrawn / Dropped">Withdrawn / Dropped</option>
                    <option value="Employee Resigned / Retired">Employee Resigned / Retired</option>
                    <option value="Medical Record Closed">Medical Record Closed</option>
                    <option value="Inactive Account">Inactive Account</option>
                    <option value="Other">Other Specific Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Additional Notes / Justification (Optional):
                  </label>
                  <textarea
                    value={archiveReasonNotes}
                    onChange={(e) => setArchiveReasonNotes(e.target.value)}
                    placeholder="e.g. Graduated Class of 2024..."
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowArchiveDialog(false)}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleConfirmArchiveFromProfile}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-xs"
                  >
                    {isProcessing ? 'Saving to Database...' : 'Confirm Archival'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PERMANENT DELETE DIALOG MODAL */}
        {/* ========================================================================= */}
        {showDeleteDialog && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-200" />
                  <h3 className="font-bold text-sm">Permanent Database Deletion</h3>
                </div>
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  className="text-rose-100 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs text-slate-700">
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {selectedPatient.firstName} {selectedPatient.lastName}
                  </div>
                  <div className="text-[11px] font-mono text-rose-800">
                    PSU ID: {selectedPatient.psuId}
                  </div>
                  <p className="text-[11px] text-rose-900 leading-tight pt-1">
                    <strong>CRITICAL WARNING:</strong> This action permanently purges this patient record from the central database and Firestore. This operation cannot be undone.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Type the patient's PSU ID (<code className="font-mono text-rose-700">{selectedPatient.psuId}</code>) to confirm:
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmationPsuId}
                    onChange={(e) => setDeleteConfirmationPsuId(e.target.value)}
                    placeholder={selectedPatient.psuId}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-600"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteDialog(false);
                      setDeleteConfirmationPsuId('');
                    }}
                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessing || deleteConfirmationPsuId.trim() !== selectedPatient.psuId}
                    onClick={handleConfirmDeleteFromProfile}
                    className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isProcessing ? 'Purging Record...' : 'Permanently Delete'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
