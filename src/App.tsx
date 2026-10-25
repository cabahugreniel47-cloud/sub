import React from 'react';
import { ClinicProvider, useClinic } from './context/ClinicContext';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/auth/LoginPage';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { DeviceToast } from './components/layout/DeviceToast';

// Dashboards
import { AdminDashboard } from './components/dashboard/AdminDashboard';
import { DoctorDashboard } from './components/dashboard/DoctorDashboard';
import { NurseDashboard } from './components/dashboard/NurseDashboard';
import { StaffDashboard } from './components/dashboard/StaffDashboard';
import { StudentDashboard } from './components/dashboard/StudentDashboard';

// Modules
import { PatientList } from './components/patients/PatientList';
import { QueueManager } from './components/queue/QueueManager';
import { ConsultationRoom } from './components/consultation/ConsultationRoom';
import { StudentConsultationsView } from './components/student/StudentConsultationsView';
import { InventoryManager } from './components/inventory/InventoryManager';
import { DispensingDesk } from './components/dispensing/DispensingDesk';
import { AppointmentManager } from './components/appointments/AppointmentManager';
import { ReportsAnalytics } from './components/reports/ReportsAnalytics';
import { UserManagement } from './components/admin/UserManagement';
import { ActivityLogs } from './components/admin/ActivityLogs';
import { SystemSettings } from './components/admin/SystemSettings';
import { ClinClinAssistant } from './components/common/ClinClinAssistant';

// Modals
import { PatientRegistrationModal } from './components/patients/PatientRegistrationModal';
import { PatientProfileModal } from './components/patients/PatientProfileModal';
import { VitalSignsAssessmentModal } from './components/assessment/VitalSignsAssessmentModal';
import { QueueDisplayBoardModal } from './components/queue/QueueDisplayBoardModal';
import { AddMedicineModal } from './components/inventory/AddMedicineModal';
import { PrintPrescriptionModal } from './components/print/PrintPrescriptionModal';
import { PrintMedicalCertificateModal } from './components/print/PrintMedicalCertificateModal';
import { PrintCensusModal } from './components/print/PrintCensusModal';
import { UserProfileModal } from './components/admin/UserProfileModal';
import { DocumentExportModal } from './components/print/DocumentExportModal';

