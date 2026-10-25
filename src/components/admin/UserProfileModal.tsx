import React, { useState, useRef, useEffect } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  X,
  Camera,
  Upload,
  Check,
  AlertCircle,
  Shield,
  Lock,
  User as UserIcon,
  Mail,
  Phone,
  Building,
  Award,
  FileText,
  Trash2,
  PenTool,
  RotateCcw,
  Sparkles
} from 'lucide-react';

// Preset professional avatars
const PRESET_AVATARS = [
  {
    id: 'doc-m',
    label: 'Male Physician',
    url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&crop=faces&q=80'
  },
  {
    id: 'doc-f',
    label: 'Female Physician',
    url: 'https://images.unsplash.com/photo-1594824813576-857e4e11e03a?w=200&h=200&fit=crop&crop=faces&q=80'
  },
  {
    id: 'nurse-f',
    label: 'Nurse Specialist',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=200&h=200&fit=crop&crop=faces&q=80'
  },
  {
    id: 'nurse-m',
    label: 'Triage Nurse',
    url: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=200&h=200&fit=crop&crop=faces&q=80'
  },
  {
    id: 'admin-m',
    label: 'Administrator',
    url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=faces&q=80'
  },
  {
    id: 'staff-f',
    label: 'Intake Staff',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces&q=80'
  },
  {
    id: 'medic-crest',
    label: 'PSU Medical Crest',
    url: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=200&h=200&fit=crop&q=80'
  }
];

