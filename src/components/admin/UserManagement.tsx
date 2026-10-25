import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { User, UserRole, RegistrationRequest, VerificationReceipt } from '../../types/clinic';
import { RolePermissionsMatrix } from './RolePermissionsMatrix';
import { EditUserModal } from './EditUserModal';
import { VerificationEmailReceiptModal } from './VerificationEmailReceiptModal';
import { AccountActivationModal } from '../auth/AccountActivationModal';
import {
  ShieldCheck,
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  Key,
  Camera,
  Shield,
  Stethoscope,
  Activity,
  Users,
  Lock,
  Trash2,
  Sliders,
  AlertTriangle,
  Mail,
  Phone,
  Building,
  Clock,
  CheckCircle2,
  FileText,
  Send,
  Eye,
  MessageSquare,
  Edit3,
  Receipt
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const {
    users,
    addUser,
    updateUser,
    toggleUserStatus,
    updateUserRole,
    deleteUser,
    resetUserPassword,
    registrationRequests,
    approveRegistrationRequest,
    rejectRegistrationRequest,
    requestAdditionalInfo,
    lastIssuedReceipt,
    setLastIssuedReceipt,
    getVerificationReceiptForUser,
    currentUser,
    setActiveModal,
    showToast
  } = useClinic();

  const [activeSubTab, setActiveSubTab] = useState<'users' | 'requests' | 'permissions'>('users');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Email Receipt Viewer State
  const [receiptToView, setReceiptToView] = useState<VerificationReceipt | null>(null);

  // Account Activation Modal State
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationTokenForModal, setActivationTokenForModal] = useState('');

  // Add User Modal State (Admin, Doctor, Nurse, Clinic Staff, Student/Patient - unlimited users per role!)
  const [showAddModal, setShowAddModal] = useState(false);
  const [targetNewRole, setTargetNewRole] = useState<UserRole>('doctor');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [institutionalId, setInstitutionalId] = useState('');
  const [title, setTitle] = useState('');
  const [prcLicense, setPrcLicense] = useState('');
  const [ptrNumber, setPtrNumber] = useState('');
  const [department, setDepartment] = useState('University Medical Clinic');
  const [contactNumber, setContactNumber] = useState('');
  const [accountStatusOption, setAccountStatusOption] = useState<'pending_activation' | 'active'>('pending_activation');

  // Registration Request Review Modal
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [adminReviewNotes, setAdminReviewNotes] = useState('');
  const [inquiryText, setInquiryText] = useState('');
  const [showInquiryInput, setShowInquiryInput] = useState(false);

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState<User | null>(null);
  const [generatedTempPass, setGeneratedTempPass] = useState<string | null>(null);

  // Filter users
  const filteredUsers = users.filter(u => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.fullName.toLowerCase().includes(q) ||
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.title.toLowerCase().includes(q) ||
      (u.institutionalId && u.institutionalId.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  const pendingRequestsCount = registrationRequests.filter(r => r.status === 'Pending').length;

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username || !email) {
      showToast('Please fill in required user details.', 'warning');
      return;
    }

    const result = await addUser(
      {
        username,
        fullName,
        email,
        role: targetNewRole,
        institutionalId: institutionalId || undefined,
        title: title || (targetNewRole === 'doctor' ? 'University Physician' : targetNewRole === 'nurse' ? 'Registered Nurse' : targetNewRole === 'administrator' ? 'Clinic Administrator' : targetNewRole === 'staff' ? 'Clinic Staff' : 'Student / Patient'),
        prcLicense: prcLicense || undefined,
        ptrNumber: ptrNumber || undefined,
        contactNumber: contactNumber || undefined,
        department,
        status: accountStatusOption === 'pending_activation' ? 'inactive' : 'active',
        accountStatus: accountStatusOption
      },
      { sendActivationEmail: true, accountStatus: accountStatusOption }
    );

    if (!result.success) {
      return;
    }

    setShowAddModal(false);
    // Open verification email receipt preview immediately
    if (result.receipt) {
      setReceiptToView(result.receipt);
    }

    // Reset form
    setFullName('');
    setUsername('');
    setEmail('');
    setInstitutionalId('');
    setTitle('');
    setPrcLicense('');
    setPtrNumber('');
    setContactNumber('');
  };

  const handleApproveRequest = async (req: RegistrationRequest) => {
    const res = await approveRegistrationRequest(req.id, adminReviewNotes);
    setSelectedRequest(null);
    setAdminReviewNotes('');
    if (res.receipt) {
      setReceiptToView(res.receipt);
    }
  };

  const handleRejectRequest = (req: RegistrationRequest) => {
    rejectRegistrationRequest(req.id, adminReviewNotes || 'Information could not be verified.');
    setSelectedRequest(null);
    setAdminReviewNotes('');
  };

  const handleSendClarification = (req: RegistrationRequest) => {
    if (!inquiryText.trim()) return;
    requestAdditionalInfo(req.id, inquiryText);
    setSelectedRequest(null);
    setShowInquiryInput(false);
    setInquiryText('');
  };

  const handleResetPassword = async (user: User) => {
    const res = await resetUserPassword(user.id);
    if (res.tempPass) {
      setGeneratedTempPass(res.tempPass);
      setResetModalUser(user);
    }
  };

  const handleViewReceipt = (user: User) => {
    const receipt = getVerificationReceiptForUser(user.id);
    if (receipt) {
      setReceiptToView(receipt);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#7F1416] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Master System Administration & Access Control</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Clinic Personnel & Authorized Accounts
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            As Master System Administrator, create, authorize, activate, and manage Doctor, Nurse, and Staff accounts with no role limits. Review and verify incoming self-registration requests.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveModal('user-profile')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300 shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5 text-[#7F1416]" />
            <span>My Profile</span>
          </button>

          <button
            onClick={() => {
              setTargetNewRole('doctor');
              setTitle('University Physician & Internist');
              setDepartment('Physician Consultation Office');
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ Add Authorized User</span>
          </button>
        </div>
      </div>

      {/* Main Switcher: Personnel Accounts vs Registration Requests vs Role Permissions */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'users'
              ? 'bg-[#7F1416] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Personnel Accounts ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('requests')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 relative ${
            activeSubTab === 'requests'
              ? 'bg-[#7F1416] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5 text-amber-500" />
          <span>Registration Requests</span>
          {pendingRequestsCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 animate-pulse">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('permissions')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'permissions'
              ? 'bg-[#7F1416] text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          <span>Role & Permissions Matrix</span>
        </button>
      </div>

      {/* SUB-TAB 1: PERSONNEL ACCOUNTS */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          {/* Quick Filter Bar by Role */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search staff name, email, role, or title..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white text-xs"
              />
            </div>

            {/* Role Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto">
              <button
                onClick={() => setRoleFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  roleFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({users.length})
              </button>
              <button
                onClick={() => setRoleFilter('doctor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  roleFilter === 'doctor'
                    ? 'bg-blue-700 text-white'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                🩺 Doctors ({users.filter(u => u.role === 'doctor').length})
              </button>
              <button
                onClick={() => setRoleFilter('nurse')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  roleFilter === 'nurse'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                💉 Nurses ({users.filter(u => u.role === 'nurse').length})
              </button>
              <button
                onClick={() => setRoleFilter('staff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  roleFilter === 'staff'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                📋 Staff ({users.filter(u => u.role === 'staff').length})
              </button>
              <button
                onClick={() => setRoleFilter('administrator')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  roleFilter === 'administrator'
                    ? 'bg-red-900 text-white'
                    : 'bg-red-50 text-red-900 hover:bg-red-100'
                }`}
              >
                👑 Admins ({users.filter(u => u.role === 'administrator').length})
              </button>
              <button
                onClick={() => setRoleFilter('student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  roleFilter === 'student'
                    ? 'bg-purple-900 text-white'
                    : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                }`}
              >
                🎓 Students ({users.filter(u => u.role === 'student').length})
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Authorized Personnel</th>
                    <th className="py-3.5 px-4">Credentials & Contact</th>
                    <th className="py-3.5 px-4">System Role</th>
                    <th className="py-3.5 px-4">PRC / PTR License</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No users found matching search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-sm">{user.fullName}</div>
                          <div className="text-[11px] text-slate-500">{user.title}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">@{user.username}</span>
                            {user.institutionalId && (
                              <span className="text-[10px] font-mono font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200">
                                ID: {user.institutionalId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-600 text-[11px]">
                          <div>{user.email}</div>
                          <div className="text-slate-400">{user.contactNumber || 'No phone recorded'}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'administrator' ? 'bg-red-100 text-red-800' :
                            user.role === 'doctor' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'nurse' ? 'bg-emerald-100 text-emerald-800' :
                            user.role === 'staff' ? 'bg-amber-100 text-amber-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {user.role}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-0.5">{user.department}</div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          {user.prcLicense ? (
                            <span className="text-blue-900 font-semibold">PRC: {user.prcLicense}</span>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                          {user.ptrNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">PTR: {user.ptrNumber}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => toggleUserStatus(user.id)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                              user.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                            }`}
                            title="Click to toggle active/inactive account status"
                          >
                            ● {user.status.toUpperCase()}
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Edit User Button */}
                            <button
                              onClick={() => setEditingUser(user)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Edit user details, role assignment, and institutional ID"
                            >
                              <Edit3 className="w-3 h-3 text-slate-600" />
                              <span>Edit</span>
                            </button>

                            {/* View Email Verification Receipt Button */}
                            <button
                              onClick={() => handleViewReceipt(user)}
                              className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="View registration confirmation email receipt and activation link"
                            >
                              <Receipt className="w-3 h-3 text-emerald-600" />
                              <span>Receipt</span>
                            </button>

                            {/* Reset Credentials Button */}
                            <button
                              onClick={() => handleResetPassword(user)}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                              title="Reset user credentials / generate temporary activation key"
                            >
                              <Key className="w-3 h-3 text-amber-700" />
                              <span>Reset</span>
                            </button>

                            {/* Delete Button */}
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                                title="Delete user account"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: REGISTRATION REQUESTS (Self-Registration Queue) */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Incoming Registration & Account Requests
              </div>
              <div className="text-slate-500 text-[11px]">
                Approving a request generates a 6-digit verification code &amp; temporary password and opens the Gmail dispatch preview.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const nowStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
                    ' ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const testCode = `PSU-${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
                  const testPass = `PsuClinic@${Math.floor(1000 + Math.random() * 9000)}`;
                  const testToken = `act_${Math.random().toString(36).substring(2, 10)}`;
                  setReceiptToView({
                    id: `rec-test-${Date.now()}`,
                    recipientName: 'Dominique Serrano',
                    recipientEmail: 'dominiqueserrano100@gmail.com',
                    recipientPhone: '+63 917 555 0199',
                    username: 'dominiqueserrano100',
                    assignedRole: 'student',
                    institutionalId: '2026-01948-BC',
                    department: 'College of Computing Studies',
                    accountStatus: 'active',
                    activationToken: testToken,
                    verificationCode: testCode,
                    temporaryPassword: testPass,
                    activationUrl: `https://clinic.psu.edu.ph/activate?token=${testToken}`,
                    issuedAt: nowStr,
                    issuedBy: currentUser?.fullName || 'Master System Administrator',
                    referenceNumber: `REC-${Date.now().toString().slice(-6)}`
                  });
                }}
                className="px-3.5 py-1.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
              >
                <Mail className="w-3.5 h-3.5 text-amber-300" />
                <span>Test Email to dominiqueserrano100@gmail.com</span>
              </button>

              <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full font-bold text-xs">
                {pendingRequestsCount} Pending Review
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Applicant Name</th>
                    <th className="py-3.5 px-4">Requested Role</th>
                    <th className="py-3.5 px-4">Institutional ID / Email</th>
                    <th className="py-3.5 px-4">Submitted Date</th>
                    <th className="py-3.5 px-4">Verification Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {registrationRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-slate-400">
                        No registration requests at this time.
                      </td>
                    </tr>
                  ) : (
                    registrationRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{req.fullName}</div>
                          <div className="text-[11px] text-slate-500">{req.department}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            req.requestedRole === 'doctor' ? 'bg-blue-100 text-blue-800' :
                            req.requestedRole === 'nurse' ? 'bg-emerald-100 text-emerald-800' :
                            req.requestedRole === 'staff' ? 'bg-amber-100 text-amber-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {req.requestedRole}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px]">
                          <div className="font-semibold text-slate-800">{req.institutionalId || 'None'}</div>
                          <div className="text-slate-500">{req.email}</div>
                          <div className="text-[10px] text-slate-400">{req.contactNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {req.submittedAt}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            req.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                            req.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                            req.status === 'Needs Information' ? 'bg-blue-100 text-blue-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedRequest(req)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                            >
                              <span>View Details</span>
                            </button>

                            {req.status === 'Approved' && (
                              <button
                                onClick={() => {
                                  const matchedUser = users.find(u => u.email.toLowerCase() === req.email.toLowerCase());
                                  const token = req.activationToken || matchedUser?.activationToken || `act_${req.id.slice(-8)}`;
                                  const code = req.verificationCode || matchedUser?.verificationCode || `PSU-849-201`;
                                  const tempPass = req.temporaryPassword || matchedUser?.temporaryPassword || matchedUser?.password || 'PsuClinic@2026';
                                  setReceiptToView({
                                    id: `rec-${req.id}`,
                                    recipientName: req.fullName,
                                    recipientEmail: req.email,
                                    recipientPhone: req.contactNumber,
                                    username: matchedUser?.username || req.email.split('@')[0] || 'user',
                                    assignedRole: req.requestedRole,
                                    institutionalId: req.institutionalId,
                                    department: req.department,
                                    accountStatus: 'active',
                                    activationToken: token,
                                    verificationCode: code,
                                    temporaryPassword: tempPass,
                                    activationUrl: `https://clinic.psu.edu.ph/activate?token=${token}`,
                                    issuedAt: req.reviewedAt || req.submittedAt,
                                    issuedBy: req.reviewedBy || currentUser?.fullName || 'Master System Administrator',
                                    referenceNumber: `REC-${req.id.slice(-6).toUpperCase()}`
                                  });
                                }}
                                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              >
                                <Mail className="w-3 h-3 text-emerald-700" />
                                <span>Email Credentials</span>
                              </button>
                            )}

                            {req.status === 'Pending' && (
                              <>
                                <button
                                  onClick={() => handleApproveRequest(req)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] cursor-pointer shadow-xs"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectRequest(req)}
                                  className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded font-bold text-[11px] cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: PERMISSIONS MATRIX */}
      {activeSubTab === 'permissions' && (
        <RolePermissionsMatrix />
      )}

      {/* ADD USER MODAL (Strictly Admin, Doctor, Nurse, Clinic Staff. Student removed!) */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-[#7F1416] via-[#94191c] to-[#7F1416] text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base">Register Authorized Personnel</h3>
                <p className="text-xs text-red-200">
                  System sends official verification email and activation link automatically
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-red-200 hover:text-white p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 text-xs text-slate-800 max-h-[80vh] overflow-y-auto">
              {/* Target Role Selector: Admin, Doctor, Nurse, Staff */}
              <div>
                <label className="block font-bold mb-1.5 text-slate-700">Account Type & Authority Role *</label>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTargetNewRole('doctor');
                      setTitle('University Physician & Internist');
                      setDepartment('Physician Consultation Office');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      targetNewRole === 'doctor'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">🩺</div>
                    <div className="text-[11px]">Doctor</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetNewRole('nurse');
                      setTitle('University Triage Nurse');
                      setDepartment('Triage & Vital Signs Station');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      targetNewRole === 'nurse'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">💉</div>
                    <div className="text-[11px]">Nurse</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetNewRole('staff');
                      setTitle('Clinic Intake Specialist');
                      setDepartment('Patient Reception & Records Desk');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      targetNewRole === 'staff'
                        ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">📋</div>
                    <div className="text-[11px]">Staff</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTargetNewRole('administrator');
                      setTitle('Clinic Administrator');
                      setDepartment('PSU Health & Medical Services Office');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer ${
                      targetNewRole === 'administrator'
                        ? 'border-red-600 bg-red-50 text-red-900 ring-2 ring-red-500/20'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="text-base mb-0.5">👑</div>
                    <div className="text-[11px]">Admin</div>
                  </button>
                </div>
                <div className="text-[10px] text-slate-400 mt-1.5">
                  * Admin adds authorized clinic personnel: Admin, Doctor, Nurse, Clinic Staff. Student/Patient accounts are user-requested or processed walk-in.
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block font-bold mb-1">Full Legal & Professional Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={targetNewRole === 'doctor' ? 'e.g. Dr. Arthur M. Ramos, MD' : targetNewRole === 'nurse' ? 'e.g. Christine P. David, RN' : 'e.g. Juan S. Dela Cruz'}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              {/* Username & Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Username *</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. doctor.ramos"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">University Email Address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ramos.clinic@psu.edu.ph"
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              {/* Institutional ID */}
              <div>
                <label className="block font-bold mb-1">Institutional ID (Employee / Faculty / Student ID)</label>
                <input
                  type="text"
                  value={institutionalId}
                  onChange={(e) => setInstitutionalId(e.target.value)}
                  placeholder="e.g. EMP-2024-0012 or 2024-01829-BC"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              {/* Initial Status Option */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <label className="block font-bold text-slate-700">Account Setup & Password Delivery *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountStatusOption('pending_activation')}
                    className={`p-2 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                      accountStatusOption === 'pending_activation'
                        ? 'border-[#7F1416] bg-red-50 text-[#7F1416] ring-1 ring-red-400'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-xs">✉️ Activation Link (Recommended)</div>
                    <div className="text-[10px] text-slate-500 font-normal">Sends verification email; user establishes password</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountStatusOption('active')}
                    className={`p-2 rounded-lg border text-left font-bold transition-all cursor-pointer ${
                      accountStatusOption === 'active'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-400'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-xs">✓ Active Immediately</div>
                    <div className="text-[10px] text-slate-500 font-normal">Immediate clinic workstation access granted</div>
                  </button>
                </div>
              </div>

              {/* Contact Number */}
              <div>
                <label className="block font-bold mb-1">Contact Number (SMS Notifications)</label>
                <input
                  type="text"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="+63 917 123 4567"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>

              {/* Position Title & Department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Position / Designation</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. University Physician"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Assigned Clinic Station</label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Physician Office"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* PRC License & PTR */}
              {(targetNewRole === 'doctor' || targetNewRole === 'nurse') && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-blue-50/60 border border-blue-200 rounded-xl">
                  <div>
                    <label className="block font-bold mb-1 text-blue-900">PRC License Number</label>
                    <input
                      type="text"
                      value={prcLicense}
                      onChange={(e) => setPrcLicense(e.target.value)}
                      placeholder="e.g. 0098412"
                      className="w-full p-2 bg-white border border-blue-300 rounded text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold mb-1 text-blue-900">PTR Number</label>
                    <input
                      type="text"
                      value={ptrNumber}
                      onChange={(e) => setPtrNumber(e.target.value)}
                      placeholder="e.g. PTR-8834921-2026"
                      className="w-full p-2 bg-white border border-blue-300 rounded text-xs font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                ✉️ <strong>Verification Email:</strong> The system will automatically dispatch an official account activation email containing instructions and an activation link to the user's email address.
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Authorize & Dispatch Activation Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUEST REVIEW & DETAILS MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Registration Request Details</h3>
                <p className="text-xs text-slate-300">Reference #{selectedRequest.id}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="text-slate-300 hover:text-white p-1">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="space-y-2 border-b border-slate-200 pb-3">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedRequest.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requested Role:</span>
                  <span className="font-bold uppercase text-red-700">{selectedRequest.requestedRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Institutional ID:</span>
                  <span className="font-mono text-slate-800">{selectedRequest.institutionalId || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address:</span>
                  <span className="font-mono text-slate-800">{selectedRequest.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Number:</span>
                  <span className="font-mono text-slate-800">{selectedRequest.contactNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department / College:</span>
                  <span className="text-slate-800 font-semibold">{selectedRequest.department}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Reason / Justification:</span>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700">
                    {selectedRequest.reason}
                  </div>
                </div>
              </div>

              {/* Admin Review Notes */}
              <div>
                <label className="block font-bold mb-1">Admin Verification Notes / Remarks</label>
                <textarea
                  rows={2}
                  value={adminReviewNotes}
                  onChange={(e) => setAdminReviewNotes(e.target.value)}
                  placeholder="e.g. Verified with HR / College dean. Approved."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              {showInquiryInput && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <span className="font-bold text-amber-900">Request Additional Information:</span>
                  <input
                    type="text"
                    value={inquiryText}
                    onChange={(e) => setInquiryText(e.target.value)}
                    placeholder="e.g. Please provide your PRC license number or current student enrollment form."
                    className="w-full p-2 bg-white border border-amber-300 rounded-lg text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => handleSendClarification(selectedRequest)}
                    className="px-3 py-1.5 bg-amber-700 text-white rounded font-bold text-xs cursor-pointer"
                  >
                    Send Clarification Email
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInquiryInput(!showInquiryInput)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer"
                >
                  Request Info
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRejectRequest(selectedRequest)}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl font-bold cursor-pointer"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApproveRequest(selectedRequest)}
                    className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold cursor-pointer shadow-md"
                  >
                    Approve & Dispatch Activation Email
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET CONFIRMATION MODAL */}
      {resetModalUser && generatedTempPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>One-Time Password Issued</span>
              </span>
              <button
                onClick={() => {
                  setResetModalUser(null);
                  setGeneratedTempPass(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 leading-relaxed">
                A temporary master security key has been generated for <strong>{resetModalUser.fullName}</strong> ({resetModalUser.email}).
              </div>

              <div className="text-center p-4 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                  Temporary Master Passcode
                </span>
                <div className="font-mono text-xl font-black text-[#7F1416] tracking-wider select-all">
                  {generatedTempPass}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Click or highlight to copy. Valid for next authentication attempt.
                </span>
              </div>

              <p className="text-[10px] text-slate-500 leading-tight">
                🔒 Security Note: This event has been permanently recorded in the RA 10173 System Audit Trail with your Administrator ID and timestamp.
              </p>

              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(generatedTempPass);
                  showToast('Passcode copied to clipboard!', 'info');
                  setResetModalUser(null);
                  setGeneratedTempPass(null);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs cursor-pointer shadow-sm"
              >
                Copy Passcode & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      <EditUserModal
        user={editingUser}
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSave={(userId, updates) => updateUser(userId, updates)}
      />

      {/* VERIFICATION EMAIL RECEIPT MODAL */}
      <VerificationEmailReceiptModal
        receipt={receiptToView}
        onClose={() => setReceiptToView(null)}
        onOpenActivation={(token) => {
          setReceiptToView(null);
          setActivationTokenForModal(token);
          setShowActivationModal(true);
        }}
      />

      {/* ACCOUNT ACTIVATION MODAL */}
      <AccountActivationModal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        initialToken={activationTokenForModal}
        onActivatedSuccess={(username) => {
          showToast(`Account activated for @${username}! Credentials established.`, 'success');
        }}
      />
    </div>
  );
};
