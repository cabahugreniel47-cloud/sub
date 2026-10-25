import React from 'react';
import psuOfficialLogo from '../../assets/images/psu_official_logo.jpg';

export const PSU_OFFICIAL_LOGO_URL = psuOfficialLogo;

/**
 * Official Pampanga State University (PSU) Seal Component
 * Displays the authentic, verified university seal with circular border and crisp fallback
 */
export const PsuUniversitySeal: React.FC<{ size?: number; className?: string }> = ({ size = 64, className = '' }) => {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      style={{ width: size, height: size }}
      className={`relative shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-white ring-1 ring-[#D4AF37] border border-[#7F1416]/30 shadow-xs ${className}`}
      title="Pampanga State University Official Seal"
    >
      {!hasError ? (
        <img
          src={psuOfficialLogo}
          alt="Pampanga State University Official Seal"
          className="w-full h-full object-contain rounded-full"
          loading="eager"
          onError={() => setHasError(true)}
        />
      ) : (
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer Gold Dentil / Gear Rim */}
          <circle cx="50" cy="50" r="48" fill="#7F1416" stroke="#D4AF37" strokeWidth="2.5" />
          <circle cx="50" cy="50" r="43" fill="#FFFFFF" stroke="#D4AF37" strokeWidth="1" />
          <circle cx="50" cy="50" r="34" fill="#7F1416" stroke="#D4AF37" strokeWidth="1.5" />
          {/* Center Gold Medallion */}
          <circle cx="50" cy="50" r="24" fill="#FFFDF0" stroke="#D4AF37" strokeWidth="1" />
          {/* Medical Red Cross */}
          <rect x="46" y="32" width="8" height="36" rx="2" fill="#7F1416" />
          <rect x="32" y="46" width="36" height="8" rx="2" fill="#7F1416" />
          {/* Gold Asclepius & Torch Accent */}
          <circle cx="50" cy="50" r="4" fill="#FCD116" />
          <circle cx="50" cy="38" r="2.5" fill="#FCD116" />
          <circle cx="50" cy="62" r="2.5" fill="#FCD116" />
          {/* Circular Text Impression */}
          <text x="50" y="24" textAnchor="middle" fontSize="4.2" fontWeight="900" fill="#7F1416" fontFamily="sans-serif">
            PAMPANGA STATE UNIVERSITY
          </text>
          <text x="50" y="80" textAnchor="middle" fontSize="4" fontWeight="800" fill="#7F1416" fontFamily="sans-serif">
            EST. 1916 · CLINIC
          </text>
        </svg>
      )}
    </div>
  );
};

/**
 * Official MCIS (Medical Clinic Information System) Emblem Component
 * Matches the official identity in the system architecture
 */
