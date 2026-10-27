import React, { useState } from 'react';
import { Laporan, AuditLog, UserRole } from '../types/pad';
import { 
  Lock, Unlock, ShieldAlert, AlertCircle, 
  Calendar, CheckCircle, Clock 
} from 'lucide-react';

interface FinalisasiViewProps {
  laporanList: Laporan[];
  auditLogs: AuditLog[];
  currentRole: UserRole;
  onFinalize: (date: string, catatan?: string) => void;
  onUnlock: (laporanId: string, alasan: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
}

export const FinalisasiView: React.FC<FinalisasiViewProps> = ({
  laporanList,
  auditLogs,
  currentRole,
  onFinalize,
  onUnlock,
  selectedDate,
  setSelectedDate
}) => {
  const [unlockTargetId, setUnlockTargetId] = useState<string | null>(null);
  const [unlockReason, setUnlockReason] = useState<string>('');
  const [finalizeDateInput, setFinalizeDateInput] = useState<string>(selectedDate);
  const [finalizeNoteInput, setFinalizeNoteInput] = useState<string>('');

  const currentReport = laporanList.find(l => l.tanggal_laporan === finalizeDateInput);
  const isFinalized = currentReport?.status === 'final';

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Penguncian &amp; Finalisasi Laporan PAD
          </h2>
          <p className="text-xs text-slate-500">
            Penetapan status final laporan berkala dan penguncian transaksi rentang 1 Januari s/d tanggal laporan
          </p>
        </div>
      </div>

      {/* Finalize Action Card */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              Penguncian Laporan Periode Baru
            </h3>
            <p className="text-xs text-slate-500">
              Periode penguncian: <strong>01 Januari</strong> s/d <strong>Tanggal Laporan</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tanggal Laporan yang Akan Difinalkan:</span>
            </label>
            <input
              type="date"
              value={finalizeDateInput}
              onChange={e => setFinalizeDateInput(e.target.value)}
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Catatan Pengesahan:
            </label>
            <input
              type="text"
              value={finalizeNoteInput}
              onChange={e => setFinalizeNoteInput(e.target.value)}
              placeholder="Contoh: Laporan Realisasi Triwulan III 2026..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="text-xs text-slate-500">
            Status tanggal {finalizeDateInput}:{' '}
            {isFinalized ? (
              <span className="font-bold text-emerald-700">SUDAH FINAL &amp; TERKUNCI</span>
            ) : (
              <span className="font-bold text-amber-700">MASIH DRAFT</span>
            )}
          </div>

          <button
            onClick={() => {
              if (isFinalized) {
                alert(`Laporan tanggal ${finalizeDateInput} sudah final.`);
                return;
              }
              onFinalize(finalizeDateInput, finalizeNoteInput);
              setFinalizeNoteInput('');
            }}
            disabled={isFinalized}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs"
          >
            <Lock className="w-4 h-4" />
            <span>Finalisasi Tanggal Ini</span>
          </button>
        </div>
      </div>

      {/* Reports History Table */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          Daftar Arsip Laporan &amp; Status Penguncian
        </h3>

        <div className="overflow-x-auto border border-slate-200 rounded-lg scrollbar-thin">
          <table className="min-w-[650px] w-full text-xs text-left">
            <thead className="bg-slate-800 text-slate-100 font-semibold">
              <tr>
                <th className="py-2.5 px-3">Nomor Laporan</th>
                <th className="py-2.5 px-3">Tanggal Laporan</th>
                <th className="py-2.5 px-3">Periode Terkunci</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Petugas Pengesah</th>
                <th className="py-2.5 px-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {laporanList.map(lap => {
                const isFinal = lap.status === 'final';
                return (
                  <tr key={lap.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{lap.nomor_laporan}</td>
                    <td className="py-2.5 px-3">{lap.tanggal_laporan}</td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {isFinal ? `${lap.periode_mulai} s/d ${lap.periode_selesai}` : '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      {isFinal ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle className="w-3 h-3" />
                          FINAL &amp; TERKUNCI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <Clock className="w-3 h-3" />
                          DRAFT
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-sans text-xs">
                      {lap.finalized_by || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {isFinal ? (
                        <button
                          onClick={() => {
                            if (currentRole !== 'admin') {
                              alert('Aksi Buka Kunci / Revisi hanya dapat dilakukan oleh role Administrator Bappenda.');
                              return;
                            }
                            setUnlockTargetId(lap.id);
                          }}
                          className="text-xs text-amber-700 hover:text-amber-900 font-bold inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded border border-amber-200"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>Buka Kunci / Revisi</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onFinalize(lap.tanggal_laporan)}
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold inline-flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded border border-emerald-200"
                        >
                          <Lock className="w-3 h-3" />
                          <span>Finalkan</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Buka Kunci */}
      {unlockTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3 text-amber-700">
              <div className="p-2 rounded-lg bg-amber-100">
                <Unlock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Konfirmasi Pembukaan Kunci Laporan
                </h3>
                <p className="text-xs text-slate-500">
                  Tindakan ini memerlukan pencatatan alasan resmi pada Audit Trail
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Alasan Pembukaan Kunci / Revisi:
              </label>
              <textarea
                value={unlockReason}
                onChange={e => setUnlockReason(e.target.value)}
                placeholder="Masukkan alasan audit..."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setUnlockTargetId(null);
                  setUnlockReason('');
                }}
                className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!unlockReason.trim()) {
                    alert('Mohon masukkan alasan pembukaan kunci.');
                    return;
                  }
                  onUnlock(unlockTargetId, unlockReason);
                  setUnlockTargetId(null);
                  setUnlockReason('');
                }}
                disabled={!unlockReason.trim()}
                className="text-xs font-semibold px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white shadow-xs"
              >
                Buka Kunci untuk Revisi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
