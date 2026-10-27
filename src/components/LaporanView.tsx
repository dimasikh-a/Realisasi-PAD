import React, { useMemo } from 'react';
import { UraianNode, TargetAnggaran, TransaksiPenerimaan, Laporan } from '../types/pad';
import { calculateReportData, formatRupiah, formatPersen, formatPersenAngka } from '../services/calculationEngine';
import { exportLaporanToExcel } from '../services/excelService';
import { FileSpreadsheet, Printer, Calendar, MoveHorizontal, CheckCircle2 } from 'lucide-react';

interface LaporanViewProps {
  nodes: UraianNode[];
  targets: TargetAnggaran[];
  transactions: TransaksiPenerimaan[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  laporanList?: Laporan[];
  keteranganMap?: Record<string, string>;
  // Optional legacy props to keep backwards compatibility if passed from App
  currentRole?: any;
  onFinalize?: any;
  onUnlock?: any;
  onSaveKeterangan?: any;
  onUpdateTarget?: any;
}

export const LaporanView: React.FC<LaporanViewProps> = ({
  nodes,
  targets,
  transactions,
  selectedDate,
  setSelectedDate,
  laporanList = [],
  keteranganMap = {}
}) => {
  // Check if current date has a report record
  const currentReport = useMemo(() => {
    return laporanList.find(l => l.tanggal_laporan === selectedDate);
  }, [laporanList, selectedDate]);

  // Calculate report data using strictly deterministic tree roll-up engine
  const { rows, reportMonthName } = useMemo(() => {
    return calculateReportData(nodes, targets, transactions, selectedDate, keteranganMap);
  }, [nodes, targets, transactions, selectedDate, keteranganMap]);

  // Styling per level based on official Bappenda layout
  const getRowStyle = (row: typeof rows[0]) => {
    const id = row.uraian.id;
    if (id === 'pad') {
      // Bottom official total row: distinct salmon/warm amber highlight
      return 'bg-amber-100 text-slate-950 font-black tracking-wide border-t-2 border-amber-400 shadow-xs';
    }
    if (id === 'pajak_daerah' || id === 'a_pajak_daerah' || id === 'b_opsen_pajak' || id === 'c_denda') {
      // Main category subtotals: soft green highlight
      return 'bg-emerald-100 text-emerald-950 font-bold border-t border-emerald-300';
    }
    if (id === 'a1_non_pbjt' || id === 'a2_pbjt') {
      return 'bg-slate-100 text-slate-900 font-bold border-t border-slate-300';
    }
    // Leaf rows
    return 'bg-white text-slate-800 hover:bg-slate-50 transition-colors border-b border-slate-200';
  };

  // Indentation for tree level
  const getIndentClass = (level: number) => {
    if (level === 0) return 'pl-3 font-extrabold';
    if (level === 1) return 'pl-4 font-bold';
    if (level === 2) return 'pl-6 font-semibold';
    if (level === 3) return 'pl-9 font-semibold';
    // Level 4 (Pos Penerimaan under 1 & 2)
    return 'pl-14 text-slate-800 font-medium';
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    exportLaporanToExcel(rows, selectedDate, reportMonthName, currentReport?.nomor_laporan);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-5">
      {/* Top Toolbar: Date Selector, Quick Dates, View Badge, Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-xs print:hidden">
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-700">Tanggal Posisi:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-xs sm:text-sm px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-300 font-mono bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Quick Date Pills: 10 - 14 Okt */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400">Pilih Cepat:</span>
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
                  title={`Tampilkan laporan per ${d}`}
                >
                  {day} Okt
                </button>
              );
            })}
          </div>

          {/* Clean View Badge: Read-Only Official Report */}
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Laporan Otomatis (Hanya Baca)
            </span>
          </div>
        </div>

        {/* Action Buttons: Export Excel & Print Only */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors shadow-xs"
            title="Download laporan dalam format Microsoft Excel (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Export Excel</span>
          </button>

          {/* Print / PDF */}
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition-colors shadow-xs"
            title="Cetak langsung atau simpan sebagai dokumen PDF"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Official Document Header (Format Resmi Bappenda) */}
      <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-xs print:border-none print:shadow-none print:p-0">
        <div className="text-center space-y-1 mb-4 sm:mb-5 border-b border-slate-200 pb-3 sm:pb-4">
          <h2 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-widest">
            Pemerintah Daerah Kabupaten / Kota
          </h2>
          <h1 className="text-base sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight">
            Badan Pendapatan Daerah (Bappenda)
          </h1>
          <p className="text-xs sm:text-sm font-bold text-emerald-800 uppercase tracking-wide">
            Laporan Realisasi Penerimaan Pendapatan Asli Daerah (PAD)
          </p>
          <div className="text-xs text-slate-500 font-mono pt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5">
            <span>Posisi Tanggal: <strong className="text-slate-800">{selectedDate}</strong> ({reportMonthName})</span>
            {currentReport?.nomor_laporan && (
              <span>No: <strong>{currentReport.nomor_laporan}</strong></span>
            )}
          </div>
        </div>

        {/* Mobile Swipe Hint */}
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pb-1.5 sm:hidden print:hidden">
          <MoveHorizontal className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Geser tabel ke kanan/kiri untuk melihat seluruh kolom</span>
        </div>

        {/* Official Report Table - PURE READ ONLY */}
        <div className="overflow-x-auto rounded-lg border border-slate-300 scrollbar-thin">
          <table className="min-w-[1260px] w-full border-collapse text-xs text-left font-sans">
            {/* Multi-level Header */}
            <thead>
              {/* Row 1: Main Header */}
              <tr className="bg-slate-900 text-slate-100 border-b border-slate-700 text-center font-bold tracking-tight">
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-700 w-12 font-mono">
                  NO
                </th>
                <th rowSpan={2} className="py-2.5 px-4 border-r border-slate-700 text-left min-w-[280px]">
                  URAIAN PENERIMAAN
                </th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-700 w-40 text-right">
                  TARGET (APBD)<br /><span className="text-[10px] font-normal text-slate-400">(Rp)</span>
                </th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-700 w-38 text-right">
                  REALISASI S/D BULAN LALU<br /><span className="text-[10px] font-normal text-slate-400">(Rp)</span>
                </th>
                {/* PENERIMAAN REALISASI spans subheader bulan */}
                <th colSpan={3} className="py-2 px-3 border-r border-slate-700 bg-slate-950 text-emerald-400 font-extrabold tracking-wide">
                  PENERIMAAN REALISASI - BULAN {reportMonthName.toUpperCase()}
                </th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-700 w-44 text-right bg-slate-900">
                  TOTAL PENERIMAAN REALISASI S/D BULAN INI<br /><span className="text-[10px] font-normal text-slate-400">(Rp)</span>
                </th>
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-700 w-16 text-center font-mono">
                  (%)
                </th>
                <th rowSpan={2} className="py-2.5 px-3 border-r border-slate-700 w-40 text-right">
                  SISA TARGET<br /><span className="text-[10px] font-normal text-slate-400">(Rp)</span>
                </th>
                <th rowSpan={2} className="py-2.5 px-2 border-r border-slate-700 w-16 text-center font-mono">
                  (%)
                </th>
                <th rowSpan={2} className="py-2.5 px-3 w-32 text-left print:hidden">
                  Ket
                </th>
              </tr>

              {/* Row 2: Sub-headers under PENERIMAAN REALISASI */}
              <tr className="bg-slate-800 text-slate-200 border-b border-slate-700 text-center font-semibold text-[11px]">
                <th className="py-2 px-3 border-r border-slate-700 w-32 text-right font-medium">
                  s/d Kemarin
                </th>
                <th className="py-2 px-3 border-r border-slate-700 w-32 text-right font-medium">
                  Hari Ini
                </th>
                <th className="py-2 px-3 border-r border-slate-700 w-36 text-right bg-slate-800/90 text-emerald-300 font-bold">
                  Jumlah
                </th>
              </tr>

              {/* Row 3: Official Column Number Row (matching attachment) */}
              <tr className="bg-slate-200 text-slate-700 border-b-2 border-slate-400 text-center text-[10px] font-mono font-bold">
                <td className="py-1 px-2 border-r border-slate-300">01</td>
                <td className="py-1 px-4 border-r border-slate-300 text-left font-sans">02</td>
                <td className="py-1 px-3 border-r border-slate-300 text-right">03</td>
                <td className="py-1 px-3 border-r border-slate-300 text-right">04</td>
                <td className="py-1 px-3 border-r border-slate-300 text-right">05</td>
                <td className="py-1 px-3 border-r border-slate-300 text-right">05</td>
                <td className="py-1 px-3 border-r border-slate-300 text-right">05</td>
                <td className="py-1 px-3 border-r border-slate-300 text-right">06</td>
                <td className="py-1 px-2 border-r border-slate-300">07</td>
                <td className="py-1 px-3 border-r border-slate-300 text-right">08(03-06)</td>
                <td className="py-1 px-2 border-r border-slate-300">09</td>
                <td className="py-1 px-3 text-left font-sans print:hidden">10</td>
              </tr>
            </thead>

            {/* Table Body - Completely Read-Only */}
            <tbody>
              {rows.map((row) => {
                const rowClass = getRowStyle(row);
                const indentClass = getIndentClass(row.uraian.level);

                return (
                  <tr key={row.uraian.id} className={rowClass}>
                    {/* 01: Item Number (only for leaf) */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-300/40 text-[11px] font-mono opacity-80">
                      {row.uraian.is_leaf ? row.uraian.urutan : ''}
                    </td>

                    {/* 02: Uraian */}
                    <td className={`py-2.5 pr-3 border-r border-slate-300/40 font-sans ${indentClass}`}>
                      <span>{row.uraian.nama}</span>
                    </td>

                    {/* 03: Target Anggaran (Read-Only Text) */}
                    <td className="py-2.5 px-3 text-right border-r border-slate-300/40 whitespace-nowrap font-mono tabular-nums tracking-tight font-semibold">
                      {formatRupiah(row.target)}
                    </td>

                    {/* 04: Realisasi s/d Bulan Lalu */}
                    <td className="py-2.5 px-3 text-right border-r border-slate-300/40 whitespace-nowrap font-mono tabular-nums tracking-tight font-medium">
                      {formatRupiah(row.s_d_bulan_lalu)}
                    </td>

                    {/* 05: s/d Kemarin (Bulan ini) */}
                    <td className="py-2.5 px-3 text-right border-r border-slate-300/40 whitespace-nowrap font-mono tabular-nums tracking-tight font-medium">
                      {formatRupiah(row.s_d_kemarin)}
                    </td>

                    {/* 05: Hari Ini */}
                    <td className="py-2.5 px-3 text-right border-r border-slate-300/40 whitespace-nowrap font-mono tabular-nums tracking-tight font-medium text-emerald-800">
                      {formatRupiah(row.hari_ini)}
                    </td>

                    {/* 05: Jumlah Bulan Ini (s/d Kemarin + Hari Ini) */}
                    <td className="py-2.5 px-3 text-right border-r border-slate-300/40 whitespace-nowrap font-mono tabular-nums tracking-tight font-semibold">
                      {formatRupiah(row.jumlah_s_d_hari_ini)}
                    </td>

                    {/* 06: Total Realisasi s/d Bulan Ini (04 + 05 Jumlah) */}
                    <td className="py-2.5 px-3 text-right border-r border-slate-300/40 whitespace-nowrap font-mono tabular-nums tracking-tight font-bold">
                      {formatRupiah(row.total_realisasi)}
                    </td>

                    {/* 07: (%) Capaian Realisasi (06 / 03 * 100) */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-300/40 whitespace-nowrap font-mono tabular-nums font-bold">
                      {formatPersenAngka(row.persen_capaian, row.target > 0)}
                    </td>

                    {/* 08(03-06): Sisa Target (03 - 06) */}
                    <td className="py-2.5 px-3 text-right border-r border-slate-300/40 whitespace-nowrap font-mono tabular-nums tracking-tight font-medium">
                      {formatRupiah(row.sisa_target)}
                    </td>

                    {/* 09: (%) Sisa Target (08 / 03 * 100) */}
                    <td className="py-2.5 px-2 text-center border-r border-slate-300/40 whitespace-nowrap font-mono tabular-nums font-medium">
                      {formatPersenAngka(row.persen_sisa_target, row.target > 0)}
                    </td>

                    {/* 10: Keterangan (Read-Only Text) */}
                    <td className="py-2.5 px-3 text-left print:hidden text-slate-600 font-sans text-xs">
                      {row.keterangan || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Signature Box for Official Print */}
        <div className="mt-8 pt-6 border-t border-slate-200 grid grid-cols-2 text-center text-xs print:grid">
          <div>
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-800 mt-1">Kepala Badan Pendapatan Daerah</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">( ............................................ )</p>
            <p className="text-slate-500">NIP. ........................................</p>
          </div>

          <div>
            <p className="text-slate-500">Dibuat Oleh,</p>
            <p className="font-bold text-slate-800 mt-1">Petugas Pengelola Penerimaan PAD</p>
            <div className="h-16" />
            <p className="font-bold underline text-slate-900">( ............................................ )</p>
            <p className="text-slate-500">NIP. ........................................</p>
          </div>
        </div>
      </div>
    </div>
  );
};
