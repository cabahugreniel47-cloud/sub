import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { Medicine, MedicineCategory } from '../../types/clinic';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Clock,
  History,
  CheckCircle2,
  DollarSign,
  Download,
  Printer
} from 'lucide-react';

export const InventoryManager: React.FC = () => {
  const {
    medicines,
    transactions,
    stockInMedicine,
    dispenseMedicine,
    setActiveModal,
    setModalPayload,
    showToast,
    isMobile
  } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'inventory' | 'transactions'>('inventory');

  // Modal for quick stock in
  const [stockInModalMed, setStockInModalMed] = useState<Medicine | null>(null);
  const [stockInQty, setStockInQty] = useState(50);
  const [stockInRemarks, setStockInRemarks] = useState('Quarterly Clinic Replenishment (PO-2026)');

  // Filter medicines
  const filteredMeds = medicines.filter(m => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.genericName.toLowerCase().includes(q) ||
      m.brandName.toLowerCase().includes(q) ||
      m.code.toLowerCase().includes(q);

    const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  const handleExecuteStockIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockInModalMed) return;

    stockInMedicine(stockInModalMed.id, Number(stockInQty), stockInRemarks);
    showToast(`Successfully stocked in ${stockInQty} ${stockInModalMed.unit} of ${stockInModalMed.genericName}!`, 'success');
    setStockInModalMed(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            <span>Pharmacy & Medical Supply Formulary</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            Clinic Medicine & Supply Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized tracking of essential medicines, emergency trays, expiration dates, and Philippine Peso valuations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveModal('export-inventory')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-300"
            title="Download PDF with official logos, print, or export CSV formulary"
          >
            <Download className="w-3.5 h-3.5 text-[#7F1416]" />
            <span>Export / Print (PDF)</span>
          </button>
          <button
            onClick={() => setActiveModal('new-medicine')}
            className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Formulary Item</span>
          </button>
        </div>
      </div>

      {/* Tabs: Master Stock vs Transaction Logs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-red-700 text-red-800 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Active Medication Stock ({medicines.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'transactions'
              ? 'border-red-700 text-red-800 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Stock-In / Dispensing Audit Trail ({transactions.length})
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <>
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search generic, brand, or code..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-pointer max-w-[200px] truncate"
              >
                <option value="all">All Therapeutic Classes</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-pointer"
              >
                <option value="all">All Stock Statuses</option>
                <option value="In Stock">In Stock</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Critical Stock">Critical Stock</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Medicines Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Generic & Brand Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Dosage & Form</th>
                    <th className="py-3 px-4">Unit Price (₱)</th>
                    <th className="py-3 px-4">Current Stock</th>
                    <th className="py-3 px-4">Expiry Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMeds.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        No medicines match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredMeds.map(med => (
                      <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-red-800">
                          {med.code}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{med.genericName}</div>
                          <div className="text-[11px] text-slate-500">{med.brandName}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600 max-w-[150px] truncate" title={med.category}>
                          {med.category}
                        </td>
                        <td className="py-3 px-4 text-slate-700">
                          {med.dosageStrength} · {med.dosageForm}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          ₱{med.unitCostPhp.toFixed(2)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-sm text-slate-900 tabular-nums">
                            {med.currentStock}
                          </span>{' '}
                          <span className="text-slate-400 text-[11px]">{med.unit}</span>
                          <div className="text-[10px] text-slate-400">Min: {med.minimumThreshold}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {med.expiryDate}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                            med.status === 'Critical Stock' ? 'bg-red-100 text-red-800' :
                            med.status === 'Low Stock' ? 'bg-amber-100 text-amber-800' :
                            med.status === 'Expired' ? 'bg-slate-800 text-white' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {med.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => setStockInModalMed(med)}
                            className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-800 font-semibold rounded transition-colors cursor-pointer"
                          >
                            + Stock In
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* TRANSACTIONS AUDIT VIEW */
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Transaction Type</th>
                  <th className="py-3 px-4">Medication</th>
                  <th className="py-3 px-4">Quantity Changed</th>
                  <th className="py-3 px-4">Previous &rarr; Balance</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                  <th className="py-3 px-4">Authorized User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {tx.timestamp}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                        tx.transactionType === 'Stock In' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {tx.transactionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {tx.medicineName}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold tabular-nums">
                      {tx.transactionType === 'Stock In' ? `+${tx.quantity}` : `-${tx.quantity}`}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {tx.previousStock} &rarr; <strong className="text-slate-900">{tx.newStock}</strong>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate" title={tx.reason}>
                      {tx.reason}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      <div>{tx.performedBy}</div>
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">{tx.performedRole}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* QUICK STOCK IN MODAL */}
      {stockInModalMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-red-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm">Stock In: {stockInModalMed.genericName}</span>
              <button onClick={() => setStockInModalMed(null)} className="text-red-200 hover:text-white">
                ✕
              </button>
            </div>
            <form onSubmit={handleExecuteStockIn} className="p-5 space-y-4 text-xs">
              <div>
                <span className="text-slate-500">Current Stock:</span>{' '}
                <strong className="text-slate-900 font-mono text-sm">{stockInModalMed.currentStock} {stockInModalMed.unit}</strong>
              </div>

              <div>
                <label className="block font-semibold mb-1">Quantity to Add *</label>
                <input
                  type="number"
                  value={stockInQty}
                  onChange={(e) => setStockInQty(Number(e.target.value))}
                  min={1}
                  required
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-bold font-mono text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Delivery Reference / Purchase Order</label>
                <input
                  type="text"
                  value={stockInRemarks}
                  onChange={(e) => setStockInRemarks(e.target.value)}
                  placeholder="e.g. Purchase Order PO-2026-99"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStockInModalMed(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-red-800 hover:bg-red-900 text-white rounded font-bold cursor-pointer"
                >
                  Confirm Stock In
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
