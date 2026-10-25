import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { QueueStage, QueuePriority, QueueCallStatus, QueueTicket } from '../../types/clinic';
import {
  SMSNotificationService,
  SMSLogEntry,
  SMSGatewayConfig
} from '../../services/smsNotificationService';
import {
  ClipboardList,
  Ticket,
  Tv,
  BellRing,
  ArrowRight,
  CheckCircle,
  Clock,
  Filter,
  AlertCircle,
  Play,
  LayoutGrid,
  List,
  User,
  Sparkles,
  X,
  MessageSquare,
  Send,
  Smartphone,
  Settings2,
  RefreshCw,
  Sliders,
  Check,
  PhoneCall,
  Volume2,
  Search,
  Trash2,
  ShieldCheck,
  Info,
  Printer
} from 'lucide-react';

export const QueueManager: React.FC = () => {
  const {
    currentUser,
    queue,
    updateQueueStage,
    updateQueueCallStatus,
    sendQueueSmsNotification,
    callNextInQueue,
    playQueueChime,
    setActiveModal,
    setModalPayload,
    patients,
    setSelectedPatient,
    issueQueueTicket,
    isMobile,
    deviceMode
  } = useClinic();

  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [callNotice, setCallNotice] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // SMS Modal State & Gateway Configuration
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsModalTab, setSmsModalTab] = useState<'logs' | 'config' | 'test'>('logs');
  const [smsLogs, setSmsLogs] = useState<SMSLogEntry[]>([]);
  const [smsConfig, setSmsConfig] = useState<SMSGatewayConfig>(SMSNotificationService.getConfig());
  const [searchLogQuery, setSearchLogQuery] = useState('');
  const [testRecipientPhone, setTestRecipientPhone] = useState('+63 917 842 1092');
  const [testMessage, setTestMessage] = useState('[PSU CLINIC TEST] Your queue ticket is ready. Please proceed to Clinic Station 1.');
  const [isSendingTestSms, setIsSendingTestSms] = useState(false);
  const [testSmsStatus, setTestSmsStatus] = useState<string | null>(null);
  const [configSavedToast, setConfigSavedToast] = useState(false);

  // Sync SMS logs & subscribe to real-time dispatches
  useEffect(() => {
    setSmsLogs(SMSNotificationService.getLogs());
    const unsubscribe = SMSNotificationService.subscribe((newEntry) => {
      setSmsLogs(prev => [newEntry, ...prev.filter(l => l.id !== newEntry.id)]);
    });
    return () => unsubscribe();
  }, []);

  const isStudent = currentUser?.role === 'student';
  const studentPatient = patients.find(
    p => (currentUser?.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
         (currentUser?.institutionalId && p.psuId === currentUser.institutionalId)
  );

  const myStudentTicket = queue.find(t => {
    if (studentPatient && t.patientId === studentPatient.id) return true;
    if (studentPatient && t.patientPsuId === studentPatient.psuId) return true;
    if (currentUser?.fullName && t.patientName.toLowerCase() === currentUser.fullName.toLowerCase()) return true;
    return false;
  });

  const handlePrintQueueSlip = (ticket: QueueTicket) => {
    const patient = patients.find(p => p.id === ticket.patientId);
    setModalPayload({
      type: 'queue-receipt',
      ticket,
      patient
    });
    setActiveModal('print-queue-receipt');
  };

  const isCardsView = viewMode === 'cards' || (viewMode === 'auto' && isMobile);

  const filteredQueue = isStudent
    ? (myStudentTicket ? [myStudentTicket] : [])
    : queue;

  const waitingTriageCount = queue.filter(q => q.stage === 'Waiting Triage').length;
  const waitingDoctorCount = queue.filter(q => q.stage === 'Waiting Doctor').length;
  const inServiceCount = queue.filter(q => q.stage === 'In Triage' || q.stage === 'In Consultation').length;

  /**
   * Automated Trigger 1: Mark Queue Ticket as 'Ready'
   * Automatically invokes SMSNotificationService.sendQueueReadyNotification
   */
  const handleSetReady = async (ticket: QueueTicket) => {
    await updateQueueCallStatus(ticket.id, 'Ready', ticket.counterOrRoom);
    const patient = patients.find(p => p.id === ticket.patientId);
    setCallNotice({
      message: `📱 Status set to READY for Ticket #${ticket.ticketNumber} (${ticket.patientName}). Automated SMS alert dispatched to ${patient?.contactNumber || 'patient'}!`,
      type: 'success'
    });
    setTimeout(() => setCallNotice(null), 4000);
  };

  /**
   * Automated Trigger 2: Mark Queue Ticket as 'Calling'
   * Automatically invokes SMSNotificationService.sendQueueCallingNotification and plays chime
   */
  const handleSetCalling = async (ticket: QueueTicket) => {
    await updateQueueCallStatus(ticket.id, 'Calling', ticket.counterOrRoom);
    const patient = patients.find(p => p.id === ticket.patientId);
    setCallNotice({
      message: `🔔 NOW CALLING Ticket #${ticket.ticketNumber} (${ticket.patientName})! Automated SMS calling notification dispatched to ${patient?.contactNumber || 'patient'}.`,
      type: 'success'
    });
    setTimeout(() => setCallNotice(null), 4000);
  };

  const handleCallTriage = () => {
    const ticket = callNextInQueue('Waiting Triage', 'In Triage', 'Triage Station 1');
    if (ticket) {
      setCallNotice({
        message: `📢 Called Ticket #${ticket.ticketNumber} (${ticket.patientName}) to Triage Station 1! Automated SMS sent.`,
        type: 'success'
      });
    } else {
      setCallNotice({
        message: 'No patients currently waiting in Triage line.',
        type: 'info'
      });
    }
    setTimeout(() => setCallNotice(null), 4000);
  };

  const handleCallDoctor = () => {
    const ticket = callNextInQueue('Waiting Doctor', 'In Consultation', 'Doctor Room 1');
    if (ticket) {
      setCallNotice({
        message: `📢 Called Ticket #${ticket.ticketNumber} (${ticket.patientName}) to Doctor Consultation Room 1! Automated SMS sent.`,
        type: 'success'
      });
    } else {
      setCallNotice({
        message: 'No patients currently waiting for Doctor Consultation.',
        type: 'info'
      });
    }
    setTimeout(() => setCallNotice(null), 4000);
  };

  const handleSaveSmsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    SMSNotificationService.saveConfig(smsConfig);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  const handleSendTestSms = async () => {
    if (!testRecipientPhone.trim() || !testMessage.trim()) return;
    setIsSendingTestSms(true);
    setTestSmsStatus(null);
    try {
      const res = await SMSNotificationService.sendSMS(testRecipientPhone, testMessage, {
        recipientName: 'Test Recipient',
        messageType: 'custom'
      });
      if (res.success) {
        setTestSmsStatus(`✓ SMS successfully dispatched to ${res.log.recipientPhone} (${res.log.provider})`);
      } else {
        setTestSmsStatus(`⚠ Failed: ${res.error || 'Check SMS settings'}`);
      }
    } catch (err: any) {
      setTestSmsStatus(`⚠ Error: ${err.message || 'Network exception'}`);
    } finally {
      setIsSendingTestSms(false);
    }
  };

  const filteredSmsLogs = smsLogs.filter(l =>
    l.recipientName.toLowerCase().includes(searchLogQuery.toLowerCase()) ||
    l.recipientPhone.includes(searchLogQuery) ||
    (l.ticketNumber && l.ticketNumber.toLowerCase().includes(searchLogQuery.toLowerCase())) ||
    l.messageText.toLowerCase().includes(searchLogQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Call Notice Feedback Toast */}
      {callNotice && (
        <div className="p-3.5 bg-gradient-to-r from-red-950 via-red-900 to-red-950 text-white rounded-xl shadow-lg border border-red-700 flex items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-full bg-amber-400 text-red-950 animate-bounce">
              <BellRing className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold">{callNotice.message}</span>
          </div>
          <button
            onClick={() => setCallNotice(null)}
            className="p-1 hover:bg-red-800 rounded text-red-200 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
            <ClipboardList className="w-4 h-4" />
            <span>Clinic Queue & Patient Flow Control</span>
            {isMobile && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                📱 Mobile Mode Fitted
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>Live University Clinic Waiting Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time tracking of patients with automated SMS alerts on status change to 'Ready' or 'Calling'.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* SMS Notification & Twilio API Center Button (Reception/Nurse Staff Only) */}
          {!isStudent && currentUser?.role !== 'doctor' && (
            <button
              onClick={() => setShowSmsModal(true)}
              className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer group"
              title="Configure Twilio API, view SMS delivery logs, and send automated alerts"
            >
              <div className="relative">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700 group-hover:scale-110 transition-transform" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              </div>
              <span>SMS Dispatcher & Twilio API</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-700 text-white font-mono text-[10px]">
                {smsLogs.length}
              </span>
            </button>
          )}

          {/* View Mode Switcher for Mobile / PC */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode('auto')}
              className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                viewMode === 'auto' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Auto: Table on PC, Cards on Mobile"
            >
              Auto
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-[#7F1416] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cards View"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-[#7F1416] font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <List className="w-3 h-3" />
              <span>Table</span>
            </button>
          </div>

          {currentUser?.role === 'nurse' && (
            <button
              onClick={() => setActiveModal('tv-queue')}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-200 transition-colors cursor-pointer"
            >
              <Tv className="w-3.5 h-3.5 text-[#7F1416]" />
              <span>TV Queue Board</span>
            </button>
          )}
        </div>
      </div>

      {/* Student/Patient Read-Only Notice */}
      {isStudent && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              <strong>Student / Patient Queue Monitor (Read-Only):</strong> You can monitor live queue movement and your ticket status here. Active calling, reordering, and priority triage are handled strictly by authorized clinic staff.
            </span>
          </div>
          {studentPatient && (
            <span className="font-mono text-[11px] font-bold bg-blue-100 px-2.5 py-1 rounded text-blue-800 shrink-0 border border-blue-200">
              ID: {studentPatient.psuId}
            </span>
          )}
        </div>
      )}

      {/* Automated SMS Status Bar Banner */}
      <div className="bg-gradient-to-r from-emerald-900/10 via-slate-50 to-blue-900/10 border border-emerald-200/80 rounded-xl p-3 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-slate-900 flex items-center gap-2">
              <span>SMS Automated Notifications Active</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                Gateway: {smsConfig.provider === 'twilio' ? 'Twilio API' : smsConfig.provider === 'semaphore' ? 'Semaphore PH' : 'Simulation Mode'}
              </span>
            </div>
            <div className="text-[11px] text-slate-600 mt-0.5">
              Automated trigger enabled: Changing status to <span className="font-semibold text-amber-700">"Ready"</span> or <span className="font-semibold text-blue-700">"Calling"</span> dispatches instant text messages to student/patient numbers.
            </div>
          </div>
        </div>

        {!isStudent && (
          <button
            onClick={() => {
              setShowSmsModal(true);
              setSmsModalTab('config');
            }}
            className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-medium text-xs flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-600" />
            <span>Twilio Settings</span>
          </button>
        )}
      </div>

      {/* Queue Calling Quick Buttons (Role-Specific Workstations) */}
      <div className={`grid grid-cols-1 ${currentUser?.role === 'administrator' ? 'sm:grid-cols-2' : 'sm:grid-cols-1'} gap-4`}>
        {/* Triage Station Calling (Nurse or Administrator) */}
        {(currentUser?.role === 'nurse' || currentUser?.role === 'administrator') && (
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-amber-900 text-sm">Triage Desk (Nurse Station)</div>
              <div className="text-xs text-amber-700">
                {waitingTriageCount} patient(s) waiting for vital signs assessment
              </div>
            </div>
            <button
              onClick={handleCallTriage}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95"
            >
              <BellRing className="w-4 h-4" />
              <span>Call Next for Triage (SMS Alert)</span>
            </button>
          </div>
        )}

        {/* Doctor Consultation Room Calling (Physician or Administrator) */}
        {(currentUser?.role === 'doctor' || currentUser?.role === 'administrator') && (
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between gap-4">
            <div>
              <div className="font-bold text-blue-900 text-sm">Doctor Consultation Room 1</div>
              <div className="text-xs text-blue-700">
                {waitingDoctorCount} patient(s) ready for physician examination
              </div>
            </div>
            <button
              onClick={handleCallDoctor}
              className="px-3.5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 active:scale-95"
            >
              <BellRing className="w-4 h-4" />
              <span>Call Next for Doctor (SMS Alert)</span>
            </button>
          </div>
        )}
      </div>


      {/* RESPONSIVE DISPLAY: Cards view on mobile or Table view on PC */}
      {isCardsView ? (
        /* Mobile Fitted Cards Grid */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing <strong>{filteredQueue.length}</strong> queue tickets</span>
            <span className="text-amber-800 font-medium">📱 Mobile Touch Cards Active</span>
          </div>

          {filteredQueue.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              No tickets found in this queue state.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredQueue.map(ticket => {
                const patient = patients.find(p => p.id === ticket.patientId);
                const isCalling = ticket.callStatus === 'Calling';
                const isReady = ticket.callStatus === 'Ready';

                return (
                  <div
                    key={ticket.id}
                    className={`bg-white p-4 rounded-xl border transition-all space-y-3 shadow-xs ${
                      isCalling
                        ? 'border-blue-500 ring-2 ring-blue-400/20 bg-blue-50/20'
                        : isReady
                        ? 'border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/20'
                        : 'border-slate-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-mono text-base font-black text-[#7F1416] bg-red-50 px-2 py-0.5 rounded-md border border-red-200 whitespace-nowrap shrink-0">
                          {ticket.ticketNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shrink-0 ${
                          ticket.priority === 'Emergency' ? 'bg-red-100 text-red-800' :
                          ticket.priority === 'Urgent' ? 'bg-amber-100 text-amber-800' :
                          ticket.priority === 'Senior/PWD' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {ticket.priority}
                        </span>

                        {/* Call Status Badge */}
                        {isCalling && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white flex items-center gap-1 animate-pulse whitespace-nowrap shrink-0">
                            <BellRing className="w-2.5 h-2.5 shrink-0" />
                            <span>CALLING</span>
                          </span>
                        )}
                        {isReady && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1 whitespace-nowrap shrink-0">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>READY</span>
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] font-mono text-slate-400">
                        {ticket.createdAt}
                      </span>
                    </div>

                    <div>
                      <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                        <span>{ticket.patientName}</span>
                        {patient?.contactNumber && (
                          <span className="text-[10px] font-mono font-normal text-slate-500">
                            {patient.contactNumber}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        PSU ID: {ticket.patientPsuId} · {ticket.patientClassification}
                      </div>
                      <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                        <span className="text-slate-400 font-medium">Complaint: </span>
                        {ticket.chiefComplaint || 'Routine Medical Checkup'}
                      </div>
                    </div>

                    {/* SMS Status Notification Pill */}
                    <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 text-slate-600 truncate">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {ticket.smsNotifiedStatus === 'Calling' ? (
                            <span className="text-blue-700 font-semibold">SMS: Calling Alert Sent</span>
                          ) : ticket.smsNotifiedStatus === 'Ready' ? (
                            <span className="text-amber-700 font-semibold">SMS: Ready Alert Sent</span>
                          ) : ticket.smsNotifiedStatus === 'Delivered' ? (
                            <span className="text-emerald-700 font-semibold">SMS Delivered</span>
                          ) : (
                            <span className="text-slate-500">SMS Ready for Trigger</span>
                          )}
                          {ticket.lastSmsSentAt && (
                            <span className="text-slate-400 ml-1">({ticket.lastSmsSentAt})</span>
                          )}
                        </span>
                      </div>

                      {!isStudent && (
                        <button
                          onClick={() => sendQueueSmsNotification(ticket.id, 'calling', ticket.counterOrRoom)}
                          className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px] transition-colors cursor-pointer shrink-0"
                          title="Resend SMS to patient"
                        >
                          Resend
                        </button>
                      )}
                    </div>

                    {/* Action Triggers: Mark Ready, Call, Stage progression */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[11px]">
                        <span className="font-semibold text-slate-800">{ticket.stage}</span>
                        <div className="text-[10px] text-slate-400">{ticket.counterOrRoom}</div>
                      </div>

                      {!isStudent ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Automated Trigger: MARK READY */}
                          {ticket.stage !== 'Completed' && ticket.callStatus !== 'Ready' && (
                            <button
                              onClick={() => handleSetReady(ticket)}
                              className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                              title="Set status to Ready and send automated SMS"
                            >
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Mark Ready</span>
                            </button>
                          )}

                          {/* Automated Trigger: CALL PATIENT */}
                          {ticket.stage !== 'Completed' && (
                            <button
                              onClick={() => handleSetCalling(ticket)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded text-xs transition-colors flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
                              title="Call ticket, ring chime, and send automated SMS"
                            >
                              <BellRing className="w-3 h-3" />
                              <span>Call (SMS)</span>
                            </button>
                          )}

                          {/* Progression button */}
                          {ticket.stage === 'Waiting Triage' && (
                            <button
                              onClick={() => updateQueueStage(ticket.id, 'In Triage', 'Triage Station 1')}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded text-xs transition-colors cursor-pointer"
                            >
                              Start Triage
                            </button>
                          )}
                          {ticket.stage === 'In Triage' && (
                            <button
                              onClick={() => updateQueueStage(ticket.id, 'Waiting Doctor', 'Waiting Hall')}
                              className="px-2.5 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold rounded text-xs transition-colors cursor-pointer"
                            >
                              To Doctor
                            </button>
                          )}
                          {ticket.stage === 'Waiting Doctor' && (
                            <button
                              onClick={() => updateQueueStage(ticket.id, 'In Consultation', 'Doctor Room 1')}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs transition-colors cursor-pointer"
                            >
                              Examine
                            </button>
                          )}
                          {ticket.stage === 'In Consultation' && (
                            <button
                              onClick={() => updateQueueStage(ticket.id, 'Completed')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-colors cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                          {ticket.stage === 'Completed' && (
                            <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Finished</span>
                            </span>
                          )}

                          {/* Print Queue Admission Slip / Receipt */}
                          <button
                            onClick={() => handlePrintQueueSlip(ticket)}
                            className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded text-xs transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
                            title="Print official clinic queue admission slip / receipt with university seal"
                          >
                            <Printer className="w-3 h-3 text-[#7F1416]" />
                            <span>Slip</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-2">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                            ticket.callStatus === 'Calling' ? 'bg-blue-100 text-blue-800 animate-pulse font-bold' :
                            ticket.callStatus === 'Ready' ? 'bg-amber-100 text-amber-900 font-bold' :
                            ticket.stage === 'Completed' ? 'bg-emerald-100 text-emerald-800 font-bold' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ticket.callStatus === 'Calling' ? '🔔 Currently Called' : ticket.callStatus === 'Ready' ? '⏳ Please Stand By' : ticket.stage === 'Completed' ? 'Finished' : 'In Line'}
                          </span>
                          <button
                            onClick={() => handlePrintQueueSlip(ticket)}
                            className="px-2 py-0.5 bg-[#7F1416] hover:bg-[#680F11] text-white font-semibold rounded text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            title="Print my queue slip with university seal"
                          >
                            <Printer className="w-3 h-3 text-amber-300" />
                            <span>Slip</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* PC/Laptop Table View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          {isMobile && (
            <div className="p-2 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-800 flex items-center justify-between px-4">
              <span>Touch Screen Detected</span>
              <span className="font-semibold">↔ Swipe table horizontally for all columns</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Ticket #</th>
                  <th className="py-3 px-4">Patient Name & Contact</th>
                  <th className="py-3 px-4">Call Status</th>
                  <th className="py-3 px-4">SMS Notification</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Current Stage & Room</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">{isStudent ? 'Calling Status' : 'Actions & Triggers'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-400">
                      No tickets found in this queue state.
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map(ticket => {
                    const patient = patients.find(p => p.id === ticket.patientId);
                    const isCalling = ticket.callStatus === 'Calling';
                    const isReady = ticket.callStatus === 'Ready';

                    return (
                      <tr
                        key={ticket.id}
                        className={`transition-colors ${
                          isCalling
                            ? 'bg-blue-50/50 hover:bg-blue-50'
                            : isReady
                            ? 'bg-amber-50/40 hover:bg-amber-50'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#7F1416] text-sm">
                          {ticket.ticketNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{ticket.patientName}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {patient?.contactNumber || 'No phone'} · {ticket.patientPsuId}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {isCalling ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white flex items-center gap-1 w-max animate-pulse">
                              <BellRing className="w-3 h-3" />
                              <span>CALLING</span>
                            </span>
                          ) : isReady ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950 flex items-center gap-1 w-max">
                              <Clock className="w-3 h-3" />
                              <span>READY</span>
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
                              {ticket.callStatus || 'Waiting'}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-[11px]">
                            {ticket.smsNotifiedStatus === 'Calling' ? (
                              <span className="text-blue-700 font-semibold flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-blue-600" />
                                <span>Calling SMS Sent</span>
                              </span>
                            ) : ticket.smsNotifiedStatus === 'Ready' ? (
                              <span className="text-amber-800 font-semibold flex items-center gap-1">
                                <MessageSquare className="w-3 h-3 text-amber-600" />
                                <span>Ready SMS Sent</span>
                              </span>
                            ) : ticket.smsNotifiedStatus === 'Delivered' ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Delivered</span>
                              </span>
                            ) : (
                              <span className="text-slate-400">Ready for trigger</span>
                            )}
                          </div>
                          {ticket.lastSmsSentAt && (
                            <div className="text-[9px] font-mono text-slate-400">
                              Sent: {ticket.lastSmsSentAt}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            ticket.priority === 'Emergency' ? 'bg-red-100 text-red-800' :
                            ticket.priority === 'Urgent' ? 'bg-amber-100 text-amber-800' :
                            ticket.priority === 'Senior/PWD' ? 'bg-purple-100 text-purple-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{ticket.stage}</div>
                          <div className="text-[11px] text-slate-400">{ticket.counterOrRoom}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                          {ticket.createdAt}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {!isStudent ? (
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Automated Trigger: Set Ready (dispatches SMS) */}
                              {ticket.stage !== 'Completed' && ticket.callStatus !== 'Ready' && (
                                <button
                                  onClick={() => handleSetReady(ticket)}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold text-[11px] cursor-pointer transition-colors"
                                  title="Set status to Ready and auto-send SMS alert"
                                >
                                  Ready (SMS)
                                </button>
                              )}

                              {/* Automated Trigger: Call Patient (rings chime & auto-sends SMS) */}
                              {ticket.stage !== 'Completed' && (
                                <button
                                  onClick={() => handleSetCalling(ticket)}
                                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors active:scale-95 shadow-2xs"
                                  title="Call ticket, ring hospital chime, and dispatch SMS calling notification"
                                >
                                  <BellRing className="w-3 h-3" />
                                  <span>Call (SMS)</span>
                                </button>
                              )}

                              {/* Stage Progression Actions */}
                              {ticket.stage === 'Waiting Triage' && (
                                <button
                                  onClick={() => updateQueueStage(ticket.id, 'In Triage', 'Triage Station 1')}
                                  className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded font-semibold text-[11px] cursor-pointer"
                                >
                                  Triage
                                </button>
                              )}

                              {ticket.stage === 'In Triage' && (
                                <button
                                  onClick={() => updateQueueStage(ticket.id, 'Waiting Doctor', 'Waiting Hall')}
                                  className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-900 rounded font-semibold text-[11px] cursor-pointer"
                                >
                                  To Doctor
                                </button>
                              )}

                              {ticket.stage === 'Waiting Doctor' && (
                                <button
                                  onClick={() => updateQueueStage(ticket.id, 'In Consultation', 'Doctor Room 1')}
                                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-[11px] cursor-pointer"
                                >
                                  Examine
                                </button>
                              )}

                              {ticket.stage === 'In Consultation' && (
                                <button
                                  onClick={() => updateQueueStage(ticket.id, 'Completed')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-[11px] cursor-pointer"
                                >
                                  Complete
                                </button>
                              )}

                              {ticket.stage === 'Completed' && (
                                <span className="text-emerald-700 font-semibold text-[11px]">
                                  Finished
                                </span>
                              )}

                              {/* Print Queue Admission Slip / Receipt */}
                              <button
                                onClick={() => handlePrintQueueSlip(ticket)}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded font-semibold text-[11px] flex items-center gap-1 border border-slate-300 cursor-pointer shadow-2xs"
                                title="Print official clinic queue admission slip / receipt with university seal"
                              >
                                <Printer className="w-3 h-3 text-[#7F1416]" />
                                <span>Slip</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                ticket.callStatus === 'Calling' ? 'bg-blue-100 text-blue-800 animate-pulse font-bold' :
                                ticket.callStatus === 'Ready' ? 'bg-amber-100 text-amber-900 font-bold' :
                                ticket.stage === 'Completed' ? 'bg-emerald-100 text-emerald-800 font-bold' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {ticket.callStatus === 'Calling' ? '🔔 Currently Called' : ticket.callStatus === 'Ready' ? '⏳ Please Stand By' : ticket.stage === 'Completed' ? 'Finished' : 'In Line'}
                              </span>
                              <button
                                onClick={() => handlePrintQueueSlip(ticket)}
                                className="px-2.5 py-1 bg-[#7F1416] hover:bg-[#680F11] text-white rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer shadow-2xs"
                                title="Print my queue slip with university seal"
                              >
                                <Printer className="w-3 h-3 text-amber-300" />
                                <span>Slip</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SMS Dispatcher, Delivery Logs & Twilio Configuration Modal */}
      {showSmsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-[#7F1416] via-[#94191c] to-[#7F1416] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 p-2 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg">
                    SMS Notification Service & Messaging Gateway
                  </h3>
                  <p className="text-xs text-red-200">
                    Twilio Integration · Real-Time Queue Updates · Automated Reminders
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSmsModal(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 pt-3 bg-slate-50 text-xs">
              <div className="flex gap-2">
                <button
                  onClick={() => setSmsModalTab('logs')}
                  className={`px-4 py-2 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    smsModalTab === 'logs'
                      ? 'border-[#7F1416] text-[#7F1416] bg-white rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>SMS Delivery Logs ({smsLogs.length})</span>
                </button>
                <button
                  onClick={() => setSmsModalTab('config')}
                  className={`px-4 py-2 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    smsModalTab === 'config'
                      ? 'border-[#7F1416] text-[#7F1416] bg-white rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Twilio / Gateway Config</span>
                </button>
                <button
                  onClick={() => setSmsModalTab('test')}
                  className={`px-4 py-2 font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    smsModalTab === 'test'
                      ? 'border-[#7F1416] text-[#7F1416] bg-white rounded-t-lg'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Quick Test SMS</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                PSU-UHMS-SMS-V2.6
              </span>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 text-xs">
              {/* TAB 1: DELIVERY LOGS */}
              {smsModalTab === 'logs' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:w-80">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search logs by patient, phone (+63), ticket..."
                        value={searchLogQuery}
                        onChange={(e) => setSearchLogQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setSmsLogs(SMSNotificationService.getLogs())}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Refresh</span>
                      </button>
                      <button
                        onClick={() => {
                          SMSNotificationService.clearLogs();
                          setSmsLogs([]);
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear Logs</span>
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Timestamp</th>
                          <th className="py-2.5 px-3">Recipient & Number</th>
                          <th className="py-2.5 px-3">Type</th>
                          <th className="py-2.5 px-3">Message Content</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Carrier / SID</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80 bg-white">
                        {filteredSmsLogs.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-slate-400">
                              No SMS logs match your query.
                            </td>
                          </tr>
                        ) : (
                          filteredSmsLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                {log.timestamp}
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="font-semibold text-slate-900">{log.recipientName}</div>
                                <div className="text-[11px] font-mono text-emerald-700 font-medium">
                                  {log.recipientPhone}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  log.messageType === 'queue_calling'
                                    ? 'bg-blue-100 text-blue-800'
                                    : log.messageType === 'queue_ready'
                                    ? 'bg-amber-100 text-amber-800'
                                    : log.messageType === 'appointment_reminder'
                                    ? 'bg-purple-100 text-purple-800'
                                    : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {log.messageType.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-slate-700 max-w-xs sm:max-w-md">
                                <div className="line-clamp-2 leading-relaxed font-sans text-[11px]">
                                  {log.messageText}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  log.status === 'Delivered'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : log.status === 'Sent' || log.status === 'Simulated'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  ✓ {log.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                                <div>{log.provider}</div>
                                {log.responseSid && <div className="truncate max-w-[100px]">{log.responseSid}</div>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: TWILIO & GATEWAY CONFIGURATION */}
              {smsModalTab === 'config' && (
                <form onSubmit={handleSaveSmsConfig} className="space-y-5 max-w-2xl mx-auto">
                  {configSavedToast && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-lg flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold">SMS Gateway configuration saved successfully!</span>
                    </div>
                  )}

                  {/* Provider Selection */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <label className="font-bold text-slate-900 block text-xs">
                      Primary Messaging API Provider:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between ${
                        smsConfig.provider === 'twilio' ? 'bg-red-50 border-red-400 ring-2 ring-red-300/30' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Twilio API</span>
                          <input
                            type="radio"
                            name="provider"
                            value="twilio"
                            checked={smsConfig.provider === 'twilio'}
                            onChange={() => setSmsConfig({ ...smsConfig, provider: 'twilio' })}
                            className="text-red-700"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2">
                          Global carrier network with Account SID & Token authentication
                        </span>
                      </label>

                      <label className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between ${
                        smsConfig.provider === 'semaphore' ? 'bg-red-50 border-red-400 ring-2 ring-red-300/30' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Semaphore PH</span>
                          <input
                            type="radio"
                            name="provider"
                            value="semaphore"
                            checked={smsConfig.provider === 'semaphore'}
                            onChange={() => setSmsConfig({ ...smsConfig, provider: 'semaphore' })}
                            className="text-red-700"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2">
                          Philippine local SMS gateway for Smart, Globe, DITO
                        </span>
                      </label>

                      <label className={`p-3 rounded-lg border cursor-pointer flex flex-col justify-between ${
                        smsConfig.provider === 'simulation' ? 'bg-red-50 border-red-400 ring-2 ring-red-300/30' : 'bg-white border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">Simulation Mode</span>
                          <input
                            type="radio"
                            name="provider"
                            value="simulation"
                            checked={smsConfig.provider === 'simulation'}
                            onChange={() => setSmsConfig({ ...smsConfig, provider: 'simulation' })}
                            className="text-red-700"
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-2">
                          Live dev test mode with instant carrier log simulation
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Twilio Credentials */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <h4 className="font-bold text-slate-900">API Credentials & Sender ID</h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Twilio Account SID:
                        </label>
                        <input
                          type="text"
                          placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                          value={smsConfig.accountSid}
                          onChange={(e) => setSmsConfig({ ...smsConfig, accountSid: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Twilio Auth Token:
                        </label>
                        <input
                          type="password"
                          placeholder="••••••••••••••••••••••••••••••••"
                          value={smsConfig.authToken}
                          onChange={(e) => setSmsConfig({ ...smsConfig, authToken: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          From Phone Number / Sender ID:
                        </label>
                        <input
                          type="text"
                          placeholder="+18005550199 or PSU-CLINIC"
                          value={smsConfig.fromNumberOrSenderId}
                          onChange={(e) => setSmsConfig({ ...smsConfig, fromNumberOrSenderId: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Semaphore API Key (Optional):
                        </label>
                        <input
                          type="password"
                          placeholder="Semaphore API key for PH"
                          value={smsConfig.semaphoreApiKey || ''}
                          onChange={(e) => setSmsConfig({ ...smsConfig, semaphoreApiKey: e.target.value })}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Automated Trigger Toggles */}
                  <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                    <h4 className="font-bold text-slate-900">Automated Notification Rules</h4>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smsConfig.autoSendOnReady}
                          onChange={(e) => setSmsConfig({ ...smsConfig, autoSendOnReady: e.target.checked })}
                          className="rounded text-[#7F1416]"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            Automated trigger when status changes to 'Ready'
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Dispatches SMS alert informing patient to prepare for their consultation turn.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smsConfig.autoSendOnCalling}
                          onChange={(e) => setSmsConfig({ ...smsConfig, autoSendOnCalling: e.target.checked })}
                          className="rounded text-[#7F1416]"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            Automated trigger when status changes to 'Calling'
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Dispatches high-priority SMS calling notification with room / counter details.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smsConfig.autoSendOnTicketIssued}
                          onChange={(e) => setSmsConfig({ ...smsConfig, autoSendOnTicketIssued: e.target.checked })}
                          className="rounded text-[#7F1416]"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            Automated SMS confirmation on Queue Ticket Issuance
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Sends ticket number and priority confirmation as soon as intake receptionist prints ticket.
                          </div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smsConfig.autoSendOnAppointmentReminder}
                          onChange={(e) => setSmsConfig({ ...smsConfig, autoSendOnAppointmentReminder: e.target.checked })}
                          className="rounded text-[#7F1416]"
                        />
                        <div>
                          <div className="font-semibold text-slate-900">
                            Automated Appointment Reminders
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Sends clinic appointment details and schedule reminders to registered students/staff.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#7F1416] hover:bg-[#680F11] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: QUICK TEST SMS COMPOSER */}
              {smsModalTab === 'test' && (
                <div className="max-w-xl mx-auto space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <h4 className="font-bold text-slate-900 mb-1">Direct SMS Test Dispatcher</h4>
                    <p className="text-[11px] text-slate-600 mb-4">
                      Simulate or trigger live test text messages to any Philippine contact number (+63 9XX XXX XXXX).
                    </p>

                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Recipient Phone Number:
                        </label>
                        <input
                          type="text"
                          value={testRecipientPhone}
                          onChange={(e) => setTestRecipientPhone(e.target.value)}
                          placeholder="+63 917 842 1092"
                          className="w-full p-2 bg-white border border-slate-200 rounded font-mono text-xs"
                        />
                      </div>

                      {/* Quick Fill Registered Patients */}
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">
                          Or select registered patient contact:
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {patients.slice(0, 4).map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setTestRecipientPhone(p.contactNumber);
                                setTestMessage(`[PSU CLINIC] Hi ${p.firstName}, this is a test notification from the Pampanga State University Medical Clinic.`);
                              }}
                              className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] font-medium"
                            >
                              {p.firstName} ({p.contactNumber})
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                          Message Body:
                        </label>
                        <textarea
                          rows={3}
                          value={testMessage}
                          onChange={(e) => setTestMessage(e.target.value)}
                          className="w-full p-2 bg-white border border-slate-200 rounded text-xs leading-relaxed"
                        />
                        <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                          <span>Characters: {testMessage.length}</span>
                          <span>Est. SMS parts: {Math.ceil(testMessage.length / 160)}</span>
                        </div>
                      </div>

                      {testSmsStatus && (
                        <div className="p-3 bg-slate-900 text-white rounded-lg text-xs font-mono">
                          {testSmsStatus}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={handleSendTestSms}
                        disabled={isSendingTestSms}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                      >
                        <Send className="w-4 h-4" />
                        <span>{isSendingTestSms ? 'Transmitting to Carrier...' : 'Dispatch Test SMS'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
