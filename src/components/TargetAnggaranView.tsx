import React, { useState, useMemo, useRef } from 'react';
import { UraianNode, TargetAnggaran, UserRole } from '../types/pad';
import { formatRupiah } from '../services/calculationEngine';
import { 
  downloadTargetTemplate, parseAndValidateTargetImport, TargetImportRow 
} from '../services/excelService';
import { 
  Target, Download, Upload, CheckCircle2, AlertTriangle, 
  FileSpreadsheet, Edit2, Check, X, ShieldAlert 
} from 'lucide-react';

interface TargetAnggaranViewProps {
  nodes: UraianNode[];
  targets: TargetAnggaran[];
  currentRole: UserRole;
  onUpdateTarget: (uraianId: string, tahun: number, jumlah: number) => { success: boolean; error?: string };
  onResetTargetsToZero?: () => void;
  onLoadDefaultTargets?: () => void;
}

export const TargetAnggaranView: React.FC<TargetAnggaranViewProps> = ({
  nodes,
  targets,
  currentRole,
  onUpdateTarget,
  onResetTargetsToZero,
  onLoadDefaultTargets
}) => {
  const [selectedTahun, setSelectedTahun] = useState<number>(2026);
  const [editingLeafId, setEditingLeafId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Import states
  const [importRows, setImportRows] = useState<TargetImportRow[] | null>(null);
  const [importStats, setImportStats] = useState<{ validCount: number; errorCount: number } | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const leafNodes = useMemo(() => nodes.filter(n => n.is_leaf), [nodes]);

  // Map leaf target
  const targetMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of targets) {
      if (t.tahun === selectedTahun) {
        map.set(t.uraian_id, t.jumlah);
      }
    }
    return map;
  }, [targets, selectedTahun]);

  // Total targets
  const totalTargetPAD = useMemo(() => {
    let sum = 0;
    for (const leaf of leafNodes) {
      sum += targetMap.get(leaf.id) || 0;
    }
    return sum;
  }, [leafNodes, targetMap]);

  const handleStartEdit = (leafId: string, currentVal: number) => {
    setEditingLeafId(leafId);
    setEditAmount(currentVal.toString());
  };

  const handleSaveEdit = (leafId: string) => {
    const num = parseFloat(editAmount);
    if (isNaN(num) || num < 0) {
      alert('Target harus berupa angka positif (>= 0).');
      return;
    }
    onUpdateTarget(leafId, selectedTahun, num);
    setEditingLeafId(null);
  };

  // Handle File Upload for Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportSuccessMsg(null);
    const reader = new FileReader();
    reader.onload = evt => {
      const buffer = evt.target?.result as ArrayBuffer;
      const res = parseAndValidateTargetImport(buffer, nodes);
      setImportRows(res.rows);
      setImportStats({ validCount: res.validCount, errorCount: res.errorCount });
    };
    reader.readAsArrayBuffer(file);
  };

  // Apply Valid Imported Targets
  const handleApplyImport = () => {
    if (!importRows) return;
    const validRows = importRows.filter(r => r.isValid && r.uraian_id);
    if (validRows.length === 0) {
      alert('Tidak ada baris target yang valid untuk disimpan.');
      return;
    }

    let applied = 0;
    for (const row of validRows) {
      if (row.uraian_id) {
        onUpdateTarget(row.uraian_id, selectedTahun, row.target);
        applied++;
      }
    }

    setImportSuccessMsg(`Berhasil memperbarui target untuk ${applied} pos penerimaan APBD ${selectedTahun}!`);
    setImportRows(null);
    setImportStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Target Anggaran Pendapatan Asli Daerah (APBD)
          </h2>
          <p className="text-xs text-slate-500">
            Kelola target APBD per pos penerimaan atau import massal melalui template spreadsheet
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-700">Tahun Anggaran:</label>
          <select
            value={selectedTahun}
            onChange={e => setSelectedTahun(parseInt(e.target.value, 10))}
            className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white"
          >
            <option value={2026}>Tahun 2026</option>
            <option value={2025}>Tahun 2025</option>
            <option value={2027}>Tahun 2027</option>
          </select>
        </div>
      </div>

      {/* Target PAD Summary Banner */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl border border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4 font-mono">
        <div>
          <span className="text-xs text-slate-400 font-sans block">TOTAL TARGET ANGGARAN PAD ({selectedTahun}):</span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-400 mt-1 break-all sm:break-normal">
            Rp {formatRupiah(totalTargetPAD)}
          </div>
          <span className="text-xs text-slate-400 font-sans mt-1 block">
            Target agregat dihitung otomatis dari akumulasi seluruh target pos penerimaan
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {onResetTargetsToZero && (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-xs font-semibold text-rose-200 border border-rose-800 transition-colors shadow-xs"
              title="Kosongkan semua target ke 0"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Kosongkan Target (Rp 0)</span>
            </button>
          )}

          {onLoadDefaultTargets && (
            <button
              onClick={onLoadDefaultTargets}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors shadow-xs"
              title="Muat nilai target standar APBD 2026 (Rp 4,212 T)"
            >
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Muat Target Contoh APBD 2026</span>
            </button>
          )}

          <button
            onClick={() => downloadTargetTemplate(leafNodes)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-xs font-semibold text-white border border-emerald-600 transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-white" />
            <span>Unduh Template Excel</span>
          </button>
        </div>
      </div>

      {/* Excel / CSV Import Section (Requirement G) */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Import Target Anggaran dari Excel / CSV
              </h3>
              <p className="text-xs text-slate-500">
                Unggah file Excel dengan kolom Kode/Nama Rekening dan Nominal Target APBD
              </p>
            </div>
          </div>
        </div>

        {importSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importSuccessMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
          />
        </div>

        {/* Import Preview & Row-by-Row Error Table */}
        {importRows && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-slate-700">Hasil Analisis Validasi:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  {importStats?.validCount} Baris Valid
                </span>
                {importStats?.errorCount ? (
                  <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                    {importStats.errorCount} Baris Error (Ditolak)
                  </span>
                ) : null}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setImportRows(null);
                    setImportStats(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 text-xs font-medium"
                >
                  Batal
                </button>
                <button
                  onClick={handleApplyImport}
                  disabled={importStats?.validCount === 0}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs"
                >
                  Simpan {importStats?.validCount} Target Valid ke Database
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-72">
              <table className="min-w-[550px] w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 sticky top-0 border-b border-slate-200 font-semibold">
                  <tr>
                    <th className="py-2 px-3 w-12 text-center">Baris</th>
                    <th className="py-2 px-3 w-28">Kode</th>
                    <th className="py-2 px-3">Nama Pos Uraian</th>
                    <th className="py-2 px-3 text-right w-40">Target (Rp)</th>
                    <th className="py-2 px-3">Status Validasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {importRows.map((r, idx) => (
                    <tr key={idx} className={r.isValid ? 'hover:bg-emerald-50/40' : 'bg-rose-50/60'}>
                      <td className="py-2 px-3 text-center text-slate-400">{r.rowNumber}</td>
                      <td className="py-2 px-3 font-semibold">{r.kode || '-'}</td>
                      <td className="py-2 px-3 font-sans text-slate-900">{r.nama}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">
                        {r.isValid ? formatRupiah(r.target) : '-'}
                      </td>
                      <td className="py-2 px-3 font-sans text-xs">
                        {r.isValid ? (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Valid (Pos Penerimaan)
                          </span>
                        ) : (
                          <span className="text-rose-700 font-medium flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                            {r.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Target Table per Leaf with Direct Inputs */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Input Langsung Target Anggaran Per Pos Penerimaan ({selectedTahun})
            </h3>
            <p className="text-xs text-slate-500">
              Ubah nilai target pada kolom input di bawah ini. Target induk dan total PAD akan dihitung ulang secara otomatis.
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
            Total Target PAD: Rp {formatRupiah(totalTargetPAD)}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-lg scrollbar-thin">
          <table className="min-w-[650px] w-full text-xs text-left font-sans">
            <thead className="bg-slate-900 text-slate-100 font-semibold tracking-tight">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center font-mono">NO</th>
                <th className="py-2.5 px-3 w-28 font-mono">KODE</th>
                <th className="py-2.5 px-3 min-w-[260px]">NAMA POS PENERIMAAN</th>
                <th className="py-2.5 px-3 text-right w-64">INPUT TARGET ANGGARAN (Rp)</th>
                <th className="py-2.5 px-3 text-right w-52">FORMAT RUPIAH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {leafNodes.map((leaf, idx) => {
                const currentVal = targetMap.get(leaf.id) || 0;
                const draft = editingLeafId === leaf.id ? editAmount : currentVal.toString();

                return (
                  <tr key={leaf.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 font-mono font-medium text-slate-600">{leaf.kode}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{leaf.nama}</td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-slate-400 text-xs font-mono">Rp</span>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={editingLeafId === leaf.id ? editAmount : currentVal}
                          onFocus={() => {
                            setEditingLeafId(leaf.id);
                            setEditAmount(currentVal.toString());
                          }}
                          onChange={e => setEditAmount(e.target.value)}
                          onBlur={() => {
                            if (editingLeafId === leaf.id) {
                              const num = parseFloat(editAmount);
                              if (!isNaN(num) && num >= 0) {
                                onUpdateTarget(leaf.id, selectedTahun, num);
                              }
                              setEditingLeafId(null);
                            }
                          }}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              const num = parseFloat(editAmount);
                              if (!isNaN(num) && num >= 0) {
                                onUpdateTarget(leaf.id, selectedTahun, num);
                              }
                              setEditingLeafId(null);
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="w-48 text-right font-mono tabular-nums font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 focus:bg-emerald-50 focus:border-emerald-600 focus:outline-hidden hover:border-emerald-400 transition-colors"
                          placeholder="0"
                          title={`Input target APBD untuk ${leaf.nama}`}
                        />
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right font-mono tabular-nums font-bold text-slate-900">
                      Rp {formatRupiah(editingLeafId === leaf.id ? parseFloat(editAmount) || 0 : currentVal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal: Reset All Targets to 0 */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kosongkan Semua Target APBD?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Semua nilai target pos penerimaan akan disetel menjadi <strong>Rp 0</strong>. Anda dapat menginput nilai target baru secara mandiri satu per satu atau import dari file Excel.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onResetTargetsToZero) {
                      onResetTargetsToZero();
                    }
                    setShowResetConfirm(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Ya, Kosongkan Target</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