export const McisLogo: React.FC<{ size?: number; className?: string; showText?: boolean }> = ({
  size = 64,
  className = '',
  showText = true
}) => {
  return (
    <div className={`flex flex-col items-center shrink-0 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-xs"
      >
        {/* Red Medical Cross with rounded edges */}
        <path
          d="M36 6 C36 4.3 37.3 3 39 3 H61 C62.7 3 64 4.3 64 6 V36 H94 C95.7 36 97 37.3 97 39 V61 C97 62.7 95.7 64 94 64 H64 V94 C64 95.7 62.7 97 61 97 H39 C37.3 97 36 95.7 36 94 V64 H6 C4.3 64 3 62.7 3 61 V39 C3 37.3 4.3 36 6 36 H36 V6 Z"
          fill="#A31D1D"
        />

        {/* White inner inset / border lines for modern tech look */}
        <path
          d="M38 8 H62 V38 H92 V62 H62 V92 H38 V62 H8 V38 H38 V8 Z"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinejoin="round"
          opacity="0.9"
        />

        {/* Digital Circuit Nodes / Traces (Medical Informatics) */}
        {/* Left circuit */}
        <path d="M14 50 H28 L34 44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="14" cy="50" r="3" fill="#FFFFFF" />
        {/* Right circuit */}
        <path d="M86 50 H72 L66 56" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="86" cy="50" r="3" fill="#FFFFFF" />
        {/* Top circuit */}
        <path d="M50 14 V26" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="14" r="3" fill="#FFFFFF" />
        {/* Bottom circuit */}
        <path d="M50 86 V74" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="50" cy="86" r="3" fill="#FFFFFF" />

        {/* Central Rod of Asclepius in White */}
        <rect x="48.5" y="24" width="3" height="52" fill="#FFFFFF" rx="1.5" />
        <circle cx="50" cy="22" r="3.5" fill="#FFFFFF" />
        
        {/* Serpent entwining the rod */}
        <path
          d="M44 32 C54 30 56 38 46 42 C40 46 58 48 48 58 C42 64 54 66 48 72"
          stroke="#A31D1D"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M44 32 C54 30 56 38 46 42 C40 46 58 48 48 58 C42 64 54 66 48 72"
          stroke="#FFFFFF"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Serpent head */}
        <circle cx="43" cy="31" r="2.2" fill="#FFFFFF" />
      </svg>

      {showText && (
        <div className="text-center mt-1">
          <div className="font-black text-slate-900 tracking-wider text-sm leading-tight">
            MCIS
          </div>
          <div className="text-[7.5px] font-bold text-slate-600 tracking-widest uppercase leading-none">
            Medical Clinic
          </div>
          <div className="text-[7.5px] font-bold text-slate-600 tracking-widest uppercase leading-none mt-0.5">
            Information System
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Official Medical Clinic Default Logo Component
 * Uses the authentic MCIS Red Medical Cross emblem as selected by the user
 */
export const MedicalClinicLogo: React.FC<{ size?: number; className?: string; title?: string; showText?: boolean }> = ({
  size = 58,
  className = '',
  title = 'Pampanga State University Medical Clinic Official Logo',
  showText = false
}) => (
  <McisLogo size={size} className={className} showText={showText} />
);

export const MedicalClinicDefaultLogo = MedicalClinicLogo;

/**
 * Republic of the Philippines Coat of Arms / Official Emblem SVG
 */
export const PhilippineCoatOfArms: React.FC<{ size?: number; className?: string }> = ({ size = 56, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    {/* Shield Base */}
    <path
      d="M50 10 C68 10 82 12 82 32 C82 58 64 78 50 88 C36 78 18 58 18 32 C18 12 32 10 50 10 Z"
      fill="#FFFFFF"
      stroke="#D4AF37"
      strokeWidth="2"
    />
    
    {/* Blue Chief (Top) */}
    <path
      d="M21 32 C21 21 32 12 50 12 C68 12 79 21 79 32 L79 40 L21 40 Z"
      fill="#0038A8"
    />

    {/* Left (Red) / Right (Blue) split on lower shield */}
    <path
      d="M50 40 L50 85 C61 76 77 58 77 40 Z"
      fill="#CE1126"
    />
    <path
      d="M50 40 L50 85 C39 76 23 58 23 40 Z"
      fill="#FFFFFF"
    />

    {/* Sun with 8 rays in center chief */}
    <circle cx="50" cy="26" r="6" fill="#FCD116" />
    <path d="M50 16 L50 19 M50 33 L50 36 M40 26 L43 26 M57 26 L60 26" stroke="#FCD116" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M43 19 L45 21 M55 31 L57 33 M43 33 L45 31 M55 21 L57 19" stroke="#FCD116" strokeWidth="1.2" strokeLinecap="round" />

    {/* 3 Golden Stars */}
    <polygon points="32,20 33,23 36,23 33.5,25 34.5,28 32,26 29.5,28 30.5,25 28,23 31,23" fill="#FCD116" />
    <polygon points="68,20 69,23 72,23 69.5,25 70.5,28 68,26 65.5,28 66.5,25 64,23 67,23" fill="#FCD116" />
    <polygon points="50,34 51,36 53,36 51.5,37.5 52,39.5 50,38 48,39.5 48.5,37.5 47,36 49,36" fill="#FCD116" />

    {/* Scroll ribbon underneath */}
    <path
      d="M25 86 C35 84 65 84 75 86 L73 90 C65 88 35 88 27 90 Z"
      fill="#FCD116"
      stroke="#B8860B"
      strokeWidth="0.8"
    />
    <text x="50" y="89" textAnchor="middle" fontSize="3.8" fontWeight="bold" fill="#002466" fontFamily="sans-serif">
      REPUBLIKA NG PILIPINAS
    </text>
  </svg>
);

/**
 * Department of Health (DOH) Accredited Clinic Badge
 */
export const DohAccreditationBadge: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 80 80"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <circle cx="40" cy="40" r="38" fill="#FFFFFF" stroke="#007A33" strokeWidth="2" />
    <circle cx="40" cy="40" r="32" fill="#E8F5E9" />
    {/* Caduceus / Rod of Asclepius */}
    <rect x="38.5" y="16" width="3" height="48" fill="#D4AF37" rx="1.5" />
    <circle cx="40" cy="16" r="3" fill="#D4AF37" />
    {/* Serpent twisting */}
    <path
      d="M34 26 C44 26 44 34 36 38 C30 42 46 44 40 54 C36 60 42 62 40 64"
      stroke="#007A33"
      strokeWidth="2.5"
      strokeLinecap="round"
      fill="none"
    />
    {/* Red Cross */}
    <rect x="36" y="36" width="8" height="2" fill="#CE1126" />
    <rect x="39" y="33" width="2" height="8" fill="#CE1126" />
    <text x="40" y="72" textAnchor="middle" fontSize="5.5" fontWeight="bold" fill="#007A33" fontFamily="sans-serif">
      DOH-ACCREDITED
    </text>
  </svg>
);

/**
 * Official University Header Component for all Printable / PDF documents
 */
export const OfficialDocumentHeader: React.FC<{
  includeLogos?: boolean;
  documentTitle?: string;
  documentSubtitle?: string;
  controlNumber?: string;
}> = ({
  includeLogos = true,
  documentTitle,
  documentSubtitle,
  controlNumber
}) => {
  return (
    <div className="border-b-2 border-[#7F1416] pb-4 mb-4 select-text">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Medical Clinic Default Logo */}
        {includeLogos ? (
          <div className="flex items-center gap-2">
            <MedicalClinicLogo size={58} />
          </div>
        ) : <div className="w-12" />}

        {/* Center: University & Clinic Identity */}
        <div className="text-center flex-1 min-w-0">
          <div className="text-[10px] font-sans font-bold tracking-widest text-[#7F1416] uppercase leading-tight">
            Republic of the Philippines
          </div>
          <h1 className="text-base sm:text-lg font-serif font-black uppercase tracking-tight text-slate-900 leading-tight mt-0.5">
            Pampanga State University
          </h1>
          <h2 className="text-xs sm:text-sm font-sans font-bold text-[#7F1416] leading-tight">
            University Health & Medical Services Office (UHMS)
          </h2>
          <p className="text-[10px] font-sans text-slate-500 mt-0.5">
            Bacolor Main Campus, Cabambangan, Bacolor, 2001 Pampanga, Philippines
          </p>
          <p className="text-[9px] font-sans text-slate-400 font-mono">
            Direct Line: (045) 901-0601 · Clinic Hotline: 0917-882-9011 · clinic@psu.edu.ph
          </p>
        </div>

        {/* Right: PSU Official Seal & DOH accreditation */}
        {includeLogos ? (
          <div className="flex items-center gap-1.5">
            <PsuUniversitySeal size={58} />
          </div>
        ) : <div className="w-12" />}
      </div>

      {/* Document Title Banner if provided */}
      {documentTitle && (
        <div className="mt-4 pt-3 border-t border-slate-200 text-center">
          <h3 className="text-base sm:text-lg font-serif font-black uppercase tracking-wider text-slate-900 underline decoration-[#7F1416] decoration-2 underline-offset-4">
            {documentTitle}
          </h3>
          {documentSubtitle && (
            <p className="text-[11px] font-sans text-slate-600 mt-1">
              {documentSubtitle}
            </p>
          )}
          {controlNumber && (
            <div className="text-[10px] font-mono font-bold text-slate-500 mt-0.5">
              DOCUMENT CONTROL NO: <span className="text-[#7F1416] font-semibold">{controlNumber}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Security Verification QR and Barcode Component for Documents
 */
export const DocumentSecurityStamp: React.FC<{
  serialCode: string;
  issuedBy: string;
  role: string;
  licenseNumber?: string;
  signatureUrl?: string;
  timestamp?: string;
  compact?: boolean;
}> = ({
  serialCode,
  issuedBy,
  role,
  licenseNumber,
  signatureUrl,
  timestamp,
  compact = false
}) => {
  const dateFormatted = timestamp || new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className={`border-t border-slate-300 pt-3 mt-4 flex items-end justify-between gap-4 font-sans text-xs ${
      compact ? 'text-[10px]' : ''
    }`}>
      {/* Left: Security verification code & legal compliance notice */}
      <div className="flex items-center gap-3">
        {/* Visual QR Code Representation */}
        <div className="w-14 h-14 bg-white p-1 border border-slate-300 rounded shadow-2xs flex flex-col items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-full h-full text-slate-900 fill-current">
            <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm13-2h3v3h-3v-3zm0 5h3v3h-3v-3zm5-5h2v8h-2v-8zm-5-2h7v2h-7v-2zm-3 5h2v5h-2v-5zM6 6h2v2H6V6zm12 0h2v2h-2V6zM6 18h2v2H6v-2z" />
          </svg>
        </div>

        <div className="space-y-0.5 text-[9px] text-slate-500 leading-tight">
          <div className="font-mono font-bold text-slate-800">
            SEC-TOKEN: {serialCode}
          </div>
          <div>Republic Act No. 10173 (Data Privacy Act of 2012)</div>
          <div>Republic Act No. 6675 (Generics Act) & DOH AO 2020-0041</div>
          <div className="text-emerald-700 font-semibold">
            ✓ Digitally Authenticated & Recorded in PSU EMR System
          </div>
        </div>
      </div>

      {/* Right: Authorized Signatory Block with optional electronic signature */}
      <div className="text-center w-56 shrink-0">
        {signatureUrl ? (
          <div className="h-10 flex items-center justify-center mb-1">
            <img
              src={signatureUrl}
              alt="Digital Signature"
              className="max-h-10 max-w-full object-contain filter contrast-125"
            />
          </div>
        ) : (
          <div className="h-9 flex items-end justify-center pb-1 text-slate-400 italic text-[11px] font-serif">
            (Digitally Signed)
          </div>
        )}

        <div className="border-b-2 border-slate-900 pb-0.5 font-bold text-slate-900 text-xs truncate">
          {issuedBy}
        </div>
        <div className="text-[10px] text-slate-600 mt-0.5">{role}</div>
        {licenseNumber && (
          <div className="text-[9px] font-mono text-slate-500">
            PRC No. {licenseNumber} · Validated
          </div>
        )}
        <div className="text-[9px] text-slate-400 font-mono mt-0.5">
          Date Signed: {dateFormatted}
        </div>
      </div>
    </div>
  );
};



/**
 * Clin Clin AI Assistant Mascot Character Component
 * Authentic representation of the PSU Clinic AI assistant robot
 */
export const ClinClinMascot: React.FC<{ size?: number; className?: string; animated?: boolean }> = ({
  size = 140,
  className = '',
  animated = false
}) => {
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative select-none shrink-0 ${animated ? 'hover:scale-105 transition-transform duration-300' : ''} ${className}`}
    >
      <svg
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-md"
      >
        {/* Soft shadow under mascot */}
        <ellipse cx="80" cy="148" rx="42" ry="7" fill="#000000" opacity="0.12" />

        {/* Body Base */}
        <path
          d="M50 115 C50 102 62 98 80 98 C98 98 110 102 110 115 L114 142 C114 146 110 148 102 148 H58 C50 148 46 146 46 142 Z"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="2.5"
        />

        {/* Chest red cross emblem */}
        <circle cx="80" cy="120" r="8" fill="#FEE2E2" />
        <rect x="78.5" y="115" width="3" height="10" fill="#DC2626" rx="1" />
        <rect x="75" y="118.5" width="10" height="3" fill="#DC2626" rx="1" />

        {/* Stethoscope around neck */}
        <path
          d="M58 98 C58 112 66 128 80 128 C94 128 102 112 102 98"
          stroke="#DC2626"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Stethoscope chest piece */}
        <circle cx="80" cy="130" r="5" fill="#DC2626" />
        <circle cx="80" cy="130" r="2.5" fill="#FFFFFF" />

        {/* Left Arm / Hand (Resting) */}
        <path
          d="M48 104 C40 112 36 120 40 128 C42 132 46 132 50 126"
          stroke="#FFFFFF"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M48 104 C40 112 36 120 40 128 C42 132 46 132 50 126"
          stroke="#E2E8F0"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />

        {/* Right Arm / Hand (Waving friendly greeting) */}
        <g className={animated ? 'origin-[114px_106px] animate-wave' : ''}>
          <path
            d="M112 104 C124 102 134 94 138 84 C140 80 136 76 132 80 C128 84 120 94 112 98"
            stroke="#FFFFFF"
            strokeWidth="9"
            strokeLinecap="round"
          />
          {/* Waving glove / hand */}
          <circle cx="137" cy="80" r="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1.5" />
          <circle cx="140" cy="76" r="2.5" fill="#FFFFFF" />
          <circle cx="136" cy="74" r="2.5" fill="#FFFFFF" />
          <circle cx="132" cy="75" r="2.5" fill="#FFFFFF" />
        </g>

        {/* Head Unit: Big rounded high-tech helmet */}
        <rect
          x="32"
          y="28"
          width="96"
          height="76"
          rx="38"
          fill="#FFFFFF"
          stroke="#E2E8F0"
          strokeWidth="3"
        />

        {/* Red Doctor/Nurse Cap on top */}
        <path
          d="M54 28 C54 18 64 12 80 12 C96 12 106 18 106 28 Z"
          fill="#DC2626"
        />
        {/* White cross on cap */}
        <rect x="78.5" y="16" width="3" height="9" fill="#FFFFFF" rx="1" />
        <rect x="75.5" y="19" width="9" height="3" fill="#FFFFFF" rx="1" />

        {/* Red Ear Cuffs / Headphones */}
        <rect x="25" y="46" width="10" height="38" rx="5" fill="#DC2626" />
        <rect x="125" y="46" width="10" height="38" rx="5" fill="#DC2626" />
        <rect x="28" y="52" width="4" height="26" rx="2" fill="#991B1B" />
        <rect x="128" y="52" width="4" height="26" rx="2" fill="#991B1B" />

        {/* Digital Screen Visor (Black Face) */}
        <rect
          x="40"
          y="36"
          width="80"
          height="58"
          rx="26"
          fill="#0F172A"
          stroke="#DC2626"
          strokeWidth="3"
        />

        {/* Smiling LED Eyes (Curved Glowing Arcs) */}
        {/* Left Eye */}
        <path
          d="M54 58 C54 52 64 52 64 58"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right Eye */}
        <path
          d="M96 58 C96 52 106 52 106 58"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        {/* Cute blush cheeks */}
        <circle cx="52" cy="68" r="4" fill="#EF4444" opacity="0.6" />
        <circle cx="108" cy="68" r="4" fill="#EF4444" opacity="0.6" />

        {/* Cheerful Mouth */}
        <path
          d="M72 68 C72 74 88 74 88 68"
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />

        {/* Forehead subtle sensor light */}
        <circle cx="80" cy="42" r="2" fill="#38BDF8" />
      </svg>
    </div>
  );
};
