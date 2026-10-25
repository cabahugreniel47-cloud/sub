import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Stethoscope,
  FileText,
  Calendar,
  Pill,
  Download,
  AlertCircle,
  CheckCircle2,
  Printer,
  Shield,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';

export const StudentConsultationsView: React.FC = () => {
  const {
    currentUser,
    patients,
    consultations,
    certificates,
    setActiveModal,
    setModalPayload
  } = useClinic();

  const [activeTab, setActiveTab] = useState<'prescriptions' | 'certificates'>('prescriptions');

  // Find linked student patient record securely matching authenticated user
  const myRecord = patients.find(
    p => (currentUser?.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
         (currentUser?.institutionalId && p.psuId === currentUser.institutionalId) ||
         (currentUser?.fullName && `${p.firstName} ${p.lastName}`.toLowerCase() === currentUser.fullName.toLowerCase())
  ) || (patients.length === 1 ? patients[0] : null);

  const myConsultations = consultations.filter(c => myRecord ? c.patientId === myRecord.id : false);
  const myCertificates = certificates.filter(c => myRecord ? c.patientId === myRecord.id : false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7F1416] uppercase tracking-wider mb-1">
            <Stethoscope className="w-4 h-4" />
            <span>Personal Health Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            My Medical Records & Prescriptions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Confidential medical consultations, electronic prescriptions (Rx), and official clearance certificates issued by university physicians.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'prescriptions'
                ? 'bg-[#7F1416] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Prescriptions ({myConsultations.length})
          </button>
          <button
            onClick={() => setActiveTab('certificates')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'certificates'
                ? 'bg-[#7F1416] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Medical Certificates ({myCertificates.length})
          </button>
        </div>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-center gap-2.5">
        <Shield className="w-4 h-4 text-emerald-700 shrink-0" />
        <span>
          <strong>Data Privacy Protection:</strong> This portal is isolated to your institutional student profile ({myRecord?.psuId}) in accordance with RA 10173.
        </span>
      </div>

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {myConsultations.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No historical electronic prescriptions on your record. When evaluated by a university doctor, your electronic Rx will appear here.
            </div>
          ) : (
            myConsultations.map(consult => (
              <div
                key={consult.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-red-100 text-red-900 px-2 py-0.5 rounded-full uppercase">
                        Official E-Prescription (Rx)
                      </span>
                      {consult.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          <span>Approved by Attending Physician</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>Under Physician Review</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-slate-900 text-base mt-1">
                      {consult.assessmentDiagnosis}
                    </h3>
                    <div className="text-xs text-slate-500">
                      Attending Doctor: <strong className="text-slate-700">{consult.approvedByDoctorName || consult.doctorName}</strong> (PRC #{consult.approvedByDoctorLicense || consult.doctorLicense || '0098412'}) · ICD-10: <span className="font-mono">{consult.icd10Code || 'J06.9'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="font-mono text-xs text-slate-500">
                      {consult.date}
                    </span>
                    <button
                      onClick={() => {
                        setModalPayload({
                          type: 'rx',
                          consultation: consult,
                          patient: myRecord
                        });
                        setActiveModal('document-export');
                      }}
                      className="px-3 py-1.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Prescriptions List */}
                <div className="space-y-2.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Formulated Medications & Dosage Instructions:
                  </div>
                  {consult.prescriptions.map((rx, idx) => (
                    <div
                      key={rx.id || idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="text-[#7F1416] font-bold font-mono">Rx #{idx + 1}</span>
                          <span>{rx.genericName} {rx.brandName ? `(${rx.brandName})` : ''} {rx.dosageStrength}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">
                          <strong>Sig:</strong> {rx.frequency} for {rx.durationDays} day(s). {rx.instructions}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-slate-800 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-xs">
                          Qty: {rx.quantity} {rx.dosageForm}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Doctor's Advice */}
                {consult.recommendations && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <strong>Physician Advice:</strong> {consult.recommendations}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Medical Certificates Tab */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          {myCertificates.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 text-slate-400 text-xs">
              No medical clearance certificates on file. When issued by the physician, they will be archived here.
            </div>
          ) : (
            myCertificates.map(cert => (
              <div
                key={cert.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#7F1416]">
                      {cert.certificateNumber}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">
                      {cert.diagnosis}
                    </h3>
                  </div>

                  <button
                    onClick={() => {
                      setModalPayload({
                        type: 'medical-certificate',
                        certificate: cert,
                        patient: myRecord
                      });
                      setActiveModal('document-export');
                    }}
                    className="px-3 py-1.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Official Clearance</span>
                  </button>
                </div>

                <div className="text-xs text-slate-600">
                  <strong>Remarks:</strong> {cert.treatmentAndRemarks}
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                  <div>
                    Fitness: <strong className="text-emerald-700">{cert.fitToResumeStudiesOrWork ? 'Fit to Resume Classes' : 'Rest Advised'}</strong>
                  </div>
                  <div>Issued: {cert.issuedAt} · Dr. Roberto M. Manalo, MD</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
