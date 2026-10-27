import React, { useState } from 'react';
import { AuditLog } from '../types/pad';
import { History, Shield, Search, Filter } from 'lucide-react';

interface AuditViewProps {
  logs: AuditLog[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const filteredLogs = logs.filter(log => {
    const matchSearch =
      log.keterangan.toLowerCase().includes(search.toLowerCase()) ||
      log.user_name.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase());

    const matchAction = filterAction === 'ALL' || log.action === filterAction;
    return matchSearch && matchAction;
  });

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Audit Trail &amp; Log Aktivitas Keuangan
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan riwayat setiap aksi penetapan status final, pembukaan revisi, input transaksi, dan target
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari log audit..."
              className="text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 w-full sm:w-52"
            />
          </div>

          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 font-medium"
          >
            <option value="ALL">Semua Tindakan</option>
            <option value="FINALIZE">FINALIZE (Kunci)</option>
            <option value="UNLOCK_REVISION">UNLOCK_REVISION (Buka Kunci)</option>
            <option value="INPUT_TRANSAKSI">INPUT_TRANSAKSI</option>
            <option value="UPDATE_TARGET">UPDATE_TARGET</option>
          </select>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {filteredLogs.length} dari {logs.length} catatan audit</span>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg scrollbar-thin">
          <table className="min-w-[650px] w-full text-xs text-left">
            <thead className="bg-slate-800 text-slate-100 font-semibold">
              <tr>
                <th className="py-2.5 px-3 w-48">Waktu (WIB)</th>
                <th className="py-2.5 px-3 w-36">Tindakan</th>
                <th className="py-2.5 px-3 w-48">Pengguna &amp; Role</th>
                <th className="py-2.5 px-3">Rincian Perubahan / Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                    Tidak ditemukan log audit yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(log.timestamp).toLocaleString('id-ID', {
                        timeZone: 'Asia/Jakarta',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })} WIB
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          log.action === 'FINALIZE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : log.action === 'UNLOCK_REVISION'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : log.action === 'INPUT_TRANSAKSI'
                            ? 'bg-sky-100 text-sky-800 border border-sky-300'
                            : 'bg-purple-100 text-purple-800 border border-purple-300'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-900 font-medium">
                      {log.user_name}{' '}
                      <span className="text-[10px] font-bold text-slate-500 uppercase">
                        ({log.user_role})
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-700 leading-relaxed">
                      {log.keterangan}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
