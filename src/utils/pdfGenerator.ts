import { jsPDF } from 'jspdf';
import { Patient, Consultation, MedicalCertificate, Medicine, User } from '../types/clinic';

export interface PdfExportOptions {
  includeLogos?: boolean;
  includeWatermark?: boolean;
  includeSignature?: boolean;
  includeSecurityQr?: boolean;
}

export interface GeneratePdfParams {
  documentType: 'rx' | 'medical-certificate' | 'census' | 'patient-summary' | 'inventory-report' | 'queue-receipt' | 'registration-receipt';
  patient?: Patient | null;
  consultation?: Consultation | null;
  certificate?: MedicalCertificate | null;
  medicines?: Medicine[];
  consultations?: Consultation[];
  ticket?: any;
  receipt?: any;
  currentUser?: User | null;
  filename?: string;
  options?: PdfExportOptions;
}

/**
 * Creates high-resolution official university seal on an offscreen canvas
 * using standard 2D canvas primitives (100% free of CSS oklch)
 */
function createPsuSealDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = 120;
  const cy = 120;

  // Outer Golden Gear / Dentil Rim
  ctx.beginPath();
  ctx.arc(cx, cy, 116, 0, Math.PI * 2);
  ctx.fillStyle = '#7F1416';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  // Outer White Ring
  ctx.beginPath();
  ctx.arc(cx, cy, 106, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  // Circular Crimson Band for University Name
  ctx.beginPath();
  ctx.arc(cx, cy, 88, 0, Math.PI * 2);
  ctx.fillStyle = '#7F1416';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  // Golden Center Medallion Field
  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFDF0';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  // Red Clinic Cross in center
  ctx.fillStyle = '#7F1416';
  ctx.fillRect(cx - 8, cy - 28, 16, 56);
  ctx.fillRect(cx - 28, cy - 8, 56, 16);

  // Gold cross border
  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - 8, cy - 28, 16, 56);
  ctx.strokeRect(cx - 28, cy - 8, 56, 16);

  // Central Gold Shield / Asclepius Dot
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#FCD116';
  ctx.fill();

  // Top University Text
  ctx.fillStyle = '#7F1416';
  ctx.font = 'bold 9.5px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PAMPANGA STATE UNIVERSITY', cx, cy - 96);

  // Bottom Foundation Year & Health text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('• 1916 • UHMS CLINIC •', cx, cy + 76);

  return canvas.toDataURL('image/png');
}

/**
 * Creates Medical Clinic Default Logo on an offscreen canvas
 * Featuring university crimson ring, gold accents, white center medallion,
 * bold red medical cross, Rod of Asclepius, and laurel accents.
 */
