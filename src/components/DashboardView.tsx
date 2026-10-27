import React, { useMemo } from 'react';
import { UraianNode, TargetAnggaran, TransaksiPenerimaan } from '../types/pad';
import {
  calculateReportData,
  formatRupiah,
  formatPersen,
} from '../services/calculationEngine';
import {
  Activity,
  BarChart3,
  Calendar,
  ChevronRight,
  Clock,
  DollarSign,
  Edit3,
  FileSpreadsheet,
  Layers,
  PieChart,
  Sparkles,
  TrendingUp,
  Wallet,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Konstanta                                                                 */
/* -------------------------------------------------------------------------- */

const QUICK_DATES = ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'];

const SECTORS = [
  {
    id: 'non_pbjt',
    rowId: 'a1_non_pbjt',
    name: '1. Pajak Non PBJT',
    sub: 'PBB-P2, BPHTB, Reklame, Air Tanah, MBLB, Walet',
    color: 'from-blue-600 to-indigo-600',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'pbjt',
    rowId: 'a2_pbjt',
    name: '2. PBJT (Barang & Jasa Tertentu)',
    sub: 'Makanan/Minuman, Tenaga Listrik, Perhotelan, Parkir, Hiburan',
    color: 'from-emerald-600 to-teal-600',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'opsen',
    rowId: 'b_opsen_pajak',
    name: 'B. Opsen Pajak PKB & BBNKB',
    sub: 'Opsen Pajak Kendaraan Bermotor & Bea Balik Nama',
    color: 'from-amber-600 to-orange-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'denda',
    rowId: 'c_denda',
    name: 'C. Pendapatan Denda Pajak',
    sub: '10 Pos Denda Keterlambatan Pembayaran Pajak Daerah',
    color: 'from-rose-600 to-pink-600',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
] as const;

const RANK_STYLES = [
  'bg-amber-500 text-white',
  'bg-slate-400 text-white',
  'bg-amber-700 text-white',
];

const dayOf = (iso: string) => iso.split('-')[2];

/* -------------------------------------------------------------------------- */
/*  Komponen kecil                                                            */
/* -------------------------------------------------------------------------- */

const Panel: React.FC<{ className?: string; children: React.ReactNode }> = ({
  className = '',
  children,
}) => (
  <section
    className={`bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-xs ${className}`}
  >
    {children}
  </section>
);

interface PanelHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const PanelHeader: React.FC<PanelHeaderProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-slate-100">
    <div className="min-w-0">
      <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-start gap-2">
        <span className="mt-0.5 shrink-0">{icon}</span>
        <span className="break-words">{title}</span>
      </h3>
      {description && <p className="text-xs text-slate-500 mt-0.5">{description}</p>}
    </div>
    {action && <div className="shrink-0">{action}</div>}
  </div>
);

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  hint: string;
  children?: React.ReactNode;
}> = ({ icon, title, hint, children }) => (
  <div className="p-6 sm:p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2">
    <div className="flex justify-center text-slate-300">{icon}</div>
    <p className="text-xs font-semibold text-slate-600 break-words">{title}</p>
    <p className="text-[11px] text-slate-400 max-w-sm mx-auto">{hint}</p>
    {children}
  </div>
);

interface KpiCardProps {
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  value: string;
  valueClass?: string;
  footer: React.ReactNode;
  note: React.ReactNode;
}

const KpiCard: React.FC<KpiCardProps> = ({
  label,
  icon,
  iconBg,
  value,
  valueClass = 'text-slate-900',
  footer,
  note,
}) => (
  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs min-w-0">
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>

    <p
      className={`mt-2 text-lg sm:text-xl xl:text-2xl font-black font-mono tracking-tight truncate ${valueClass}`}
      title={value}
    >
      {value}
    </p>

    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono">
      {footer}
    </div>
    <p className="mt-1 text-[11px] text-slate-400">{note}</p>
  </div>
);

/* -------------------------------------------------------------------------- */
/*  Tipe                                                                      */
/* -------------------------------------------------------------------------- */

