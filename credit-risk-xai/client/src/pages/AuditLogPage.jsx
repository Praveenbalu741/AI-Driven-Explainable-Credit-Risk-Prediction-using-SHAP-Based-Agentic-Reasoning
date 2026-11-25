import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShieldAlert, Search, Filter, Clock, User, CheckCircle2 } from 'lucide-react';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/audit')
      .then(res => setLogs(res.data))
      .catch(err => console.error('Error fetching audit logs:', err))
      .finally(() => setLoading(false));
  }, []);

  const filteredLogs = logs.filter(log => {
    const term = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term) ||
      log.user?.toLowerCase().includes(term) ||
      log.id?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Institutional Compliance Audit Trail</h1>
        <p className="text-xs text-slate-400 mt-1">
          Immutable event log for banking regulators &bull; Captures model versions, policy covenant thresholds, and authorized officer identity
        </p>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md flex items-center space-x-3">
        <Search className="w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter audit events by action, officer email, or details..."
          className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                <th className="py-3 px-3">Audit ID</th>
                <th className="py-3 px-3">Timestamp</th>
                <th className="py-3 px-3">Action Event</th>
                <th className="py-3 px-3">Authorized Officer</th>
                <th className="py-3 px-3">Model Version</th>
                <th className="py-3 px-3">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="py-3 px-3 text-indigo-400 font-medium">{log.id}</td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 font-semibold text-white">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-cyan-300">{log.user}</td>
                  <td className="py-3 px-3 text-slate-400">{log.modelVersion || 'N/A'}</td>
                  <td className="py-3 px-3 font-sans text-slate-300 max-w-md truncate">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