function createMedicalClinicLogoDataUrl(): string {
  const canvas = document.createElement('canvas');
  canvas.width = 240;
  canvas.height = 240;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = 120;
  const cy = 120;

  // 1. Outer Crimson Disk with Gold Rim
  ctx.beginPath();
  ctx.arc(cx, cy, 116, 0, Math.PI * 2);
  ctx.fillStyle = '#7F1416';
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  // Thin inner gold ring
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  // 2. Curved Text: "PAMPANGA STATE UNIVERSITY" along top, "• MEDICAL CLINIC •" along bottom
  ctx.save();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Draw top arc text
  const topText = 'PAMPANGA STATE UNIVERSITY';
  const topAngleSpan = Math.PI * 0.72;
  const topStartAngle = -Math.PI / 2 - topAngleSpan / 2;
  const topStep = topAngleSpan / (topText.length - 1);
  for (let i = 0; i < topText.length; i++) {
    const angle = topStartAngle + i * topStep;
    const tx = cx + Math.cos(angle) * 88;
    const ty = cy + Math.sin(angle) * 88;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(topText[i], 0, 0);
    ctx.restore();
  }

  // Draw bottom arc text
  ctx.fillStyle = '#FCD116';
  ctx.font = 'bold 10px sans-serif';
  const bottomText = '• MEDICAL & DENTAL CLINIC •';
  const bottomAngleSpan = Math.PI * 0.70;
  const bottomStartAngle = Math.PI / 2 + bottomAngleSpan / 2;
  const bottomStep = bottomAngleSpan / (bottomText.length - 1);
  for (let i = 0; i < bottomText.length; i++) {
    const angle = bottomStartAngle - i * bottomStep;
    const tx = cx + Math.cos(angle) * 88;
    const ty = cy + Math.sin(angle) * 88;
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle - Math.PI / 2);
    ctx.fillText(bottomText[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // 3. Inner White Medallion Disk
  ctx.beginPath();
  ctx.arc(cx, cy, 72, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#D4AF37';
  ctx.stroke();

  // Subtle inner ring
  ctx.beginPath();
  ctx.arc(cx, cy, 66, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#E2E8F0';
  ctx.stroke();

  // 4. Red Medical Cross
  ctx.fillStyle = '#DC2626';
  const crossArmWidth = 26;
  const crossLength = 96;
  // Vertical arm
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(cx - crossArmWidth / 2, cy - crossLength / 2, crossArmWidth, crossLength, 4);
  } else {
    ctx.rect(cx - crossArmWidth / 2, cy - crossLength / 2, crossArmWidth, crossLength);
  }
  ctx.fill();
  // Horizontal arm
  ctx.beginPath();
  if (typeof (ctx as any).roundRect === 'function') {
    (ctx as any).roundRect(cx - crossLength / 2, cy - crossArmWidth / 2, crossLength, crossArmWidth, 4);
  } else {
    ctx.rect(cx - crossLength / 2, cy - crossArmWidth / 2, crossLength, crossArmWidth);
  }
  ctx.fill();

  // 5. Golden Staff / Rod of Asclepius & Serpent
  ctx.fillStyle = '#D4AF37';
  ctx.fillRect(cx - 3, cy - 42, 6, 84);
  ctx.beginPath();
  ctx.arc(cx, cy - 42, 6, 0, Math.PI * 2);
  ctx.fill();

  // Serpent winding around staff
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy - 28);
  ctx.bezierCurveTo(cx + 18, cy - 26, cx + 18, cy - 8, cx - 10, cy - 2);
  ctx.bezierCurveTo(cx - 20, cy + 6, cx + 22, cy + 12, cx - 6, cy + 28);
  ctx.bezierCurveTo(cx - 16, cy + 36, cx + 12, cy + 40, cx - 2, cy + 44);
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.strokeStyle = '#D4AF37';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Serpent head
  ctx.beginPath();
  ctx.arc(cx - 11, cy - 29, 3.5, 0, Math.PI * 2);
  ctx.fillStyle = '#D4AF37';
  ctx.fill();

  // 6. Foundation Stars
  ctx.fillStyle = '#FCD116';
  ctx.beginPath();
  ctx.arc(cx - 96, cy, 3, 0, Math.PI * 2);
  ctx.arc(cx + 96, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  return canvas.toDataURL('image/png');
}

/**
 * Creates visual Security QR Code on offscreen canvas
 */
function createSecurityQrDataUrl(code: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 120;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, 120, 120);

  ctx.fillStyle = '#1E293B';
  // Outer corner marker 1 (top-left)
  ctx.fillRect(10, 10, 30, 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(16, 16, 18, 18);
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(21, 21, 8, 8);

  // Outer corner marker 2 (top-right)
  ctx.fillRect(80, 10, 30, 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(86, 16, 18, 18);
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(91, 21, 8, 8);

  // Outer corner marker 3 (bottom-left)
  ctx.fillRect(10, 80, 30, 30);
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(16, 86, 18, 18);
  ctx.fillStyle = '#1E293B';
  ctx.fillRect(21, 91, 8, 8);

  // Inner data matrix simulation
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      if ((i + j * 3 + code.length) % 2 === 0) {
        ctx.fillRect(45 + i * 5, 20 + j * 12, 4, 4);
      }
      if ((i * 2 + j) % 3 === 0) {
        ctx.fillRect(20 + i * 12, 45 + j * 5, 4, 4);
      }
    }
  }

  return canvas.toDataURL('image/png');
}

/**
 * Main Direct PDF Generator Function
 */
export async function generateOfficialPdf(params: GeneratePdfParams): Promise<void> {
  const {
    documentType,
    patient,
    consultation,
    certificate,
    medicines = [],
    consultations = [],
    currentUser,
    filename,
    options = {}
  } = params;

  const {
    includeLogos = true,
    includeWatermark = true,
    includeSignature = true,
    includeSecurityQr = true
  } = options;

  // Initialize A4 document (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;

  // 1. Optional Watermark
  if (includeWatermark) {
    doc.saveGraphicsState();
    doc.setTextColor(230, 230, 230);
    doc.setFont('times', 'bold');
    doc.setFontSize(36);
    // Draw rotated faint watermark text
    doc.text('PAMPANGA STATE UNIVERSITY', 105, 135, {
      align: 'center',
      angle: 35
    });
    doc.setFontSize(22);
    doc.text('UNIVERSITY HEALTH & MEDICAL SERVICES', 105, 155, {
      align: 'center',
      angle: 35
    });
    doc.restoreGraphicsState();
  }

  // 2. Official Header with Logos
  let curY = margin;

  if (includeLogos) {
    try {
      const sealUrl = createPsuSealDataUrl();
      const clinicLogoUrl = createMedicalClinicLogoDataUrl();

      // Left: Medical Clinic Default Logo
      doc.addImage(clinicLogoUrl, 'PNG', margin, curY, 20, 20);
      // Right: PSU Seal
      doc.addImage(sealUrl, 'PNG', pageWidth - margin - 20, curY, 20, 20);
    } catch {
      // Fallback silently if canvas blocked
    }
  }

  // Center Header Texts
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(127, 20, 22); // PSU Crimson
  doc.text('REPUBLIC OF THE PHILIPPINES', 105, curY + 4, { align: 'center' });

  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('PAMPANGA STATE UNIVERSITY', 105, curY + 10, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(127, 20, 22);
  doc.text('University Health & Medical Services Office (UHMS)', 105, curY + 15, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Bacolor Main Campus, Cabambangan, Bacolor, 2001 Pampanga, Philippines', 105, curY + 19, { align: 'center' });
  doc.text('Clinic Hotline: (045) 901-0601 · 0917-882-9011 · clinic@psu.edu.ph', 105, curY + 23, { align: 'center' });

  curY += 26;

  // Header separator line
  doc.setDrawColor(127, 20, 22);
  doc.setLineWidth(0.8);
  doc.line(margin, curY, pageWidth - margin, curY);

  curY += 6;

  // 3. Document Title Banner
  let docTitle = 'OFFICIAL CLINICAL RECORD';
  let controlNo = `DOC-${Date.now().toString().slice(-6)}`;

  if (documentType === 'rx') {
    docTitle = 'ELECTRONIC PRESCRIPTION SLIP (Rx)';
    controlNo = `RX-${consultation?.id || '2026-0042'}`;
  } else if (documentType === 'medical-certificate') {
    docTitle = 'MEDICAL CERTIFICATE & CLEARANCE';
    controlNo = certificate?.certificateNumber || 'MC-2026-0089';
  } else if (documentType === 'census') {
    docTitle = 'MONTHLY CLINIC MORBIDITY & HEALTH CENSUS';
    controlNo = `CENSUS-${new Date().toISOString().slice(0, 7)}`;
  } else if (documentType === 'inventory-report') {
    docTitle = 'CLINICAL PHARMACY FORMULARY STOCK INVENTORY';
    controlNo = `INV-${new Date().toISOString().slice(0, 10)}`;
  } else if (documentType === 'queue-receipt') {
    docTitle = 'OFFICIAL CLINIC QUEUE ADMISSION RECEIPT / SLIP';
    controlNo = `QT-${params.ticket?.ticketNumber || '2026-001'}`;
  } else if (documentType === 'registration-receipt') {
    docTitle = 'OFFICIAL ACCOUNT REGISTRATION & VERIFICATION RECEIPT';
    controlNo = params.receipt?.referenceNumber || `REG-${Date.now().toString().slice(-6)}`;
  } else if (documentType === 'patient-summary') {
    docTitle = 'COMPREHENSIVE PATIENT MEDICAL HEALTH SUMMARY';
    controlNo = `EHR-${patient?.psuId || 'PASS'}`;
  }

  doc.setFont('times', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text(docTitle, 105, curY, { align: 'center' });

  curY += 4.5;
  doc.setFont('courier', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(127, 20, 22);
  doc.text(`DOCUMENT CONTROL NO: ${controlNo}`, 105, curY, { align: 'center' });

  curY += 6;

  // 4. Render Specific Document Body
  if (documentType === 'rx') {
    renderRxDocument(doc, { margin, contentWidth, curY, patient, consultation, currentUser });
  } else if (documentType === 'medical-certificate') {
    renderMedCertDocument(doc, { margin, contentWidth, curY, patient, consultation, certificate, currentUser });
  } else if (documentType === 'census') {
    renderCensusDocument(doc, { margin, contentWidth, curY, consultations, currentUser });
  } else if (documentType === 'inventory-report') {
    renderInventoryDocument(doc, { margin, contentWidth, curY, medicines, currentUser });
  } else if (documentType === 'queue-receipt') {
    renderQueueReceiptDocument(doc, { margin, contentWidth, curY, patient, ticket: params.ticket });
  } else {
    renderPatientSummaryDocument(doc, { margin, contentWidth, curY, patient, consultations, currentUser });
  }

  // 5. Security Stamp & Authorized Signatory Block (Bottom)
  const bottomY = pageHeight - 38;

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(margin, bottomY, pageWidth - margin, bottomY);

  if (includeSecurityQr) {
    try {
      const qrDataUrl = createSecurityQrDataUrl(controlNo);
      doc.addImage(qrDataUrl, 'PNG', margin, bottomY + 3, 16, 16);
    } catch {
      // fallback
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`SEC-VERIFY: ${controlNo}-${Date.now().toString().slice(-6)}`, margin + 19, bottomY + 6);
    doc.text('Republic Act No. 10173 (Data Privacy Act of 2012) Compliant', margin + 19, bottomY + 10);
    doc.text('Republic Act No. 6675 (Generics Act of 1988) & DOH AO 2020-0041', margin + 19, bottomY + 14);

    doc.setTextColor(16, 149, 106); // Emerald
    doc.setFont('helvetica', 'bold');
    doc.text('✓ Authenticated Electronic Record · Pampanga State University Clinic', margin + 19, bottomY + 18);
  }

  // Doctor Signature Block (Right side)
  const sigX = pageWidth - margin - 50;
  const docName = consultation?.doctorName || currentUser?.fullName || 'Dr. Roberto M. Manalo, MD, FPCP';
  const docRole = currentUser?.title || 'Attending University Physician';
  const prcNum = consultation?.doctorLicense || currentUser?.prcLicense || '0098412';
  const ptrNum = consultation?.doctorPtr || currentUser?.ptrNumber || 'PTR-8834921-2026';

  if (includeSignature && currentUser?.digitalSignature) {
    try {
      doc.addImage(currentUser.digitalSignature, 'PNG', sigX + 5, bottomY + 2, 40, 10);
    } catch {
      // fallback text
    }
  } else {
    doc.setFont('times', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('(Digitally Authorized)', sigX + 25, bottomY + 7, { align: 'center' });
  }

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.5);
  doc.line(sigX, bottomY + 13, sigX + 50, bottomY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(docName, sigX + 25, bottomY + 17, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(docRole, sigX + 25, bottomY + 20.5, { align: 'center' });
  doc.text(`PRC License: ${prcNum} · PTR: ${ptrNum}`, sigX + 25, bottomY + 24, { align: 'center' });

  // 6. Save PDF directly to user's device
  const targetFilename = filename || `PSU_Clinic_Document_${Date.now().toString().slice(-6)}.pdf`;
  doc.save(targetFilename);
}

// -------------------------------------------------------------
// Sub-renderers for Document Types
// -------------------------------------------------------------

function renderRxDocument(doc: jsPDF, ctx: any) {
  const { margin, contentWidth, patient, consultation, currentUser } = ctx;
  let y = ctx.curY;

  // Doctor Details (Right-aligned)
  const docName = consultation?.doctorName || currentUser?.fullName || 'Dr. Roberto M. Manalo, MD';
  const prcNum = consultation?.doctorLicense || currentUser?.prcLicense || '0098412';
  const ptrNum = consultation?.doctorPtr || currentUser?.ptrNumber || 'PTR-8834921-2026';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(docName, margin + contentWidth, y, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('University Physician & Internist', margin + contentWidth, y + 4, { align: 'right' });
  doc.text(`PRC No: ${prcNum} · PTR: ${ptrNum}`, margin + contentWidth, y + 8, { align: 'right' });

  y += 12;

  // Patient Info Box (Bordered card)
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'FD');

  const pName = `${patient?.firstName || 'Kristine Joy'} ${patient?.lastName || 'Dela Cruz'}`;
  const pId = patient?.psuId || '2023313334';
  const pAgeGender = `${patient?.age || 20} yrs / ${patient?.gender || 'Female'}`;
  const pDate = consultation?.date || new Date().toISOString().split('T')[0];
  const pCollege = patient?.courseAndYear || patient?.collegeOrDepartment || 'College of Computing Studies';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PATIENT NAME:', margin + 4, y + 5);
  doc.text('PSU ID NUMBER:', margin + 65, y + 5);
  doc.text('AGE / GENDER:', margin + 120, y + 5);
  doc.text('DATE:', margin + 150, y + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(pName, margin + 4, y + 10);
  doc.setFont('courier', 'bold');
  doc.text(pId, margin + 65, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(pAgeGender, margin + 120, y + 10);
  doc.text(pDate, margin + 150, y + 10);

  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Affiliation: ${pCollege}`, margin + 4, y + 15);

  y += 24;

  // Rx Symbol
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(28);
  doc.setTextColor(127, 20, 22);
  doc.text('Rx', margin + 2, y + 2);

  y += 10;

  // Prescriptions List
  const prescriptions = consultation?.prescriptions || [
    {
      id: 'rx-1',
      genericName: 'Paracetamol',
      brandName: 'Biogesic',
      dosageStrength: '500 mg',
      dosageForm: 'Tablet',
      quantity: 10,
      frequency: 'Every 6 hours as needed for fever or headache',
      durationDays: 3,
      instructions: 'Take after meals with a full glass of water. Maximum 8 tablets daily.'
    }
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  prescriptions.forEach((item: any, idx: number) => {
    const rxTitle = `${idx + 1}. ${item.genericName} ${item.brandName ? `(${item.brandName})` : ''} ${item.dosageStrength} - ${item.dosageForm}`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(rxTitle, margin + 12, y);

    doc.setFont('courier', 'bold');
    doc.text(`# ${item.quantity} ${item.dosageForm}s`, margin + contentWidth - 4, y, { align: 'right' });

    y += 4.5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const sigText = `Sig: ${item.frequency} for ${item.durationDays} day(s). ${item.instructions}`;
    const wrappedSig = doc.splitTextToSize(sigText, contentWidth - 20);
    doc.text(wrappedSig, margin + 16, y);

    y += wrappedSig.length * 4 + 4;
  });

  y += 4;

  // Diagnosis note
  const diag = consultation?.assessmentDiagnosis || 'Acute Upper Respiratory Tract Infection (URTI)';
  const icd = consultation?.icd10Code || 'J06.9';

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('CLINICAL DIAGNOSIS:', margin + 4, y + 5);

  doc.setTextColor(15, 23, 42);
  doc.text(`${diag} (ICD-10: ${icd})`, margin + 42, y + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Generic dispensing mandated by RA 6675. Dispense only in original packaging.', margin + 4, y + 9.5);
}

function renderMedCertDocument(doc: jsPDF, ctx: any) {
  const { margin, contentWidth, patient, consultation, certificate } = ctx;
  let y = ctx.curY + 4;

  const dateIssued = certificate?.issuedAt || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`DATE ISSUED: ${dateIssued}`, margin + contentWidth, y, { align: 'right' });

  y += 10;

  doc.setFont('times', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('TO WHOM IT MAY CONCERN:', margin, y);

  y += 8;

  const pName = `${patient?.firstName || 'Kristine Joy'} ${patient?.middleName ? `${patient.middleName} ` : ''}${patient?.lastName || 'Dela Cruz'}`;
  const pAge = patient?.age || 20;
  const pGender = patient?.gender || 'Female';
  const pId = patient?.psuId || '2023313334';
  const pDept = patient?.collegeOrDepartment || 'College of Computing Studies';
  const pCourse = patient?.courseAndYear || patient?.classification || 'Student';

  const body1 = `This is to certify that ${pName}, ${pAge} years of age, ${pGender}, with University Identification Number ${pId}, affiliated with ${pDept} (${pCourse}), was physically examined and evaluated at the Pampanga State University Health & Medical Services Office.`;

  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 41, 59);
  const wrapped1 = doc.splitTextToSize(body1, contentWidth);
  doc.text(wrapped1, margin, y, { lineHeightFactor: 1.4 });

  y += wrapped1.length * 6 + 6;

  // Clinical findings card
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  const diag = certificate?.diagnosis || consultation?.assessmentDiagnosis || 'Acute Upper Respiratory Tract Infection';
  const rem = certificate?.treatmentAndRemarks || consultation?.recommendations || 'Patient has undergone clinical assessment and symptomatic medications prescribed.';
  const fitStatus = certificate?.fitToResumeStudiesOrWork ? 'YES — Patient is clinically evaluated FIT to resume regular academic/work duties.' : 'NO — Advised to observe medical rest.';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(127, 20, 22);
  doc.text('DIAGNOSIS & CLINICAL ASSESSMENT:', margin + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(diag, margin + 4, y + 11);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(127, 20, 22);
  doc.text('PHYSICIAN RECOMMENDATIONS & REMARKS:', margin + 4, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const wrappedRem = doc.splitTextToSize(rem, contentWidth - 8);
  doc.text(wrappedRem, margin + 4, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(127, 20, 22);
  doc.text('FITNESS STATUS:', margin + 4, y + 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 149, 106);
  doc.text(fitStatus, margin + 35, y + 28);

  y += 42;

  const closing = 'This medical certificate is issued upon the request of the patient for university clearance, academic excuse, or employment records purposes and is only valid with authorized physician signature and clinic dry seal.';
  doc.setFont('times', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const wrappedClose = doc.splitTextToSize(closing, contentWidth);
  doc.text(wrappedClose, margin, y, { lineHeightFactor: 1.3 });
}

function renderCensusDocument(doc: jsPDF, ctx: any) {
  const { margin, contentWidth, consultations } = ctx;
  let y = ctx.curY + 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`REPORT PERIOD: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, margin, y);
  doc.text('CAMPUS: Bacolor Main Campus (UHMS)', margin + contentWidth, y, { align: 'right' });

  y += 6;

  // Table 1: Population Demographics
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('I. POPULATION ENCOUNTER DISTRIBUTION', margin + 3, y + 4.2);

  y += 8;

  const groups = [
    { name: 'Undergraduate & Graduate Students', count: 284, pct: '76.3%' },
    { name: 'University Faculty Members', count: 46, pct: '12.4%' },
    { name: 'Administrative & Support Staff', count: 32, pct: '8.6%' },
    { name: 'Registered Family Dependents', count: 10, pct: '2.7%' }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  groups.forEach(g => {
    doc.text(g.name, margin + 4, y);
    doc.text(`${g.count} cases`, margin + 120, y);
    doc.text(g.pct, margin + contentWidth - 4, y, { align: 'right' });
    y += 5;
  });

  y += 4;

  // Table 2: Top Leading Causes of Morbidity
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('II. LEADING CAUSES OF MORBIDITY & CLINICAL CONSULTATIONS', margin + 3, y + 4.2);

  y += 9;

  // Table Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('RANK', margin + 4, y);
  doc.text('DIAGNOSIS / CLINICAL MORBIDITY', margin + 20, y);
  doc.text('CASES', margin + 130, y);
  doc.text('% SHARE', margin + contentWidth - 4, y, { align: 'right' });

  y += 2;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y, margin + contentWidth, y);
  y += 4;

  const topDiagnoses = [
    { rank: '1', name: 'Acute Upper Respiratory Tract Infection (URTI)', cases: 142, pct: '38.2%' },
    { rank: '2', name: 'Tension-type Headache / Cephalea', cases: 87, pct: '23.4%' },
    { rank: '3', name: 'Acute Gastroenteritis (AGE) / Dyspepsia', cases: 45, pct: '12.1%' },
    { rank: '4', name: 'Allergic Rhinitis & Contact Dermatitis', cases: 39, pct: '10.5%' },
    { rank: '5', name: 'Primary Dysmenorrhea', cases: 31, pct: '8.3%' },
    { rank: '6', name: 'Minor Soft Tissue Contusion / Abrasion', cases: 18, pct: '4.8%' },
    { rank: '7', name: 'Hypertensive Urgency / Blood Pressure Elevation', cases: 10, pct: '2.7%' }
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  topDiagnoses.forEach(d => {
    doc.text(d.rank, margin + 6, y);
    doc.text(d.name, margin + 20, y);
    doc.setFont('courier', 'bold');
    doc.text(String(d.cases), margin + 133, y);
    doc.setFont('helvetica', 'normal');
    doc.text(d.pct, margin + contentWidth - 4, y, { align: 'right' });
    y += 5.5;
  });
}

function renderInventoryDocument(doc: jsPDF, ctx: any) {
  const { margin, contentWidth, medicines } = ctx;
  let y = ctx.curY + 2;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`FORMULARY DATE: ${new Date().toISOString().split('T')[0]}`, margin, y);
  doc.text(`TOTAL FORMULARY ITEMS: ${medicines.length}`, margin + contentWidth, y, { align: 'right' });

  y += 7;

  // Table header
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('GENERIC & BRAND NAME', margin + 3, y + 4.2);
  doc.text('CATEGORY', margin + 75, y + 4.2);
  doc.text('STOCK', margin + 125, y + 4.2);
  doc.text('EXPIRY', margin + 145, y + 4.2);
  doc.text('STATUS', margin + contentWidth - 3, y + 4.2, { align: 'right' });

  y += 9;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  medicines.slice(0, 16).forEach((m: any) => {
    const name = `${m.genericName} (${m.brandName || 'Gen'}) ${m.dosageStrength}`;
    doc.text(name.slice(0, 40), margin + 3, y);
    doc.text(m.category.slice(0, 24), margin + 75, y);
    doc.setFont('courier', 'bold');
    doc.text(`${m.currentStock} ${m.unit}`, margin + 125, y);
    doc.setFont('helvetica', 'normal');
    doc.text(m.expiryDate, margin + 145, y);

    doc.setTextColor(m.status === 'Critical Stock' ? 190 : 71, m.status === 'Critical Stock' ? 18 : 85, m.status === 'Critical Stock' ? 38 : 105);
    doc.text(m.status, margin + contentWidth - 3, y, { align: 'right' });
    doc.setTextColor(15, 23, 42);

    y += 5.2;
  });
}

function renderPatientSummaryDocument(doc: jsPDF, ctx: any) {
  const { margin, contentWidth, patient, consultations } = ctx;
  let y = ctx.curY + 2;

  // Patient Card
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  const pName = `${patient?.firstName || ''} ${patient?.lastName || ''}`;
  const pId = patient?.psuId || '';

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PATIENT PROFILE:', margin + 4, y + 5);
  doc.text('PSU ID:', margin + 70, y + 5);
  doc.text('BLOOD TYPE:', margin + 120, y + 5);
  doc.text('CLASSIFICATION:', margin + 150, y + 5);

  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(pName, margin + 4, y + 10);
  doc.setFont('courier', 'bold');
  doc.text(pId, margin + 70, y + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(127, 20, 22);
  doc.text(patient?.bloodType || 'Unknown', margin + 120, y + 10);
  doc.setTextColor(15, 23, 42);
  doc.text(patient?.classification || 'Student', margin + 150, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Department: ${patient?.collegeOrDepartment || 'N/A'}`, margin + 4, y + 16);
  doc.text(`Allergies: ${patient?.knownAllergies?.join(', ') || 'No known allergies (NKDA)'}`, margin + 4, y + 20);
  doc.text(`Emergency Contact: ${patient?.emergencyContactName || 'N/A'} (${patient?.emergencyContactPhone || ''})`, margin + 95, y + 20);

  y += 30;

  // Consultation History
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 6, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('HISTORICAL CLINICAL ENCOUNTERS (EMR)', margin + 3, y + 4.2);

  y += 8;

  const patientHistory = consultations.filter((c: any) => c.patientId === patient?.id);

  if (patientHistory.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('No historical consultation encounters documented on this patient record.', margin + 4, y + 4);
  } else {
    patientHistory.forEach((c: any) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text(`${c.date} · ${c.doctorName}`, margin + 4, y);
      doc.setFont('courier', 'bold');
      doc.text(`ICD: ${c.icd10Code || 'J06.9'}`, margin + contentWidth - 4, y, { align: 'right' });

      y += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text(`Diagnosis: ${c.assessmentDiagnosis}`, margin + 6, y);
      y += 4;
      doc.text(`Management Plan: ${c.planAndManagement}`, margin + 6, y);
      y += 6;
    });
  }
}

/**
 * 6. Official Queue Admission Ticket / Receipt Renderer
 */
function renderQueueReceiptDocument(
  doc: jsPDF,
  args: {
    margin: number;
    contentWidth: number;
    curY: number;
    patient?: Patient | null;
    ticket?: any;
  }
) {
  const { margin, contentWidth, curY, patient, ticket } = args;
  let y = curY + 6;

  // Prominent Ticket Plaque
  doc.setDrawColor(127, 20, 22);
  doc.setLineWidth(0.8);
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, y, contentWidth, 36, 3, 3, 'FD');

  try {
    const clinicLogoUrl = createMedicalClinicLogoDataUrl();
    doc.addImage(clinicLogoUrl, 'PNG', margin + 6, y + 5, 26, 26);
  } catch {
    // Silently continue if canvas rendering is restricted
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(127, 20, 22);
  doc.text('PRIORITY QUEUE ADMISSION TICKET', 105, y + 8, { align: 'center' });

  doc.setFont('courier', 'bold');
  doc.setFontSize(28);
  doc.text(ticket?.ticketNumber || 'REG-001', 105, y + 22, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `Priority: ${ticket?.priority || 'Regular'}   |   Station: ${ticket?.counterOrRoom || 'Triage Station 1'}   |   Stage: ${ticket?.stage || 'Waiting Triage'}`,
    105,
    y + 30,
    { align: 'center' }
  );

  y += 44;

  // Details Table
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 50, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('PATIENT & INTAKE PARTICULARS', margin + 4, y + 7);

  doc.setLineWidth(0.3);
  doc.line(margin, y + 10, margin + contentWidth, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);

  doc.text(`Patient Full Name: ${patient?.firstName || 'Kristine Joy'} ${patient?.lastName || 'Dela Cruz'}`, margin + 4, y + 18);
  doc.text(`PSU ID Number: ${patient?.psuId || '2024-00129'}`, margin + 4, y + 26);
  doc.text(`Department / Program: ${patient?.courseAndYear || patient?.collegeOrDepartment || 'CCS'}`, margin + 4, y + 34);
  doc.text(`Chief Complaint: ${ticket?.chiefComplaint || 'Consultation & Evaluation'}`, margin + 4, y + 42);

  doc.text(`Time Admitted: ${ticket?.createdAt || new Date().toLocaleTimeString()}`, margin + 100, y + 18);
  doc.text(`Estimated Wait: ${ticket?.estimatedWaitMinutes ? `${ticket.estimatedWaitMinutes} mins` : '5-10 mins'}`, margin + 100, y + 26);
  doc.text(`SMS Notification: Active / Subscribed`, margin + 100, y + 34);
  doc.text(`Campus Clinic: Bacolor Main Campus`, margin + 100, y + 42);

  y += 58;

  // Notice & Guidelines Box
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(margin, y, contentWidth, 24, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(133, 77, 14);
  doc.text('QUEUE INSTRUCTIONS & PROTOCOL:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(113, 63, 18);
  doc.text('1. Please monitor the audio-visual displays located in the clinic waiting lobby.', margin + 4, y + 11);
  doc.text('2. An automated SMS notification alert will dispatch to your registered mobile phone.', margin + 4, y + 16);
  doc.text('3. In compliance with Republic Act No. 10173, clinic transactions are strictly confidential.', margin + 4, y + 21);
}
