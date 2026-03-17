import React, { useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { AuditLogEntry, AuditLogFilters, AuditAction } from '@/types';
import { formatDistanceToNow } from 'date-fns';

interface BookAuditLogProps {
  bookId: string | number;
}

const actionColors: Record<AuditAction, string> = {
  upload: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  edit: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  publish: 'bg-green-500/20 text-green-400 border-green-500/30'
};

const actionLabels: Record<AuditAction, string> = {
  upload: 'Upload',
  edit: 'Edit',
  publish: 'Publish'
};

export function BookAuditLog({ bookId }: BookAuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AuditLogFilters>({});

  useEffect(() => {
    loadAuditLog();
  }, [bookId, filters]);

  async function loadAuditLog() {
    try {
      setLoading(true);
      setError(null);
      const response = await api.getBookAuditLog(bookId, filters, 100);
      setLogs(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  }

  function formatDetails(log: AuditLogEntry): string {
    switch (log.action) {
      case 'upload':
        return `Attempt #${log.details.attempt || 1}`;
      case 'edit':
        return `Page ${log.details.pageNumber}${log.details.version ? `, Version ${log.details.version}` : ''}`;
      case 'publish':
        return `${log.details.pageCount || '?'} pages published`;
      default:
        return '';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFFF2E]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
        Error loading audit log: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 border border-white/10 bg-black/50">
        <div>
          <label className="block text-xs font-mono text-gray-500 mb-1">Action</label>
          <select
            value={filters.action || ''}
            onChange={(e) => setFilters(f => ({ ...f, action: e.target.value as AuditAction || undefined }))}
            className="bg-black border border-white/20 text-white text-sm px-3 py-2 focus:border-[#FFFF2E] outline-none"
          >
            <option value="">All Actions</option>
            <option value="upload">Upload</option>
            <option value="edit">Edit</option>
            <option value="publish">Publish</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-500 mb-1">Start Date</label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value || undefined }))}
            className="bg-black border border-white/20 text-white text-sm px-3 py-2 focus:border-[#FFFF2E] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-gray-500 mb-1">End Date</label>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value || undefined }))}
            className="bg-black border border-white/20 text-white text-sm px-3 py-2 focus:border-[#FFFF2E] outline-none"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setFilters({})}
            className="px-4 py-2 border border-white/20 text-white text-sm hover:border-[#FFFF2E] hover:text-[#FFFF2E] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs font-mono text-gray-500">
        Showing {logs.length} audit record{logs.length !== 1 ? 's' : ''}
      </div>

      {/* Table */}
      {logs.length === 0 ? (
        <div className="p-8 text-center border border-white/10 text-gray-500">
          No audit records found
        </div>
      ) : (
        <div className="overflow-x-auto border border-white/10">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="text-left text-xs font-mono text-gray-400 p-3 uppercase">Timestamp</th>
                <th className="text-left text-xs font-mono text-gray-400 p-3 uppercase">User</th>
                <th className="text-left text-xs font-mono text-gray-400 p-3 uppercase">Action</th>
                <th className="text-left text-xs font-mono text-gray-400 p-3 uppercase">Details</th>
                <th className="text-left text-xs font-mono text-gray-400 p-3 uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="p-3 text-sm text-white">
                    <span title={new Date(log.timestamp).toLocaleString()}>
                      {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true })}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-white">{log.userEmail}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 text-xs font-mono uppercase border ${actionColors[log.action]}`}>
                      {actionLabels[log.action]}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-400">{formatDetails(log)}</td>
                  <td className="p-3 text-sm text-gray-500 font-mono">{log.ipAddress || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