interface DashboardViewProps {
  nodes: UraianNode[];
  targets: TargetAnggaran[];
  transactions: TransaksiPenerimaan[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onNavigateTab: (tab: string) => void;
}

interface DailyTrendItem {
  tanggal: string;
  total: number;
  pokok: number;
  piutang: number;
  count: number;
  heightPct: number;
}

/* -------------------------------------------------------------------------- */
/*  Komponen utama                                                            */
/* -------------------------------------------------------------------------- */

export const DashboardView: React.FC<DashboardViewProps> = ({
  nodes,
  targets,
  transactions,
  selectedDate,
  setSelectedDate,
  onNavigateTab,
}) => {
  // Rekap hierarki laporan
  const { rows, reportMonthName, padRow } = useMemo(
    () => calculateReportData(nodes, targets, transactions, selectedDate),
    [nodes, targets, transactions, selectedDate]
  );

  // Transaksi pada tanggal terpilih
  const todayTransactions = useMemo(
    () => transactions.filter(t => t.tanggal === selectedDate),
    [transactions, selectedDate]
  );

  const { todayPokok, todayPiutang, todayTotal } = useMemo(() => {
    const pokok = todayTransactions.reduce((sum, t) => sum + (t.pokok || 0), 0);
    const piutang = todayTransactions.reduce((sum, t) => sum + (t.piutang || 0), 0);
    return { todayPokok: pokok, todayPiutang: piutang, todayTotal: pokok + piutang };
  }, [todayTransactions]);

  // Rangkuman per sektor
  const sectors = useMemo(
    () =>
      SECTORS.map(s => {
        const row = rows.find(r => r.uraian.id === s.rowId);
        return {
          ...s,
          today: row?.hari_ini || 0,
          bulanIni: row?.jumlah_s_d_hari_ini || 0,
          totalTahun: row?.total_realisasi || 0,
          target: row?.target || 0,
          persen: row?.persen_capaian || 0,
        };
      }),
    [rows]
  );

  // 5 pos terbesar hari ini
  const topLeafToday = useMemo(
    () =>
      rows
        .filter(r => r.uraian.is_leaf && r.hari_ini > 0)
        .sort((a, b) => b.hari_ini - a.hari_ini)
        .slice(0, 5),
    [rows]
  );

  // Tren harian
  const dailyTrend = useMemo<DailyTrendItem[]>(() => {
    const map = new Map<string, Omit<DailyTrendItem, 'heightPct'>>();

    for (const d of QUICK_DATES) {
      map.set(d, { tanggal: d, total: 0, pokok: 0, piutang: 0, count: 0 });
    }

    for (const tx of transactions) {
      const item = map.get(tx.tanggal) ?? {
        tanggal: tx.tanggal,
        total: 0,
        pokok: 0,
        piutang: 0,
        count: 0,
      };
      item.total += tx.total || 0;
      item.pokok += tx.pokok || 0;
      item.piutang += tx.piutang || 0;
      item.count += 1;
      map.set(tx.tanggal, item);
    }

    const sorted = Array.from(map.values())
      .filter(i => i.tanggal.startsWith('2026-10') || i.count > 0)
      .sort((a, b) => a.tanggal.localeCompare(b.tanggal));

    const maxVal = Math.max(...sorted.map(s => s.total), 1);

    return sorted.map(i => ({
      ...i,
      heightPct: Math.min(100, Math.max(12, Math.round((i.total / maxVal) * 100))),
    }));
  }, [transactions]);

  const selectedTrend = dailyTrend.find(d => d.tanggal === selectedDate);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* ------------------------------ Header ------------------------------ */}
      <Panel className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-base sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Ringkasan Eksekutif &amp; Penerimaan Harian</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Auto-Update Realtime
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Data penerimaan PAD otomatis teragregasi setiap kali ada transaksi yang
            diinput atau diimpor.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:flex-wrap gap-2.5">
          {/* Pemilih tanggal */}
          <label className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <Calendar className="w-4 h-4 text-emerald-600 ml-2 shrink-0" />
            <span className="text-xs font-semibold text-slate-600">Tanggal:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="flex-1 min-w-0 text-xs font-mono font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            />
          </label>

