import React, { useState } from 'react';
import { useClinic } from '../../context/ClinicContext';
import { ActivityLog } from '../../types/clinic';
import {
  FileClock,
  Search,
  Filter,
  ShieldCheck,
  Download,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

export const ActivityLogs: React.FC = () => {
  const { activityLogs } = useClinic();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredLogs = activityLogs.filter(log => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.action.toLowerCase().includes(q) ||
      log.userName.toLowerCase().includes(q) ||
      log.details.toLowerCase().includes(q) ||
      log.ipAddress.toLowerCase().includes(q);

    const matchesModule = filterModule === 'all' || log.module === filterModule;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;

    return matchesSearch && matchesModule && matchesStatus;
  });

  const exportLogsAsCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Module', 'Action', 'Details', 'IP Address', 'Status'];
    const rows = filteredLogs.map(l => [
      `"${l.timestamp}"`,
      `"${l.userName}"`,
      `"${l.userRole}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${l.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PSU_Clinic_Audit_Log_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Republic Act No. 10173 Audit Compliance</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            System Security & Clinical Activity Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable chronological record of logins, medical record modifications, queue actions, and pharmaceutical transactions.
          </p>
        </div>

        <button
          onClick={exportLogsAsCSV}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by action, personnel, details, IP..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-red-600 focus:bg-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={filterModule}
            onChange={(e) => setFilterModule(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-pointer"
          >
            <option value="all">All Modules</option>
            <option value="Authentication">Authentication</option>
            <option value="Patient Management">Patient Management</option>
            <option value="Vital Signs / Assessment">Vital Signs / Assessment</option>
            <option value="Queue">Queue</option>
            <option value="Consultation">Consultation</option>
            <option value="Prescription">Prescription</option>
            <option value="Inventory">Inventory</option>
            <option value="Dispensing">Dispensing</option>
            <option value="Security">Security</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Error">Error</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Authorized User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Clinical Module</th>
                <th className="py-3 px-4">Action Taken</th>
                <th className="py-3 px-4">Detailed Audit Event</th>
                <th className="py-3 px-4">IP / Terminal</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {log.userName}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700 whitespace-nowrap">
                    {log.module}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                    {log.action}
                  </td>
                  <td className="py-3 px-4 text-slate-600 max-w-sm" title={log.details}>
                    {log.details}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                    {log.ipAddress}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold ${
                      log.status === 'Success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
