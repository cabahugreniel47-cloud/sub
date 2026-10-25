import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Appointment } from '../../types/clinic';
import { SMSNotificationService } from '../../services/smsNotificationService';
import {
  Calendar,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  User,
  ChevronRight,
  MessageSquare,
  Send,
  FileText,
  Activity,
  X,
  Printer,
  HeartPulse
} from 'lucide-react';

export const AppointmentManager: React.FC = () => {
  const {
    currentUser,
    appointments,
    addAppointment,
    updateAppointmentStatus,
    patients,
    vitalSigns,
    consultations,
    setModalPayload,
    setActiveModal,
    setSelectedPatient,
    showToast
  } = useClinic();

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppointmentForView, setSelectedAppointmentForView] = useState<Appointment | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [purpose, setPurpose] = useState<Appointment['purpose']>('Physician Consultation');
  const [date, setDate] = useState('2026-09-27');
  const [time, setTime] = useState('10:00 AM');
  const [doctorName, setDoctorName] = useState('Dr. Roberto M. Manalo, MD');
  const [notes, setNotes] = useState('Routine clinical checkup');

  const [filterPurpose, setFilterPurpose] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const isStudent = currentUser?.role === 'student';
  const myRecord = patients.find(
    p => (currentUser?.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
         (currentUser?.institutionalId && p.psuId === currentUser.institutionalId) ||
         (currentUser?.fullName && `${p.firstName} ${p.lastName}`.toLowerCase() === currentUser.fullName.toLowerCase())
  );

  const filteredAppointments = appointments.filter(a => {
    if (isStudent) {
      const isMyApt = myRecord
        ? (a.patientId === myRecord.id || a.patientPsuId === myRecord.psuId)
        : (currentUser?.fullName ? a.patientName.toLowerCase() === currentUser.fullName.toLowerCase() : true);
      if (!isMyApt) return false;
    }
    const matchesPurpose = filterPurpose === 'all' || a.purpose === filterPurpose;
    const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
    return matchesPurpose && matchesStatus;
  });

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const pat = patients.find(p => p.id === selectedPatientId);
    if (!pat) return;

    const newApt = addAppointment({
      patientId: pat.id,
      patientName: `${pat.firstName} ${pat.lastName}`,
      patientPsuId: pat.psuId,
      classification: pat.classification,
      purpose,
      date,
      time,
      doctorName,
      notes,
      status: 'Scheduled'
    });

    const config = SMSNotificationService.getConfig();
    if (config.enabled && config.autoSendOnAppointmentReminder && pat.contactNumber) {
      await SMSNotificationService.sendAppointmentReminder(pat, newApt);
    }

    showToast(`Appointment scheduled for ${pat.firstName} ${pat.lastName} on ${date} at ${time}! SMS confirmation sent to ${pat.contactNumber}`, 'success');
    setShowAddModal(false);
  };

  const handleSendSmsReminder = async (apt: Appointment) => {
    const pat = patients.find(p => p.id === apt.patientId);
    if (!pat || !pat.contactNumber) {
      showToast('Patient has no valid mobile contact number on file.', 'warning');
      return;
    }

    const res = await SMSNotificationService.sendAppointmentReminder(pat, apt);
    if (res.success) {
      showToast(`📱 SMS reminder successfully sent to ${pat.firstName} (${pat.contactNumber})!`, 'success');
    } else {
      showToast('Failed to dispatch SMS reminder. Check gateway settings.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Clinic Scheduling System</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Appointments & Health Clearances
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage future consultations, annual student physical examinations, faculty medical clearances, and dental visits.
          </p>
        </div>

        {currentUser?.role !== 'doctor' && currentUser?.role !== 'administrator' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Appointment</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Filter Purpose:</span>
          <select
            value={filterPurpose}
            onChange={(e) => setFilterPurpose(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium cursor-pointer"
          >
            <option value="all">All Purposes</option>
            <option value="Physician Consultation">Physician Consultation</option>
            <option value="Annual Physical Exam">Annual Physical Exam</option>
            <option value="Medical Clearance">Medical Clearance</option>
            <option value="Dental Assessment">Dental Assessment</option>
            <option value="Follow-up">Follow-up</option>
            <option value="Vaccination">Vaccination</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-600">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-medium cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Patient Name & PSU ID</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">Purpose</th>
                <th className="py-3 px-4">Assigned Doctor</th>
                <th className="py-3 px-4">Remarks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    No appointments match your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map(apt => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 font-mono">{apt.date}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{apt.time}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{apt.patientName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{apt.patientPsuId}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {apt.classification}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {apt.purpose}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {apt.doctorName}
                    </td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate" title={apt.notes}>
                      {apt.notes}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                        apt.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                        apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                        apt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {apt.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isStudent ? (
                        <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold ${
                          apt.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                          apt.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' :
                          apt.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {apt.status === 'Completed' ? 'Completed Visit' : apt.status === 'Confirmed' ? 'Confirmed Visit' : apt.status === 'Cancelled' ? 'Cancelled' : 'Scheduled Visit'}
                        </span>
                      ) : currentUser?.role === 'doctor' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status !== 'Completed' && apt.status !== 'Cancelled' && (
                            <button
                              onClick={() => {
                                updateAppointmentStatus(apt.id, 'Completed');
                                showToast(`Appointment for ${apt.patientName} marked as Finished.`, 'success');
                              }}
                              className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Finish this appointment"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Finish Appointment</span>
                            </button>
                          )}
                          {apt.status === 'Completed' && (
                            <button
                              onClick={() => setSelectedAppointmentForView(apt)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              title="Access and view clinical record for this finished appointment"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-700" />
                              <span>View Details</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                            <button
                              onClick={() => handleSendSmsReminder(apt)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Send instant SMS appointment reminder to patient contact number"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-700" />
                              <span>SMS Reminder</span>
                            </button>
                          )}
                          {apt.status === 'Scheduled' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'Confirmed')}
                              className="px-2 py-1 bg-blue-50 text-blue-800 font-semibold rounded hover:bg-blue-100 cursor-pointer"
                            >
                              Confirm
                            </button>
                          )}
                          {apt.status === 'Confirmed' && (
                            <button
                              onClick={() => {
                                updateAppointmentStatus(apt.id, 'Completed');
                                showToast(`Appointment for ${apt.patientName} marked as Completed.`, 'success');
                              }}
                              className="px-2 py-1 bg-emerald-50 text-emerald-800 font-semibold rounded hover:bg-emerald-100 cursor-pointer"
                            >
                              Complete
                            </button>
                          )}
                          {apt.status === 'Completed' && (
                            <button
                              onClick={() => setSelectedAppointmentForView(apt)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-slate-600" />
                              <span>Details</span>
                            </button>
                          )}
                          {apt.status !== 'Cancelled' && apt.status !== 'Completed' && (
                            <button
                              onClick={() => updateAppointmentStatus(apt.id, 'Cancelled')}
                              className="px-2 py-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Appointment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-red-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Schedule Clinic Appointment</span>
              <button onClick={() => setShowAddModal(false)} className="text-red-200 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateAppointment} className="p-5 space-y-3.5 text-xs text-slate-700">
              <div>
                <label className="block font-semibold mb-1">Patient</label>
                {currentUser?.role === 'student' ? (
                  <div className="p-2.5 bg-slate-100 border border-slate-200 rounded font-semibold text-slate-800">
                    {patients[0] ? `${patients[0].firstName} ${patients[0].lastName} (${patients[0].psuId})` : currentUser.fullName}
                  </div>
                ) : (
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-medium"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.psuId})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-semibold mb-1">Purpose / Service *</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                >
                  <option value="Physician Consultation">Physician Consultation</option>
                  <option value="Annual Physical Exam">Annual Physical Exam</option>
                  <option value="Medical Clearance">Medical Clearance</option>
                  <option value="Dental Assessment">Dental Assessment</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Vaccination">Vaccination</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Appointment Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Time</label>
                  <input
                    type="text"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Attending Physician / Personnel</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Clinical Remarks / Requirements</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded font-bold cursor-pointer"
                >
                  Save Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Finished Appointment Details & Clinical Access Modal */}
      {selectedAppointmentForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-red-950/20 bg-gradient-to-r from-red-900 to-red-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <span className="font-bold text-sm">Finished Appointment & Clinical Access</span>
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
              {/* Patient Banner */}
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
                          {selectedAppointmentForView.status}
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
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span>Clinical Consultation & Diagnosis</span>
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
    </div>
  );
};
