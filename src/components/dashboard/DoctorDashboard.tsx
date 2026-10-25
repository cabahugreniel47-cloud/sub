import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Appointment, Consultation, QueueTicket } from '../../types/clinic';
import {
  Stethoscope,
  Users,
  Clock,
  Activity,
  FileText,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  Printer,
  X,
  HeartPulse,
  ShieldCheck,
  Ticket,
  BellRing,
  ArrowRight,
  Thermometer,
  Play
} from 'lucide-react';

export const DoctorDashboard: React.FC = () => {
  const {
    currentUser,
    appointments,
    updateAppointmentStatus,
    vitalSigns,
    consultations,
    approveConsultation,
    patients,
    setActiveTab,
    setActiveModal,
    setModalPayload,
    setSelectedPatient,
    showToast,
    queue,
    updateQueueStage,
    updateQueueCallStatus,
    playQueueChime
  } = useClinic();

  const [selectedAppointmentForView, setSelectedAppointmentForView] = useState<Appointment | null>(null);
  const [consultFilter, setConsultFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [dashboardApproveConsultation, setDashboardApproveConsultation] = useState<Consultation | null>(null);
  const [dashboardApprovalRemarks, setDashboardApprovalRemarks] = useState('');
  const [isApprovingDashboard, setIsApprovingDashboard] = useState(false);

  // Doctor's live triage consultation queue
  const waitingDoctorTickets = queue.filter(q => q.stage === 'Waiting Doctor');
  const inConsultationTickets = queue.filter(q => q.stage === 'In Consultation');
  const doctorQueueTickets = [...inConsultationTickets, ...waitingDoctorTickets];

  // Doctor's active and finished appointments
  const activeAppointments = appointments.filter(a => a.status !== 'Completed' && a.status !== 'Cancelled');
  const finishedAppointments = appointments.filter(a => a.status === 'Completed');

  const pendingApprovalsCount = consultations.filter(c => !c.isApproved).length;
  const approvedConsultationsCount = consultations.filter(c => c.isApproved).length;

  const filteredConsultations = consultations.filter(c => {
    if (consultFilter === 'pending') return !c.isApproved;
    if (consultFilter === 'approved') return Boolean(c.isApproved);
    return true;
  });

  const handleFinishAppointment = (apt: Appointment) => {
    updateAppointmentStatus(apt.id, 'Completed');
    showToast(`Appointment for ${apt.patientName} marked as Finished. You can now access and view the clinical record.`, 'success');
  };

  const handleOpenDashboardApprove = (con: Consultation) => {
    setDashboardApproveConsultation(con);
    setDashboardApprovalRemarks(con.approvalNotes || 'Clinically evaluated, prescriptions authorized, and patient cleared.');
  };

  const handleConfirmDashboardApprove = async () => {
    if (!dashboardApproveConsultation) return;
    setIsApprovingDashboard(true);
    try {
      await approveConsultation(dashboardApproveConsultation.id, dashboardApprovalRemarks);
      setDashboardApproveConsultation(null);
    } finally {
      setIsApprovingDashboard(false);
    }
  };

  const handleStartConsultationFromQueue = (ticket: QueueTicket) => {
    const pat = patients.find(p => p.id === ticket.patientId);
    if (!pat) {
      showToast('Patient record not found in system.', 'error');
      return;
    }
    updateQueueStage(ticket.id, 'In Consultation', 'Physician Clinic Room 1', true);
    updateQueueCallStatus(ticket.id, 'Calling', 'Physician Clinic Room 1', true);
    playQueueChime(ticket.ticketNumber, 'Physician Clinic Room 1');
    setSelectedPatient(pat);
    showToast(`✓ Calling Ticket #${ticket.ticketNumber} (${pat.firstName} ${pat.lastName}) to Physician Consultation Room!`, 'success');
    setActiveTab('consultations');
  };

  const handleCallNextInQueue = () => {
    if (waitingDoctorTickets.length === 0) {
      showToast('No triaged patients are currently waiting for physician examination.', 'info');
      return;
    }
    const priorityWeight: Record<string, number> = {
      'Emergency': 4,
      'Urgent': 3,
      'Senior/PWD': 2,
      'Regular': 1
    };
    const sorted = [...waitingDoctorTickets].sort((a, b) => (priorityWeight[b.priority] || 1) - (priorityWeight[a.priority] || 1));
    handleStartConsultationFromQueue(sorted[0]);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Attending Physician Clinical Workspace</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {currentUser?.fullName || 'Dr. Roberto M. Manalo, MD'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            PRC License: <span className="font-mono font-semibold text-slate-700">{currentUser?.prcLicense || '0098412'}</span> · PTR: <span className="font-mono text-slate-700">{currentUser?.ptrNumber || 'PTR-8834921-2026'}</span> · Medical Officer III
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {waitingDoctorTickets.length > 0 && (
            <button
              onClick={handleCallNextInQueue}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer animate-pulse"
            >
              <BellRing className="w-4 h-4 text-emerald-200" />
              <span>Call Next Patient ({waitingDoctorTickets.length} Waiting)</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('queue')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
          >
            <Clock className="w-4 h-4 text-red-700" />
            <span>Live Queue ({doctorQueueTickets.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('consultations')}
            className="px-4 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 text-amber-300" />
            <span>Consultation Room</span>
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-blue-700" />
            <span>Appointments</span>
          </button>
        </div>
      </div>

      {/* Role Notice */}
      <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start sm:items-center gap-2.5">
        <Sparkles className="w-4 h-4 text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
        <span>
          <strong>Attending Physician Queue SOP:</strong> Patients triaged by nursing staff (with vital signs, pain assessment, and chief complaints recorded) arrive directly in your <strong>Live Consultation Queue</strong> below. Call the next patient to begin consultation, document SOAP findings, and authorize prescriptions.
        </span>
      </div>

      {/* Key Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-2xs bg-amber-50/30">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-amber-900">Waiting for Doctor</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-700 tabular-nums">
            {waitingDoctorTickets.length}
          </div>
          <div className="text-[11px] text-amber-800/80 mt-1">Triaged patients in line</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-2xs bg-blue-50/30">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium text-blue-900">In Consultation</span>
            <Stethoscope className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-blue-700 tabular-nums">
            {inConsultationTickets.length}
          </div>
          <div className="text-[11px] text-blue-800/80 mt-1">Currently being examined</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Appointments</span>
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-slate-800 tabular-nums">
            {activeAppointments.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Scheduled visits</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Pending Sign-off</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-bold font-mono text-amber-600 tabular-nums">
            {pendingApprovalsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Awaiting approval</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Approved Records</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-bold font-mono text-emerald-700 tabular-nums">
            {approvedConsultationsCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Clinically authorized</div>
        </div>
      </div>

      {/* SECTION 1: Live Patient Consultation Queue (Triaged & Ready for Doctor Examination) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#7F1416]/10 text-[#7F1416] rounded-lg">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-sm">
                  Live Consultation Queue (Triaged by Nursing Staff)
                </h3>
                {waitingDoctorTickets.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                    {waitingDoctorTickets.length} waiting
                  </span>
                )}
                {inConsultationTickets.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {inConsultationTickets.length} in exam
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Patients who have completed vital signs intake and are awaiting physician consultation.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {waitingDoctorTickets.length > 0 && (
              <button
                onClick={handleCallNextInQueue}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Call Next</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('queue')}
              className="text-xs font-semibold text-red-700 hover:underline flex items-center gap-1"
            >
              <span>Full Queue Board</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {doctorQueueTickets.length === 0 ? (
            <div className="p-10 text-center text-slate-400 space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No Triaged Patients in Consultation Queue</p>
              <p className="text-[11px] max-w-md mx-auto text-slate-400">
                When the triage nurse registers a walk-in patient and records their vital signs, the patient ticket will automatically arrive here ready for examination.
              </p>
            </div>
          ) : (
            doctorQueueTickets.map(ticket => {
              const patient = patients.find(p => p.id === ticket.patientId);
              const vitalsList = vitalSigns.filter(v => v.patientId === ticket.patientId);
              const latestV = vitalsList[0];
              const isInConsultation = ticket.stage === 'In Consultation';

              return (
                <div
                  key={ticket.id}
                  className={`p-4 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    isInConsultation ? 'bg-blue-50/40 border-l-4 border-l-blue-600' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono font-extrabold text-red-900 text-base px-2.5 py-0.5 bg-red-50 border border-red-200 rounded-md">
                        {ticket.ticketNumber}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {ticket.patientName}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        ({ticket.patientPsuId})
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                        {ticket.patientClassification}
                      </span>

                      {ticket.priority !== 'Regular' && (
                        <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                          ticket.priority === 'Emergency'
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ticket.priority}
                        </span>
                      )}

                      <span className={`text-[11px] px-2 py-0.5 rounded font-bold ${
                        isInConsultation
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {ticket.stage}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div>
                        <span className="font-semibold text-slate-800">Chief Complaint:</span>{' '}
                        <span className="text-slate-900 font-medium">
                          {ticket.chiefComplaint || latestV?.chiefComplaint || 'Consultation & Clinical Assessment'}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        <span>Queued at:</span> <strong className="font-mono">{ticket.createdAt}</strong>
                      </div>
                      {patient?.collegeOrDepartment && (
                        <div className="text-slate-500">
                          <span>Dept:</span> {patient.collegeOrDepartment}
                        </div>
                      )}
                    </div>

                    {/* Nurse-Captured Vital Signs Preview Bar */}
                    {latestV ? (
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                          BP: <strong className={latestV.bloodPressureSystolic >= 140 ? 'text-red-700 font-bold' : 'text-slate-900'}>
                            {latestV.bloodPressureSystolic}/{latestV.bloodPressureDiastolic}
                          </strong> mmHg
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                          HR: <strong className="text-slate-900">{latestV.heartRate}</strong> bpm
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                          Temp: <strong className={latestV.temperature >= 37.8 ? 'text-red-700 font-bold' : 'text-slate-900'}>
                            {latestV.temperature}°C
                          </strong>
                        </span>
                        {latestV.oxygenSaturation > 0 && (
                          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                            SpO2: <strong className="text-slate-900">{latestV.oxygenSaturation}%</strong>
                          </span>
                        )}
                        {latestV.painScale > 0 && (
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold border border-amber-200">
                            Pain: {latestV.painScale}/10
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 italic">
                          Triaged by {latestV.recordedByName || 'Nurse'}
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        Preliminary vital signs recording in progress...
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isInConsultation ? (
                      <button
                        onClick={() => {
                          if (patient) setSelectedPatient(patient);
                          setActiveTab('consultations');
                        }}
                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Stethoscope className="w-3.5 h-3.5" />
                        <span>Resume Consultation</span>
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartConsultationFromQueue(ticket)}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <BellRing className="w-3.5 h-3.5" />
                        <span>Call & Start Consultation</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 2: Scheduled Clinic Appointments (Appointments Calendar) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#7F1416]" />
            <h3 className="font-bold text-slate-900 text-sm">
              Section 2: Scheduled Clinic Appointments
            </h3>
          </div>
          <span className="text-xs font-medium text-slate-500">
            {activeAppointments.length} pending
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {activeAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No pending appointments are currently scheduled. When students or faculty book appointments, they will appear here.
            </div>
          ) : (
            activeAppointments.map(apt => {
              const patient = patients.find(p => p.id === apt.patientId) ||
                              patients.find(p => p.psuId === apt.patientPsuId);
              const vitals = vitalSigns.find(v => patient ? v.patientId === patient.id : false);

              return (
                <div key={apt.id} className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-red-800 text-sm">
                        {apt.date} · {apt.time}
                      </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {apt.patientName}
                      </span>
                      <span className="text-xs font-mono text-slate-400">
                        ({apt.patientPsuId})
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-700">
                        {apt.classification}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                        {apt.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <div>
                        <span className="font-medium text-slate-700">Purpose:</span> {apt.purpose}
                      </div>
                      {apt.notes && (
                        <div className="text-slate-500">
                          <span className="font-medium text-slate-700">Notes:</span> {apt.notes}
                        </div>
                      )}
                      {patient?.knownAllergies && patient.knownAllergies.length > 0 && patient.knownAllergies[0] !== 'None declared' && (
                        <div className="text-red-700 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Allergies: {patient.knownAllergies.join(', ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Nurse-captured Vital Signs Preview if recorded */}
                    {vitals && (
                      <div className="pt-1 flex flex-wrap items-center gap-3 text-xs font-mono text-slate-600">
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          BP: <strong className="text-slate-900">{vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}</strong> mmHg
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          HR: <strong className="text-slate-900">{vitals.heartRate}</strong> bpm
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded">
                          Temp: <strong className={vitals.temperature >= 37.5 ? 'text-red-700' : 'text-slate-900'}>{vitals.temperature}°C</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleFinishAppointment(apt)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Finish Appointment</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 2: Finished Appointments (Doctor Access & Review) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-900 text-sm">
              Finished Appointments (Access & Review Records)
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {finishedAppointments.length} Finished
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {finishedAppointments.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No appointments have been finished yet. When you complete an appointment, it will appear here for immediate access and review.
            </div>
          ) : (
            finishedAppointments.map(apt => {
              const pat = patients.find(p => p.id === apt.patientId) ||
                          patients.find(p => p.psuId === apt.patientPsuId);
              const cons = consultations.find(c => pat ? c.patientId === pat.id : false);

              return (
                <div key={apt.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {apt.patientName}
                      </span>
                      <span className="font-mono text-slate-400 text-xs">({apt.patientPsuId})</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Finished Visit
                      </span>
                      {cons && (
                        cons.isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Consultation Approved</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Awaiting Doctor Approval</span>
                          </span>
                        )
                      )}
                    </div>

                    <div className="text-slate-600 mt-1">
                      <strong>Purpose:</strong> {apt.purpose} · <span className="font-mono">{apt.date} at {apt.time}</span>
                    </div>

                    {cons && (
                      <div className="text-slate-500 text-[11px] mt-1 flex flex-wrap items-center gap-2">
                        <span>Diagnosis: <strong className="text-slate-800">{cons.assessmentDiagnosis}</strong></span>
                        <span>·</span>
                        <span>{cons.prescriptions.length} medication(s) prescribed</span>
                        {cons.approvedAt && (
                          <span className="text-emerald-700 font-mono text-[10px]">
                            · Approved on {cons.approvedAt}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    {cons && !cons.isApproved && (
                      <button
                        onClick={() => handleOpenDashboardApprove(cons)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="Clinically approve this patient consultation"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Approve Consultation</span>
                      </button>
                    )}

                    <button
                      onClick={() => setSelectedAppointmentForView(apt)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span>Access Details</span>
                    </button>

                    {cons && cons.prescriptions.length > 0 && (
                      <button
                        onClick={() => {
                          setModalPayload({ consultation: cons, patient: pat });
                          setActiveModal('print-rx');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-red-700" />
                        <span>Print Rx</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Section 3: Today's Nurse-Documented Consultations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-700" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Nurse-Documented Clinical Consultations Directory
              </h3>
              <p className="text-[11px] text-slate-500">
                Review and approve finished patient consultations documented during nurse triage
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setConsultFilter('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                consultFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({consultations.length})
            </button>
            <button
              onClick={() => setConsultFilter('pending')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                consultFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-2xs'
                  : 'text-amber-800 hover:text-amber-900'
              }`}
            >
              <span>Pending Approval</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${consultFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'}`}>
                {pendingApprovalsCount}
              </span>
            </button>
            <button
              onClick={() => setConsultFilter('approved')}
              className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                consultFilter === 'approved'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-emerald-800 hover:text-emerald-900'
              }`}
            >
              <span>Approved</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${consultFilter === 'approved' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'}`}>
                {approvedConsultationsCount}
              </span>
            </button>
          </div>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {filteredConsultations.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {consultFilter === 'pending'
                ? 'Great! All documented patient consultations have been clinically approved.'
                : consultFilter === 'approved'
                ? 'No consultations approved yet.'
                : 'No consultations documented yet. Nurse triage captures arriving consultations.'}
            </div>
          ) : (
            filteredConsultations.map(con => {
              const pat = patients.find(p => p.id === con.patientId);
              return (
                <div key={con.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">
                        {pat ? `${pat.firstName} ${pat.lastName}` : 'Patient'}
                      </span>
                      <span className="font-mono text-slate-400 text-xs">({pat?.psuId || con.patientId})</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 font-medium text-slate-600">
                        {pat?.classification || 'Student'}
                      </span>
                      {con.isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>Approved by Physician</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Pending Doctor Approval</span>
                        </span>
                      )}
                    </div>

                    <div className="text-slate-700">
                      <strong>Diagnosis:</strong> {con.assessmentDiagnosis}
                      {con.icd10Code && <span className="font-mono text-slate-500 ml-1">[{con.icd10Code}]</span>}
                    </div>

                    <div className="text-slate-500 text-[11px] flex flex-wrap items-center gap-x-3 gap-y-0.5">
                      <span>Prescribed {con.prescriptions.length} medication(s)</span>
                      <span>·</span>
                      <span>Documented: {con.date} {con.time}</span>
                      {con.approvedAt && (
                        <>
                          <span>·</span>
                          <span className="text-emerald-700 font-semibold">
                            Signed by {con.approvedByDoctorName || con.doctorName} on {con.approvedAt}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    {/* Doctor approval action button */}
                    {!con.isApproved ? (
                      <button
                        onClick={() => handleOpenDashboardApprove(con)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="Officially approve this finished consultation"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                        <span>Approve Consultation</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenDashboardApprove(con)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        title="View official physician approval details"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Approval Stamp</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setSelectedPatient(pat || null);
                        setActiveTab('consultations');
                      }}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title="Open in Consultation Room"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-red-800" />
                      <span>Consultation Room</span>
                    </button>

                    {con.prescriptions.length > 0 && (
                      <button
                        onClick={() => {
                          setModalPayload({ consultation: con, patient: pat });
                          setActiveModal('print-rx');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-blue-700" />
                        <span>Print Rx</span>
                      </button>
                    )}

                    {con.medicalCertificateIssued && (
                      <button
                        onClick={() => {
                          setModalPayload({ consultation: con, patient: pat });
                          setActiveModal('print-med-cert');
                        }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5 text-red-700" />
                        <span>Med Cert</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Finished Appointment Clinical Review Modal */}
      {selectedAppointmentForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-red-950/20 bg-gradient-to-r from-red-900 to-red-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span className="font-bold text-sm">Finished Appointment Record</span>
              </div>
              <button
                onClick={() => setSelectedAppointmentForView(null)}
                className="text-red-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {(() => {
                const pat = patients.find(p => p.id === selectedAppointmentForView.patientId) ||
                            patients.find(p => p.psuId === selectedAppointmentForView.patientPsuId);
                const vitals = vitalSigns.find(v => pat ? v.patientId === pat.id : false);
                const cons = consultations.find(c => pat ? c.patientId === pat.id : false);

                return (
                  <>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-bold text-slate-900 text-base">
                            {selectedAppointmentForView.patientName}
                          </div>
                          <div className="text-slate-500 font-mono text-[11px] mt-0.5">
                            PSU ID: <strong className="text-red-800">{selectedAppointmentForView.patientPsuId}</strong> · {selectedAppointmentForView.classification}
                          </div>
                          {pat && (
                            <div className="text-slate-600 text-[11px] mt-1">
                              {pat.courseAndYear || pat.collegeOrDepartment} · Contact: {pat.contactNumber}
                            </div>
                          )}
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[11px]">
                          Finished Visit
                        </span>
                      </div>
                    </div>

                    {/* Appointment Details */}
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
                      <div>
                        <div className="text-[11px] text-blue-800 font-semibold">Appointment Purpose:</div>
                        <div className="font-bold text-slate-900 mt-0.5">{selectedAppointmentForView.purpose}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-blue-800 font-semibold">Attending Doctor:</div>
                        <div className="font-bold text-slate-900 mt-0.5">{selectedAppointmentForView.doctorName}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-blue-800 font-semibold">Scheduled Date & Time:</div>
                        <div className="font-mono text-slate-900 mt-0.5">{selectedAppointmentForView.date} at {selectedAppointmentForView.time}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-blue-800 font-semibold">Clinical Remarks:</div>
                        <div className="text-slate-700 mt-0.5">{selectedAppointmentForView.notes || 'Routine checkup completed'}</div>
                      </div>
                    </div>

                    {/* Nurse-Captured Vital Signs Preview */}
                    {vitals ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                          <Activity className="w-3.5 h-3.5 text-emerald-700" />
                          <span>Triage Vital Signs (Recorded by {vitals.recordedByName || 'Clinic Nurse'})</span>
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="text-[10px] text-slate-400">BP</div>
                            <div className="font-mono font-bold text-slate-900">{vitals.bloodPressureSystolic}/{vitals.bloodPressureDiastolic}</div>
                          </div>
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="text-[10px] text-slate-400">Heart Rate</div>
                            <div className="font-mono font-bold text-slate-900">{vitals.heartRate} bpm</div>
                          </div>
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="text-[10px] text-slate-400">Temp</div>
                            <div className="font-mono font-bold text-slate-900">{vitals.temperature}°C</div>
                          </div>
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="text-[10px] text-slate-400">SpO2</div>
                            <div className="font-mono font-bold text-slate-900">{vitals.oxygenSaturation}%</div>
                          </div>
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="text-[10px] text-slate-400">BMI</div>
                            <div className="font-mono font-bold text-slate-900">{vitals.bmi}</div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-[11px]">
                        No vital signs record linked yet.
                      </div>
                    )}

                    {/* Documented Clinical Diagnosis & Prescriptions */}
                    {cons && (
                      <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="font-bold text-slate-900 flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span>Clinical Consultation & Diagnosis</span>
                            {cons.isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                <span>Approved</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Clock className="w-3 h-3 text-amber-700" />
                                <span>Pending Approval</span>
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-slate-500">{cons.date}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 font-medium">Diagnosis:</span>{' '}
                          <strong className="text-slate-900">{cons.assessmentDiagnosis}</strong>
                          {cons.icd10Code && <span className="font-mono text-slate-500 ml-1">[{cons.icd10Code}]</span>}
                        </div>
                        {cons.planAndManagement && (
                          <div className="text-slate-600">
                            <span className="text-slate-500 font-medium">Management:</span> {cons.planAndManagement}
                          </div>
                        )}

                        {/* Approval Status Stamp / Action */}
                        {cons.isApproved ? (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-900 space-y-0.5">
                            <div className="font-bold flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                              <span>Clinically Approved by {cons.approvedByDoctorName || cons.doctorName} (PRC #{cons.approvedByDoctorLicense || cons.doctorLicense || '0098412'})</span>
                            </div>
                            <div className="text-slate-600 text-[10px]">
                              Approved on {cons.approvedAt || cons.date}. Remarks: {cons.approvalNotes || 'Consultation finalized and cleared.'}
                            </div>
                          </div>
                        ) : (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3 flex-wrap">
                            <div className="text-[11px] text-amber-900">
                              <span className="font-bold block">Physician Approval Pending</span>
                              <span className="text-amber-800 text-[10px]">Review findings and clinically authorize electronic clearances.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenDashboardApprove(cons)}
                              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-200" />
                              <span>Approve Consultation</span>
                            </button>
                          </div>
                        )}

                        {cons.prescriptions && cons.prescriptions.length > 0 && (
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <span className="font-semibold text-slate-800">
                              {cons.prescriptions.length} Prescribed Medication(s)
                            </span>
                            <button
                              onClick={() => {
                                setModalPayload({ consultation: cons, patient: pat });
                                setActiveModal('print-rx');
                              }}
                              className="px-3 py-1 bg-red-800 hover:bg-red-900 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <Printer className="w-3 h-3 text-amber-300" />
                              <span>Print Rx Slip</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      {pat && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPatient(pat);
                            setSelectedAppointmentForView(null);
                            setActiveModal('patient-profile');
                          }}
                          className="text-xs font-bold text-red-800 hover:underline cursor-pointer"
                        >
                          View Full Patient EMR History →
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedAppointmentForView(null)}
                        className="ml-auto px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Doctor Consultation Approval Modal */}
      {dashboardApproveConsultation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
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
                    Official Clinical Validation & Sign-off
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDashboardApproveConsultation(null)}
                className="p-1.5 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
              {(() => {
                const pat = patients.find(p => p.id === dashboardApproveConsultation.patientId);
                return (
                  <>
                    {/* Patient Pill */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 text-sm">
                          {pat ? `${pat.firstName} ${pat.lastName}` : 'Patient File'}
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          {pat?.classification || 'Student'} · {pat?.courseAndYear || pat?.collegeOrDepartment}
                        </div>
                      </div>
                      <span className="font-mono text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                        {pat?.psuId || dashboardApproveConsultation.patientId}
                      </span>
                    </div>

                    {/* Assessment & Plan */}
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Documented Diagnosis:
                      </div>
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                        <div className="font-bold text-slate-900 text-sm text-red-950">
                          {dashboardApproveConsultation.assessmentDiagnosis}
                        </div>
                        {dashboardApproveConsultation.icd10Code && (
                          <div className="font-mono text-[11px] text-slate-500">
                            ICD-10: {dashboardApproveConsultation.icd10Code}
                          </div>
                        )}
                        {dashboardApproveConsultation.planAndManagement && (
                          <div className="text-slate-600 text-[11px] pt-1 border-t border-slate-200 mt-1">
                            <strong>Plan:</strong> {dashboardApproveConsultation.planAndManagement}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Prescriptions */}
                    {dashboardApproveConsultation.prescriptions && dashboardApproveConsultation.prescriptions.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Prescribed Medications ({dashboardApproveConsultation.prescriptions.length} items):
                        </div>
                        <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                          {dashboardApproveConsultation.prescriptions.map((rx, idx) => (
                            <div key={rx.id || idx} className="p-2.5 flex items-center justify-between text-[11px]">
                              <div>
                                <strong className="text-slate-900">{rx.genericName}</strong> {rx.brandName && `(${rx.brandName})`} · {rx.dosageStrength}
                                <div className="text-slate-500">{rx.frequency} · {rx.durationDays} day(s)</div>
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
                        value={dashboardApprovalRemarks}
                        onChange={(e) => setDashboardApprovalRemarks(e.target.value)}
                        placeholder="e.g. Clinically evaluated, prescriptions authorized, and student cleared."
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600"
                      />
                    </div>

                    {dashboardApproveConsultation.isApproved ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0" />
                        <span>
                          This consultation was already officially approved on <strong>{dashboardApproveConsultation.approvedAt}</strong>. You can update clearance remarks if needed.
                        </span>
                      </div>
                    ) : (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>
                          Upon clinical approval, the patient consultation is finalized, queue tickets are marked Completed, and official electronic clearances are validated.
                        </span>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDashboardApproveConsultation(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isApprovingDashboard}
                onClick={handleConfirmDashboardApprove}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                {isApprovingDashboard ? (
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
      )}
    </div>
  );
};
