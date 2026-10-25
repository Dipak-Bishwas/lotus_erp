import React, { useState, useEffect } from 'react';
import { StorageService } from '@/lib/storage';
import { DateDisplay } from '@/components/data-display/MoneyDisplay';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/data-display/EmptyState';
import { AuditLog } from '@/types';
import { History, ShieldCheck, UserCheck, Clock, FileText } from 'lucide-react';

export function AuditLogView() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    setLogs(StorageService.getAuditLogs());
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">System Audit Trail & Compliance</h2>
        <p className="text-xs text-slate-500">
          Traceable record of all rate revisions, delivery status changes, invoice generations, and payment reversals
        </p>
      </div>

      {logs.length === 0 ? (
        <EmptyState
          icon={<History className="w-8 h-8 text-blue-400" />}
          title="No Audit Records"
          description="System events and financial changes will automatically appear here."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Change Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {logs.map((log) => (
                <tr key={log.log_id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                    <DateDisplay date={log.timestamp} showTime />
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">{log.user_name}</td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="info" size="sm">
                      {log.entity_type}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-slate-800 font-medium">{log.change_summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