const ClinicAppContent: React.FC = () => {
  const {
    currentUser,
    isRestoringSession,
    activeTab,
    activeModal,
    setActiveModal,
    modalPayload,
    isMobile,
    deviceMode,
    setDeviceMode
  } = useClinic();

  if (isRestoringSession) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-4">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold tracking-wide text-slate-300">Restoring Centralized Clinic Session...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  // Render main tab view
  const renderTabContent = () => {
    // Strict RBAC: Student/Patient accounts can only access student-permitted modules
    if (currentUser.role === 'student') {
      const studentAllowed = ['dashboard', 'consultations', 'appointments'];
      if (!studentAllowed.includes(activeTab)) {
        return <StudentDashboard />;
      }
    }

    // Strict RBAC & Privacy Guard (RA 10173): Administrator only accesses Central Command, User Accounts & Roles, Audit Logs, and System Settings
    if (currentUser.role === 'administrator') {
      const adminAllowed = ['dashboard', 'users', 'logs', 'settings'];
      if (!adminAllowed.includes(activeTab)) {
        return <AdminDashboard />;
      }
    }

    // Strict RBAC: Doctor accesses Doctor Dashboard, Patient Queue, Consultation, Patient Medical History, and Appointments Schedule
    if (currentUser.role === 'doctor') {
      const doctorAllowed = ['dashboard', 'queue', 'consultations', 'patients', 'appointments'];
      if (!doctorAllowed.includes(activeTab)) {
        return <DoctorDashboard />;
      }
    }

    // Strict RBAC: Staff only accesses Supplies Directory (inventory)
    if (currentUser.role === 'staff') {
      const staffAllowed = ['inventory'];
      if (!staffAllowed.includes(activeTab)) {
        return <InventoryManager />;
      }
    }

    switch (activeTab) {
      case 'dashboard':
        if (currentUser.role === 'administrator') return <AdminDashboard />;
        if (currentUser.role === 'doctor') return <DoctorDashboard />;
        if (currentUser.role === 'nurse') return <NurseDashboard />;
        if (currentUser.role === 'staff') return <StaffDashboard />;
        if (currentUser.role === 'student') return <StudentDashboard />;
        return <AdminDashboard />;

      case 'patients':
        return <PatientList />;

      case 'vitals':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-slate-900">Health Assessment</h1>
                <p className="text-xs text-slate-500 mt-0.5">Capture hemodynamic metrics, pain scale, and calculate body mass index.</p>
              </div>
              <button
                onClick={() => setActiveModal('record-vitals')}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
              >
                + Record Health Assessment
              </button>
            </div>
            <PatientList />
          </div>
        );

      case 'queue':
        return <QueueManager />;

      case 'consultations':
        if (currentUser.role === 'student') {
          return <StudentConsultationsView />;
        }
        return <ConsultationRoom />;

      case 'inventory':
        return <InventoryManager />;

      case 'dispensing':
        return <DispensingDesk />;

      case 'appointments':
        return <AppointmentManager />;

      case 'reports':
        return <ReportsAnalytics />;

      case 'users':
        return <UserManagement />;

      case 'logs':
        return <ActivityLogs />;

      case 'settings':
        return <SystemSettings />;

      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      <Navbar />
      <DeviceToast />

      <div className="flex-1 flex w-full relative">
        {/* Sidebar: Persistent on PC/Laptop, Slide-out overlay drawer on Mobile */}
        <Sidebar />

        {/* Main Content Area: Responsive padding with safe bottom space for mobile navigation */}
        <main className={`flex-1 p-3 sm:p-5 lg:p-7 overflow-y-auto max-w-7xl mx-auto w-full transition-all duration-200 ${
          isMobile ? 'pb-24' : 'pb-10'
        }`}>
          {renderTabContent()}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Thumb ergonomic quick bar) */}
      {isMobile && <MobileBottomNav />}

      {/* Global Modals */}
      {activeModal === 'new-patient' && <PatientRegistrationModal />}
      {activeModal === 'patient-profile' && <PatientProfileModal />}
      {activeModal === 'record-vitals' && <VitalSignsAssessmentModal />}
      {activeModal === 'tv-queue' && <QueueDisplayBoardModal />}
      {activeModal === 'new-medicine' && <AddMedicineModal />}
      {activeModal === 'user-profile' && <UserProfileModal />}
      {activeModal === 'print-rx' && <PrintPrescriptionModal />}
      {activeModal === 'print-med-cert' && <PrintMedicalCertificateModal />}
      {activeModal === 'print-census' && <PrintCensusModal />}
      {activeModal === 'print-queue-receipt' && <DocumentExportModal documentType="queue-receipt" />}
      {activeModal === 'print-registration-receipt' && <DocumentExportModal documentType="registration-receipt" />}
      {activeModal === 'export-record' && <DocumentExportModal documentType="patient-summary" />}
      {activeModal === 'export-inventory' && <DocumentExportModal documentType="inventory-report" />}
      {activeModal === 'document-export' && (
        <DocumentExportModal
          documentType={
            (modalPayload?.type as any) === 'medical-certificate'
              ? 'medical-certificate'
              : (modalPayload?.type as any) === 'census'
              ? 'census'
              : (modalPayload?.type as any) === 'queue-receipt'
              ? 'queue-receipt'
              : (modalPayload?.type as any) === 'registration-receipt'
              ? 'registration-receipt'
              : (modalPayload?.type as any) === 'patient-summary'
              ? 'patient-summary'
              : (modalPayload?.type as any) === 'inventory-report'
              ? 'inventory-report'
              : 'rx'
          }
        />
      )}


      {/* Global AI Assistant across all authenticated roles */}
      <ClinClinAssistant />
    </div>
  );
};

export default function App() {
  return (
    <ClinicProvider>
      <ClinicAppContent />
    </ClinicProvider>
  );
}
