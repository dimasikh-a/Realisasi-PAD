import React, { useState, useEffect } from 'react';
import { 
  Database, Server, CheckCircle2, AlertTriangle, Copy, Check, 
  Download, Terminal, FileCode, Layers, RefreshCw, Key, ShieldCheck,
  TableProperties, ExternalLink, Play
} from 'lucide-react';

export const DatabaseManagerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'prisma' | 'sql' | 'guide' | 'api'>('overview');
  const [dbStatus, setDbStatus] = useState<{
    isConnected: boolean;
    database: string;
    provider: string;
    message: string;
    counts?: {
      uraian: number;
      targets: number;
      transactions: number;
      laporan: number;
    };
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [prismaSchema, setPrismaSchema] = useState<string>('');
  const [initSql, setInitSql] = useState<string>('');
  const [copiedPrisma, setCopiedPrisma] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);

  // Fetch DB Status
  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/db/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      } else {
        setDbStatus({
          isConnected: false,
          database: 'PostgreSQL',
          provider: 'Prisma Client',
          message: 'Layanan API backend belum merespons. Pastikan server aktif.'
        });
      }
    } catch {
      setDbStatus({
        isConnected: false,
        database: 'PostgreSQL',
        provider: 'Prisma Client',
        message: 'DATABASE_URL belum terhubung ke instance PostgreSQL aktif. Menggunakan Local Storage fallback.'
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Fetch schema & SQL
  useEffect(() => {
    fetchStatus();

    fetch('/api/db/schema')
      .then(r => r.json())
      .then(d => { if (d.success) setPrismaSchema(d.schema); })
      .catch(() => {});

    fetch('/api/db/init-sql')
      .then(r => r.json())
      .then(d => { if (d.success) setInitSql(d.sql); })
      .catch(() => {});
  }, []);

  const handleCopy = (text: string, type: 'prisma' | 'sql' | 'env') => {
    navigator.clipboard.writeText(text);
    if (type === 'prisma') {
      setCopiedPrisma(true);
      setTimeout(() => setCopiedPrisma(false), 2000);
    } else if (type === 'sql') {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else if (type === 'env') {
      setCopiedEnv(true);
      setTimeout(() => setCopiedEnv(false), 2000);
    }
  };

  const handleDownloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const tables = [
    {
      name: 'uraian_node',
      desc: 'Master Bagan Akun PAD (Struktur Pohon Hierarkis Level 0 s/d 4)',
      pk: 'id (VARCHAR)',
      columns: [
        { name: 'id', type: 'VARCHAR(100)', key: 'PK', desc: 'ID unik pos (contoh: pad, leaf_reklame)' },
        { name: 'kode', type: 'VARCHAR(50)', key: 'IDX', desc: 'Kode rekening resmi Bappenda (4.1.01.xx)' },
        { name: 'nama', type: 'VARCHAR(255)', key: '', desc: 'Uraian pos penerimaan' },
        { name: 'parent_id', type: 'VARCHAR(100)', key: 'FK', desc: 'Relasi rekursif ke node induk' },
        { name: 'level', type: 'INTEGER', key: '', desc: 'Tingkat hierarki (0=PAD, 1=Pajak/Denda, dst.)' },
        { name: 'is_leaf', type: 'BOOLEAN', key: 'IDX', desc: 'True jika pos akhir (tempat transaksi diinput)' },
        { name: 'urutan', type: 'INTEGER', key: '', desc: 'Urutan tampilan dalam dokumen resmi' },
      ]
    },
    {
      name: 'target_anggaran',
      desc: 'Target APBD Tahunan per Pos Penerimaan Leaf',
      pk: 'id (VARCHAR)',
      columns: [
        { name: 'id', type: 'VARCHAR(100)', key: 'PK', desc: 'UUID unik record target' },
        { name: 'uraian_id', type: 'VARCHAR(100)', key: 'FK', desc: 'Foreign key ke tabel uraian_node' },
        { name: 'tahun', type: 'INTEGER', key: 'IDX', desc: 'Tahun anggaran APBD (default 2026)' },
        { name: 'jumlah', type: 'DECIMAL(20,2)', key: '', desc: 'Nominal target APBD dalam Rupiah' },
      ]
    },
    {
      name: 'transaksi_penerimaan',
      desc: 'Catatan Transaksi Realisasi Harian (Pokok & Piutang)',
      pk: 'id (VARCHAR)',
      columns: [
        { name: 'id', type: 'VARCHAR(100)', key: 'PK', desc: 'UUID unik transaksi' },
        { name: 'uraian_id', type: 'VARCHAR(100)', key: 'FK', desc: 'Foreign key ke pos leaf uraian_node' },
        { name: 'tanggal', type: 'VARCHAR(10)', key: 'IDX', desc: 'Tanggal pembukuan (YYYY-MM-DD)' },
        { name: 'pokok', type: 'DECIMAL(20,2)', key: '', desc: 'Penerimaan pokok pajak/retribusi' },
        { name: 'piutang', type: 'DECIMAL(20,2)', key: '', desc: 'Penerimaan piutang masa lalu' },
        { name: 'total', type: 'DECIMAL(20,2)', key: '', desc: 'Total realisasi (pokok + piutang)' },
        { name: 'keterangan', type: 'VARCHAR(500)', key: '', desc: 'Catatan setor bank / kasda' },
      ]
    },
    {
      name: 'laporan',
      desc: 'Header Dokumen Laporan Resmi & Periode Penguncian',
      pk: 'id (VARCHAR)',
      columns: [
        { name: 'id', type: 'VARCHAR(100)', key: 'PK', desc: 'UUID unik laporan' },
        { name: 'nomor_laporan', type: 'VARCHAR(100)', key: 'UK', desc: 'Nomor surat laporan resmi (unik)' },
        { name: 'tanggal_laporan', type: 'VARCHAR(10)', key: 'IDX', desc: 'Tanggal posisi laporan (YYYY-MM-DD)' },
        { name: 'periode_mulai', type: 'VARCHAR(10)', key: '', desc: 'Awal tahun anggaran (2026-01-01)' },
        { name: 'periode_selesai', type: 'VARCHAR(10)', key: '', desc: 'Tanggal batas akhir penguncian' },
        { name: 'status', type: 'VARCHAR(20)', key: 'IDX', desc: 'Status laporan (draft / final)' },
        { name: 'total_pad', type: 'DECIMAL(20,2)', key: '', desc: 'Akumulasi total PAD saat pengesahan' },
        { name: 'catatan', type: 'TEXT', key: '', desc: 'Catatan pengesahan pejabat penandatangan' },
      ]
    },
    {
      name: 'laporan_detail',
      desc: 'Snapshot Realisasi per Baris saat Laporan Difinalisasi',
      pk: 'id (VARCHAR)',
      columns: [
        { name: 'id', type: 'VARCHAR(100)', key: 'PK', desc: 'UUID unik snapshot baris' },
        { name: 'laporan_id', type: 'VARCHAR(100)', key: 'FK', desc: 'Foreign key ke tabel laporan' },
        { name: 'uraian_id', type: 'VARCHAR(100)', key: 'FK', desc: 'Foreign key ke uraian_node' },
        { name: 'target', type: 'DECIMAL(20,2)', key: '', desc: 'Target saat laporan dibuat' },
        { name: 'sd_bulan_lalu', type: 'DECIMAL(20,2)', key: '', desc: 'Realisasi s/d bulan sebelumnya' },
        { name: 'sd_kemarin', type: 'DECIMAL(20,2)', key: '', desc: 'Realisasi s/d kemarin (bulan berjalan)' },
        { name: 'hari_ini', type: 'DECIMAL(20,2)', key: '', desc: 'Realisasi hari tanggal laporan' },
        { name: 'total_realisasi', type: 'DECIMAL(20,2)', key: '', desc: 'Total akumulasi realisasi' },
        { name: 'sisa_target', type: 'DECIMAL(20,2)', key: '', desc: 'Sisa target anggaran' },
        { name: 'persen_capaian', type: 'DECIMAL(10,4)', key: '', desc: 'Persentase capaian target' },
      ]
    },
    {
      name: 'audit_log',
      desc: 'Jejak Audit Trail Transaksi dan Perubahan Laporan',
      pk: 'id (VARCHAR)',
      columns: [
        { name: 'id', type: 'VARCHAR(100)', key: 'PK', desc: 'UUID log' },
        { name: 'timestamp', type: 'TIMESTAMP', key: 'IDX', desc: 'Waktu kejadian audit' },
        { name: 'user', type: 'VARCHAR(100)', key: '', desc: 'Nama / akun petugas pelaksana' },
        { name: 'action', type: 'VARCHAR(50)', key: 'IDX', desc: 'Jenis aksi (INPUT_TRANSAKSI, FINALISASI, dll)' },
        { name: 'keterangan', type: 'TEXT', key: '', desc: 'Deskripsi lengkap kronologi aksi' },
      ]
    },
    {
      name: 'users',
      desc: 'Pengguna Sistem Bappenda (Administrator & Operator)',
      pk: 'id (VARCHAR)',
      columns: [
        { name: 'id', type: 'VARCHAR(100)', key: 'PK', desc: 'UUID pengguna' },
        { name: 'username', type: 'VARCHAR(50)', key: 'UK', desc: 'Nama akun login (admin / operator)' },
        { name: 'email', type: 'VARCHAR(100)', key: 'UK', desc: 'Alamat surel resmi kedinasan' },
        { name: 'name', type: 'VARCHAR(100)', key: '', desc: 'Nama lengkap pejabat/petugas' },
        { name: 'role', type: 'VARCHAR(20)', key: '', desc: 'Peran hak akses (admin / operator)' },
      ]
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* Top Banner: PostgreSQL & Prisma Status */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30 text-emerald-400 shrink-0">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight">
                  Database PostgreSQL &amp; Prisma ORM
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  Prisma v6.19
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-blue-950 text-blue-300 border border-blue-800">
                  PostgreSQL 13+
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Arsitektur database relasional profesional untuk pembukuan dan pengawasan PAD Bappenda
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchStatus}
              disabled={isLoadingStatus}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              <span>Cek Koneksi</span>
            </button>
          </div>
        </div>

        {/* Live Status Indicator Bar */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              {dbStatus?.isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              )}
            </span>
            <span className="font-semibold text-slate-300">
              Status Engine:{' '}
              {dbStatus?.isConnected ? (
                <strong className="text-emerald-400">PostgreSQL Live (Terhubung)</strong>
              ) : (
                <strong className="text-amber-400">Prisma Client Siap (Menunggu PostgreSQL Host)</strong>
              )}
            </span>
          </div>

          <div className="text-slate-400 font-mono text-[11px] truncate max-w-xl">
            {dbStatus?.message}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 text-xs overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <TableProperties className="w-4 h-4" />
          <span>Struktur Tabel (ERD)</span>
        </button>

        <button
          onClick={() => setActiveTab('prisma')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'prisma'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>File schema.prisma</span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'sql'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Script DDL (init.sql)</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'guide'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Panduan Setup PostgreSQL</span>
        </button>

        <button
          onClick={() => setActiveTab('api')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            activeTab === 'api'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>REST API Endpoints</span>
        </button>
      </div>

      {/* TAB 1: ERD & Struktur Tabel Database */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Skema Database Relasional PostgreSQL (7 Tabel Utama)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Struktur ternormalisasi dengan integritas referensial (Foreign Keys), indeks performa, dan tipe angka Decimal presisi tinggi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-slate-100 text-slate-700 border border-slate-300">
                7 Tabel Terdaftar
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tables.map(table => (
              <div key={table.name} className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="bg-slate-900 text-white p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TableProperties className="w-4 h-4 text-emerald-400" />
                      <strong className="font-mono text-sm tracking-wide text-emerald-300">{table.name}</strong>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      PK: {table.pk}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
                    {table.desc}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-1.5 px-3 font-mono">Kolom</th>
                          <th className="py-1.5 px-3 font-mono">Tipe Data</th>
                          <th className="py-1.5 px-2 text-center">Atribut</th>
                          <th className="py-1.5 px-3">Keterangan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {table.columns.map(col => (
                          <tr key={col.name} className="hover:bg-slate-50/80">
                            <td className="py-2 px-3 font-mono font-bold text-slate-800">
                              {col.name}
                            </td>
                            <td className="py-2 px-3 font-mono text-[11px] text-emerald-700">
                              {col.type}
                            </td>
                            <td className="py-2 px-2 text-center">
                              {col.key === 'PK' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                  PK
                                </span>
                              )}
                              {col.key === 'FK' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-100 text-blue-800 border border-blue-300">
                                  FK
                                </span>
                              )}
                              {col.key === 'UK' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-300">
                                  UNIQUE
                                </span>
                              )}
                              {col.key === 'IDX' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-200 text-slate-700">
                                  INDEX
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-500 text-[11px]">
                              {col.desc}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: File schema.prisma */}
      {activeTab === 'prisma' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="bg-slate-900 p-4 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCode className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-mono font-bold text-sm">prisma/schema.prisma</span>
                <span className="text-xs text-slate-400 block">Model Prisma ORM untuk PostgreSQL</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(prismaSchema, 'prisma')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copiedPrisma ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedPrisma ? 'Tersalin!' : 'Salin Schema'}</span>
              </button>

              <button
                onClick={() => handleDownloadFile(prismaSchema, 'schema.prisma', 'text/plain')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-[600px] scrollbar-thin">
            <pre className="leading-relaxed">
              {prismaSchema || '// Memuat prisma/schema.prisma...'}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: Script DDL PostgreSQL (init.sql) */}
      {activeTab === 'sql' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden space-y-0">
          <div className="bg-slate-900 p-4 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-mono font-bold text-sm">prisma/init.sql</span>
                <span className="text-xs text-slate-400 block">DDL &amp; Seeding PostgreSQL (Siap Dijalankan di pgAdmin / DBeaver / psql)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(initSql, 'sql')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
              </button>

              <button
                onClick={() => handleDownloadFile(initSql, 'init.sql', 'application/sql')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh init.sql</span>
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-950 font-mono text-xs text-emerald-300 overflow-x-auto max-h-[600px] scrollbar-thin">
            <pre className="leading-relaxed whitespace-pre-wrap">
              {initSql || '-- Memuat prisma/init.sql...'}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: Panduan Setup PostgreSQL */}
      {activeTab === 'guide' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-emerald-600" />
              Panduan Menghubungkan Aplikasi ke Database PostgreSQL
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Anda dapat menggunakan instance PostgreSQL lokal (Docker, pgAdmin, Postgres App) atau cloud (Neon, Supabase, Cloud SQL).
            </p>
          </div>

          {/* Step 1: Set DATABASE_URL */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">1</span>
              <span>Konfigurasi Variabel Lingkungan di file .env</span>
            </h3>
            <p className="text-xs text-slate-600">
              Buat atau tambahkan baris koneksi PostgreSQL pada file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">.env</code> di root aplikasi:
            </p>
            <div className="relative bg-slate-900 text-emerald-300 p-3.5 rounded-lg font-mono text-xs flex items-center justify-between">
              <code>DATABASE_URL="postgresql://postgres:password123@localhost:5432/bappenda_pad?schema=public"</code>
              <button
                onClick={() => handleCopy('DATABASE_URL="postgresql://postgres:password123@localhost:5432/bappenda_pad?schema=public"', 'env')}
                className="text-slate-400 hover:text-white ml-2 shrink-0"
                title="Salin contoh DATABASE_URL"
              >
                {copiedEnv ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Step 2: Menjalankan PostgreSQL Lokal via Docker */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">2</span>
              <span>Jalankan PostgreSQL Lokal (Contoh dengan Docker)</span>
            </h3>
            <p className="text-xs text-slate-600">
              Jika Anda ingin menjalankan database PostgreSQL di komputer lokal menggunakan terminal / Docker:
            </p>
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg font-mono text-xs overflow-x-auto space-y-1">
              <div className="text-slate-500"># Jalankan container PostgreSQL baru</div>
              <div className="text-emerald-300">docker run --name pg-bappenda -e POSTGRES_PASSWORD=password123 -e POSTGRES_DB=bappenda_pad -p 5432:5432 -d postgres:16-alpine</div>
            </div>
          </div>

          {/* Step 3: Perintah Prisma */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">3</span>
              <span>Sinkronisasi Skema &amp; Seeding Otomatis dengan Prisma</span>
            </h3>
            <p className="text-xs text-slate-600">
              Setelah database PostgreSQL berjalan dan <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">DATABASE_URL</code> disetel, jalankan perintah Prisma berikut:
            </p>
            <div className="bg-slate-900 text-slate-200 p-3.5 rounded-lg font-mono text-xs space-y-2.5">
              <div>
                <span className="text-slate-500 block"># 1. Terapkan skema tabel ke PostgreSQL secara langsung:</span>
                <span className="text-emerald-300">npx prisma db push</span>
              </div>
              <div>
                <span className="text-slate-500 block"># 2. Masukkan master hierarki PAD dan data target 2026:</span>
                <span className="text-emerald-300">npm run prisma:seed</span>
              </div>
              <div>
                <span className="text-slate-500 block"># 3. Buka GUI Prisma Studio untuk melihat isi tabel di browser:</span>
                <span className="text-emerald-300">npx prisma studio</span>
              </div>
            </div>
          </div>

          {/* Step 4: Menjalankan via pgAdmin */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[11px]">4</span>
              <span>Alternatif: Jalankan File init.sql di pgAdmin / DBeaver</span>
            </h3>
            <p className="text-xs text-slate-600">
              Anda juga dapat mengunduh file <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-emerald-800">prisma/init.sql</code> pada tab script di atas, lalu membuka Query Tool di pgAdmin dan klik <strong>Execute (F5)</strong>. Seluruh 7 tabel dan 28 baris master bagan akun PAD akan terbuat otomatis!
            </p>
          </div>
        </div>
      )}

      {/* TAB 5: REST API Endpoints */}
      {activeTab === 'api' && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">
              Koleksi Endpoint REST API Backend (Express + Prisma)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Endpoint ini dapat diuji menggunakan Postman, cURL, atau dipanggil langsung dari sistem luar.
            </p>
          </div>

          <div className="space-y-3">
            {[
              {
                method: 'GET',
                path: '/api/db/status',
                desc: 'Memeriksa status koneksi aktif ke database PostgreSQL dan Prisma Client.',
                color: 'bg-blue-100 text-blue-800'
              },
              {
                method: 'GET',
                path: '/api/uraian',
                desc: 'Mengambil seluruh master hierarki bagan akun PAD (Level 0 s/d 4) dari tabel uraian_node.',
                color: 'bg-blue-100 text-blue-800'
              },
              {
                method: 'GET',
                path: '/api/targets?tahun=2026',
                desc: 'Mengambil target APBD tahunan per pos penerimaan dari tabel target_anggaran.',
                color: 'bg-blue-100 text-blue-800'
              },
              {
                method: 'POST',
                path: '/api/targets',
                desc: 'Memperbarui atau menambah target APBD pos leaf (Body: { uraian_id, tahun, jumlah }).',
                color: 'bg-emerald-100 text-emerald-800'
              },
              {
                method: 'GET',
                path: '/api/transaksi?tanggal=YYYY-MM-DD',
                desc: 'Mengambil daftar transaksi penerimaan harian dari tabel transaksi_penerimaan.',
                color: 'bg-blue-100 text-blue-800'
              },
              {
                method: 'POST',
                path: '/api/transaksi',
                desc: 'Menyimpan transaksi realisasi baru (Body: { uraian_id, tanggal, pokok, piutang, keterangan }).',
                color: 'bg-emerald-100 text-emerald-800'
              },
              {
                method: 'POST',
                path: '/api/db/seed',
                desc: 'Melakukan seeding otomatis data master dan target 2026 langsung ke database PostgreSQL.',
                color: 'bg-emerald-100 text-emerald-800'
              }
            ].map(ep => (
              <div key={ep.path + ep.method} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${ep.color}`}>
                    {ep.method}
                  </span>
                  <span className="font-mono text-xs font-bold text-slate-800">{ep.path}</span>
                </div>
                <p className="text-xs text-slate-600 pl-1">{ep.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
