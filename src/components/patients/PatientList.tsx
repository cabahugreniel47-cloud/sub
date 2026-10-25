import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Patient, PatientClassification } from '../../types/clinic';
import {
  Users,
  Search,
  Plus,
  Filter,
  Activity,
  AlertTriangle,
  Download,
  Building,
  Phone,
  LayoutGrid,
  List,
  Archive,
  RotateCcw,
  Trash2,
  History,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Calendar,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export const PatientList: React.FC = () => {
  const {
    currentUser,
    patients,
    setSelectedPatient,
    setActiveModal,
    setModalPayload,
    archivePatient,
    restorePatient,
    deletePatient,
    isMobile,
    deviceMode
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterClassification, setFilterClassification] = useState<string>('all');
  const [filterCollege, setFilterCollege] = useState<string>('all');
  const [statusTab, setStatusTab] = useState<'active' | 'archived' | 'all'>('active');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');

  // Archive & Delete Modal State
  const [patientToArchive, setPatientToArchive] = useState<Patient | null>(null);
  const [archiveReasonCategory, setArchiveReasonCategory] = useState<string>('Graduated');
  const [archiveReasonNotes, setArchiveReasonNotes] = useState<string>('');
  
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [deleteConfirmationPsuId, setDeleteConfirmationPsuId] = useState<string>('');
  
  const [isProcessing, setIsProcessing] = useState(false);

  const isCards = viewMode === 'cards' || (viewMode === 'auto' && isMobile);

  const activePatients = patients.filter(p => p.status !== 'archived' && p.status !== 'deleted');
  const archivedPatients = patients.filter(p => p.status === 'archived');

  // Filter patients
  const filteredPatients = patients.filter(p => {
    // Status tab filter
    if (statusTab === 'active' && p.status === 'archived') return false;
    if (statusTab === 'archived' && p.status !== 'archived') return false;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || (
      p.psuId.toLowerCase().includes(q) ||
      p.firstName.toLowerCase().includes(q) ||
      p.lastName.toLowerCase().includes(q) ||
      p.collegeOrDepartment.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q)
    );

    const matchesClassification =
      filterClassification === 'all' || p.classification === filterClassification;

    const matchesCollege =
      filterCollege === 'all' || p.collegeOrDepartment.includes(filterCollege);

    return matchesSearch && matchesClassification && matchesCollege;
  });

  const colleges = Array.from(new Set(patients.map(p => p.collegeOrDepartment)));

  // Handlers
  const handleConfirmArchive = async () => {
    if (!patientToArchive) return;
    setIsProcessing(true);
    const finalReason = archiveReasonNotes.trim()
      ? `${archiveReasonCategory} - ${archiveReasonNotes.trim()}`
      : archiveReasonCategory;

    const success = await archivePatient(patientToArchive.id, finalReason);
    setIsProcessing(false);
    if (success) {
      setPatientToArchive(null);
      setArchiveReasonNotes('');
    }
  };

  const handleConfirmRestore = async (patient: Patient) => {
    setIsProcessing(true);
    await restorePatient(patient.id);
    setIsProcessing(false);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!patientToDelete) return;
    if (deleteConfirmationPsuId.trim() !== patientToDelete.psuId) {
      return;
    }
    setIsProcessing(true);
    const success = await deletePatient(patientToDelete.id);
    setIsProcessing(false);
    if (success) {
      setPatientToDelete(null);
      setDeleteConfirmationPsuId('');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7F1416] uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Master Health Registry & Patient Records</span>
            {isMobile && (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                📱 Mobile Mode Fitted
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Current & Past Patient Database
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full lifecycle database: register walk-in patients, archive past student/faculty records, restore archived profiles, and access stored medical histories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
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

          {currentUser?.role !== 'doctor' && currentUser?.role !== 'administrator' && (
            <button
              onClick={() => setActiveModal('new-patient')}
              className="px-3.5 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Register Patient</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Database Statistics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Current Active</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{activePatients.length}</div>
          <div className="text-[10px] text-emerald-700 font-medium mt-0.5">Enrolled active health records</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Past / Archived</span>
            <Archive className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-900 mt-1">{archivedPatients.length}</div>
          <div className="text-[10px] text-amber-700 font-medium mt-0.5">Alumni, relocated & past records</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Total Database</span>
            <Users className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900 mt-1">{patients.length}</div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Current + Past stored patients</div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase">Database Control</span>
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
            <span className="text-amber-700">Remove</span> · <span className="text-emerald-700">Restore</span> · <span className="text-rose-700">Delete</span>
          </div>
          <div className="text-[10px] text-slate-500 font-medium mt-0.5">Complete historical data preserved</div>
        </div>
      </div>

      {/* Primary Lifecycle Status Navigation Tabs: Current vs Past vs All */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setStatusTab('active')}
            className={`px-3.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              statusTab === 'active'
                ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Current Active Patients</span>
            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-mono">
              {activePatients.length}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('archived')}
            className={`px-3.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              statusTab === 'archived'
                ? 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Archive className="w-3.5 h-3.5 text-amber-600" />
            <span>Past / Archived Patients</span>
            <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full text-[10px] font-mono">
              {archivedPatients.length}
            </span>
          </button>

          <button
            onClick={() => setStatusTab('all')}
            className={`px-3.5 py-1.5 rounded-md font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
              statusTab === 'all'
                ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-400/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>All Database Records</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px] font-mono">
              {patients.length}
            </span>
          </button>
        </div>

        <div className="text-[11px] text-slate-500 px-2 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>RA 10173 Audit Compliant Storage</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search PSU ID (e.g. 2024-00123-BC), Name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-600 focus:bg-white transition-all text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Classification filter */}
          <select
            value={filterClassification}
            onChange={(e) => setFilterClassification(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-600 cursor-pointer text-xs"
          >
            <option value="all">All Classifications</option>
            <option value="Student">Student</option>
            <option value="Faculty">Faculty</option>
            <option value="Administrative Staff">Administrative Staff</option>
            <option value="Dependent">Dependent</option>
          </select>

          {/* College filter */}
          <select
            value={filterCollege}
            onChange={(e) => setFilterCollege(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-600 cursor-pointer max-w-[200px] truncate text-xs"
          >
            <option value="all">All Colleges / Offices</option>
            {colleges.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* PATIENT DISPLAY: Cards view on mobile or Table view on PC */}
      {isCards ? (
        /* Mobile Touch Card Layout */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing <strong>{filteredPatients.length}</strong> {statusTab === 'archived' ? 'past/archived' : statusTab === 'active' ? 'current' : 'total'} records</span>
            <span className="text-[#7F1416] font-medium">📱 Touch Optimized</span>
          </div>

          {filteredPatients.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-600">No patient records found.</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {statusTab === 'archived'
                  ? 'No archived past patients in database.'
                  : 'Try adjusting your search criteria or register a new patient.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPatients.map(patient => {
                const isArchived = patient.status === 'archived';
                return (
                  <div
                    key={patient.id}
                    className={`bg-white p-4 rounded-xl border shadow-xs transition-all space-y-3 ${
                      isArchived ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap mb-1">
                          <span className="font-mono text-xs font-black text-[#7F1416] bg-red-50 px-2 py-0.5 rounded border border-red-200 inline-block">
                            {patient.psuId}
                          </span>
                          {isArchived ? (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                              <Archive className="w-2.5 h-2.5" />
                              <span>Past / Archived</span>
                            </span>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Current Active</span>
                            </span>
                          )}
                        </div>

                        <div>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setActiveModal('patient-profile');
                            }}
                            className="font-bold text-slate-900 text-sm hover:text-[#7F1416] hover:underline cursor-pointer text-left transition-colors"
                            title="Click to view full medical history and records"
                          >
                            {patient.firstName} {patient.middleName ? `${patient.middleName.charAt(0)}.` : ''} {patient.lastName}
                          </button>
                        </div>
                      </div>

                      <span className="text-[10px] px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 shrink-0">
                        {patient.classification}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 truncate">
                        <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                        <span className="truncate">{patient.collegeOrDepartment}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                        <span>{patient.age} yrs · {patient.gender} · Blood {patient.bloodType}</span>
                        <span className="font-mono">{patient.contactNumber}</span>
                      </div>

                      {isArchived && patient.archivedReason && (
                        <div className="bg-amber-100/70 border border-amber-300 p-2 rounded text-[11px] text-amber-900 space-y-0.5">
                          <div className="font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>Archive Reason:</span>
                          </div>
                          <div>{patient.archivedReason}</div>
                          {patient.archivedAt && (
                            <div className="text-[10px] text-amber-700 font-mono">
                              Archived on {patient.archivedAt.split('T')[0]} {patient.archivedBy ? `by ${patient.archivedBy}` : ''}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        onClick={() => {
                          setSelectedPatient(patient);
                          setActiveModal('patient-profile');
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="View Complete Stored Clinical History"
                      >
                        <History className="w-3.5 h-3.5 text-[#7F1416]" />
                        <span>History</span>
                      </button>

                      {!isArchived ? (
                        <>
                          {currentUser?.role !== 'doctor' && (
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setActiveModal('record-vitals');
                              }}
                              className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-md font-semibold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Activity className="w-3.5 h-3.5" />
                              <span>Vitals</span>
                            </button>
                          )}

                          <button
                            onClick={() => setPatientToArchive(patient)}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-md font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Remove from Active & Move to Past Patients Repository"
                          >
                            <Archive className="w-3.5 h-3.5 text-amber-700" />
                            <span>Remove</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleConfirmRestore(patient)}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Restore back to Active Health Registry"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>

                          <button
                            onClick={() => setPatientToDelete(patient)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-md font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            title="Permanently Delete Record from Database"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span>Delete</span>
                          </button>
                        </>
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
          <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="text-xs font-semibold text-slate-600">
              Showing <strong className="text-slate-900">{filteredPatients.length}</strong> {statusTab === 'archived' ? 'past/archived' : statusTab === 'active' ? 'current' : 'total'} matching records
            </span>
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active: <strong>{activePatients.length}</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Past/Archived: <strong>{archivedPatients.length}</strong>
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">PSU ID Number</th>
                  <th className="py-3 px-4">Full Patient Name</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Classification</th>
                  <th className="py-3 px-4">College / Department</th>
                  <th className="py-3 px-4">Age / Sex</th>
                  <th className="py-3 px-4">Emergency Contact</th>
                  <th className="py-3 px-4 text-right">Actions & Lifecycle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPatients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No patient records matching criteria.</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {statusTab === 'archived' ? 'There are no past archived patients.' : 'Try adjusting the search query or filters.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredPatients.map(patient => {
                    const isArchived = patient.status === 'archived';
                    return (
                      <tr
                        key={patient.id}
                        className={`transition-colors ${
                          isArchived ? 'bg-amber-50/20 hover:bg-amber-50/40' : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-bold text-[#7F1416]">
                          {patient.psuId}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPatient(patient);
                              setActiveModal('patient-profile');
                            }}
                            className="font-bold text-slate-900 hover:text-[#7F1416] hover:underline cursor-pointer text-left transition-colors"
                            title="Click patient name to view full medical profile and history"
                          >
                            {patient.firstName} {patient.middleName ? `${patient.middleName.charAt(0)}.` : ''} {patient.lastName}
                          </button>
                          <div className="text-[11px] text-slate-400">{patient.contactNumber}</div>
                        </td>
                        <td className="py-3 px-4">
                          {isArchived ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                <Archive className="w-2.5 h-2.5" />
                                <span>Past / Archived</span>
                              </span>
                              {patient.archivedReason && (
                                <div className="text-[10px] text-slate-500 truncate max-w-[150px] mt-0.5" title={patient.archivedReason}>
                                  {patient.archivedReason}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>Current Active</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {patient.classification}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 max-w-[180px] truncate" title={patient.collegeOrDepartment}>
                          {patient.collegeOrDepartment}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {patient.age} yrs · {patient.gender}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div className="text-[11px] font-medium">{patient.emergencyContactName}</div>
                          <div className="text-[10px] text-slate-400">{patient.emergencyContactPhone}</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Stored History trigger */}
                            <button
                              onClick={() => {
                                setSelectedPatient(patient);
                                setActiveModal('patient-profile');
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                              title="View Full Stored History & Clinical Timeline"
                            >
                              <History className="w-3.5 h-3.5 text-[#7F1416]" />
                              <span>History</span>
                            </button>

                            {!isArchived ? (
                              <>
                                {currentUser?.role !== 'doctor' && (
                                  <button
                                    onClick={() => {
                                      setSelectedPatient(patient);
                                      setActiveModal('record-vitals');
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                                    title="Record Vitals"
                                  >
                                    <Activity className="w-4 h-4" />
                                  </button>
                                )}

                                {/* Archive / Remove Button */}
                                <button
                                  onClick={() => setPatientToArchive(patient)}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Archive / Remove Patient from Active Records"
                                >
                                  <Archive className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Remove</span>
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Restore Button */}
                                <button
                                  onClick={() => handleConfirmRestore(patient)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                                  title="Restore back to Active Health Registry"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Restore</span>
                                </button>

                                {/* Permanent Delete Button */}
                                <button
                                  onClick={() => setPatientToDelete(patient)}
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Permanently Delete Patient from Database"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Delete</span>
                                </button>
                              </>
                            )}
                          </div>
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

      {/* ========================================================================= */}
      {/* ARCHIVE / REMOVE PATIENT MODAL */}
      {/* ========================================================================= */}
      {patientToArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-amber-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5" />
                <h3 className="font-bold text-sm">Archive Patient Record</h3>
              </div>
              <button
                onClick={() => setPatientToArchive(null)}
                className="text-amber-100 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  {patientToArchive.firstName} {patientToArchive.lastName}
                </div>
                <div className="text-[11px] font-mono text-amber-800">
                  PSU ID: {patientToArchive.psuId} · {patientToArchive.classification}
                </div>
                <p className="text-[11px] text-amber-900 leading-tight pt-1">
                  Archiving moves this patient to the <strong>Past Patients Repository</strong>. All previous consultations, vital signs, prescriptions, and certificates will remain preserved and can be viewed or restored at any time.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Reason for Archival / Removal:
                </label>
                <select
                  value={archiveReasonCategory}
                  onChange={(e) => setArchiveReasonCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-amber-500 cursor-pointer text-xs"
                >
                  <option value="Graduated">Graduated / Alumni</option>
                  <option value="Transferred to Other Campus">Transferred to Other Campus</option>
                  <option value="Transferred to Other School">Transferred to Other University</option>
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
                  placeholder="e.g. Completed Bachelor of Science degree in June 2024..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPatientToArchive(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleConfirmArchive}
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
      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {patientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-rose-200" />
                <h3 className="font-bold text-sm">Permanent Database Deletion</h3>
              </div>
              <button
                onClick={() => setPatientToDelete(null)}
                className="text-rose-100 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs text-slate-700">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1">
                <div className="font-bold text-slate-900 text-sm">
                  {patientToDelete.firstName} {patientToDelete.lastName}
                </div>
                <div className="text-[11px] font-mono text-rose-800">
                  PSU ID: {patientToDelete.psuId}
                </div>
                <p className="text-[11px] text-rose-900 leading-tight pt-1">
                  <strong>WARNING:</strong> This action permanently purges this patient record from the centralized database and Firestore. This operation cannot be undone.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Type the patient's PSU ID (<code className="font-mono text-rose-700">{patientToDelete.psuId}</code>) to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmationPsuId}
                  onChange={(e) => setDeleteConfirmationPsuId(e.target.value)}
                  placeholder={patientToDelete.psuId}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setPatientToDelete(null);
                    setDeleteConfirmationPsuId('');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isProcessing || deleteConfirmationPsuId.trim() !== patientToDelete.psuId}
                  onClick={handleConfirmPermanentDelete}
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
  );
};
