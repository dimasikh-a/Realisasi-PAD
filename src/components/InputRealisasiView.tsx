import React, { useState, useMemo, useRef } from 'react';
import { UraianNode, TransaksiPenerimaan } from '../types/pad';
import { formatRupiah } from '../services/calculationEngine';
import { 
  downloadRealisasiTemplate, 
  parseAndValidateRealisasiImport, 
  RealisasiImportRow 
} from '../services/excelService';
import { 
  PlusCircle, AlertTriangle, CheckCircle, Calendar, 
  Trash2, Lock, Table, ListTree, RefreshCw, Edit2, X, AlertCircle,
  FileSpreadsheet, Upload, Download, CheckCircle2, ArrowRight, Check, FileCheck, Info
} from 'lucide-react';

interface InputRealisasiViewProps {
  nodes: UraianNode[];
  transactions: TransaksiPenerimaan[];
  onAddTransaction: (tx: {
    uraian_id: string;
    tanggal: string;
    pokok: number;
    piutang: number;
    keterangan?: string;
  }) => { success: boolean; error?: string };
  onBulkAddTransactions: (
    tanggal: string,
    items: { uraian_id: string; pokok: number; piutang: number; keterangan?: string }[]
  ) => { success: boolean; error?: string; count?: number };
  onBatchImportTransactions?: (
    items: { uraian_id: string; tanggal: string; pokok: number; piutang: number; keterangan?: string }[]
  ) => { success: boolean; insertedCount: number; skippedLockedCount: number; error?: string };
  onDeleteTransaction: (id: string) => { success: boolean; error?: string };
  onUpdateTransaction: (
    id: string,
    data: { uraian_id?: string; tanggal?: string; pokok: number; piutang: number; keterangan?: string }
  ) => { success: boolean; error?: string };
  isDateLocked: (date: string) => { isLocked: boolean; finalizedReport?: { nomor_laporan: string } };
  onClearAllTransactions?: () => void;
}

