import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { MedicineCategory } from '../../types/clinic';
import { X, PackagePlus, CheckCircle2 } from 'lucide-react';

export const AddMedicineModal: React.FC = () => {
  const { addMedicine, setActiveModal, showToast } = useClinic();

  const [code, setCode] = useState(`MED-00${Math.floor(Math.random() * 89) + 10}`);
  const [genericName, setGenericName] = useState('');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState<MedicineCategory>('Analgesic / Antipyretic');
  const [dosageStrength, setDosageStrength] = useState('500 mg');
  const [dosageForm, setDosageForm] = useState('Tablet');
  const [currentStock, setCurrentStock] = useState(100);
  const [minimumThreshold, setMinimumThreshold] = useState(30);
  const [unit, setUnit] = useState('tabs');
  const [unitCostPhp, setUnitCostPhp] = useState(5.50);
  const [batchNumber, setBatchNumber] = useState(`BAT-2026-${Math.floor(Math.random() * 899) + 100}`);
  const [expiryDate, setExpiryDate] = useState('2028-12-31');
  const [storageLocation, setStorageLocation] = useState('Cabinet A, Shelf 1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!genericName) {
      showToast('Please enter generic name.', 'warning');
      return;
    }

    addMedicine({
      code,
      genericName,
      brandName: brandName || 'Generic Formulation',
      category,
      dosageStrength,
      dosageForm,
      currentStock: Number(currentStock),
      minimumThreshold: Number(minimumThreshold),
      unit,
      unitCostPhp: Number(unitCostPhp),
      batchNumber,
      expiryDate,
      storageLocation
    });

    showToast(`Added ${genericName} to the clinic pharmacy formulary!`, 'success');
    setActiveModal(null);
  };

  const categories: MedicineCategory[] = [
    'Analgesic / Antipyretic',
    'Antibiotic',
    'Antihistamine / Antiallergy',
    'Gastrointestinal',
    'Antihypertensive',
    'Bronchodilator / Respiratory',
    'Topical / Antiseptic',
    'Medical Supply & Consumable',
    'Emergency & First Aid'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-red-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-sm">
            <PackagePlus className="w-5 h-5 text-red-200" />
            <span>Add Pharmaceutical / Medical Supply</span>
          </div>
          <button
            onClick={() => setActiveModal(null)}
            className="p-1.5 text-red-200 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Item Code *</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Generic Name *</label>
              <input
                type="text"
                value={genericName}
                onChange={(e) => setGenericName(e.target.value)}
                placeholder="e.g. Ibuprofen"
                required
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Brand Name</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Advil"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Therapeutic Class *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as MedicineCategory)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Dosage Strength</label>
              <input
                type="text"
                value={dosageStrength}
                onChange={(e) => setDosageStrength(e.target.value)}
                placeholder="e.g. 500 mg"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Dosage Form</label>
              <input
                type="text"
                value={dosageForm}
                onChange={(e) => setDosageForm(e.target.value)}
                placeholder="e.g. Tablet, Capsule, Syrup"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-semibold mb-1">Initial Stock *</label>
              <input
                type="number"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                min={0}
                required
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Min Threshold *</label>
              <input
                type="number"
                value={minimumThreshold}
                onChange={(e) => setMinimumThreshold(Number(e.target.value))}
                min={0}
                required
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="tabs, caps, bottles"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Unit Price (₱)</label>
              <input
                type="number"
                step="0.25"
                value={unitCostPhp}
                onChange={(e) => setUnitCostPhp(Number(e.target.value))}
                min={0}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold mb-1">Batch / Lot Number</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Storage Location</label>
              <input
                type="text"
                value={storageLocation}
                onChange={(e) => setStorageLocation(e.target.value)}
                placeholder="Cabinet A, Shelf 1"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActiveModal(null)}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save to Inventory</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