export const UserProfileModal: React.FC = () => {
  const { currentUser, updateCurrentUserProfile, setActiveModal, showToast } = useClinic();

  if (!currentUser) return null;

  // Form State for Valid Fields
  const [fullName, setFullName] = useState(currentUser.fullName || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [title, setTitle] = useState(currentUser.title || '');
  const [department, setDepartment] = useState(currentUser.department || '');
  const [contactNumber, setContactNumber] = useState(currentUser.contactNumber || '+63 917 882 9011');
  const [officeLocation, setOfficeLocation] = useState(currentUser.officeLocation || 'Main Clinic Building, Room 101');
  const [prcLicense, setPrcLicense] = useState(currentUser.prcLicense || '');
  const [ptrNumber, setPtrNumber] = useState(currentUser.ptrNumber || '');
  const [s2License, setS2License] = useState(currentUser.s2License || '');
  const [bio, setBio] = useState(currentUser.bio || '');
  const [avatar, setAvatar] = useState<string | undefined>(currentUser.avatar);
  const [digitalSignature, setDigitalSignature] = useState<string | undefined>(currentUser.digitalSignature);

  // UI Tabs & Modes
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials' | 'signature'>('profile');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
  const [isDrawing, setIsDrawing] = useState(false);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Canvas ref for drawing electronic signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const signatureFileInputRef = useRef<HTMLInputElement | null>(null);

  // Validate only the valid information
  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = 'Full Name is required and cannot be empty.';
    }

    if (!email.trim()) {
      newErrors.email = 'University email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please provide a valid email format (e.g. name@psu.edu.ph).';
    }

    if (contactNumber && !/^[+0-9\s-]{7,16}$/.test(contactNumber)) {
      newErrors.contactNumber = 'Contact number should contain 7 to 15 digits (e.g. +63 917 123 4567).';
    }

    if ((currentUser.role === 'doctor' || currentUser.role === 'nurse') && !prcLicense.trim()) {
      newErrors.prcLicense = 'PRC License Number is strongly recommended for healthcare practitioners.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPG, PNG, WebP).', 'warning');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToast('Image size exceeds 3MB. Please select a smaller photo.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatar(result);
      setShowAvatarPicker(false);
      showToast('Custom profile picture uploaded! Click Save to apply.', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Handle Signature Image Upload
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setDigitalSignature(result);
      showToast('Digital signature file loaded successfully.', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Canvas drawing handlers for signature
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#002B7F'; // Professional deep blue medical ink
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setDigitalSignature(canvas.toDataURL('image/png'));
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setDigitalSignature(undefined);
    }
  };

  // Save changes
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    updateCurrentUserProfile({
      fullName: fullName.trim(),
      email: email.trim(),
      title: title.trim(),
      department: department.trim(),
      contactNumber: contactNumber.trim(),
      officeLocation: officeLocation.trim(),
      prcLicense: prcLicense.trim() || undefined,
      ptrNumber: ptrNumber.trim() || undefined,
      s2License: s2License.trim() || undefined,
      bio: bio.trim(),
      avatar: avatar || undefined,
      digitalSignature: digitalSignature || undefined
    });

    setActiveModal(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#7F1416] to-[#5e0d0f] text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                User Profile & Credentials Settings
              </h2>
              <p className="text-[11px] text-red-200/90 font-medium">
                Customize profile picture, clinical designations, contact details & e-signature
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Profile Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 pt-3 flex gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'profile'
                ? 'border-[#7F1416] text-[#7F1416] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile Picture & Basic Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credentials')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'credentials'
                ? 'border-[#7F1416] text-[#7F1416] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Professional Licenses & Office</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('signature')}
            className={`pb-2.5 px-3 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'signature'
                ? 'border-[#7F1416] text-[#7F1416] font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Digital Signature Stamp</span>
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-800">
          {/* TAB 1: PROFILE PICTURE & BASIC INFO */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Profile Picture Customization Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Profile Picture Customization
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Avatar Display */}
                  <div className="relative group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-red-800 to-amber-500 border-2 border-white shadow-md flex items-center justify-center shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-3xl font-black text-white uppercase">
                          {fullName.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-black/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity cursor-pointer text-[10px] font-semibold"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Change</span>
                    </button>

                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>

                  {/* Actions & Preset Avatars */}
                  <div className="space-y-2 flex-1 text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-[#7F1416] hover:bg-[#6a0e10] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                        className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>{showAvatarPicker ? 'Hide Presets' : 'Choose Preset Avatar'}</span>
                      </button>

                      {avatar && (
                        <button
                          type="button"
                          onClick={() => setAvatar(undefined)}
                          className="px-2.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                          title="Reset to Initials"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Reset</span>
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500">
                      Supports JPG, PNG, or WebP up to 3MB. Displayed across patient records, consultations, and headers.
                    </p>
                  </div>
                </div>

                {/* Preset Avatar Gallery Tray */}
                {showAvatarPicker && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase">
                      Select University / Clinic Persona:
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {PRESET_AVATARS.map(preset => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatar(preset.url);
                            setShowAvatarPicker(false);
                          }}
                          className={`group relative p-1 rounded-xl border transition-all cursor-pointer text-center ${
                            avatar === preset.url
                              ? 'border-[#7F1416] bg-red-50 ring-2 ring-red-700/20'
                              : 'border-slate-200 hover:border-slate-400 bg-white'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            className="w-12 h-12 rounded-lg object-cover mx-auto"
                          />
                          <span className="block text-[9px] text-slate-600 truncate mt-1 group-hover:text-[#7F1416]">
                            {preset.label}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Editable Valid Information Fields */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Valid User Information (Editable)
                  </span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                    ✓ Validated Fields
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Full Legal / Professional Name <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Dr. Roberto M. Manalo, MD, FPCP"
                      className={`w-full p-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-red-600 text-xs ${
                        errors.fullName ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                      }`}
                    />
                    {errors.fullName && (
                      <p className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.fullName}</span>
                      </p>
                    )}
                  </div>

                  {/* University Email */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      University Email Address <span className="text-red-600">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor.manalo@psu.edu.ph"
                        className={`w-full pl-9 pr-3 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-red-600 text-xs font-mono ${
                          errors.email ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.email}</span>
                      </p>
                    )}
                  </div>

                  {/* Professional Title */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Designation / Position Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. University Physician & Internist"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 text-xs"
                    />
                  </div>

                  {/* Contact Number */}
                  <div className="space-y-1">
                    <label className="block font-bold text-slate-700">
                      Mobile / Telephone Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="+63 917 123 4567"
                        className={`w-full pl-9 pr-3 py-2.5 bg-white border rounded-lg focus:ring-2 focus:ring-red-600 text-xs font-mono ${
                          errors.contactNumber ? 'border-red-500 bg-red-50/20' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.contactNumber && (
                      <p className="text-[10px] text-red-600 flex items-center gap-1 mt-0.5">
                        <AlertCircle className="w-3 h-3" />
                        <span>{errors.contactNumber}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Protected / Read-Only Notice Box */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>System Protected Account Properties (Read-Only)</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono text-slate-700">
                  <div className="bg-white p-2 rounded border border-amber-200/60">
                    <div className="text-[9px] text-slate-400 uppercase font-sans">User ID</div>
                    <div className="font-bold truncate text-slate-900">{currentUser.id}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-amber-200/60">
                    <div className="text-[9px] text-slate-400 uppercase font-sans">Security Role</div>
                    <div className="font-bold text-[#7F1416] uppercase truncate">{currentUser.role}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-amber-200/60">
                    <div className="text-[9px] text-slate-400 uppercase font-sans">Account Status</div>
                    <div className="font-bold text-emerald-700 capitalize truncate">{currentUser.status}</div>
                  </div>
                  <div className="bg-white p-2 rounded border border-amber-200/60">
                    <div className="text-[9px] text-slate-400 uppercase font-sans">Last Login</div>
                    <div className="font-bold truncate text-slate-600">{currentUser.lastLogin?.split(' ')[0] || 'Active'}</div>
                  </div>
                </div>
                <p className="text-[10px] text-amber-800 leading-tight">
                  🔒 Note: In compliance with Republic Act No. 10173 and PSU Clinic Access Policies, security roles cannot be escalated by users. Only designated System Administrators can adjust privileges.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: CREDENTIALS & LICENSES */}
          {activeTab === 'credentials' && (
            <div className="space-y-5">
              <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-blue-900 leading-relaxed">
                  These verified clinical licenses (PRC, PTR, S2) are automatically stamped on official electronic prescriptions, medical clearance certificates, and DOH census reports issued under your name.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Department / Unit */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Assigned Unit / Department
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="University Health & Medical Services"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 text-xs"
                    />
                  </div>
                </div>

                {/* Office Location */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    Clinic Office / Station Room
                  </label>
                  <input
                    type="text"
                    value={officeLocation}
                    onChange={(e) => setOfficeLocation(e.target.value)}
                    placeholder="Consultation Wing - Room 101"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 text-xs"
                  />
                </div>

                {/* PRC License */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    PRC Professional License Number
                  </label>
                  <input
                    type="text"
                    value={prcLicense}
                    onChange={(e) => setPrcLicense(e.target.value)}
                    placeholder="e.g. 0098412"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Required for Attending Physicians and Registered Nurses
                  </span>
                </div>

                {/* PTR Number */}
                <div className="space-y-1">
                  <label className="block font-bold text-slate-700">
                    PTR Number (Professional Tax Receipt)
                  </label>
                  <input
                    type="text"
                    value={ptrNumber}
                    onChange={(e) => setPtrNumber(e.target.value)}
                    placeholder="e.g. PTR-8834921-2026"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 text-xs font-mono"
                  />
                </div>

                {/* S2 License */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700">
                    S2 Dangerous Drugs License (PDEA / DDB Authorization)
                  </label>
                  <input
                    type="text"
                    value={s2License}
                    onChange={(e) => setS2License(e.target.value)}
                    placeholder="e.g. S2-R03-4921-2026"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    Optional: For physicians authorized to dispense or prescribe controlled substances.
                  </span>
                </div>

                {/* Bio / Qualifications */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="block font-bold text-slate-700">
                    Professional Background & Specializations
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="e.g. Fellow of the Philippine College of Physicians (FPCP). Specializing in adult internal medicine and occupational campus health..."
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-600 text-xs leading-relaxed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIGITAL SIGNATURE */}
          {activeTab === 'signature' && (
            <div className="space-y-5">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-900 leading-relaxed">
                  Your electronic signature is securely encrypted and appended to PDF documents (Prescriptions, Medical Certificates, and Official Census) when you authorize and print them.
                </div>
              </div>

              {/* Mode Selector: Draw vs Upload */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSignatureMode('draw')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    signatureMode === 'draw'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Draw with Mouse / Touchpad</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSignatureMode('upload')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    signatureMode === 'upload'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Signature Image</span>
                </button>
              </div>

              {/* Signature Canvas Area */}
              {signatureMode === 'draw' ? (
                <div className="space-y-2">
                  <div className="text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Draw your signature inside the box below:</span>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-red-700 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Clear Canvas</span>
                    </button>
                  </div>

                  <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative overflow-hidden flex items-center justify-center">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="cursor-crosshair bg-white w-full max-w-lg h-36 touch-none"
                    />
                    <div className="absolute bottom-2 left-4 text-[10px] text-slate-400 pointer-events-none select-none">
                      Sign above the line · Blue ink simulated
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50">
                    <input
                      type="file"
                      ref={signatureFileInputRef}
                      onChange={handleSignatureUpload}
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => signatureFileInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg font-bold text-xs text-slate-800 shadow-2xs inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#7F1416]" />
                      <span>Select Signature Image File (PNG recommended)</span>
                    </button>
                    <p className="text-[10px] text-slate-500 mt-2">
                      Transparent PNG or high-contrast scanned signature works best.
                    </p>
                  </div>
                </div>
              )}

              {/* Current Signature Preview */}
              {digitalSignature && (
                <div className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-[10px] font-bold text-slate-400 uppercase">
                      Current Signature:
                    </div>
                    <img
                      src={digitalSignature}
                      alt="Digital Signature Preview"
                      className="h-10 max-w-44 object-contain filter contrast-125"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDigitalSignature(undefined);
                      clearCanvas();
                    }}
                    className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons: Cancel vs Save Changes */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel / Discard
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#7F1416] hover:bg-[#680F11] text-white rounded-xl font-bold text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-98"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
