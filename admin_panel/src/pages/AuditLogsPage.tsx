import React, { useState, useEffect } from 'react';
import { FileText, Clock, User, Shield, Terminal } from 'lucide-react';
import { apiRequest } from '../services/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const res = await apiRequest('/admin/audit-logs');
        if (res.success && res.data) {
          setLogs(res.data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Enterprise Audit Logs</h2>
        <p className="text-sm text-slate-500">
          Immutable historical audit trail of platform operations, commission changes & status overrides
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Timestamp</th>
                <th className="py-3 px-6">Actor</th>
                <th className="py-3 px-6">Action</th>
                <th className="py-3 px-6">Target Entity</th>
                <th className="py-3 px-6">Payload Snapshot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="py-3 px-6 text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-3 px-6 text-slate-800 font-sans font-medium">
                    {log.actorEmail || 'System / Admin'}
                  </td>
                  <td className="py-3 px-6 font-bold text-brand-700">
                    {log.action}
                  </td>
                  <td className="py-3 px-6 text-slate-700">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="py-3 px-6">
                    <pre className="text-[10px] text-slate-600 bg-slate-50 p-1.5 rounded max-w-xs truncate">
                      {JSON.stringify(log.newValues || log.oldValues || {})}
                    </pre>
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