          {/* Pilihan tanggal cepat (bisa digeser di layar kecil) */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 -mx-1 px-1">
            {QUICK_DATES.map(d => {
              const active = selectedDate === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  title={`Pilih tanggal ${d}`}
                  aria-pressed={active}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {dayOf(d)} Okt
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onNavigateTab('input')}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>+ Input Transaksi</span>
          </button>
        </div>
      </Panel>

      {/* ------------------------------ KPI ------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <KpiCard
          label="Penerimaan Hari Ini (T)"
          icon={<DollarSign className="w-4 h-4" />}
          iconBg="bg-emerald-50 text-emerald-600"
          value={`Rp ${formatRupiah(todayTotal)}`}
          footer={
            <>
              <span>
                Pokok: <strong className="text-slate-800">{formatRupiah(todayPokok)}</strong>
              </span>
              <span>
                Piutang: <strong className="text-slate-800">{formatRupiah(todayPiutang)}</strong>
              </span>
            </>
          }
          note={
            <span className="flex items-center justify-between gap-2">
              <span>
                Tercatat:{' '}
                <strong className="text-emerald-700">{todayTransactions.length} transaksi</strong>
              </span>
              <span className="font-mono text-emerald-600 font-semibold">{selectedDate}</span>
            </span>
          }
        />

        <KpiCard
          label={`Bulan ${reportMonthName} (s/d Hari Ini)`}
          icon={<TrendingUp className="w-4 h-4" />}
          iconBg="bg-blue-50 text-blue-600"
          value={`Rp ${formatRupiah(padRow?.jumlah_s_d_hari_ini || 0)}`}
          footer={
            <>
              <span>
                s/d Kemarin:{' '}
                <strong className="text-slate-800">{formatRupiah(padRow?.s_d_kemarin || 0)}</strong>
              </span>
              <span>
                Hari Ini:{' '}
                <strong className="text-emerald-700">{formatRupiah(padRow?.hari_ini || 0)}</strong>
              </span>
            </>
          }
          note={`Realisasi bulan berjalan posisi per tanggal ${selectedDate}`}
        />

        <KpiCard
          label="Total Akumulasi Realisasi PAD"
          icon={<Wallet className="w-4 h-4" />}
          iconBg="bg-indigo-50 text-indigo-600"
          value={`Rp ${formatRupiah(padRow?.total_realisasi || 0)}`}
          valueClass="text-emerald-800"
          footer={
            <>
              <span className="font-sans font-semibold">% Capaian Target:</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                {formatPersen(padRow?.persen_capaian || 0, (padRow?.target || 0) > 0)}
              </span>
            </>
          }
          note={`Akumulasi 1 Jan s/d ${selectedDate}`}
        />

        <KpiCard
          label="Target APBD & Sisa Target"
          icon={<PieChart className="w-4 h-4" />}
          iconBg="bg-purple-50 text-purple-600"
          value={`Rp ${formatRupiah(padRow?.target || 0)}`}
          valueClass="text-slate-800"
          footer={
            <>
              <span>
                Sisa:{' '}
                <strong className="text-rose-700">{formatRupiah(padRow?.sisa_target || 0)}</strong>
              </span>
              <span className="text-slate-400">Thn 2026</span>
            </>
          }
          note="Total pagu penetapan APBD Tahun Anggaran 2026"
        />
      </div>


      {/* ------------------------------ Sektor ------------------------------ */}
      <Panel className="space-y-4">
        <PanelHeader
          icon={<Layers className="w-4 h-4 text-emerald-600" />}
          title="Rangkuman Realisasi Harian per Sektor Penerimaan"
          description={`Distribusi realisasi hari ini (${selectedDate}) dan total s/d bulan ${reportMonthName} 2026`}
          action={
            <button
              type="button"
              onClick={() => onNavigateTab('laporan')}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Buka Laporan Resmi Bapenda</span>
            </button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
          {sectors.map(cat => (
            <div
              key={cat.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-slate-300 transition-colors space-y-3 flex flex-col justify-between min-w-0"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-900 break-words" title={cat.name}>
                    {cat.name}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shrink-0 ${cat.badge}`}
                  >
                    {formatPersen(cat.persen, cat.target > 0)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2" title={cat.sub}>
                  {cat.sub}
                </p>

                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">Hari Ini:</dt>
                    <dd className="font-mono text-emerald-800 font-bold">
                      Rp {formatRupiah(cat.today)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">Bulan Ini:</dt>
                    <dd className="font-mono text-slate-800 font-semibold">
                      Rp {formatRupiah(cat.bulanIni)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-slate-500">Kumulatif Thn:</dt>
                    <dd className="font-mono text-slate-800 font-semibold">
                      Rp {formatRupiah(cat.totalTahun)}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/70">
                    <dt className="text-slate-500">Target APBD:</dt>
                    <dd className="font-mono text-slate-700">Rp {formatRupiah(cat.target)}</dd>
                  </div>
                </dl>
              </div>

              <div
                className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden"
                role="progressbar"
                aria-valuenow={Math.min(100, Math.max(0, cat.persen))}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  style={{ width: `${Math.min(100, Math.max(0, cat.persen))}%` }}
                  className={`h-full rounded-full bg-gradient-to-r ${cat.color}`}
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {/* ------------------------- Daftar transaksi ------------------------- */}
      <Panel className="space-y-4">
        <PanelHeader
          icon={<Clock className="w-4 h-4 text-emerald-600" />}
          title={`Daftar Transaksi Tercatat pada Tanggal ${selectedDate}`}
          description="Seluruh mutasi penerimaan harian yang masuk ke kas daerah"
          action={
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <span className="text-xs text-slate-600">
                Total Masuk:{' '}
                <strong className="font-mono text-emerald-700 font-bold">
                  Rp {formatRupiah(todayTotal)}
                </strong>
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('input')}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors"
              >
                Kelola di Input Realisasi
              </button>
            </div>
          }
        />

        {todayTransactions.length > 0 ? (
          <>
            {/* Mobile: daftar kartu */}
            <ul className="md:hidden space-y-2 max-h-96 overflow-y-auto">
              {todayTransactions.map((tx, idx) => {
                const node = nodes.find(n => n.id === tx.uraian_id);
                return (
                  <li
                    key={tx.id}
                    className="p-3 rounded-xl border border-slate-200 bg-white space-y-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 break-words">
                          {idx + 1}. {node?.nama || tx.uraian_id}
                        </p>
                        <p className="text-[10px] font-mono text-slate-400">{node?.kode}</p>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-800 shrink-0">
                        Rp {formatRupiah(tx.total)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600">
                      <span>Pokok: {formatRupiah(tx.pokok)}</span>
                      <span>Piutang: {formatRupiah(tx.piutang)}</span>
                    </div>
                    {tx.keterangan && (
                      <p className="text-[11px] text-slate-500 break-words">{tx.keterangan}</p>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Tablet ke atas: tabel */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200 max-h-80">
              <table className="min-w-full divide-y divide-slate-200 text-xs">
                <thead className="bg-slate-900 text-white text-left sticky top-0 z-10">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center font-mono">No</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Pos Penerimaan (Leaf)</th>
                    <th className="py-2.5 px-3 w-36 text-right font-mono">Pokok (Rp)</th>
                    <th className="py-2.5 px-3 w-36 text-right font-mono">Piutang (Rp)</th>
                    <th className="py-2.5 px-3 w-40 text-right font-mono">Total (Rp)</th>
                    <th className="py-2.5 px-4 min-w-[200px]">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {todayTransactions.map((tx, idx) => {
                    const node = nodes.find(n => n.id === tx.uraian_id);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-mono text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-4 font-semibold text-slate-900">
                          <span>{node?.nama || tx.uraian_id}</span>
                          <span className="text-[10px] font-mono text-slate-400 block">
                            {node?.kode}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          {formatRupiah(tx.pokok)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-700">
                          {formatRupiah(tx.piutang)}
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-800">
                          {formatRupiah(tx.total)}
                        </td>
                        <td className="py-2 px-4 text-slate-600 truncate max-w-xs">
                          {tx.keterangan || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Calendar className="w-8 h-8" />}
            title={`Tidak ada transaksi yang tercatat pada tanggal ${selectedDate}`}
            hint="Anda dapat menginput transaksi secara manual, input massal, atau import file Excel melalui menu Input Realisasi Harian."
          >
            <button
              type="button"
              onClick={() => onNavigateTab('input')}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Input Realisasi Sekarang</span>
            </button>
          </EmptyState>
        )}
      </Panel>
    </div>
  );
};