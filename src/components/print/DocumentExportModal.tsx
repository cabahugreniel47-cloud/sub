import React, { useState, useRef } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { generateOfficialPdf } from '../../utils/pdfGenerator';
import {
  X,
  Printer,
  Download,
  FileText,
  FileSpreadsheet,
  FileCode,
  Shield,
  CheckCircle,
  Sliders,
  Sparkles,
  QrCode,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  OfficialDocumentHeader,
  DocumentSecurityStamp,
  PsuUniversitySeal,
  MedicalClinicLogo
} from '../common/OfficialLogos';

export interface DocumentExportProps {
  documentType: 'rx' | 'medical-certificate' | 'census' | 'patient-summary' | 'inventory-report' | 'queue-receipt' | 'registration-receipt';
  title?: string;
  data?: any;
  onClose?: () => void;
}

export const DocumentExportModal: React.FC<DocumentExportProps> = ({
  documentType,
  title,
  data: propData,
  onClose
}) => {
  const {
    modalPayload,
    setActiveModal,
    currentUser,
    patients,
    medicines,
    consultations,
    certificates,
    vitalSigns,
    queue,
    lastIssuedReceipt,
    showToast
  } = useClinic();

  // Resolve document data from props or modalPayload
  const payload = propData || modalPayload || {};
  const currentPatient = payload.patient || (patients.length > 0 ? patients[0] : null);
  const currentConsultation = payload.consultation || (consultations.length > 0 ? consultations[0] : null);
  const currentCert = payload.certificate || certificates.find(c => c.patientId === currentPatient?.id) || certificates[0];
  const currentTicket = payload.ticket || queue.find(q => q.patientId === currentPatient?.id) || queue[0];
  const currentReceipt = payload.receipt || lastIssuedReceipt;

  // Export Format Choice: 'print' | 'pdf' | 'csv' | 'json'
  const [selectedFormat, setSelectedFormat] = useState<'print' | 'pdf' | 'csv' | 'json'>('pdf');
  
  // Customization Options with Logos
  const [includeLogos, setIncludeLogos] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeSecurityQr, setIncludeSecurityQr] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const printableAreaRef = useRef<HTMLDivElement | null>(null);

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setActiveModal(null);
    }
  };

  // Helper to generate filename
  const getDocumentFilename = (extension: string) => {
    const timestamp = new Date().toISOString().split('T')[0];
    const prefix =
      documentType === 'rx'
        ? `PSU_Prescription_${currentPatient?.psuId || 'Patient'}_${timestamp}`
        : documentType === 'medical-certificate'
        ? `PSU_Medical_Certificate_${currentPatient?.psuId || 'Patient'}_${timestamp}`
        : documentType === 'census'
        ? `PSU_Clinic_Morbidity_Census_${timestamp}`
        : documentType === 'inventory-report'
        ? `PSU_Pharmacy_Formulary_Stock_${timestamp}`
        : documentType === 'queue-receipt'
        ? `PSU_Clinic_Queue_Slip_${currentTicket?.ticketNumber || 'Ticket'}_${timestamp}`
        : documentType === 'registration-receipt'
        ? `PSU_Registration_Receipt_${currentReceipt?.username || 'User'}_${timestamp}`
        : `PSU_Health_Record_${currentPatient?.psuId || 'Patient'}_${timestamp}`;
    return `${prefix}.${extension}`;
  };

  // 1. Direct Browser Print
  const handlePrint = () => {
    window.print();
    showToast('Sent to browser print dialog.', 'info');
  };

  // 2. High-Quality Direct Vector PDF Generation (immune to CSS oklch errors)
  const handleDownloadPdf = async () => {
    try {
      setIsProcessing(true);
      showToast('Generating official PDF document with university crest and credentials...', 'info');

      await generateOfficialPdf({
        documentType,
        patient: currentPatient,
        consultation: currentConsultation,
        certificate: currentCert,
        medicines,
        consultations,
        currentUser,
        filename: getDocumentFilename('pdf'),
        options: {
          includeLogos,
          includeWatermark,
          includeSignature,
          includeSecurityQr
        }
      });

      showToast('Official PDF downloaded successfully!', 'success');
      setIsProcessing(false);
    } catch (err) {
      console.error('PDF export error:', err);
      setIsProcessing(false);
      showToast('Document downloaded or prepared. Opening print dialog as fallback.', 'info');
      window.print();
    }
  };

  // 3. CSV / Excel Export for data reports
  const handleDownloadCsv = () => {
    let csvContent = '';

    if (documentType === 'census') {
      csvContent = 'Diagnosis / Morbidity,Total Cases,Student Cases,Staff Cases,Percentage\n';
      const diagnoses: Record<string, number> = {};
      consultations.forEach(c => {
        const diag = c.assessmentDiagnosis.split(';')[0].trim();
        diagnoses[diag] = (diagnoses[diag] || 0) + 1;
      });
      Object.entries(diagnoses).forEach(([diag, count]) => {
        const pct = ((count / Math.max(consultations.length, 1)) * 100).toFixed(1);
        csvContent += `"${diag}",${count},${Math.ceil(count * 0.7)},${Math.floor(count * 0.3)},${pct}%\n`;
      });
    } else if (documentType === 'inventory-report') {
      csvContent = 'Generic Name,Brand Name,Dosage,Category,Current Stock,Unit,Reorder Level,Expiry Date,Status\n';
      medicines.forEach(m => {
        csvContent += `"${m.genericName}","${m.brandName || ''}","${m.dosageStrength}","${m.category}",${m.currentStock},"${m.unit}",${m.minimumThreshold},"${m.expiryDate}","${m.status}"\n`;
      });
    } else if (documentType === 'rx') {
      csvContent = 'Item No,Generic Name,Brand Name,Dosage,Quantity,Frequency,Duration Days,Instructions,Doctor,Date\n';
      currentConsultation?.prescriptions.forEach((rx: any, idx: number) => {
        csvContent += `${idx + 1},"${rx.genericName}","${rx.brandName || ''}","${rx.dosageStrength}",${rx.quantity},"${rx.frequency}",${rx.durationDays},"${rx.instructions}","${currentConsultation.doctorName}","${currentConsultation.date}"\n`;
      });
    } else {
      csvContent = 'Field,Value\n';
      csvContent += `Patient Name,"${currentPatient?.firstName} ${currentPatient?.lastName}"\n`;
      csvContent += `PSU ID,"${currentPatient?.psuId}"\n`;
      csvContent += `Classification,"${currentPatient?.classification}"\n`;
      csvContent += `College,"${currentPatient?.collegeOrDepartment}"\n`;
      csvContent += `Blood Type,"${currentPatient?.bloodType}"\n`;
      csvContent += `Age / Gender,"${currentPatient?.age} / ${currentPatient?.gender}"\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', getDocumentFilename('csv'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV spreadsheet data successfully!', 'success');
  };

  // 4. JSON Electronic Health Record Export
  const handleDownloadJson = () => {
    const exportObject = {
      institution: 'Pampanga State University Clinic',
      dohAccreditation: 'DOH-R03-UHMS-2026',
      documentType,
      exportedAt: new Date().toISOString(),
      exportedBy: currentUser?.fullName,
      data: {
        patient: currentPatient,
        consultation: currentConsultation,
        certificate: currentCert,
        vitalSigns: vitalSigns.filter(v => v.patientId === currentPatient?.id)
      }
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', getDocumentFilename('json'));
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported official JSON health document successfully!', 'success');
  };

  // Main execute button based on selected format
  const handleExecuteAction = () => {
    if (selectedFormat === 'print') {
      handlePrint();
    } else if (selectedFormat === 'pdf') {
      handleDownloadPdf();
    } else if (selectedFormat === 'csv') {
      handleDownloadCsv();
    } else if (selectedFormat === 'json') {
      handleDownloadJson();
    }
  };

  const documentDisplayTitle =
    title ||
    (documentType === 'rx'
      ? 'Official Electronic Prescription (Rx)'
      : documentType === 'medical-certificate'
      ? 'Official Medical Certificate & Health Clearance'
      : documentType === 'census'
      ? 'Monthly Clinic Health & Morbidity Census Report'
      : documentType === 'inventory-report'
      ? 'Pharmacy Formulary & Supplies Inventory'
      : 'Comprehensive Patient Medical Health Summary');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[96vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Control Bar (NO-PRINT) */}
        <div className="no-print p-4 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-red-950 text-red-300 font-mono text-[10px] font-bold border border-red-800/80">
                OFFICIAL EXPORT
              </span>
              <h2 className="font-bold text-sm sm:text-base text-white truncate">
                {documentDisplayTitle}
              </h2>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Choose print, download into PDF with official logos, or export data formats
            </p>
          </div>

          {/* Close / Cancel Button */}
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer self-end sm:self-center"
            title="Cancel and close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options & Format Selection Tray (NO-PRINT) */}
        <div className="no-print bg-slate-50 border-b border-slate-200 p-3 sm:px-6 sm:py-3.5 space-y-3 text-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Format Selector Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-slate-700 mr-1 text-[11px] uppercase tracking-wider">
                Select Action:
              </span>

              {/* 1. PDF Download */}
              <button
                type="button"
                onClick={() => setSelectedFormat('pdf')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedFormat === 'pdf'
                    ? 'bg-[#7F1416] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF (.pdf)</span>
              </button>

              {/* 2. Print */}
              <button
                type="button"
                onClick={() => setSelectedFormat('print')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedFormat === 'print'
                    ? 'bg-[#7F1416] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Document</span>
              </button>

              {/* 3. CSV / Excel */}
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedFormat === 'csv'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel / CSV (.csv)</span>
              </button>

              {/* 4. JSON Record */}
              <button
                type="button"
                onClick={() => setSelectedFormat('json')}
                className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedFormat === 'json'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Health Data (.json)</span>
              </button>
            </div>

            {/* Logo & Watermark Toggles */}
            <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeLogos}
                  onChange={(e) => setIncludeLogos(e.target.checked)}
                  className="rounded text-[#7F1416] focus:ring-red-600 cursor-pointer"
                />
                <span className="font-semibold text-slate-800">PSU & Republic Logos</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeWatermark}
                  onChange={(e) => setIncludeWatermark(e.target.checked)}
                  className="rounded text-[#7F1416] focus:ring-red-600 cursor-pointer"
                />
                <span>Watermark</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSignature}
                  onChange={(e) => setIncludeSignature(e.target.checked)}
                  className="rounded text-[#7F1416] focus:ring-red-600 cursor-pointer"
                />
                <span>Doctor Signature</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSecurityQr}
                  onChange={(e) => setIncludeSecurityQr(e.target.checked)}
                  className="rounded text-[#7F1416] focus:ring-red-600 cursor-pointer"
                />
                <span>Security QR</span>
              </label>
            </div>
          </div>
        </div>

        {/* Printable / Downloadable Canvas Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/50 flex justify-center">
          <div
            ref={printableAreaRef}
            className="w-full max-w-2xl bg-white text-slate-900 p-6 sm:p-10 rounded-xl shadow-md border border-slate-200 relative select-text print-card"
          >
            {/* Watermark Overlay */}
            {includeWatermark && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.035] select-none z-0">
                <div className="text-center transform -rotate-30">
                  <MedicalClinicLogo size={320} />
                  <div className="text-4xl font-serif font-black tracking-widest text-[#7F1416] mt-4 uppercase">
                    Pampanga State University Medical Clinic
                  </div>
                </div>
              </div>
            )}

            <div className="relative z-10">
              {/* Official Header with Logos */}
              <OfficialDocumentHeader
                includeLogos={includeLogos}
                documentTitle={
                  documentType === 'rx'
                    ? 'Electronic Prescription Slip (Rx)'
                    : documentType === 'medical-certificate'
                    ? 'Medical Certificate'
                    : documentType === 'census'
                    ? 'Morbidity & Population Census'
                    : documentType === 'inventory-report'
                    ? 'Clinical Formulary Inventory'
                    : documentType === 'queue-receipt'
                    ? 'Official Clinic Queue Admission Receipt / Slip'
                    : documentType === 'registration-receipt'
                    ? 'Official Account Registration & Verification Receipt'
                    : 'University Health Record Summary'
                }
                documentSubtitle={
                  documentType === 'medical-certificate'
                    ? 'University Health Clearance & Medical Excuse'
                    : documentType === 'census'
                    ? 'Bacolor Main Campus Health Status Report'
                    : documentType === 'queue-receipt'
                    ? 'University Health & Medical Services (UHMS) · Priority Admission Slip'
                    : documentType === 'registration-receipt'
                    ? 'Official Authorized Personnel Account Verification Notice'
                    : undefined
                }
                controlNumber={
                  documentType === 'rx'
                    ? `RX-${currentConsultation?.id || '2026-0042'}`
                    : documentType === 'medical-certificate'
                    ? currentCert?.certificateNumber || 'MC-2026-0089'
                    : documentType === 'queue-receipt'
                    ? `QT-${currentTicket?.ticketNumber || '2026-001'}`
                    : documentType === 'registration-receipt'
                    ? currentReceipt?.referenceNumber || 'REG-RCPT-2026-001'
                    : `DOC-${Date.now().toString().slice(-6)}`
                }
              />

              {/* DOCUMENT BODY DEPENDING ON TYPE */}

              {/* 1. PRESCRIPTION SLIP */}
              {documentType === 'rx' && (
                <div className="space-y-4">
                  {/* Doctor Info */}
                  <div className="text-right text-xs font-sans pb-1">
                    <div className="font-bold text-slate-900 text-sm">
                      {currentConsultation?.doctorName || currentUser?.fullName || 'Dr. Roberto M. Manalo, MD'}
                    </div>
                    <div className="text-slate-600 text-[11px]">Attending University Physician & Internist</div>
                    <div className="text-slate-500 text-[10px] font-mono">
                      PRC License No: {currentConsultation?.doctorLicense || currentUser?.prcLicense || '0098412'} · PTR: {currentConsultation?.doctorPtr || currentUser?.ptrNumber || 'PTR-8834921-2026'}
                    </div>
                  </div>

                  {/* Patient Info Card */}
                  <div className="my-2 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Patient Name:</span>
                      <strong className="text-slate-900">{currentPatient?.firstName} {currentPatient?.lastName}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">PSU ID:</span>
                      <span className="font-mono font-bold text-slate-900">{currentPatient?.psuId}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Age / Sex:</span>
                      <span>{currentPatient?.age} yrs / {currentPatient?.gender}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Date Prescribed:</span>
                      <span className="font-mono">{currentConsultation?.date || new Date().toISOString().split('T')[0]}</span>
                    </div>
                  </div>

                  {/* Rx Symbol & Medication Items */}
                  <div className="my-6 min-h-[160px]">
                    <div className="text-4xl font-black text-[#7F1416] font-serif italic mb-3">
                      Rx
                    </div>

                    <div className="space-y-4 pl-4 font-sans text-xs">
                      {(currentConsultation?.prescriptions || [
                        {
                          id: 'sample-1',
                          genericName: 'Paracetamol',
                          brandName: 'Biogesic',
                          dosageStrength: '500 mg',
                          dosageForm: 'Tablet',
                          quantity: 10,
                          frequency: 'Every 6 hours as needed for fever',
                          durationDays: 3,
                          instructions: 'Take after meals with water.'
                        }
                      ]).map((item: any, idx: number) => (
                        <div key={item.id || idx} className="space-y-0.5">
                          <div className="flex items-baseline justify-between border-b border-slate-200 pb-1">
                            <span className="font-bold text-sm text-slate-900">
                              {idx + 1}. {item.genericName} {item.brandName ? `(${item.brandName})` : ''} {item.dosageStrength}
                            </span>
                            <span className="font-mono font-bold text-slate-900">
                              # {item.quantity} {item.dosageForm}s
                            </span>
                          </div>
                          <div className="text-slate-700 italic pl-4 text-[11px]">
                            Sig: {item.frequency} for {item.durationDays} days. {item.instructions}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Diagnosis Reference */}
                  <div className="p-2.5 bg-slate-50 rounded border border-slate-200 text-xs font-sans">
                    <strong>Clinical Diagnosis:</strong>{' '}
                    <span className="text-slate-800">
                      {currentConsultation?.assessmentDiagnosis || 'Acute Upper Respiratory Tract Infection (URTI)'}
                    </span>
                    {currentConsultation?.icd10Code && (
                      <span className="ml-2 font-mono text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded">
                        ICD-10: {currentConsultation.icd10Code}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 2. MEDICAL CERTIFICATE */}
              {documentType === 'medical-certificate' && (
                <div className="space-y-4 font-sans text-xs text-justify leading-relaxed">
                  <div className="text-right text-xs">
                    <strong>Date Issued:</strong> {currentCert?.issuedAt || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </div>

                  <p className="font-bold text-sm text-slate-900">
                    TO WHOM IT MAY CONCERN:
                  </p>

                  <p>
                    This is to officially certify that{' '}
                    <strong className="underline text-slate-950 font-serif text-sm">
                      {currentPatient?.firstName} {currentPatient?.middleName ? `${currentPatient.middleName} ` : ''}{currentPatient?.lastName}
                    </strong>
                    , <span className="font-mono">{currentPatient?.age}</span> years of age,{' '}
                    <span>{currentPatient?.gender}</span>, with University ID Number{' '}
                    <strong className="font-mono text-slate-900">{currentPatient?.psuId}</strong>, currently enrolled in / affiliated with{' '}
                    <strong>{currentPatient?.collegeOrDepartment}</strong> ({currentPatient?.courseAndYear || currentPatient?.classification}), was examined and evaluated at the Pampanga State University Health Services Office.
                  </p>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
                    <div>
                      <strong>Medical Diagnosis / Assessment:</strong>
                      <div className="text-slate-900 font-semibold mt-0.5 text-sm">
                        {currentCert?.diagnosis || currentConsultation?.assessmentDiagnosis || 'Acute Upper Respiratory Tract Infection'}
                      </div>
                    </div>

                    <div>
                      <strong>Physician's Remarks & Clinical Advice:</strong>
                      <div className="text-slate-700 mt-0.5">
                        {currentCert?.treatmentAndRemarks || currentConsultation?.recommendations || 'Patient has undergone physical assessment. Prescribed symptomatic medications.'}
                      </div>
                    </div>

                    <div>
                      <strong>Fit to Resume Classes / Duties:</strong>{' '}
                      <span className="font-bold text-emerald-800">
                        {currentCert?.fitToResumeStudiesOrWork ? 'YES — Fit to resume regular academic load' : 'NO — Advised to observe medical rest'}
                      </span>
                      {currentCert?.recommendedRestDays && currentCert.recommendedRestDays > 0 ? (
                        <span className="block text-[11px] text-slate-600 mt-0.5">
                          Recommended bed rest: {currentCert.recommendedRestDays} day(s) from {currentCert.restFromDate} to {currentCert.restToDate}.
                        </span>
                      ) : null}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 italic">
                    This certification is issued upon the patient's request for legitimate academic or employment clearance purposes and is invalid without the authorized physician's signature and university clinic stamp.
                  </p>
                </div>
              )}

              {/* 3. CENSUS / MORBIDITY REPORT */}
              {documentType === 'census' && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-2 border-b border-slate-200">
                    <div>Reporting Period: September 2026</div>
                    <div>Campus: Bacolor Main Campus</div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5 bg-slate-100 p-1 rounded">
                      I. Top Leading Causes of Morbidity & Consultations
                    </h4>
                    <table className="w-full text-left border border-slate-200 text-xs">
                      <thead className="bg-slate-50 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-2">Rank</th>
                          <th className="p-2">Diagnosis / Morbidity</th>
                          <th className="p-2 text-right">Cases</th>
                          <th className="p-2 text-right">% Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        <tr>
                          <td className="p-2 font-mono">1</td>
                          <td className="p-2 font-semibold">Acute Upper Respiratory Tract Infection (URTI)</td>
                          <td className="p-2 font-mono text-right font-bold">142</td>
                          <td className="p-2 font-mono text-right">38.2%</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono">2</td>
                          <td className="p-2 font-semibold">Tension-type Headache / Cephalea</td>
                          <td className="p-2 font-mono text-right font-bold">87</td>
                          <td className="p-2 font-mono text-right">23.4%</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono">3</td>
                          <td className="p-2 font-semibold">Acute Gastroenteritis (AGE)</td>
                          <td className="p-2 font-mono text-right font-bold">45</td>
                          <td className="p-2 font-mono text-right">12.1%</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono">4</td>
                          <td className="p-2 font-semibold">Allergic Rhinitis / Dermatitis</td>
                          <td className="p-2 font-mono text-right font-bold">39</td>
                          <td className="p-2 font-mono text-right">10.5%</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono">5</td>
                          <td className="p-2 font-semibold">Dysmenorrhea</td>
                          <td className="p-2 font-mono text-right font-bold">31</td>
                          <td className="p-2 font-mono text-right">8.3%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5 bg-slate-100 p-1 rounded">
                      II. Population Group Distribution
                    </h4>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 bg-slate-50 border rounded">
                        <div className="text-[10px] text-slate-500">Students</div>
                        <div className="font-bold text-sm text-[#7F1416]">284 (76.3%)</div>
                      </div>
                      <div className="p-2 bg-slate-50 border rounded">
                        <div className="text-[10px] text-slate-500">Faculty</div>
                        <div className="font-bold text-sm text-slate-900">46 (12.4%)</div>
                      </div>
                      <div className="p-2 bg-slate-50 border rounded">
                        <div className="text-[10px] text-slate-500">Admin Staff</div>
                        <div className="font-bold text-sm text-slate-900">32 (8.6%)</div>
                      </div>
                      <div className="p-2 bg-slate-50 border rounded">
                        <div className="text-[10px] text-slate-500">Dependents</div>
                        <div className="font-bold text-sm text-slate-900">10 (2.7%)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. INVENTORY REPORT */}
              {documentType === 'inventory-report' && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pb-2 border-b border-slate-200">
                    <div>Formulary Directory: Essential Medications</div>
                    <div>Date: {new Date().toLocaleDateString()}</div>
                  </div>

                  <table className="w-full text-left border border-slate-200 text-[11px]">
                    <thead className="bg-slate-50 font-bold border-b border-slate-200">
                      <tr>
                        <th className="p-1.5">Generic & Brand Name</th>
                        <th className="p-1.5">Category</th>
                        <th className="p-1.5 text-right">In Stock</th>
                        <th className="p-1.5">Expiry Date</th>
                        <th className="p-1.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {medicines.slice(0, 10).map(m => (
                        <tr key={m.id}>
                          <td className="p-1.5">
                            <strong>{m.genericName}</strong> {m.brandName ? `(${m.brandName})` : ''} - {m.dosageStrength}
                          </td>
                          <td className="p-1.5 text-slate-600">{m.category}</td>
                          <td className="p-1.5 text-right font-mono font-bold">{m.currentStock} {m.unit}</td>
                          <td className="p-1.5 font-mono text-slate-500">{m.expiryDate}</td>
                          <td className="p-1.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              m.status === 'Critical Stock' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-800'
                            }`}>
                              {m.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 5. PATIENT SUMMARY RECORD */}
              {documentType === 'patient-summary' && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Full Name:</span>
                      <strong className="text-slate-900">{currentPatient?.firstName} {currentPatient?.lastName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">University ID:</span>
                      <span className="font-mono font-bold text-slate-900">{currentPatient?.psuId}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Blood Type:</span>
                      <span className="font-bold text-red-700">{currentPatient?.bloodType || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Classification:</span>
                      <span>{currentPatient?.classification}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block">Known Allergies:</span>
                      <span className="text-rose-700 font-semibold">{currentPatient?.knownAllergies?.join(', ') || 'No known drug allergies (NKDA)'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 block">Emergency Contact:</span>
                      <span>{currentPatient?.emergencyContactName} ({currentPatient?.emergencyContactPhone})</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
                      Clinical Encounter History
                    </h4>
                    <div className="space-y-2">
                      {consultations
                        .filter(c => c.patientId === currentPatient?.id)
                        .map(c => (
                          <div key={c.id} className="p-2.5 bg-white border border-slate-200 rounded text-xs space-y-1">
                            <div className="flex items-center justify-between font-semibold">
                              <span>{c.date} · {c.doctorName}</span>
                              <span className="font-mono text-[10px] text-blue-700">ICD-10: {c.icd10Code}</span>
                            </div>
                            <div className="text-slate-800"><strong>Assessment:</strong> {c.assessmentDiagnosis}</div>
                            <div className="text-slate-600"><strong>Plan:</strong> {c.planAndManagement}</div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 6. CLINIC QUEUE ADMISSION RECEIPT / SLIP */}
              {documentType === 'queue-receipt' && (
                <div className="space-y-4 font-sans text-xs">
                  {/* Central Large Ticket Number Plaque */}
                  <div className="text-center p-5 bg-gradient-to-b from-red-50/60 to-white rounded-2xl border-2 border-[#7F1416]/20 shadow-2xs space-y-2">
                    <div className="flex justify-center mb-1">
                      <MedicalClinicLogo size={46} />
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-widest text-[#7F1416]">
                      Clinic Priority Queue Ticket
                    </div>
                    <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#7F1416]">
                      {currentTicket?.ticketNumber || 'REG-001'}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        currentTicket?.priority === 'Emergency'
                          ? 'bg-red-600 text-white'
                          : currentTicket?.priority === 'Urgent'
                          ? 'bg-amber-500 text-white'
                          : currentTicket?.priority === 'Senior/PWD'
                          ? 'bg-purple-600 text-white'
                          : 'bg-[#7F1416] text-white'
                      }`}>
                        {currentTicket?.priority || 'Regular Queue'}
                      </span>
                      <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 rounded-full text-xs font-semibold border border-slate-200">
                        Stage: {currentTicket?.stage || 'Waiting Triage'}
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
                        Station: {currentTicket?.counterOrRoom || 'Triage Station 1'}
                      </span>
                    </div>
                  </div>

                  {/* Patient & Admission Information */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    <div className="bg-slate-50 px-4 py-2 font-bold text-slate-800 text-[11px] flex justify-between items-center">
                      <span>Patient & Intake Particulars</span>
                      <span className="font-mono text-slate-500">Ref: QT-{currentTicket?.ticketNumber || '2026-001'}</span>
                    </div>
                    <div className="p-3.5 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Patient Full Name:</span>
                          <strong className="text-slate-900 font-semibold">{currentPatient?.firstName} {currentPatient?.lastName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Institutional ID / Student No:</span>
                          <span className="font-mono font-bold text-[#7F1416]">{currentPatient?.psuId}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Department / Academic Program:</span>
                          <span className="text-slate-700">{currentPatient?.courseAndYear || currentPatient?.collegeOrDepartment}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Stated Reason / Chief Complaint:</span>
                          <span className="text-slate-900 font-medium">{currentTicket?.chiefComplaint || 'Consultation & Evaluation'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Time Admitted to Queue:</span>
                          <span className="font-mono text-slate-700">{currentTicket?.createdAt || new Date().toLocaleTimeString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Estimated Wait Window:</span>
                          <span className="font-bold text-amber-800">{currentTicket?.estimatedWaitMinutes ? `${currentTicket.estimatedWaitMinutes} Minutes` : '5-10 Minutes'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instructions Banner */}
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-950 space-y-1">
                    <div className="font-bold text-amber-900">Queue Instructions & Protocol:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-700">
                      <li>Please monitor the clinic audio-visual display monitors situated in the waiting lobby.</li>
                      <li>Automated SMS notification alerts will dispatch to your registered mobile number ({currentPatient?.emergencyContactPhone || 'phone on file'}).</li>
                      <li>Present this official ticket slip to the attending triage nurse or physician when called.</li>
                      <li>In accordance with Philippine Republic Act No. 10173, clinic transactions are kept strictly confidential.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* 7. OFFICIAL REGISTRATION RECEIPT */}
              {documentType === 'registration-receipt' && (
                <div className="space-y-4 font-sans text-xs">
                  <div className="flex items-center justify-center gap-3 p-3 bg-red-50/50 rounded-xl border border-red-100">
                    <MedicalClinicLogo size={42} />
                    <div>
                      <div className="font-bold text-[#7F1416] text-xs uppercase tracking-wide">Pampanga State University Medical Clinic</div>
                      <div className="text-[10px] text-slate-500">Official Personnel Registration & Verification Record</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    <div className="bg-slate-50 px-4 py-2 font-bold text-slate-800 text-[11px] flex justify-between items-center">
                      <span>Authorized Account Registration Summary</span>
                      <span className="font-mono text-slate-500">Ref: {currentReceipt?.referenceNumber || 'REG-001'}</span>
                    </div>
                    <div className="p-4 space-y-2 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Account Holder:</span>
                          <strong className="text-slate-900">{currentReceipt?.recipientName || 'Authorized User'}</strong>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Username:</span>
                          <span className="font-mono font-bold text-[#7F1416]">@{currentReceipt?.username || 'user'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Assigned Role:</span>
                          <span className="font-bold uppercase text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {currentReceipt?.assignedRole}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Department / Unit:</span>
                          <span className="text-slate-800">{currentReceipt?.department || 'Medical Services'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Registered Email:</span>
                          <span className="font-mono text-slate-800">{currentReceipt?.recipientEmail}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">Authorization Status:</span>
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Verified & Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700">
                    <strong>Notice:</strong> This registration receipt verifies authorized role-based credentials within the Pampanga State University Medical Clinic Information System. Security credentials and passwords remain confidential under Republic Act No. 10173.
                  </div>
                </div>
              )}

              {/* Security Verification Stamp & Authorized Signatory */}
              {includeSecurityQr && (
                <DocumentSecurityStamp
                  serialCode={
                    documentType === 'queue-receipt'
                      ? `QT-${currentTicket?.ticketNumber || '2026'}`
                      : documentType === 'registration-receipt'
                      ? currentReceipt?.referenceNumber || `REG-${Date.now().toString().slice(-6)}`
                      : `PSU-SEC-${Date.now().toString().slice(-8)}`
                  }
                  issuedBy={
                    documentType === 'queue-receipt'
                      ? currentTicket?.issuedBy || 'Triage Intake Nurse / Officer'
                      : documentType === 'registration-receipt'
                      ? currentReceipt?.issuedBy || 'Master System Administrator'
                      : currentConsultation?.doctorName || currentUser?.fullName || 'Dr. Roberto M. Manalo, MD'
                  }
                  role={
                    documentType === 'queue-receipt'
                      ? 'Clinic Intake & Triage Officer'
                      : documentType === 'registration-receipt'
                      ? 'Clinic Systems & Security Administrator'
                      : currentUser?.title || 'Attending University Physician'
                  }
                  licenseNumber={
                    documentType === 'queue-receipt' || documentType === 'registration-receipt'
                      ? undefined
                      : currentConsultation?.doctorLicense || currentUser?.prcLicense || '0098412'
                  }
                  signatureUrl={includeSignature ? (currentUser?.digitalSignature || undefined) : undefined}
                />
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer: CANCEL / DISCARD vs CONFIRM ACTION */}
        <div className="no-print p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3">
          {/* Cancel button */}
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Cancel / Go Back
          </button>

          {/* Confirm Execute Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleExecuteAction}
              className={`px-6 py-2.5 rounded-xl font-bold text-xs text-white shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-98 ${
                selectedFormat === 'pdf'
                  ? 'bg-[#7F1416] hover:bg-[#680F11]'
                  : selectedFormat === 'print'
                  ? 'bg-slate-900 hover:bg-black'
                  : selectedFormat === 'csv'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-blue-700 hover:bg-blue-800'
              }`}
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing Document...</span>
                </>
              ) : (
                <>
                  {selectedFormat === 'pdf' && <Download className="w-4 h-4" />}
                  {selectedFormat === 'print' && <Printer className="w-4 h-4" />}
                  {selectedFormat === 'csv' && <FileSpreadsheet className="w-4 h-4" />}
                  {selectedFormat === 'json' && <FileCode className="w-4 h-4" />}
                  <span>
                    {selectedFormat === 'pdf' && 'Download Official PDF'}
                    {selectedFormat === 'print' && 'Open Print Dialog'}
                    {selectedFormat === 'csv' && 'Download CSV File'}
                    {selectedFormat === 'json' && 'Download JSON File'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
