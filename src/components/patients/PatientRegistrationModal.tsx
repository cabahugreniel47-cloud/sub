import React, { useState, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Patient, PatientClassification, QueuePriority } from '../../types/clinic';
import { X, UserPlus, CheckCircle, AlertCircle, Edit3, Ticket, BellRing, Sparkles, ArrowRight } from 'lucide-react';

interface PatientRegistrationModalProps {
  isEditMode?: boolean;
  patientToEdit?: Patient | null;
}

export const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
  isEditMode: propIsEditMode,
  patientToEdit: propPatientToEdit
}) => {
  const {
    addPatient,
    updatePatient,
    activeModal,
    setActiveModal,
    selectedPatient,
    setSelectedPatient,
    showToast,
    issueQueueTicket,
    setModalPayload
  } = useClinic();

  const isEditMode = propIsEditMode || activeModal === 'edit-patient';
  const targetPatient = propPatientToEdit || selectedPatient;

  const [psuId, setPsuId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [classification, setClassification] = useState<PatientClassification>('Student');
  const [collegeOrDepartment, setCollegeOrDepartment] = useState('College of Computing Studies');
  const [courseAndYear, setCourseAndYear] = useState('BS Information Technology - 1st Year');
  const [birthDate, setBirthDate] = useState('2005-01-01');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [civilStatus, setCivilStatus] = useState<'Single' | 'Married' | 'Widowed' | 'Separated'>('Single');
  const [contactNumber, setContactNumber] = useState('+63 9');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('Bacolor, Pampanga');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState('Parent');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('+63 9');
  const [bloodType, setBloodType] = useState<any>('O+');
  const [knownAllergies, setKnownAllergies] = useState('None declared');
  const [chronicConditions, setChronicConditions] = useState('None');
  const [philHealthNumber, setPhilHealthNumber] = useState('');

  // Queue Handling & Intake Options
  const [autoEnqueue, setAutoEnqueue] = useState(true);
  const [visitComplaint, setVisitComplaint] = useState('General Medical Consultation');
  const [queuePriority, setQueuePriority] = useState<QueuePriority>('Regular');

  // Pre-fill existing patient values when in edit mode
  useEffect(() => {
    if (isEditMode && targetPatient) {
      setPsuId(targetPatient.psuId || '');
      setFirstName(targetPatient.firstName || '');
      setMiddleName(targetPatient.middleName || '');
      setLastName(targetPatient.lastName || '');
      setClassification(targetPatient.classification || 'Student');
      setCollegeOrDepartment(targetPatient.collegeOrDepartment || 'College of Computing Studies');
      setCourseAndYear(targetPatient.courseAndYear || '');
      setBirthDate(targetPatient.birthDate || '2005-01-01');
      setGender(targetPatient.gender || 'Male');
      setCivilStatus(targetPatient.civilStatus || 'Single');
      setContactNumber(targetPatient.contactNumber || '+63 9');
      setEmail(targetPatient.email || '');
      setAddress(targetPatient.address || 'Bacolor, Pampanga');
      setEmergencyContactName(targetPatient.emergencyContactName || '');
      setEmergencyContactRelationship(targetPatient.emergencyContactRelationship || 'Parent');
      setEmergencyContactPhone(targetPatient.emergencyContactPhone || '+63 9');
      setBloodType(targetPatient.bloodType || 'O+');
      setKnownAllergies(
        Array.isArray(targetPatient.knownAllergies)
          ? targetPatient.knownAllergies.join(', ')
          : targetPatient.knownAllergies || 'None declared'
      );
      setChronicConditions(
        Array.isArray(targetPatient.chronicConditions)
          ? targetPatient.chronicConditions.join(', ')
          : targetPatient.chronicConditions || 'None'
      );
      setPhilHealthNumber(targetPatient.philHealthNumber || '');
    }
  }, [isEditMode, targetPatient]);

  // Auto calculate age
  const calculateAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970) || 19;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!psuId.trim() || !firstName.trim() || !lastName.trim()) {
      showToast('Please fill in required fields (PSU ID, First Name, Last Name).', 'warning');
      return;
    }

    const patientPayload = {
      psuId: psuId.trim(),
      firstName: firstName.trim(),
      middleName: middleName.trim() || undefined,
      lastName: lastName.trim(),
      classification,
      collegeOrDepartment,
      courseAndYear: classification === 'Student' ? courseAndYear : 'Staff Position',
      birthDate,
      age: calculateAge(birthDate),
      gender,
      civilStatus,
      contactNumber: contactNumber.trim(),
      email: email.trim() || `${firstName.toLowerCase().replace(/\s+/g, '')}.${lastName.toLowerCase()}@psu.edu.ph`,
      address: address.trim(),
      emergencyContactName: emergencyContactName.trim() || 'Family Member',
      emergencyContactRelationship,
      emergencyContactPhone: emergencyContactPhone.trim(),
      bloodType,
      knownAllergies: knownAllergies.split(',').map(s => s.trim()).filter(Boolean),
      chronicConditions: chronicConditions !== 'None' ? chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      philHealthNumber: philHealthNumber.trim()
    };

    if (isEditMode && targetPatient) {
      const ok = await updatePatient(targetPatient.id, patientPayload);
      if (ok) {
        setSelectedPatient({
          ...targetPatient,
          ...patientPayload
        });
        showToast(`✓ Patient record for ${firstName} ${lastName} (${psuId}) updated successfully!`, 'success');
        setActiveModal(null);
      }
      return;
    }

    const newPatient = await addPatient(patientPayload);
    if (!newPatient) {
      return;
    }

    setSelectedPatient(newPatient);

    // Auto-enqueue patient into Queue Handling for Nurse Triage
    if (autoEnqueue) {
      const ticket = issueQueueTicket(newPatient.id, queuePriority, visitComplaint || 'New Patient Intake & Triage');
      setModalPayload({
        type: 'queue-receipt',
        ticket,
        patient: newPatient
      });
      showToast(`✓ Registered ${newPatient.firstName} ${newPatient.lastName} & issued Queue Ticket #${ticket.ticketNumber}! Sent to Waiting Triage.`, 'success');
      setActiveModal('print-queue-receipt');
    } else {
      showToast(`✓ Patient record for ${newPatient.firstName} ${newPatient.lastName} created successfully!`, 'success');
      setActiveModal(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-800 font-bold text-base">
            {isEditMode ? (
              <>
                <Edit3 className="w-5 h-5 text-[#7F1416]" />
                <span>Edit Patient Record — {targetPatient?.firstName} {targetPatient?.lastName}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                <span>New Patient Registration & Health Intake</span>
              </>
            )}
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 flex-1">
          {/* Institutional Identifiers */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 pb-1 border-b border-slate-100">
              1. Institutional Identity & Demographics
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-800">PSU ID Number *</label>
                  <button
                    type="button"
                    onClick={() => {
                      const yr = '2024';
                      const rnd = Math.floor(100000 + Math.random() * 900000);
                      setPsuId(`${yr}${rnd}`);
                    }}
                    className="text-[10px] text-red-700 hover:underline font-semibold cursor-pointer"
                  >
                    + Auto-Gen (10 digits)
                  </button>
                </div>
                <input
                  type="text"
                  value={psuId}
                  onChange={(e) => setPsuId(e.target.value.replace(/[^0-9]/g, '').slice(0, 10))}
                  placeholder="e.g. 2023313334"
                  maxLength={10}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-red-600 focus:bg-white text-slate-900"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Format: 10-digit continuous number (e.g. 2023313334)</span>
              </div>

              <div>
                <label className="block font-semibold mb-1">Classification *</label>
                <select
                  value={classification}
                  onChange={(e) => setClassification(e.target.value as PatientClassification)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white cursor-pointer"
                >
                  <option value="Student">Student</option>
                  <option value="Faculty">Faculty</option>
                  <option value="Administrative Staff">Administrative Staff</option>
                  <option value="Dependent">Dependent</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">College or Department *</label>
                <input
                  type="text"
                  value={collegeOrDepartment}
                  onChange={(e) => setCollegeOrDepartment(e.target.value)}
                  placeholder="e.g. College of Computing Studies"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block font-semibold mb-1">First Name *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First Name"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Middle Name</label>
                <input
                  type="text"
                  value={middleName}
                  onChange={(e) => setMiddleName(e.target.value)}
                  placeholder="Middle Name"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Last Name *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last Name"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
              <div>
                <label className="block font-semibold mb-1">Birth Date</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white cursor-pointer"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Civil Status</label>
                <select
                  value={civilStatus}
                  onChange={(e) => setCivilStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white cursor-pointer"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="Separated">Separated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact & Emergency */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 pb-1 border-b border-slate-100">
              2. Contact & Emergency Details (Philippine Standard)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Mobile Contact Number (PH) *</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Institutional Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@psu.edu.ph"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Home Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Barangay, Municipality / City, Pampanga"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Emergency Contact Person</label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="e.g. Maria Dela Cruz (Mother)"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Emergency Phone Number</label>
                <input
                  type="text"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="+63 9XX XXX XXXX"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Medical Baseline & Allergies */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase text-[11px] tracking-wider mb-2 pb-1 border-b border-slate-100">
              3. Clinical Baseline & Drug Allergy Safeguards
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Blood Type</label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white cursor-pointer"
                >
                  <option value="O+">O+</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Known Drug Allergies</label>
                <input
                  type="text"
                  value={knownAllergies}
                  onChange={(e) => setKnownAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa drugs"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white text-red-700 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">PhilHealth Number</label>
                <input
                  type="text"
                  value={philHealthNumber}
                  onChange={(e) => setPhilHealthNumber(e.target.value)}
                  placeholder="e.g. 12-054921849-1"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:bg-white font-mono"
                />
              </div>
            </div>
          </div>


          {/* 4. Queue Handling & Intake Triage (Walk-in Admissions) */}
          {!isEditMode && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-200/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg text-amber-800">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950 text-xs uppercase tracking-wider">
                      4. Queue Handling & Triage Intake
                    </h4>
                    <p className="text-[11px] text-amber-800/80">
                      Issue live queue ticket and admit patient to waiting triage immediately.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-amber-300 shadow-2xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoEnqueue}
                    onChange={(e) => setAutoEnqueue(e.target.checked)}
                    className="w-4 h-4 rounded text-red-700 focus:ring-red-600 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Auto-Enqueue for Nurse Triage
                  </span>
                </label>
              </div>

              {autoEnqueue && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block font-semibold mb-1 text-slate-800">
                      Triage Priority Classification *
                    </label>
                    <select
                      value={queuePriority}
                      onChange={(e) => setQueuePriority(e.target.value as QueuePriority)}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-red-600 cursor-pointer"
                    >
                      <option value="Regular">Regular Queue (Standard Walk-In)</option>
                      <option value="Senior/PWD">Senior Citizen / PWD / Priority</option>
                      <option value="Urgent">Urgent Priority (High Fever, Moderate Distress)</option>
                      <option value="Emergency">Emergency Priority (Acute Severe Condition)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold mb-1 text-slate-800">
                      Chief Complaint / Reason for Visit *
                    </label>
                    <input
                      type="text"
                      value={visitComplaint}
                      onChange={(e) => setVisitComplaint(e.target.value)}
                      placeholder="e.g. Fever, persistent cough, headache"
                      required={autoEnqueue}
                      className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs focus:ring-2 focus:ring-red-600 text-slate-900"
                    />
                  </div>

                  <div className="sm:col-span-2 flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] text-slate-500 font-semibold">Quick Presets:</span>
                    {[
                      'General Medical Consultation',
                      'Fever & Body Malaise',
                      'Cough / Colds (URTI)',
                      'Abdominal Pain / Gastritis',
                      'Wound Dressing / First Aid',
                      'Annual Physical Exam'
                    ].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setVisitComplaint(preset)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors cursor-pointer ${
                          visitComplaint === preset
                            ? 'bg-[#7F1416] text-white border-[#7F1416]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              {isEditMode ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Update Patient Record</span>
                </>
              ) : autoEnqueue ? (
                <>
                  <Ticket className="w-4 h-4 text-amber-300" />
                  <span>Register & Enqueue to Triage</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Save Patient Record Only</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