export const InputRealisasiView: React.FC<InputRealisasiViewProps> = ({
  nodes,
  transactions,
  onAddTransaction,
  onBulkAddTransactions,
  onBatchImportTransactions,
  onDeleteTransaction,
  onUpdateTransaction,
  isDateLocked,
  onClearAllTransactions
}) => {
  const [activeMode, setActiveMode] = useState<'single' | 'bulk' | 'excel'>('single');
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  // Excel Import states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importRows, setImportRows] = useState<RealisasiImportRow[]>([]);
  const [importSummary, setImportSummary] = useState<{
    validCount: number;
    errorCount: number;
    totalPokok: number;
    totalPiutang: number;
    totalNominal: number;
  } | null>(null);
  const [filterOnlyErrors, setFilterOnlyErrors] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Single form states
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-14');
  const [pokokInput, setPokokInput] = useState<string>('');
  const [piutangInput, setPiutangInput] = useState<string>('');
  const [keteranganInput, setKeteranganInput] = useState<string>('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // State for Delete Confirmation Modal (avoids iframe confirm dialog blocks)
  const [deletingTx, setDeletingTx] = useState<{
    id: string;
    nama: string;
    total: number;
    tanggal: string;
  } | null>(null);

  // State for Edit Transaction Modal
  const [editingTx, setEditingTx] = useState<{
    id: string;
    uraian_id: string;
    tanggal: string;
    pokok: string;
    piutang: string;
    keterangan: string;
  } | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // Cascading Dropdown states (adapts dynamically per branch)
  // Level 1: Under PAD -> 'pajak_daerah' or 'c_denda'
  const [selectedL1, setSelectedL1] = useState<string>('pajak_daerah');
  // Level 2: Under L1 -> if L1 is 'pajak_daerah', options are 'a_pajak_daerah', 'b_opsen_pajak'. If L1 is 'c_denda', option is 'leaf_denda' (which is leaf!)
  const [selectedL2, setSelectedL2] = useState<string>('a_pajak_daerah');
  // Level 3: Under L2 -> if L2 is 'a_pajak_daerah', options are 'a1_non_pbjt', 'a2_pbjt'. If L2 is 'b_opsen_pajak', options are leaf Opsen.
  const [selectedL3, setSelectedL3] = useState<string>('a1_non_pbjt');
  // Level 4: Under L3 -> leaf nodes under 1 or 2
  const [selectedL4, setSelectedL4] = useState<string>('leaf_reklame');

  // Bulk input state: mapping leaf_id -> { pokok, piutang, keterangan }
  const leafNodes = useMemo(() => nodes.filter(n => n.is_leaf), [nodes]);
  const [bulkRows, setBulkRows] = useState<Record<string, { pokok: string; piutang: string; keterangan: string }>>({});

  // Initialize bulk rows
  const handleResetBulk = () => {
    const initial: Record<string, { pokok: string; piutang: string; keterangan: string }> = {};
    for (const leaf of leafNodes) {
      initial[leaf.id] = { pokok: '', piutang: '', keterangan: '' };
    }
    setBulkRows(initial);
  };

  // Determine current active leaf node in cascading dropdown
  const currentSelectedNode = useMemo(() => {
    const l1Node = nodes.find(n => n.id === selectedL1);
    if (!l1Node) return null;
    if (l1Node.is_leaf) return l1Node;

    const l2Node = nodes.find(n => n.id === selectedL2);
    if (!l2Node) return null;
    if (l2Node.is_leaf) return l2Node;

    const l3Node = nodes.find(n => n.id === selectedL3);
    if (!l3Node) return null;
    if (l3Node.is_leaf) return l3Node;

    const l4Node = nodes.find(n => n.id === selectedL4);
    return l4Node || null;
  }, [nodes, selectedL1, selectedL2, selectedL3, selectedL4]);

  // Options for Level 1 (Children of PAD)
  const l1Options = useMemo(() => nodes.filter(n => n.parent_id === 'pad'), [nodes]);

  // Options for Level 2 (Children of selected L1)
  const l2Options = useMemo(() => nodes.filter(n => n.parent_id === selectedL1), [nodes, selectedL1]);

  // Options for Level 3 (Children of selected L2)
  const l3Options = useMemo(() => nodes.filter(n => n.parent_id === selectedL2), [nodes, selectedL2]);

  // Options for Level 4 (Children of selected L3)
  const l4Options = useMemo(() => nodes.filter(n => n.parent_id === selectedL3), [nodes, selectedL3]);

  // Average daily calculation for surge warning (>10x daily average) (Requirement G)
  const dailyAverageForCurrentLeaf = useMemo(() => {
    if (!currentSelectedNode) return 0;
    const leafTx = transactions.filter(t => t.uraian_id === currentSelectedNode.id);
    if (leafTx.length === 0) return 0;
    const total = leafTx.reduce((sum, t) => sum + (t.total || 0), 0);
    return total / leafTx.length;
  }, [transactions, currentSelectedNode]);

  // Check lock on selected date
  const lockStatus = isDateLocked(selectedDate);

  // Handle single transaction submission
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!currentSelectedNode || !currentSelectedNode.is_leaf) {
      setFeedback({ type: 'error', message: 'Silakan pilih pos penerimaan yang valid.' });
      return;
    }

    if (lockStatus.isLocked) {
      setFeedback({
        type: 'error',
        message: `Tanggal ${selectedDate} sudah TERKUNCI oleh laporan final (${lockStatus.finalizedReport?.nomor_laporan}).`
      });
      return;
    }

    const pokokNum = parseFloat(pokokInput) || 0;
    const piutangNum = parseFloat(piutangInput) || 0;

    if (pokokNum < 0 || piutangNum < 0) {
      setFeedback({ type: 'error', message: 'Nilai pokok dan piutang tidak boleh bernilai negatif.' });
      return;
    }

    if (pokokNum === 0 && piutangNum === 0) {
      setFeedback({ type: 'error', message: 'Masukkan setidaknya nilai pokok atau piutang (> 0).' });
      return;
    }

    const totalInput = pokokNum + piutangNum;

    // Check surge warning (> 10x average)
    if (dailyAverageForCurrentLeaf > 0 && totalInput > dailyAverageForCurrentLeaf * 10) {
      const confirmLarge = confirm(
        `PERINGATAN DETEKSI LONJAKAN NILAI:\n\nNominal yang Anda masukkan (Rp ${formatRupiah(totalInput)}) lebih dari 10 KALI LIPAT rata-rata transaksi untuk '${currentSelectedNode.nama}' (Rata-rata: Rp ${formatRupiah(dailyAverageForCurrentLeaf)}).\n\nApakah Anda yakin nominal ini sudah benar dan bukan salah ketik?`
      );
      if (!confirmLarge) return;
    }

    const result = onAddTransaction({
      uraian_id: currentSelectedNode.id,
      tanggal: selectedDate,
      pokok: pokokNum,
      piutang: piutangNum,
      keterangan: keteranganInput || 'Penerimaan harian'
    });

    if (result.success) {
      setFeedback({
        type: 'success',
        message: `Berhasil mencatat penerimaan untuk '${currentSelectedNode.nama}' sebesar Rp ${formatRupiah(totalInput)}`
      });
      setPokokInput('');
      setPiutangInput('');
      setKeteranganInput('');
    } else {
      setFeedback({ type: 'error', message: result.error || 'Gagal menyimpan transaksi.' });
    }
  };

  // Handle Bulk submission
  const handleSubmitBulk = () => {
    if (lockStatus.isLocked) {
      setFeedback({
        type: 'error',
        message: `Tanggal ${selectedDate} sudah terkunci oleh laporan final (${lockStatus.finalizedReport?.nomor_laporan || ''}).`
      });
      return;
    }

    const itemsToInsert: { uraian_id: string; pokok: number; piutang: number; keterangan?: string }[] = [];

    for (const leaf of leafNodes) {
      const row = bulkRows[leaf.id];
      if (!row) continue;
      const pokok = parseFloat(row.pokok) || 0;
      const piutang = parseFloat(row.piutang) || 0;

      if (pokok < 0 || piutang < 0) {
        setFeedback({
          type: 'error',
          message: `Nilai negatif ditemukan pada ${leaf.nama}. Nilai harus >= 0.`
        });
        return;
      }

      if (pokok > 0 || piutang > 0) {
        itemsToInsert.push({
          uraian_id: leaf.id,
          pokok,
          piutang,
          keterangan: row.keterangan || 'Input Massal Harian'
        });
      }
    }

    if (itemsToInsert.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Tidak ada baris dengan nilai pokok atau piutang yang diisi.'
      });
      return;
    }

    const res = onBulkAddTransactions(selectedDate, itemsToInsert);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Berhasil menyimpan ${res.count} transaksi untuk tanggal ${selectedDate}!`
      });
      handleResetBulk();
    } else {
      setFeedback({
        type: 'error',
        message: `Gagal: ${res.error}`
      });
    }
  };

  // Handle Delete Confirmation (In-App Modal to avoid iframe prompt issues)
  const handleConfirmDelete = () => {
    if (!deletingTx) return;
    const res = onDeleteTransaction(deletingTx.id);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `Transaksi '${deletingTx.nama}' sebesar Rp ${formatRupiah(deletingTx.total)} berhasil dihapus.`
      });
    } else {
      setFeedback({
        type: 'error',
        message: res.error || 'Gagal menghapus transaksi.'
      });
    }
    setDeletingTx(null);
  };

  // Handle Save Edited Transaction
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const p = parseFloat(editingTx.pokok) || 0;
    const pi = parseFloat(editingTx.piutang) || 0;

    if (p < 0 || pi < 0) {
      setEditError('Nilai pokok dan piutang tidak boleh bernilai negatif.');
      return;
    }

    if (p === 0 && pi === 0) {
      setEditError('Masukkan setidaknya nilai pokok atau piutang (> 0).');
      return;
    }

    const editDateLock = isDateLocked(editingTx.tanggal);
    if (editDateLock.isLocked) {
      setEditError(`Tanggal ${editingTx.tanggal} sudah terkunci oleh laporan final (${editDateLock.finalizedReport?.nomor_laporan || ''}).`);
      return;
    }

    const res = onUpdateTransaction(editingTx.id, {
      uraian_id: editingTx.uraian_id,
      tanggal: editingTx.tanggal,
      pokok: p,
      piutang: pi,
      keterangan: editingTx.keterangan
    });

    if (res.success) {
      const uNode = nodes.find(n => n.id === editingTx.uraian_id);
      setFeedback({
        type: 'success',
        message: `Transaksi '${uNode?.nama || 'Pos'}' berhasil diperbarui (Total: Rp ${formatRupiah(p + pi)}).`
      });
      setEditingTx(null);
      setEditError(null);
    } else {
      setEditError(res.error || 'Gagal menyimpan perubahan transaksi.');
    }
  };

  // --- Excel Import Handlers ---
  const handleDownloadTemplate = () => {
    downloadRealisasiTemplate(leafNodes, selectedDate);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setImportFileName(file.name);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const buffer = evt.target?.result as ArrayBuffer;
        const result = parseAndValidateRealisasiImport(buffer, nodes, selectedDate);
        setImportRows(result.rows);
        setImportSummary({
          validCount: result.validCount,
          errorCount: result.errorCount,
          totalPokok: result.totalPokok,
          totalPiutang: result.totalPiutang,
          totalNominal: result.totalNominal
        });
      } catch (err: any) {
        setFeedback({
          type: 'error',
          message: `Gagal membaca file Excel: ${err.message || 'Pastikan file berekstensi .xlsx atau .xls'}`
        });
      } finally {
        setIsProcessingFile(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleCommitImport = () => {
    const validRowsToInsert = importRows.filter(r => r.isValid && r.uraian_id && (r.pokok > 0 || r.piutang > 0));

    if (validRowsToInsert.length === 0) {
      setFeedback({
        type: 'error',
        message: 'Tidak ada baris data valid dengan nominal (> 0) yang dapat diimpor.'
      });
      return;
    }

    if (onBatchImportTransactions) {
      const items = validRowsToInsert.map(r => ({
        uraian_id: r.uraian_id!,
        tanggal: r.tanggal || selectedDate,
        pokok: r.pokok,
        piutang: r.piutang,
        keterangan: r.keterangan || 'Import Excel Realisasi PAD'
      }));

      const res = onBatchImportTransactions(items);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: `Berhasil mengimpor ${res.insertedCount} transaksi realisasi dari file '${importFileName}'!${
            res.skippedLockedCount > 0 ? ` (${res.skippedLockedCount} baris dilewati karena tanggalnya terkunci)` : ''
          }`
        });
        handleResetImport();
      } else {
        setFeedback({
          type: 'error',
          message: `Gagal impor: ${res.error}`
        });
      }
    } else {
      let count = 0;
      for (const r of validRowsToInsert) {
        onAddTransaction({
          uraian_id: r.uraian_id!,
          tanggal: r.tanggal || selectedDate,
          pokok: r.pokok,
          piutang: r.piutang,
          keterangan: r.keterangan
        });
        count++;
      }
      setFeedback({
        type: 'success',
        message: `Berhasil mengimpor ${count} transaksi realisasi!`
      });
      handleResetImport();
    }
  };

  const handleResetImport = () => {
    setImportFileName(null);
    setImportRows([]);
    setImportSummary(null);
    setFilterOnlyErrors(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Filtered transactions for the selected date
  const dateTransactions = useMemo(() => {
    return transactions
      .filter(t => t.tanggal === selectedDate)
      .map(t => {
        const u = nodes.find(n => n.id === t.uraian_id);
        return { ...t, uraian_nama: u?.nama || t.uraian_id };
      });
  }, [transactions, selectedDate, nodes]);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Input Realisasi Penerimaan Harian
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan realisasi pokok dan piutang per pos pendapatan asli daerah
          </p>
        </div>

        {/* Segmented Mode Control */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold border border-emerald-300 transition-colors shadow-2xs"
            title="Unduh template Excel resmi untuk format import realisasi"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unduh Template Excel</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs w-full sm:w-auto">
            <button
              onClick={() => setActiveMode('single')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeMode === 'single'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListTree className="w-3.5 h-3.5 text-emerald-600" />
              <span>Dropdown Bertingkat</span>
            </button>
            <button
              onClick={() => setActiveMode('bulk')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
                activeMode === 'bulk'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="w-3.5 h-3.5 text-emerald-600" />
              <span>Input Massal</span>
            </button>
            <button
              onClick={() => setActiveMode('excel')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-colors ${
                activeMode === 'excel'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${activeMode === 'excel' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Import Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Picker Bar with Lock Warning */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <label className="block text-xs font-semibold text-slate-700">
                Tanggal Transaksi Penerimaan:
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-300 font-mono bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 mt-0.5"
              />
            </div>
          </div>

          {/* Quick Date Pills: 10 - 14 Okt */}
          <div className="flex items-center gap-1.5 flex-wrap pt-2 sm:pt-0">
            <span className="text-[11px] font-semibold text-slate-400">Data Dummy Okt:</span>
            {['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'].map(d => {
              const day = d.split('-')[2];
              const isSel = selectedDate === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all ${
                    isSel
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title={`Lihat / input transaksi tanggal ${d}`}
                >
                  {day} Okt
                </button>
              );
            })}
          </div>
        </div>

        {lockStatus.isLocked && (
          <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2 rounded-lg text-xs font-medium">
            <Lock className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              Tanggal <strong>{selectedDate}</strong> terkunci oleh laporan final <strong>{lockStatus.finalizedReport?.nomor_laporan}</strong>.
              Tidak dapat menambah transaksi baru.
            </span>
          </div>
        )}
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-600">
            &times;
          </button>
        </div>
      )}

      {/* MODE 1: Cascading Dropdown */}
      {activeMode === 'single' && (
        <form onSubmit={handleSubmitSingle} className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-base">
              Pilih Pos Penerimaan (Dropdown Bertingkat Otomatis)
            </h3>
            <p className="text-xs text-slate-500">
              Pilihan akan berjenjang menyesuaikan kedalaman cabang pos penerimaan
            </p>
          </div>

          {/* Cascading Dropdown Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Level 1: Under PAD */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">1. Sektor (Level 1)</label>
              <select
                value={selectedL1}
                onChange={e => {
                  const newL1 = e.target.value;
                  setSelectedL1(newL1);
                  const children = nodes.filter(n => n.parent_id === newL1);
                  if (children.length > 0) {
                    const firstChild = children[0];
                    setSelectedL2(firstChild.id);
                    const subChildren = nodes.filter(n => n.parent_id === firstChild.id);
                    if (subChildren.length > 0) {
                      const firstSubChild = subChildren[0];
                      setSelectedL3(firstSubChild.id);
                      const leafChildren = nodes.filter(n => n.parent_id === firstSubChild.id);
                      if (leafChildren.length > 0) setSelectedL4(leafChildren[0].id);
                      else setSelectedL4('');
                    } else {
                      setSelectedL3('');
                      setSelectedL4('');
                    }
                  } else {
                    setSelectedL2('');
                    setSelectedL3('');
                    setSelectedL4('');
                  }
                }}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {l1Options.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Level 2 */}
            {l2Options.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  {selectedL1 === 'c_denda' ? '2. Pos Denda Pajak' : '2. Kategori (Level 2)'}
                </label>
                <select
                  value={selectedL2}
                  onChange={e => {
                    const newL2 = e.target.value;
                    setSelectedL2(newL2);
                    const subChildren = nodes.filter(n => n.parent_id === newL2);
                    if (subChildren.length > 0) {
                      const firstSubChild = subChildren[0];
                      setSelectedL3(firstSubChild.id);
                      const leafChildren = nodes.filter(n => n.parent_id === firstSubChild.id);
                      if (leafChildren.length > 0) setSelectedL4(leafChildren[0].id);
                      else setSelectedL4('');
                    } else {
                      setSelectedL3('');
                      setSelectedL4('');
                    }
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {l2Options.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Level 3 */}
            {l3Options.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">3. Sub-Kategori (Level 3)</label>
                <select
                  value={selectedL3}
                  onChange={e => {
                    const newL3 = e.target.value;
                    setSelectedL3(newL3);
                    const leafChildren = nodes.filter(n => n.parent_id === newL3);
                    if (leafChildren.length > 0) setSelectedL4(leafChildren[0].id);
                    else setSelectedL4('');
                  }}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {l3Options.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Level 4: Leaf Nodes under 1 or 2 */}
            {l4Options.length > 0 && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">4. Pos Penerimaan (Level 4)</label>
                <select
                  value={selectedL4}
                  onChange={e => setSelectedL4(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-medium"
                >
                  {l4Options.map(opt => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nama}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Current Selection Summary Card */}
          {currentSelectedNode && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-500">Target Pos Terpilih:</span>{' '}
                <strong className="text-emerald-950 font-bold">{currentSelectedNode.nama}</strong>{' '}
                <span className="text-emerald-700 font-mono">({currentSelectedNode.kode})</span>
              </div>
              {dailyAverageForCurrentLeaf > 0 && (
                <div className="text-slate-600">
                  Rata-rata transaksi harian:{' '}
                  <strong className="font-mono text-slate-800">
                    Rp {formatRupiah(dailyAverageForCurrentLeaf)}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Nominal Inputs (Pokok & Piutang) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Penerimaan POKOK (Rp) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={pokokInput}
                onChange={e => setPokokInput(e.target.value)}
                placeholder="Contoh: 15000000"
                className="w-full text-sm font-mono p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                disabled={lockStatus.isLocked}
              />
              <span className="text-[11px] text-slate-400">Tidak boleh negatif (&ge; 0)</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Penerimaan PIUTANG (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={piutangInput}
                onChange={e => setPiutangInput(e.target.value)}
                placeholder="0 jika tidak ada"
                className="w-full text-sm font-mono p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                disabled={lockStatus.isLocked}
              />
              <span className="text-[11px] text-slate-400">Tidak boleh negatif (&ge; 0)</span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">
                Total Realisasi Transaksi
              </label>
              <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-sm font-mono font-bold text-slate-800">
                Rp {formatRupiah((parseFloat(pokokInput) || 0) + (parseFloat(piutangInput) || 0))}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700">
              Keterangan / Nomor Bukti Setor (Opsional)
            </label>
            <input
              type="text"
              value={keteranganInput}
              onChange={e => setKeteranganInput(e.target.value)}
              placeholder="Contoh: STS Kasda Bank Jatim No. 441/IX/2026"
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              disabled={lockStatus.isLocked}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={lockStatus.isLocked}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan Transaksi Realisasi</span>
            </button>
          </div>
        </form>
      )}

      {/* MODE 2: Bulk Input per Date (Requirement G) */}
      {activeMode === 'bulk' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                Input Massal Semua Pos Penerimaan untuk Tanggal {selectedDate}
              </h3>
              <p className="text-xs text-slate-500">
                Isi nominal Pokok dan Piutang pada tabel berikut lalu klik simpan sekaligus
              </p>
            </div>
            <button
              onClick={handleResetBulk}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 bg-slate-100 px-3 py-1.5 rounded-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kosongkan Tabel</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-lg max-h-[500px] scrollbar-thin">
            <table className="min-w-[680px] w-full text-xs text-left">
              <thead className="bg-slate-800 text-slate-100 sticky top-0 font-semibold">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">NO</th>
                  <th className="py-2.5 px-3 min-w-[240px]">NAMA POS PENERIMAAN</th>
                  <th className="py-2.5 px-3 w-44">POKOK (Rp)</th>
                  <th className="py-2.5 px-3 w-44">PIUTANG (Rp)</th>
                  <th className="py-2.5 px-3 w-40 text-right">TOTAL</th>
                  <th className="py-2.5 px-3 min-w-[180px]">KETERANGAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leafNodes.map((leaf, idx) => {
                  const current = bulkRows[leaf.id] || { pokok: '', piutang: '', keterangan: '' };
                  const pNum = parseFloat(current.pokok) || 0;
                  const piNum = parseFloat(current.piutang) || 0;
                  const total = pNum + piNum;

                  return (
                    <tr key={leaf.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-2 px-3">
                        <div className="font-semibold text-slate-900">{leaf.nama}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{leaf.kode}</div>
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          min="0"
                          value={current.pokok}
                          onChange={e => {
                            setBulkRows(prev => ({
                              ...prev,
                              [leaf.id]: { ...(prev[leaf.id] || { pokok: '', piutang: '', keterangan: '' }), pokok: e.target.value }
                            }));
                          }}
                          placeholder="0"
                          disabled={lockStatus.isLocked}
                          className="w-full text-xs font-mono p-1.5 rounded border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="number"
                          min="0"
                          value={current.piutang}
                          onChange={e => {
                            setBulkRows(prev => ({
                              ...prev,
                              [leaf.id]: { ...(prev[leaf.id] || { pokok: '', piutang: '', keterangan: '' }), piutang: e.target.value }
                            }));
                          }}
                          placeholder="0"
                          disabled={lockStatus.isLocked}
                          className="w-full text-xs font-mono p-1.5 rounded border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                        {total > 0 ? `Rp ${formatRupiah(total)}` : '-'}
                      </td>
                      <td className="py-1 px-2">
                        <input
                          type="text"
                          value={current.keterangan}
                          onChange={e => {
                            setBulkRows(prev => ({
                              ...prev,
                              [leaf.id]: { ...(prev[leaf.id] || { pokok: '', piutang: '', keterangan: '' }), keterangan: e.target.value }
                            }));
                          }}
                          placeholder="Ket..."
                          disabled={lockStatus.isLocked}
                          className="w-full text-xs p-1.5 rounded border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSubmitBulk}
              disabled={lockStatus.isLocked}
              className="flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan Semua Transaksi Massal</span>
            </button>
          </div>
        </div>
      )}

      {/* MODE 3: Import Excel Realisasi */}
      {activeMode === 'excel' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          {/* Header & Instructions */}
          <div className="border-b border-slate-100 pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  Import Transaksi Realisasi dari File Excel (.xlsx / .xls)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Input data penerimaan dalam jumlah banyak tanpa ribet. Format template sudah disesuaikan dengan 23 master pos leaf Bappenda.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Template Excel (.xlsx)</span>
              </button>
            </div>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Struktur Rapi &amp; Valid</strong>
                  <span className="text-slate-500 text-[11px]">Template mencakup kode rekening dan nama pos resmi agar tidak tertukar.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Multi-Tanggal Sekaligus</strong>
                  <span className="text-slate-500 text-[11px]">Bisa input tanggal yang berbeda pada setiap baris transaksi (misal: 10 s/d 14 Okt).</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 block">Validasi Ketat Zero Error</strong>
                  <span className="text-slate-500 text-[11px]">Otomatis mendeteksi pos induk, minus, atau salah format sebelum disimpan.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Area & File Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
            {/* Box Unduh Template */}
            <div className="lg:col-span-5 p-5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">1</span>
                  <span>Langkah Pertama: Unduh File Template</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Gunakan file template standar yang telah disediakan. File ini sudah berisi <strong>23 pos penerimaan Leaf</strong>, format tanggal, kolom Pokok, Piutang, serta lembar petunjuk pengisian.
                </p>
                <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                  <div className="font-semibold text-slate-700">Contoh format kolom:</div>
                  <div className="font-mono text-emerald-800 font-medium">KODE_REKENING | NAMA_POS | TANGGAL | POKOK_RP | PIUTANG_RP</div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Unduh File: Template_Import_Realisasi_PAD.xlsx</span>
              </button>
            </div>

            {/* Box Upload File */}
            <div className="lg:col-span-7 p-5 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50/70 transition-colors flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wide">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">2</span>
                  <span>Langkah Kedua: Unggah File Excel</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pilih file Excel yang sudah Anda isi angka pokok dan piutangnya. Sistem akan memindai dan memverifikasi isi tabel secara instan.
                </p>

                {importFileName ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-emerald-300 text-xs shadow-2xs">
                    <div className="flex items-center gap-2.5 truncate">
                      <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div className="truncate">
                        <span className="font-bold text-slate-800 block truncate">{importFileName}</span>
                        <span className="text-[11px] text-slate-500">{importRows.length} baris data terbaca</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded border border-emerald-300 shrink-0 ml-2"
                    >
                      Ganti File
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="cursor-pointer border border-emerald-200 bg-white hover:border-emerald-400 p-4 rounded-xl text-center space-y-1.5 transition-all group"
                  >
                    <Upload className="w-7 h-7 text-emerald-600 mx-auto group-hover:scale-110 transition-transform" />
                    <span className="block text-xs font-bold text-slate-800">
                      Klik untuk memilih file Excel (.xlsx / .xls)
                    </span>
                    <span className="block text-[11px] text-slate-400">
                      Atau seret dan lepas file Anda ke area ini
                    </span>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {importSummary && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-slate-600">
                    Status: <strong className="text-emerald-700 font-bold">{importSummary.validCount} baris valid</strong>
                    {importSummary.errorCount > 0 && (
                      <span className="text-rose-600 ml-1.5">({importSummary.errorCount} baris bermasalah)</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={handleResetImport}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 underline"
                  >
                    Batal / Bersihkan
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Validation Preview & Commit Section */}
          {importSummary && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              {/* Metric Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block">Total Baris</span>
                  <span className="text-base font-bold text-slate-800 font-mono">{importRows.length}</span>
                </div>

                <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                  <span className="text-[11px] font-semibold text-emerald-800 block">Siap Diimpor</span>
                  <span className="text-base font-bold text-emerald-700 font-mono">{importSummary.validCount}</span>
                </div>

                <div className={`p-3 rounded-lg border ${importSummary.errorCount > 0 ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  <span className={`text-[11px] font-semibold block ${importSummary.errorCount > 0 ? 'text-rose-800' : 'text-slate-500'}`}>
                    Perlu Perbaikan
                  </span>
                  <span className={`text-base font-bold font-mono ${importSummary.errorCount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    {importSummary.errorCount}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block">Total Pokok</span>
                  <span className="text-xs font-bold text-slate-800 font-mono truncate block" title={`Rp ${formatRupiah(importSummary.totalPokok)}`}>
                    Rp {formatRupiah(importSummary.totalPokok)}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-semibold text-slate-500 block">Total Piutang</span>
                  <span className="text-xs font-bold text-slate-800 font-mono truncate block" title={`Rp ${formatRupiah(importSummary.totalPiutang)}`}>
                    Rp {formatRupiah(importSummary.totalPiutang)}
                  </span>
                </div>

                <div className="bg-emerald-100/70 p-3 rounded-lg border border-emerald-300">
                  <span className="text-[11px] font-bold text-emerald-900 block">Total Realisasi</span>
                  <span className="text-xs font-black text-emerald-800 font-mono truncate block" title={`Rp ${formatRupiah(importSummary.totalNominal)}`}>
                    Rp {formatRupiah(importSummary.totalNominal)}
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="filterErrors"
                    checked={filterOnlyErrors}
                    onChange={e => setFilterOnlyErrors(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="filterErrors" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Hanya tampilkan baris yang bermasalah ({importSummary.errorCount})
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetImport}
                    className="text-xs font-semibold px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-600 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleCommitImport}
                    disabled={importSummary.validCount === 0}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-xs transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Simpan {importSummary.validCount} Transaksi ke Sistem</span>
                  </button>
                </div>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-96 scrollbar-thin">
                <table className="min-w-full divide-y divide-slate-200 text-xs">
                  <thead className="bg-slate-900 text-white font-semibold text-left sticky top-0 z-10">
                    <tr>
                      <th className="py-2.5 px-3 w-14 text-center">Baris</th>
                      <th className="py-2.5 px-3 w-28">Kode Rekening</th>
                      <th className="py-2.5 px-4 min-w-[200px]">Pos Penerimaan (Leaf)</th>
                      <th className="py-2.5 px-3 w-28 font-mono">Tanggal</th>
                      <th className="py-2.5 px-3 w-32 text-right">Pokok (Rp)</th>
                      <th className="py-2.5 px-3 w-32 text-right">Piutang (Rp)</th>
                      <th className="py-2.5 px-3 w-36 text-right">Total (Rp)</th>
                      <th className="py-2.5 px-4 min-w-[180px]">Status &amp; Keterangan Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {importRows
                      .filter(r => !filterOnlyErrors || !r.isValid)
                      .map((row, idx) => (
                        <tr
                          key={idx}
                          className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/70 hover:bg-rose-100/60'}
                        >
                          <td className="py-2 px-3 text-center font-mono text-slate-500">
                            {row.rowNumber}
                          </td>
                          <td className="py-2 px-3 font-mono font-medium text-slate-700">
                            {row.kode || '-'}
                          </td>
                          <td className="py-2 px-4 font-semibold text-slate-800">
                            {row.nama}
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 whitespace-nowrap">
                            {row.tanggal}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700">
                            {formatRupiah(row.pokok)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono text-slate-700">
                            {formatRupiah(row.piutang)}
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                            {formatRupiah(row.total)}
                          </td>
                          <td className="py-2 px-4">
                            {row.isValid ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Valid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800" title={row.error}>
                                <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                                <span className="truncate max-w-[200px]">{row.error}</span>
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
      )}

      {/* List of transactions on selected date */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm">
            Daftar Transaksi Tercatat pada {selectedDate} ({dateTransactions.length} transaksi)
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              Total:{' '}
              <strong className="font-mono text-emerald-700">
                Rp {formatRupiah(dateTransactions.reduce((s, t) => s + t.total, 0))}
              </strong>
            </span>
            {onClearAllTransactions && transactions.length > 0 && (
              <button
                type="button"
                onClick={() => setShowClearAllConfirm(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                title="Hapus seluruh data transaksi realisasi"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Semua Transaksi ({transactions.length})</span>
              </button>
            )}
          </div>
        </div>

        {dateTransactions.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Tidak ada transaksi penerimaan pada tanggal {selectedDate}.
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="min-w-[550px] w-full text-xs text-left font-sans">
              <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 font-semibold tracking-tight">
                <tr>
                  <th className="py-2.5 px-3">Pos Penerimaan</th>
                  <th className="py-2.5 px-3 text-right">Pokok</th>
                  <th className="py-2.5 px-3 text-right">Piutang</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3">Keterangan</th>
                  <th className="py-2.5 px-3 text-center min-w-[130px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dateTransactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{tx.uraian_nama}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums tracking-tight text-slate-700">{formatRupiah(tx.pokok)}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums tracking-tight text-slate-700">{formatRupiah(tx.piutang)}</td>
                    <td className="py-2.5 px-3 text-right font-mono tabular-nums tracking-tight font-bold text-emerald-700">{formatRupiah(tx.total)}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-sans">{tx.keterangan || '-'}</td>
                    <td className="py-2.5 px-3 text-center">
                      {!lockStatus.isLocked ? (
                        <div className="flex items-center justify-center gap-1.5 font-sans">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingTx({
                                id: tx.id,
                                uraian_id: tx.uraian_id,
                                tanggal: tx.tanggal,
                                pokok: String(tx.pokok),
                                piutang: String(tx.piutang),
                                keterangan: tx.keterangan || ''
                              });
                              setEditError(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 transition-colors shadow-2xs"
                            title="Edit transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeletingTx({
                                id: tx.id,
                                nama: tx.uraian_nama,
                                total: tx.total,
                                tanggal: tx.tanggal
                              });
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-rose-600 bg-rose-50 hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-2xs"
                            title="Hapus transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      ) : (
                        <span className="inline-block text-[10px] text-slate-400 font-sans bg-slate-100 px-2 py-0.5 rounded">
                          Terkunci
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hapus Transaksi (Reliable in-app dialog) */}
      {deletingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Konfirmasi Hapus Transaksi
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Apakah Anda yakin ingin menghapus catatan transaksi penerimaan ini?
                  </p>
                </div>
              </div>

              {/* Transaction Summary Card */}
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pos Penerimaan:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[220px] truncate">
                    {deletingTx.nama}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tanggal:</span>
                  <span className="font-mono text-slate-700">{deletingTx.tanggal}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-700 font-medium">Nominal Total:</span>
                  <span className="font-mono font-bold text-rose-600 text-sm">
                    Rp {formatRupiah(deletingTx.total)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Kalkulasi laporan PAD akan langsung diperbarui otomatis setelah transaksi dihapus.</span>
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingTx(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Transaksi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Transaksi */}
      {editingTx && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Edit Transaksi Realisasi
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbarui pos penerimaan, tanggal, atau nominal transaksi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTx(null);
                  setEditError(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editError}</span>
                </div>
              )}

              {/* Pos Penerimaan Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pos Penerimaan
                </label>
                <select
                  value={editingTx.uraian_id}
                  onChange={e => setEditingTx(prev => prev ? { ...prev, uraian_id: e.target.value } : null)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  {leafNodes.map(node => (
                    <option key={node.id} value={node.id}>
                      {node.kode} - {node.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal Transaksi */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Realisasi
                </label>
                <input
                  type="date"
                  value={editingTx.tanggal}
                  onChange={e => setEditingTx(prev => prev ? { ...prev, tanggal: e.target.value } : null)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                {isDateLocked(editingTx.tanggal).isLocked && (
                  <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1 font-sans">
                    <Lock className="w-3 h-3" /> Tanggal ini sudah terkunci oleh laporan final ({isDateLocked(editingTx.tanggal).finalizedReport?.nomor_laporan || ''}).
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nominal Pokok */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal Pokok (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingTx.pokok}
                    onChange={e => setEditingTx(prev => prev ? { ...prev, pokok: e.target.value } : null)}
                    placeholder="0"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Rp {formatRupiah(parseFloat(editingTx.pokok) || 0)}
                  </div>
                </div>

                {/* Nominal Piutang */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nominal Piutang (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingTx.piutang}
                    onChange={e => setEditingTx(prev => prev ? { ...prev, piutang: e.target.value } : null)}
                    placeholder="0"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Rp {formatRupiah(parseFloat(editingTx.piutang) || 0)}
                  </div>
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                <span className="font-medium text-slate-600">Total Realisasi Baru:</span>
                <span className="font-mono font-bold text-emerald-700 text-sm">
                  Rp {formatRupiah((parseFloat(editingTx.pokok) || 0) + (parseFloat(editingTx.piutang) || 0))}
                </span>
              </div>

              {/* Keterangan */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  value={editingTx.keterangan}
                  onChange={e => setEditingTx(prev => prev ? { ...prev, keterangan: e.target.value } : null)}
                  placeholder="Catatan / nomor bukti..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingTx(null);
                    setEditError(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isDateLocked(editingTx.tanggal).isLocked}
                  className="px-5 py-2 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  style={{ backgroundColor: '#0CBAA4' }}
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Semua Transaksi */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Hapus Semua Transaksi Realisasi?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Seluruh {transactions.length} catatan transaksi penerimaan di semua tanggal akan dihapus permanen. Anda dapat menginput ulang data dari awal secara mandiri.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClearAllConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearAllTransactions) {
                      onClearAllTransactions();
                    }
                    setShowClearAllConfirm(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Hapus Semua Transaksi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
