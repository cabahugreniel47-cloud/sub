import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  BarChart3,
  Calendar,
  ChevronDown,
  Filter,
  FileText,
  FileSpreadsheet,
  Printer,
  Download,
  Users,
  Stethoscope,
  Pill,
  TrendingUp,
  TrendingDown,
  Heart,
  Check,
  X,
  Clock,
  Sparkles,
  ArrowRight,
  ClipboardList,
  FileCheck
} from 'lucide-react';

interface ReportRecord {
  id: string;
  name: string;
  type: string;
  generatedBy: string;
  dateGenerated: string;
  downloadUrl?: string;
  summary: string;
}

export const ReportsAnalytics: React.FC = () => {
  const {
    consultations,
    patients,
    medicines,
    transactions,
    queue,
    appointments,
    currentUser,
    setActiveTab,
    setActiveModal,
    isMobile,
    deviceMode
  } = useClinic();

  // Active Sub-Navigation Tab
  const [activeSubTab, setActiveSubTab] = useState<
    'Overview' | 'Patient Reports' | 'Consultation Reports' | 'Inventory Reports' | 'Financial Reports' | 'User Activity' | 'Custom Reports'
  >('Overview');

  // Filter States
  const [dateRange, setDateRange] = useState('April 1, 2025 - April 26, 2025');
  const [selectedDepartment, setSelectedDepartment] = useState('All Departments');
  const [selectedReportType, setSelectedReportType] = useState('All Reports');
  const [trendPeriod, setTrendPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');

  // Interactive Hover State for Trend Chart
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(5); // default point 5 (Apr 16) matches reference!

  // Modal State for Viewing a Report Preview
  const [viewingReport, setViewingReport] = useState<ReportRecord | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Recent Reports List (Preloaded matching the reference image + expandable)
  const [recentReports, setRecentReports] = useState<ReportRecord[]>([
    {
      id: 'rep-1',
      name: 'Daily Clinic Summary (Apr 26, 2025)',
      type: 'Patient Report',
      generatedBy: 'Administrator',
      dateGenerated: 'Apr 26, 2025 10:15 AM',
      summary: 'Complete summary of 42 patient triage intakes, 28 medical consultations, and 3 emergency cases.'
    },
    {
      id: 'rep-2',
      name: 'Inventory Report (Apr 2025)',
      type: 'Inventory Report',
      generatedBy: 'Nurse',
      dateGenerated: 'Apr 26, 2025 09:42 AM',
      summary: 'Detailed pharmaceutical stock report: 45 items analyzed, 2 critical stock items, 1,320 total units dispensed.'
    },
    {
      id: 'rep-3',
      name: 'Financial Report (April 2025)',
      type: 'Financial Report',
      generatedBy: 'Administrator',
      dateGenerated: 'Apr 25, 2025 04:20 PM',
      summary: 'University Health Services operational allocation and pharmacy cost recovery totaling ₱248,500.'
    },
    {
      id: 'rep-4',
      name: 'User Activity Log (April 2025)',
      type: 'Activity Log',
      generatedBy: 'Administrator',
      dateGenerated: 'Apr 25, 2025 02:10 PM',
      summary: 'Audit log of 342 user logins, medical record edits, prescription sign-offs, and triage entries.'
    }
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handlers for Export Buttons
  const handleExportCSV = () => {
    const headers = ['Metric', 'Value', 'Change'];
    const rows = [
      ['Total Patients', '1,248', '+12% vs. last month'],
      ['Total Consultations', '892', '+8% vs. last month'],
      ['Appointments', '745', '+15% vs. last month'],
      ['Queue Served', '680', '+10% vs. last month'],
      ['Medicine Dispensed', '1,320', '-7% vs. last month'],
      ['Total Revenue', '₱248,500', '+14% vs. last month'],
      ['Top Diagnosis 1', 'Acute Upper Respiratory Infection (210 cases, 16.8%)', ''],
      ['Top Diagnosis 2', 'Hypertension (145 cases, 11.6%)', ''],
      ['Top Diagnosis 3', 'Allergic Rhinitis (122 cases, 9.8%)', ''],
      ['Top Diagnosis 4', 'Gastritis (98 cases, 7.8%)', ''],
      ['Top Diagnosis 5', 'Urinary Tract Infection (87 cases, 7.0%)', '']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PSU_Clinic_Report_${dateRange.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('CSV Report downloaded successfully');
  };

  const handleExportExcel = () => {
    handleExportCSV();
    showToast('Excel/Spreadsheet formatted export generated');
  };

  const handleExportPDF = () => {
    setActiveModal('print-census');
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      const newReport: ReportRecord = {
        id: `rep-${Date.now()}`,
        name: `${selectedReportType === 'All Reports' ? 'Executive Census Summary' : selectedReportType} (${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`,
        type: selectedReportType === 'All Reports' ? 'Patient Report' : selectedReportType,
        generatedBy: currentUser?.title || currentUser?.role || 'Administrator',
        dateGenerated: `${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        summary: `Fresh analytical census compiled for ${selectedDepartment}. All statistical morbidity indicators verified.`
      };
      setRecentReports([newReport, ...recentReports]);
      showToast('New report generated successfully and added to recent reports');
    }, 600);
  };

  // 1. Patient Visits Trend Data (Matching the reference curve)
  const visitTrendData = [
    { date: 'Apr 1', visits: 90, x: 20, y: 155 },
    { date: 'Apr 4', visits: 70, x: 75, y: 175 },
    { date: 'Apr 7', visits: 85, x: 130, y: 160 },
    { date: 'Apr 10', visits: 105, x: 185, y: 140 },
    { date: 'Apr 13', visits: 125, x: 240, y: 120 },
    { date: 'Apr 16', visits: 165, x: 295, y: 80 }, // Reference peak!
    { date: 'Apr 19', visits: 110, x: 350, y: 135 },
    { date: 'Apr 22', visits: 115, x: 405, y: 130 },
    { date: 'Apr 25', visits: 155, x: 460, y: 90 }
  ];

  // SVG Path generator for smooth area
  const svgWidth = 480;
  const svgHeight = 220;

  // Path string for smooth line curve
  const linePointsString = visitTrendData
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  const areaPointsString = `${linePointsString} L 460 210 L 20 210 Z`;

  // 2. Patient Type Distribution Data
  const patientTypes = [
    { label: 'Student', percent: 68, count: 848, color: '#881337', strokeColor: '#9f1239' },
    { label: 'Faculty', percent: 12, count: 150, color: '#dc2626', strokeColor: '#ef4444' },
    { label: 'Staff', percent: 8, count: 100, color: '#f87171', strokeColor: '#fca5a5' },
    { label: 'Dependents', percent: 7, count: 87, color: '#fca5a5', strokeColor: '#fecdd3' },
    { label: 'Others', percent: 5, count: 63, color: '#94a3b8', strokeColor: '#cbd5e1' }
  ];

  // 3. Top Diagnoses (Matching reference numbers)
  const topDiagnoses = [
    { rank: 1, name: 'Acute Upper Respiratory Infection', count: 210, percent: 16.8, barWidth: 85 },
    { rank: 2, name: 'Hypertension', count: 145, percent: 11.6, barWidth: 62 },
    { rank: 3, name: 'Allergic Rhinitis', count: 122, percent: 9.8, barWidth: 52 },
    { rank: 4, name: 'Gastritis', count: 98, percent: 7.8, barWidth: 42 },
    { rank: 5, name: 'Urinary Tract Infection', count: 87, percent: 7.0, barWidth: 38 }
  ];

  // 4. Consultation by Department Data (Matching reference numbers)
  const departmentConsultations = [
    { dept: 'Internal Medicine', count: 320, height: 160 },
    { dept: 'Pediatrics', count: 210, height: 105 },
    { dept: 'OB-GYN', count: 145, height: 72 },
    { dept: 'Surgery', count: 98, height: 49 },
    { dept: 'Dental', count: 72, height: 36 }
  ];

  // 5. Inventory Status (Matching reference items)
  const inventoryStatusItems = [
    { item: 'Paracetamol', stock: '45 pcs', status: 'Good', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { item: 'Amoxicillin', stock: '12 pcs', status: 'Low Stock', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    { item: 'Ibuprofen', stock: '8 pcs', status: 'Low Stock', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
    { item: 'Syringes', stock: '60 pcs', status: 'Good', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { item: 'Alcohol', stock: '5 pcs', status: 'Critical', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2.5 text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Context Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Title Zone */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 text-[#7F1416] flex items-center justify-center shrink-0 shadow-xs">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Reports & Analytics
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              View and analyze clinic data to support better decision-making and improved services.
            </p>
          </div>
        </div>

        {/* Right Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {/* Timestamp Indicator */}
          <div className="hidden xl:flex items-center gap-1.5 text-xs text-slate-500 mr-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>April 26, 2025 | 10:24 AM</span>
          </div>

          {/* Date Range Picker Input */}
          <div className="relative">
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 shadow-2xs hover:border-slate-300">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent focus:outline-hidden text-xs font-medium text-slate-800 w-full sm:w-48"
                placeholder="Select date range"
              />
            </div>
          </div>

          {/* Department Dropdown */}
          <div className="relative">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="appearance-none w-full sm:w-auto px-3 py-2 pr-8 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-2xs hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-red-700 cursor-pointer"
            >
              <option value="All Departments">All Departments</option>
              <option value="Internal Medicine">Internal Medicine</option>
              <option value="Pediatrics">Pediatrics</option>
              <option value="OB-GYN">OB-GYN</option>
              <option value="Surgery">Surgery</option>
              <option value="Dental">Dental</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Primary Generate Report Button */}
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-70 active:scale-95"
          >
            <BarChart3 className="w-4 h-4" />
            <span>{isGenerating ? 'Compiling...' : 'Generate Report'}</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs border-b border-slate-200">
        {[
          'Overview',
          'Patient Reports',
          'Consultation Reports',
          'Inventory Reports',
          'Financial Reports',
          'User Activity',
          'Custom Reports'
        ].map((tab) => {
          const isActive = activeSubTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveSubTab(tab as any)}
              className={`px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#7F1416] text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* Conditional Sub-Navigation Views */}
      {activeSubTab !== 'Overview' ? (
        <div className="space-y-6">
          {/* Sub-Tab Header Banner */}
          <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#7F1416] uppercase tracking-wider mb-1">
                <span>Reports & Analytics</span>
                <span>/</span>
                <span className="text-slate-700 font-bold">{activeSubTab}</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">
                {activeSubTab === 'Patient Reports' && 'Comprehensive Patient Demographics & Health Profile Census'}
                {activeSubTab === 'Consultation Reports' && 'Clinical Consultation Logbook & EMR Morbidity Analysis'}
                {activeSubTab === 'Inventory Reports' && 'Pharmacy Stock Utilization, Dispensing & Expiration Audit'}
                {activeSubTab === 'Financial Reports' && 'University Clinic Resource Utilization & Pharmacy Valuation'}
                {activeSubTab === 'User Activity' && 'Staff Access & System Audit Activity Trail'}
                {activeSubTab === 'Custom Reports' && 'Custom Clinic Data Query & Cross-Tabulation Generator'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Filtered dataset for {dateRange} · {selectedDepartment}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveSubTab('Overview')}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                ← Back to Overview
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3.5 py-1.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Dataset</span>
              </button>
            </div>
          </div>

          {/* Sub-Tab Specific Content */}
          {activeSubTab === 'Patient Reports' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#7F1416]" />
                  <span>Student & Personnel Registry Census ({patients.length} Total Patients)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">PSU ID</th>
                      <th className="py-2.5 px-4">Patient Name</th>
                      <th className="py-2.5 px-4">Classification</th>
                      <th className="py-2.5 px-4">College / Department</th>
                      <th className="py-2.5 px-4">Blood Type</th>
                      <th className="py-2.5 px-4">Emergency Contact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patients.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-mono font-bold text-red-900">{p.psuId}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.firstName} {p.lastName}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-700 font-semibold">
                            {p.classification}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{p.collegeOrDepartment}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-800">{p.bloodType || 'O+'}</td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.emergencyContactPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'Consultation Reports' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#7F1416]" />
                  <span>Documented Consultations & Clinical Diagnoses ({consultations.length} Records)</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Date & Time</th>
                      <th className="py-2.5 px-4">Patient Name</th>
                      <th className="py-2.5 px-4">Chief Complaint</th>
                      <th className="py-2.5 px-4">Assessment / Diagnosis</th>
                      <th className="py-2.5 px-4">Attending Doctor</th>
                      <th className="py-2.5 px-4">Disposition</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {consultations.map(c => {
                      const patient = patients.find(p => p.id === c.patientId);
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{c.date} {c.time}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{patient ? `${patient.firstName} ${patient.lastName}` : 'Walk-in Enrollee'}</td>
                          <td className="py-3 px-4 text-slate-700 max-w-xs truncate">{c.subjective}</td>
                          <td className="py-3 px-4 font-semibold text-red-900">{c.assessmentDiagnosis}</td>
                          <td className="py-3 px-4 text-slate-700">{c.doctorName}</td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 font-bold">
                              {c.medicalCertificateIssued ? 'Cert Issued' : 'Treated / Rest'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'Inventory Reports' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Pill className="w-4 h-4 text-[#7F1416]" />
                  <span>Pharmacy Inventory Stock & Consumption Audit</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-4">Medicine Item</th>
                      <th className="py-2.5 px-4">Category</th>
                      <th className="py-2.5 px-4">Stock on Hand</th>
                      <th className="py-2.5 px-4">Threshold</th>
                      <th className="py-2.5 px-4">Batch Number</th>
                      <th className="py-2.5 px-4">Expiry Date</th>
                      <th className="py-2.5 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicines.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{m.genericName}</div>
                          <div className="text-[10px] text-slate-400">{m.brandName} · {m.dosageStrength}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{m.category}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.currentStock} {m.unit}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{m.minimumThreshold} {m.unit}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{m.batchNumber}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{m.expiryDate}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            m.status === 'Critical Stock'
                              ? 'bg-rose-100 text-rose-800'
                              : m.status === 'Low Stock'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'Financial Reports' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  University Health & Pharmacy Valuation Breakdown
                </h3>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                  Total Valuation: ₱248,500.00
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-xs font-medium">Pharmaceutical Inventory Valuation</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">₱142,350.00</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Procured clinic medicines & supplies</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-xs font-medium">Medical Equipment Allocation</div>
                  <div className="text-xl font-bold font-mono text-slate-900 mt-1">₱86,150.00</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Sphygmomanometers, nebulizers, beds</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-slate-500 text-xs font-medium">University Subsidy & Operational Fund</div>
                  <div className="text-xl font-bold font-mono text-emerald-700 mt-1">₱20,000.00</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Auxiliary medical assistance buffer</div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'User Activity' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-slate-900 text-sm">
                  Personnel Audit & Access Trail
                </h3>
              </div>
              <div className="space-y-2">
                {[
                  { user: 'Dr. Roberto M. Manalo, MD', role: 'Doctor', action: 'Signed Medical Certificate & SOAP Record', time: 'Today at 10:18 AM' },
                  { user: 'Mary Jane Santos, RN', role: 'Nurse', action: 'Dispensed 10 Paracetamol 500mg (Ticket A-102)', time: 'Today at 10:04 AM' },
                  { user: 'Juan De La Cruz', role: 'Staff', action: 'Issued Queue Ticket A-105 for Student 2023313334', time: 'Today at 09:48 AM' },
                  { user: 'Clinic Administrator', role: 'Admin', action: 'Generated Monthly Census Summary (Apr 2025)', time: 'Today at 09:15 AM' }
                ].map((act, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{act.user}</span>
                      <span className="text-[10px] ml-2 px-1.5 py-0.5 bg-slate-200 rounded text-slate-700">{act.role}</span>
                      <div className="text-slate-600 mt-0.5">{act.action}</div>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeSubTab === 'Custom Reports' && (
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
              <h3 className="font-bold text-slate-900 text-sm">Custom Report Builder</h3>
              <p className="text-xs text-slate-500">Configure parameters to generate customized epidemiological or logistical reports.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Target Dimension</label>
                  <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <option>Morbidity by Age & College</option>
                    <option>Prescription Dispensing by Month</option>
                    <option>Queue Wait-Time Velocity</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Date Interval</label>
                  <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <option>Daily Aggregation</option>
                    <option>Weekly Grouping</option>
                    <option>Semester Census</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Export Format</label>
                  <select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <option>PDF Official Document</option>
                    <option>Excel Worksheet (XLSX)</option>
                    <option>CSV Raw Table</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerateReport}
                className="px-4 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Compile Custom Report
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* 6 Top Metric KPI Cards (Exact match to reference) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Patients */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#7F1416] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-500 truncate">Total Patients</span>
          </div>
          <div className="text-2xl font-bold font-sans text-slate-900 tabular-nums">
            1,248
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>↑ 12%</span>
            <span className="text-slate-400 font-normal">vs. last month</span>
          </div>
        </div>

        {/* Card 2: Total Consultations */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#7F1416] flex items-center justify-center shrink-0">
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-500 truncate">Total Consultations</span>
          </div>
          <div className="text-2xl font-bold font-sans text-slate-900 tabular-nums">
            892
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>↑ 8%</span>
            <span className="text-slate-400 font-normal">vs. last month</span>
          </div>
        </div>

        {/* Card 3: Appointments */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#7F1416] flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-500 truncate">Appointments</span>
          </div>
          <div className="text-2xl font-bold font-sans text-slate-900 tabular-nums">
            745
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>↑ 15%</span>
            <span className="text-slate-400 font-normal">vs. last month</span>
          </div>
        </div>

        {/* Card 4: Queue Served */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#7F1416] flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-500 truncate">Queue Served</span>
          </div>
          <div className="text-2xl font-bold font-sans text-slate-900 tabular-nums">
            680
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>↑ 10%</span>
            <span className="text-slate-400 font-normal">vs. last month</span>
          </div>
        </div>

        {/* Card 5: Medicine Dispensed */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#7F1416] flex items-center justify-center shrink-0">
              <Pill className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium text-slate-500 truncate">Medicine Dispensed</span>
          </div>
          <div className="text-2xl font-bold font-sans text-slate-900 tabular-nums">
            1,320
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 mt-1">
            <TrendingDown className="w-3 h-3" />
            <span>↓ 7%</span>
            <span className="text-slate-400 font-normal">vs. last month</span>
          </div>
        </div>

        {/* Card 6: Total Revenue */}
        <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-red-50 text-[#7F1416] flex items-center justify-center font-bold text-xs shrink-0">
              ₱
            </div>
            <span className="text-xs font-medium text-slate-500 truncate">Total Revenue</span>
          </div>
          <div className="text-2xl font-bold font-sans text-slate-900 tabular-nums">
            ₱248,500
          </div>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            <span>↑ 14%</span>
            <span className="text-slate-400 font-normal">vs. last month</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Patient Visits Trend, Patient Type Distribution & Sidebar Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Chart: Patient Visits Trend (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#7F1416]" />
              <h2 className="font-bold text-slate-900 text-xs sm:text-sm">
                Patient Visits Trend
              </h2>
            </div>

            {/* Daily/Weekly/Monthly selector */}
            <div className="relative">
              <select
                value={trendPeriod}
                onChange={(e) => setTrendPeriod(e.target.value as any)}
                className="appearance-none px-2.5 py-1 pr-6 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 cursor-pointer focus:outline-hidden"
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
              </select>
              <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* SVG Area Line Chart */}
          <div className="relative pt-4 pb-2">
            {/* Tooltip on active point */}
            {hoveredPointIndex !== null && (
              <div
                className="absolute z-20 pointer-events-none -translate-x-1/2 transition-all duration-150"
                style={{
                  left: `${(visitTrendData[hoveredPointIndex].x / svgWidth) * 100}%`,
                  top: `${(visitTrendData[hoveredPointIndex].y / svgHeight) * 100 - 32}%`
                }}
              >
                <div className="bg-slate-900 text-white rounded-md px-2 py-1 shadow-lg text-[10px] text-center whitespace-nowrap">
                  <div className="text-slate-400 text-[9px]">{visitTrendData[hoveredPointIndex].date}, 2025</div>
                  <div className="font-bold text-white">{visitTrendData[hoveredPointIndex].visits} visits</div>
                </div>
                <div className="w-2 h-2 bg-slate-900 rotate-45 mx-auto -mt-1" />
              </div>
            )}

            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-48 overflow-visible">
              <defs>
                <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc2626" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#dc2626" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[
                { y: 30, val: 200 },
                { y: 75, val: 150 },
                { y: 120, val: 100 },
                { y: 165, val: 50 },
                { y: 210, val: 0 }
              ].map((g) => (
                <g key={g.y}>
                  <line
                    x1="20"
                    y1={g.y}
                    x2="460"
                    y2={g.y}
                    stroke="#f1f5f9"
                    strokeWidth="1"
                    strokeDasharray={g.val === 0 ? undefined : '3 3'}
                  />
                  <text
                    x="12"
                    y={g.y + 3}
                    textAnchor="end"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="sans-serif"
                  >
                    {g.val}
                  </text>
                </g>
              ))}

              {/* Gradient Area */}
              <path d={areaPointsString} fill="url(#trendGradient)" />

              {/* Red Line */}
              <path
                d={linePointsString}
                fill="none"
                stroke="#dc2626"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data Points */}
              {visitTrendData.map((p, idx) => (
                <g
                  key={p.date}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredPointIndex(idx)}
                >
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={hoveredPointIndex === idx ? 5 : 3.5}
                    fill={hoveredPointIndex === idx ? '#881337' : '#dc2626'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-150"
                  />
                  {/* Invisible larger hit target */}
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r="14"
                    fill="transparent"
                  />
                </g>
              ))}

              {/* X Axis Labels */}
              {visitTrendData.map((p) => (
                <text
                  key={p.date}
                  x={p.x}
                  y="224"
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {p.date}
                </text>
              ))}
            </svg>
          </div>
        </div>

        {/* Center Chart: Patient Type Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Users className="w-4 h-4 text-[#7F1416]" />
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm">
              Patient Type Distribution
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            {/* SVG Donut Chart with Cutout */}
            <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* 5 Slices representing 68%, 12%, 8%, 7%, 5% */}
                {/* Student: 68% -> circumference = 2 * PI * 38 = ~238.76 */}
                {/* dasharray = (percent/100 * 238.76) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#881337"
                  strokeWidth="15"
                  strokeDasharray="162.3 238.76"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#dc2626"
                  strokeWidth="15"
                  strokeDasharray="28.6 238.76"
                  strokeDashoffset="-162.3"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#f87171"
                  strokeWidth="15"
                  strokeDasharray="19.1 238.76"
                  strokeDashoffset="-190.9"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#fca5a5"
                  strokeWidth="15"
                  strokeDasharray="16.7 238.76"
                  strokeDashoffset="-210.0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#94a3b8"
                  strokeWidth="15"
                  strokeDasharray="12.0 238.76"
                  strokeDashoffset="-226.7"
                />
              </svg>

              {/* Center Total Counter */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-bold text-slate-900 leading-tight">1,248</span>
                <span className="text-[9px] text-slate-400 font-medium">Total Patients</span>
              </div>
            </div>

            {/* Legend on the right (Exact match to reference) */}
            <div className="space-y-1.5 text-xs flex-1 w-full sm:w-auto">
              {patientTypes.map((pt) => (
                <div key={pt.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: pt.color }}
                    />
                    <span className="text-slate-700 font-medium">{pt.label}</span>
                  </div>
                  <span className="font-semibold text-slate-800 text-[11px]">
                    {pt.percent}% <span className="text-slate-400 font-normal">({pt.count})</span>
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex justify-between">
            <span>Primary Demographic:</span>
            <span className="font-semibold text-[#7F1416]">PSU Students (848 enrollees)</span>
          </div>
        </div>

        {/* Right Sidebar Controls: Report Filters & Export Report (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Card 1: Report Filters */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Filter className="w-4 h-4 text-[#7F1416]" />
              <h2 className="font-bold text-slate-900 text-xs sm:text-sm">
                Report Filters
              </h2>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Date Range
                </label>
                <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full bg-transparent focus:outline-hidden text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Department
                </label>
                <div className="relative">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="appearance-none w-full px-2.5 py-1.5 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 cursor-pointer focus:outline-hidden"
                  >
                    <option value="All Departments">All Departments</option>
                    <option value="Internal Medicine">Internal Medicine</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="OB-GYN">OB-GYN</option>
                    <option value="Surgery">Surgery</option>
                    <option value="Dental">Dental</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Report Type
                </label>
                <div className="relative">
                  <select
                    value={selectedReportType}
                    onChange={(e) => setSelectedReportType(e.target.value)}
                    className="appearance-none w-full px-2.5 py-1.5 pr-6 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-700 cursor-pointer focus:outline-hidden"
                  >
                    <option value="All Reports">All Reports</option>
                    <option value="Patient Morbidity Census">Patient Morbidity Census</option>
                    <option value="Prescription & Dispensing Census">Prescription & Dispensing Census</option>
                    <option value="Consultation Logbook Summary">Consultation Logbook Summary</option>
                    <option value="Pharmacy Inventory Audit">Pharmacy Inventory Audit</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <button
                onClick={() => showToast('Filters applied to dataset')}
                className="w-full mt-1 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>

          {/* Card 2: Export Report */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
              <Download className="w-4 h-4 text-[#7F1416]" />
              <h2 className="font-bold text-slate-900 text-xs sm:text-sm">
                Export Report
              </h2>
            </div>

            <div className="space-y-1.5 text-xs">
              {/* PDF Button */}
              <button
                onClick={handleExportPDF}
                className="w-full py-1.5 px-3 bg-white hover:bg-red-50/50 border border-slate-200 hover:border-red-300 rounded-lg text-slate-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="w-5 h-5 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px]">
                  PDF
                </span>
                <span className="text-xs">PDF Document</span>
              </button>

              {/* Excel Button */}
              <button
                onClick={handleExportExcel}
                className="w-full py-1.5 px-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-lg text-slate-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="w-5 h-5 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                  XLS
                </span>
                <span className="text-xs">Excel Spreadsheet</span>
              </button>

              {/* CSV Button */}
              <button
                onClick={handleExportCSV}
                className="w-full py-1.5 px-3 bg-white hover:bg-blue-50/50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <span className="w-5 h-5 rounded bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-[10px]">
                  CSV
                </span>
                <span className="text-xs">CSV Data Table</span>
              </button>

              {/* Print Button */}
              <button
                onClick={() => setActiveModal('print-census')}
                className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-800 font-semibold flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span className="text-xs">Print Official Form</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Top Diagnoses, Consultation by Department, Inventory Status (Exact match to reference) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Top Diagnoses */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-600 fill-rose-600" />
              <h2 className="font-bold text-slate-900 text-xs sm:text-sm">
                Top Diagnoses
              </h2>
            </div>
            <button
              onClick={() => setActiveSubTab('Consultation Reports')}
              className="text-xs font-bold text-[#7F1416] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {topDiagnoses.map((diag) => (
              <div key={diag.rank} className="space-y-1.5">
                <div className="flex items-start justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {diag.rank}
                    </span>
                    <span className="font-semibold text-slate-800 truncate" title={diag.name}>
                      {diag.name}
                    </span>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">{diag.count}</span>
                    <span className="text-slate-400 text-[11px] font-medium w-10 text-right">{diag.percent}%</span>
                  </div>
                </div>

                {/* Crimson Progress Bar */}
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#7F1416] rounded-full transition-all duration-500"
                    style={{ width: `${diag.barWidth}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Consultation by Department */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Stethoscope className="w-4 h-4 text-[#7F1416]" />
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm">
              Consultation by Department
            </h2>
          </div>

          {/* Bar Chart Representation with Y-axis */}
          <div className="relative pt-6 pb-2 h-52 flex items-end">
            {/* Y Axis Guide Lines */}
            <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none text-[9px] text-slate-400">
              <div className="border-b border-slate-100 pb-0.5">400</div>
              <div className="border-b border-slate-100 pb-0.5">300</div>
              <div className="border-b border-slate-100 pb-0.5">200</div>
              <div className="border-b border-slate-100 pb-0.5">100</div>
              <div className="border-b border-slate-200 pb-0.5">0</div>
            </div>

            {/* Bars */}
            <div className="relative z-10 w-full flex items-end justify-around pl-6 pr-2">
              {departmentConsultations.map((dept) => {
                const maxVal = 400;
                const barHeightPercent = (dept.count / maxVal) * 100;
                return (
                  <div key={dept.dept} className="flex flex-col items-center gap-1 group">
                    <span className="text-[10px] font-bold text-slate-800">
                      {dept.count}
                    </span>
                    <div
                      className="w-8 sm:w-10 bg-[#7F1416] hover:bg-[#680F11] rounded-t-sm transition-all duration-300"
                      style={{ height: `${barHeightPercent * 1.3}px` }}
                    />
                    <span className="text-[9px] text-slate-600 font-medium mt-1 truncate max-w-[65px] text-center" title={dept.dept}>
                      {dept.dept}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Inventory Status */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-[#7F1416]" />
              <h2 className="font-bold text-slate-900 text-xs sm:text-sm">
                Inventory Status
              </h2>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-bold text-[#7F1416] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] text-slate-400 font-semibold border-b border-slate-100">
                <tr>
                  <th className="pb-2">Item</th>
                  <th className="pb-2">Stock Level</th>
                  <th className="pb-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventoryStatusItems.map((inv) => (
                  <tr key={inv.item} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 font-medium text-slate-800">
                      {inv.item}
                    </td>
                    <td className="py-2.5 font-mono text-slate-600">
                      {inv.stock}
                    </td>
                    <td className="py-2.5 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${inv.badgeClass}`}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Reports Table (Exact match to reference) */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#7F1416]" />
            <h2 className="font-bold text-slate-900 text-xs sm:text-sm">
              Recent Reports
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {recentReports.length} compiled documents
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/70 text-slate-500 font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-4">Report Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Generated By</th>
                <th className="py-3 px-4">Date Generated</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-3.5 h-3.5 text-[#7F1416] shrink-0" />
                      <span>{report.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 font-medium">
                      {report.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {report.generatedBy}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {report.dateGenerated}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* View Button */}
                      <button
                        onClick={() => setViewingReport(report)}
                        className="px-3 py-1 bg-[#7F1416] hover:bg-[#680F11] text-white rounded text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        View
                      </button>
                      {/* Download Button */}
                      <button
                        onClick={() => {
                          handleExportCSV();
                          showToast(`Downloading: ${report.name}`);
                        }}
                        className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

      {/* Footer (Exact match to reference bottom) */}
      <footer className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Clinic Information System</span>
          <span>|</span>
          <span className="font-medium text-slate-700">Pampanga State University Medical Clinic</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#7F1416] font-semibold">
          <Heart className="w-3.5 h-3.5 fill-[#7F1416]" />
          <span>Your Health, Our Priority.</span>
        </div>
      </footer>

      {/* Modal: View Specific Report */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 bg-[#7F1416] text-white flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm">
                <FileText className="w-4 h-4" />
                <span>{viewingReport.name}</span>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-[11px]">
                <div><span className="text-slate-400">Report Category:</span> <strong className="text-slate-800">{viewingReport.type}</strong></div>
                <div><span className="text-slate-400">Generated By:</span> <strong className="text-slate-800">{viewingReport.generatedBy}</strong></div>
                <div><span className="text-slate-400">Date Generated:</span> <strong className="text-slate-800">{viewingReport.dateGenerated}</strong></div>
                <div><span className="text-slate-400">Status:</span> <strong className="text-emerald-700">Verified & Official</strong></div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-1">Executive Summary</h4>
                <p className="text-slate-600 leading-relaxed bg-white p-3 border border-slate-100 rounded-lg">
                  {viewingReport.summary}
                </p>
              </div>

              {/* Key Indicators Preview */}
              <div>
                <h4 className="font-bold text-slate-800 text-xs mb-2">Census Metric Highlights</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 bg-red-50/50 rounded-lg border border-red-100 text-center">
                    <div className="text-[10px] text-slate-500">Patients Processed</div>
                    <div className="text-lg font-bold text-[#7F1416]">1,248</div>
                  </div>
                  <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100 text-center">
                    <div className="text-[10px] text-slate-500">Consultations Held</div>
                    <div className="text-lg font-bold text-blue-700">892</div>
                  </div>
                  <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-center">
                    <div className="text-[10px] text-slate-500">Medicine Dispensed</div>
                    <div className="text-lg font-bold text-emerald-700">1,320 pcs</div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    handleExportPDF();
                    setViewingReport(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Formal Copy</span>
                </button>
                <button
                  onClick={() => {
                    handleExportCSV();
                    setViewingReport(null);
                  }}
                  className="px-4 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
