import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import {
  Pill,
  CheckCircle,
  AlertTriangle,
  Users,
  Search,
  History,
  FileCheck
} from 'lucide-react';

export const DispensingDesk: React.FC = () => {
  const {
    medicines,
    dispenseMedicine,
    transactions,
    patients,
    currentUser,
    showToast
  } = useClinic();

  const [selectedMedId, setSelectedMedId] = useState(medicines[0]?.id || '');
  const [patientMode, setPatientMode] = useState<'registered' | 'manual'>('registered');
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id || '');
  const [manualPatientName, setManualPatientName] = useState('');
  const [quantity, setQuantity] = useState(4);
  const [reason, setReason] = useState('Headache / Tension discomfort during classes');
  const [dosageInstructions, setDosageInstructions] = useState('Take 1 tablet every 6 hours after meals as needed.');

  const selectedMed = medicines.find(m => m.id === selectedMedId) || medicines[0];

  const dispensingTransactions = transactions.filter(t => t.transactionType === 'Dispensed');

  const handleDispense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMed) return;

    let patientName = '';
    if (patientMode === 'registered') {
      const p = patients.find(pat => pat.id === selectedPatientId);
      patientName = p ? `${p.firstName} ${p.lastName} (${p.psuId})` : 'Student';
    } else {
      patientName = manualPatientName || 'Walk-in Campus Visitor';
    }

    const success = dispenseMedicine(
      selectedMed.id,
      Number(quantity),
      reason,
      patientName
    );

    if (success) {
      showToast(`Dispensed ${quantity} ${selectedMed.unit} of ${selectedMed.genericName} to ${patientName}! Pharmacy inventory updated.`, 'success');
    }
  };

  const quickReasons = [
    'Headache / Migraine relief',
    'Dysmenorrhea / Menstrual cramps',
    'Hyperacidity / Heartburn relief',
    'Allergic reaction / Rhinitis flare-up',
    'Wound dressing / Minor skin abrasion'
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <Pill className="w-4 h-4" />
            <span>Nurse Station & Pharmacy Counter</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Medicine Dispensing & OTC First-Aid Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log direct nurse OTC medication administration and update university clinic stock balances automatically.
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
          Dispensing Officer: <strong className="text-slate-900">{currentUser?.fullName}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dispense Form (2 Columns) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs">
          <h2 className="font-bold text-slate-900 text-sm mb-4 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Pill className="w-4 h-4 text-emerald-700" />
            <span>Record Medicine Administration</span>
          </h2>

          <form onSubmit={handleDispense} className="space-y-4 text-xs text-slate-700">
            {/* Patient Mode */}
            <div>
              <label className="block font-semibold mb-1">Patient Identification</label>
              <div className="flex items-center gap-4 mb-2">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={patientMode === 'registered'}
                    onChange={() => setPatientMode('registered')}
                    className="accent-red-700"
                  />
                  <span>Select Registered PSU Student / Employee</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    checked={patientMode === 'manual'}
                    onChange={() => setPatientMode('manual')}
                    className="accent-red-700"
                  />
                  <span>Manual Walk-in / Guest</span>
                </label>
              </div>

              {patientMode === 'registered' ? (
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-semibold text-slate-900 cursor-pointer"
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.psuId} - {p.classification})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={manualPatientName}
                  onChange={(e) => setManualPatientName(e.target.value)}
                  placeholder="Enter full name of patient"
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              )}
            </div>

            {/* Medicine Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-semibold mb-1">Select Medicine from Formulary *</label>
                <select
                  value={selectedMedId}
                  onChange={(e) => setSelectedMedId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-900 cursor-pointer"
                >
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.genericName} ({m.brandName}) - {m.dosageStrength} [Available: {m.currentStock} {m.unit}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Quantity to Dispense *</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={1}
                  max={selectedMed?.currentStock || 100}
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold text-base text-red-800"
                />
              </div>
            </div>

            {/* Current Stock Banner */}
            {selectedMed && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Formulary Code:</span>{' '}
                  <span className="font-mono font-bold text-slate-800">{selectedMed.code}</span> · Expiry: <span className="font-mono">{selectedMed.expiryDate}</span>
                </div>
                <div className="font-mono">
                  Available Stock: <strong className="text-emerald-700 text-sm">{selectedMed.currentStock} {selectedMed.unit}</strong>
                </div>
              </div>
            )}

            {/* Clinical Reason / Indication */}
            <div>
              <label className="block font-semibold mb-1">Indication / Reason for Administration</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Headache, Fever, Pain relief"
                required
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {quickReasons.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] cursor-pointer"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block font-semibold mb-1">Dosage Advice / Instructions Given</label>
              <input
                type="text"
                value={dosageInstructions}
                onChange={(e) => setDosageInstructions(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Dispense & Deduct Inventory</span>
              </button>
            </div>
          </form>
        </div>

        {/* Recent Dispensed Log (1 Column) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
              Recent Dispensed Records
            </h3>
            <span className="font-mono text-xs text-slate-400">Live</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs max-h-[460px] overflow-y-auto">
            {dispensingTransactions.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No medications dispensed yet today.</div>
            ) : (
              dispensingTransactions.slice(0, 8).map(tx => (
                <div key={tx.id} className="py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{tx.medicineName}</span>
                    <span className="font-mono font-bold text-red-800">-{tx.quantity}</span>
                  </div>
                  <div className="text-slate-600 text-[11px] leading-snug">
                    {tx.reason}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                    <span>{tx.performedBy}</span>
                    <span className="font-mono">{tx.timestamp.split(' ')[1]}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
