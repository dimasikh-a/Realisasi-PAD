import { 
  UraianNode, TargetAnggaran, TransaksiPenerimaan, Laporan, LaporanDetail, 
  AuditLog, UserRole, StatusLaporan 
} from '../types/pad';
import { 
  SEED_URAIAN, SEED_TARGETS_2026, SEED_TARGETS_EMPTY, 
  generateOctoberDummyTransactions 
} from './seedData';
import { calculateReportData } from './calculationEngine';

const STORAGE_VERSION_FLAG = 'bappenda_october_v7_init';
const STORAGE_KEY_URAIAN = 'bappenda_uraian_v7';
const STORAGE_KEY_TARGETS = 'bappenda_targets_v7';
const STORAGE_KEY_TRANSACTIONS = 'bappenda_transactions_v7';
const STORAGE_KEY_LAPORAN = 'bappenda_laporan_v7';
const STORAGE_KEY_LAPORAN_DETAILS = 'bappenda_laporan_details_v7';
const STORAGE_KEY_AUDIT = 'bappenda_audit_logs_v7';
const STORAGE_KEY_ROLE = 'bappenda_current_role_v7';

export class DataStore {
  uraian: UraianNode[] = [];
  targets: TargetAnggaran[] = [];
  transactions: TransaksiPenerimaan[] = [];
  laporanList: Laporan[] = [];
  laporanDetails: LaporanDetail[] = [];
  auditLogs: AuditLog[] = [];
  currentRole: UserRole = 'admin';
  currentUserName: string = 'Administrator Bappenda';

  constructor() {
    this.init();
  }

  init() {
    try {
      // Purge old cached data from previous versions
      const legacyKeys = [
        'bapenda_uraian_v2', 'bapenda_targets_v2', 'bapenda_transactions_v2', 
        'bapenda_laporan_v2', 'bapenda_laporan_details_v2', 'bapenda_audit_logs_v2',
        'bapenda_uraian_v3', 'bapenda_targets_v3', 'bapenda_transactions_v3',
        'bapenda_laporan_v3', 'bapenda_laporan_details_v3', 'bapenda_audit_logs_v3',
        'bapenda_uraian_v4', 'bapenda_targets_v4', 'bapenda_transactions_v4',
        'bapenda_clean_v5_init', 'bapenda_uraian_v5', 'bapenda_targets_v5',
        'bapenda_transactions_v5', 'bapenda_laporan_v5', 'bapenda_laporan_details_v5',
        'bapenda_audit_logs_v5', 'bapenda_current_role_v5'
      ];
      for (const k of legacyKeys) {
        localStorage.removeItem(k);
      }

      const hasInit = localStorage.getItem(STORAGE_VERSION_FLAG) || localStorage.getItem('bapenda_october_v6_init');
      const storedUraian = localStorage.getItem(STORAGE_KEY_URAIAN) || localStorage.getItem('bapenda_uraian_v6');
      const storedTargets = localStorage.getItem(STORAGE_KEY_TARGETS) || localStorage.getItem('bapenda_targets_v6');
      const storedTx = localStorage.getItem(STORAGE_KEY_TRANSACTIONS) || localStorage.getItem('bapenda_transactions_v6');
      const storedLaporan = localStorage.getItem(STORAGE_KEY_LAPORAN) || localStorage.getItem('bapenda_laporan_v6');
      const storedDetails = localStorage.getItem(STORAGE_KEY_LAPORAN_DETAILS) || localStorage.getItem('bapenda_laporan_details_v6');
      const storedAudit = localStorage.getItem(STORAGE_KEY_AUDIT) || localStorage.getItem('bapenda_audit_logs_v6');
      const storedRole = localStorage.getItem(STORAGE_KEY_ROLE) || localStorage.getItem('bapenda_current_role_v6');

      if (hasInit && storedUraian && storedTargets && storedTx) {
        this.uraian = JSON.parse(storedUraian);
        // Ensure latest denda leaf nodes exist
        if (!this.uraian.some(n => n.id === 'leaf_denda_hotel')) {
          this.resetToSeed();
          return;
        }
        this.targets = JSON.parse(storedTargets);
        this.transactions = JSON.parse(storedTx);
        this.laporanList = storedLaporan ? JSON.parse(storedLaporan) : [];
        this.laporanDetails = storedDetails ? JSON.parse(storedDetails) : [];
        this.auditLogs = storedAudit ? JSON.parse(storedAudit) : [];
        this.currentRole = (storedRole as UserRole) || 'admin';
      } else {
        this.resetToSeed();
      }
    } catch {
      this.resetToSeed();
    }
  }

  resetToSeed() {
    this.uraian = [...SEED_URAIAN];
    this.targets = [...SEED_TARGETS_2026];
    this.transactions = generateOctoberDummyTransactions(); // Dummy data 10, 11, 12, 13, 14 Oktober 2026
    this.laporanList = [];
    this.laporanDetails = [];
    this.auditLogs = [
      {
        id: 'audit-oct-init',
        laporan_id: '-',
        action: 'INPUT_TRANSAKSI',
        user_name: 'Sistem Inisialisasi',
        user_role: 'admin',
        keterangan: 'Inisialisasi Data Transaksi Realisasi Dummy Bulan Oktober (10, 11, 12, 13, 14 Oktober 2026)',
        timestamp: '2026-10-14T17:00:00+07:00'
      }
    ];
    this.currentRole = 'admin';
    try {
      localStorage.setItem(STORAGE_VERSION_FLAG, 'true');
    } catch {
      // ignore
    }
    this.saveAll();
  }

  /**
   * Loads or appends dummy transactions for 10, 11, 12, 13, 14 October 2026
   */
  loadOctoberDummyData() {
    const octTx = generateOctoberDummyTransactions();
    const otherTx = this.transactions.filter(
      t => !['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14'].includes(t.tanggal)
    );
    this.transactions = [...otherTx, ...octTx];
    if (this.targets.length === 0 || this.targets.every(t => t.jumlah === 0)) {
      this.targets = [...SEED_TARGETS_2026];
    }
    this.logAudit({
      laporan_id: '-',
      action: 'INPUT_TRANSAKSI',
      keterangan: `Memuat data transaksi dummy bulan Oktober tanggal 10, 11, 12, 13, 14 (${octTx.length} transaksi)`
    });
    this.saveAll();
  }

  /**
   * Clears all transactions and reports so user can input everything from scratch.
   * If clearTargets is true, also sets all budget targets to 0.
   */
  clearAllData(clearTargets: boolean = true) {
    this.transactions = [];
    this.laporanList = [];
    this.laporanDetails = [];
    this.auditLogs = [];
    if (clearTargets) {
      this.targets = this.uraian
        .filter(n => n.is_leaf)
        .map(n => ({
          id: `tgt-${n.id}-2026`,
          uraian_id: n.id,
          tahun: 2026,
          jumlah: 0
        }));
    }
    this.saveAll();
  }

  /**
   * Clears transactions and reports only, keeping existing targets
   */
  clearTransactionsOnly() {
    this.transactions = [];
    this.laporanList = [];
    this.laporanDetails = [];
    this.saveAll();
  }

  /**
   * Loads the official APBD 2026 target template (total Rp 4.212 Trillion)
   */
  loadDefaultTargets() {
    this.targets = [...SEED_TARGETS_2026];
    this.logAudit({
      laporan_id: '-',
      action: 'UPDATE_TARGET',
      keterangan: 'Memuat nilai target standar APBD 2026'
    });
    this.saveAll();
  }

  saveAll() {
    try {
      localStorage.setItem(STORAGE_VERSION_FLAG, 'true');
      localStorage.setItem(STORAGE_KEY_URAIAN, JSON.stringify(this.uraian));
      localStorage.setItem(STORAGE_KEY_TARGETS, JSON.stringify(this.targets));
      localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEY_LAPORAN, JSON.stringify(this.laporanList));
      localStorage.setItem(STORAGE_KEY_LAPORAN_DETAILS, JSON.stringify(this.laporanDetails));
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
      localStorage.setItem(STORAGE_KEY_ROLE, this.currentRole);
    } catch {
      // ignore
    }
  }

  setRole(role: UserRole) {
    this.currentRole = role;
    this.currentUserName = role === 'admin' ? 'Administrator Bappenda' : 'Operator Penerimaan PAD';
    this.saveAll();
  }

  // --- Transactions & Locking ---

  /**
   * Check if a specific date is within any FINALIZED report's locked range
   */
  isDateLocked(dateStr: string): { isLocked: boolean; finalizedReport?: Laporan } {
    for (const report of this.laporanList) {
      if (report.status === 'final') {
        if (dateStr >= report.periode_mulai && dateStr <= report.periode_selesai) {
          return { isLocked: true, finalizedReport: report };
        }
      }
    }
    return { isLocked: false };
  }

  /**
   * Add a single realization transaction
   */
  addTransaction(tx: Omit<TransaksiPenerimaan, 'id' | 'created_at' | 'total'>): { success: boolean; error?: string } {
    const lockCheck = this.isDateLocked(tx.tanggal);
    if (lockCheck.isLocked) {
      return {
        success: false,
        error: `Tanggal ${tx.tanggal} sudah TERKUNCI oleh laporan final (${lockCheck.finalizedReport?.nomor_laporan}). Transaksi tidak dapat ditambahkan.`
      };
    }

    if (tx.pokok < 0 || tx.piutang < 0) {
      return { success: false, error: 'Nilai pokok dan piutang tidak boleh bernilai negatif.' };
    }

    const newTx: TransaksiPenerimaan = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      total: tx.pokok + tx.piutang,
      created_at: new Date().toISOString()
    };

    this.transactions.push(newTx);
    this.logAudit({
      laporan_id: '-',
      action: 'INPUT_TRANSAKSI',
      keterangan: `Input transaksi realisasi leaf ID ${tx.uraian_id}: Pokok Rp ${tx.pokok.toLocaleString('id-ID')}, Piutang Rp ${tx.piutang.toLocaleString('id-ID')}`
    });
    this.saveAll();
    return { success: true };
  }

  /**
   * Bulk add transactions for a specific date
   */
  bulkAddTransactions(
    tanggal: string,
    items: { uraian_id: string; pokok: number; piutang: number; keterangan?: string }[]
  ): { success: boolean; error?: string; count?: number } {
    const lockCheck = this.isDateLocked(tanggal);
    if (lockCheck.isLocked) {
      return {
        success: false,
        error: `Tanggal ${tanggal} sudah TERKUNCI oleh laporan final (${lockCheck.finalizedReport?.nomor_laporan}).`
      };
    }

    let inserted = 0;
    for (const item of items) {
      if (item.pokok < 0 || item.piutang < 0) {
        return { success: false, error: 'Terdapat nilai negatif pada baris input. Nilai harus >= 0.' };
      }
      if (item.pokok === 0 && item.piutang === 0) continue;

      this.transactions.push({
        id: `tx-bulk-${Date.now()}-${inserted}-${Math.random().toString(36).substr(2, 4)}`,
        uraian_id: item.uraian_id,
        tanggal,
        pokok: item.pokok,
        piutang: item.piutang,
        total: item.pokok + item.piutang,
        keterangan: item.keterangan || 'Input Massal Realisasi Harian',
        created_at: new Date().toISOString()
      });
      inserted++;
    }

    if (inserted > 0) {
      this.logAudit({
        laporan_id: '-',
        action: 'INPUT_TRANSAKSI',
        keterangan: `Input massal ${inserted} transaksi untuk tanggal ${tanggal}`
      });
      this.saveAll();
    }

    return { success: true, count: inserted };
  }

  /**
   * Batch import transactions from Excel (supporting multiple dates and items)
   */
  batchImportTransactions(
    items: { uraian_id: string; tanggal: string; pokok: number; piutang: number; keterangan?: string }[]
  ): { success: boolean; insertedCount: number; skippedLockedCount: number; error?: string } {
    let inserted = 0;
    let skippedLocked = 0;

    for (const item of items) {
      if (item.pokok < 0 || item.piutang < 0) continue;
      if (item.pokok === 0 && item.piutang === 0) continue;

      const lockCheck = this.isDateLocked(item.tanggal);
      if (lockCheck.isLocked) {
        skippedLocked++;
        continue;
      }

      this.transactions.push({
        id: `tx-excel-${Date.now()}-${inserted}-${Math.random().toString(36).substr(2, 5)}`,
        uraian_id: item.uraian_id,
        tanggal: item.tanggal,
        pokok: item.pokok,
        piutang: item.piutang,
        total: item.pokok + item.piutang,
        keterangan: item.keterangan || 'Import Excel Realisasi PAD',
        created_at: new Date().toISOString()
      });
      inserted++;
    }

    if (inserted > 0) {
      this.logAudit({
        laporan_id: '-',
        action: 'INPUT_TRANSAKSI',
        keterangan: `Import Excel: Berhasil menambahkan ${inserted} transaksi penerimaan realisasi`
      });
      this.saveAll();
    }

    return { success: true, insertedCount: inserted, skippedLockedCount: skippedLocked };
  }

  deleteTransaction(id: string): { success: boolean; error?: string } {
    const tx = this.transactions.find(t => t.id === id);
    if (!tx) return { success: false, error: 'Transaksi tidak ditemukan.' };

    const lockCheck = this.isDateLocked(tx.tanggal);
    if (lockCheck.isLocked) {
      return {
        success: false,
        error: `Tanggal ${tx.tanggal} sudah terkunci oleh laporan final.`
      };
    }

    this.transactions = this.transactions.filter(t => t.id !== id);
    this.logAudit({
      laporan_id: '-',
      action: 'HAPUS_TRANSAKSI',
      keterangan: `Hapus transaksi ID ${id} (leaf ID ${tx.uraian_id}): Total Rp ${tx.total.toLocaleString('id-ID')} pada tanggal ${tx.tanggal}`
    });
    this.saveAll();
    return { success: true };
  }

  updateTransaction(
    id: string,
    data: {
      uraian_id?: string;
      tanggal?: string;
      pokok: number;
      piutang: number;
      keterangan?: string;
    }
  ): { success: boolean; error?: string } {
    const txIndex = this.transactions.findIndex(t => t.id === id);
    if (txIndex === -1) return { success: false, error: 'Transaksi tidak ditemukan.' };

    const oldTx = this.transactions[txIndex];
    const targetDate = data.tanggal || oldTx.tanggal;

    // Check lock on original date
    const origLockCheck = this.isDateLocked(oldTx.tanggal);
    if (origLockCheck.isLocked) {
      return {
        success: false,
        error: `Transaksi tanggal ${oldTx.tanggal} sudah terkunci oleh laporan final.`
      };
    }

    // If changing date, check lock on new date
    if (targetDate !== oldTx.tanggal) {
      const newLockCheck = this.isDateLocked(targetDate);
      if (newLockCheck.isLocked) {
        return {
          success: false,
          error: `Tanggal baru ${targetDate} sudah terkunci oleh laporan final.`
        };
      }
    }

    if (data.pokok < 0 || data.piutang < 0) {
      return { success: false, error: 'Nilai pokok dan piutang tidak boleh bernilai negatif.' };
    }

    if (data.pokok === 0 && data.piutang === 0) {
      return { success: false, error: 'Total transaksi tidak boleh Rp 0. Masukkan nilai pokok atau piutang.' };
    }

    const newUraianId = data.uraian_id || oldTx.uraian_id;
    this.transactions[txIndex] = {
      ...oldTx,
      uraian_id: newUraianId,
      tanggal: targetDate,
      pokok: data.pokok,
      piutang: data.piutang,
      total: data.pokok + data.piutang,
      keterangan: data.keterangan !== undefined ? data.keterangan : oldTx.keterangan
    };

    this.logAudit({
      laporan_id: '-',
      action: 'REVISI_TRANSAKSI',
      keterangan: `Ubah transaksi ID ${id} (leaf ID ${newUraianId}): Pokok Rp ${data.pokok.toLocaleString('id-ID')}, Piutang Rp ${data.piutang.toLocaleString('id-ID')}`
    });

    this.saveAll();
    return { success: true };
  }

  // --- Finalization & Unlock Revision ---

  /**
   * Finalize report for date T:
   * Sets periode_mulai = YYYY-01-01, periode_selesai = T
   * Checks if an earlier final report conflicts
   */
  finalizeReport(
    tanggalLaporan: string,
    catatan?: string
  ): { success: boolean; error?: string; laporan?: Laporan } {
    const year = parseInt(tanggalLaporan.split('-')[0], 10);
    const periodeMulai = `${year}-01-01`;
    const periodeSelesai = tanggalLaporan;

    // Check if there is already a finalized report with a later date that would conflict
    const laterFinal = this.laporanList.find(
      l => l.status === 'final' && l.tahun === year && l.periode_selesai > tanggalLaporan
    );
    if (laterFinal) {
      return {
        success: false,
        error: `Tidak dapat memfinalkan laporan untuk tanggal ${tanggalLaporan} karena sudah ada laporan final yang lebih baru (${laterFinal.nomor_laporan} per ${laterFinal.periode_selesai}).`
      };
    }

    let report = this.laporanList.find(l => l.tanggal_laporan === tanggalLaporan);
    if (!report) {
      report = {
        id: `lap-${tanggalLaporan}`,
        nomor_laporan: `LAP-PAD/${tanggalLaporan.replace(/-/g, '/')}`,
        tanggal_laporan: tanggalLaporan,
        tahun: year,
        periode_mulai: periodeMulai,
        periode_selesai: periodeSelesai,
        status: 'final',
        finalized_at: new Date().toISOString(),
        finalized_by: `${this.currentUserName} (${this.currentRole})`,
        catatan: catatan || 'Laporan Realisasi PAD Final'
      };
      this.laporanList.push(report);
    } else {
      report.status = 'final';
      report.periode_mulai = periodeMulai;
      report.periode_selesai = periodeSelesai;
      report.finalized_at = new Date().toISOString();
      report.finalized_by = `${this.currentUserName} (${this.currentRole})`;
      if (catatan) report.catatan = catatan;
    }

    // Snapshot details into laporan_details
    const calc = calculateReportData(
      this.uraian,
      this.targets,
      this.transactions,
      tanggalLaporan
    );

    // Remove old details for this report
    this.laporanDetails = this.laporanDetails.filter(d => d.laporan_id !== report?.id);

    for (const r of calc.rows) {
      this.laporanDetails.push({
        id: `det-${report.id}-${r.uraian.id}`,
        laporan_id: report.id,
        uraian_id: r.uraian.id,
        target: r.target,
        s_d_bulan_lalu: r.s_d_bulan_lalu,
        s_d_kemarin: r.s_d_kemarin,
        hari_ini: r.hari_ini,
        jumlah_s_d_hari_ini: r.jumlah_s_d_hari_ini,
        total_realisasi: r.total_realisasi,
        sisa_target: r.sisa_target,
        persen_capaian: r.persen_capaian,
        persen_sisa_target: r.persen_sisa_target,
        keterangan: r.keterangan
      });
    }

    this.logAudit({
      laporan_id: report.id,
      action: 'FINALIZE',
      keterangan: `Laporan Realisasi PAD tanggal ${tanggalLaporan} telah DIFINALISASI & TERKUNCI untuk periode ${periodeMulai} s/d ${periodeSelesai}`
    });

    this.saveAll();
    return { success: true, laporan: report };
  }

  /**
   * Unlock / Revise report (Admin only)
   * Changes status from final to draft, deletes old locked snapshot details
   */
  unlockReport(
    laporanId: string,
    alasan: string
  ): { success: boolean; error?: string } {
    if (this.currentRole !== 'admin') {
      return { success: false, error: 'Aksi Buka Kunci / Revisi hanya dapat dilakukan oleh role Administrator.' };
    }

    const report = this.laporanList.find(l => l.id === laporanId);
    if (!report) return { success: false, error: 'Laporan tidak ditemukan.' };

    report.status = 'draft';
    report.unlocked_at = new Date().toISOString();
    report.unlocked_by = `${this.currentUserName} (Admin)`;

    // Remove locked snapshot details so it returns to live calculation
    this.laporanDetails = this.laporanDetails.filter(d => d.laporan_id !== laporanId);

    this.logAudit({
      laporan_id: laporanId,
      action: 'UNLOCK_REVISION',
      keterangan: `Buka Kunci / Revisi laporan ${report.nomor_laporan} (${report.tanggal_laporan}). Alasan: ${alasan}`
    });

    this.saveAll();
    return { success: true };
  }

  // --- Keterangan Notes per Row ---
  saveKeterangan(uraianId: string, keterangan: string) {
    const existing = this.laporanDetails.find(d => d.uraian_id === uraianId);
    if (existing) {
      existing.keterangan = keterangan;
    }
    this.saveAll();
  }

  // --- Targets Management ---
  updateTarget(uraianId: string, tahun: number, jumlah: number): { success: boolean; error?: string } {
    const node = this.uraian.find(u => u.id === uraianId);
    if (!node) return { success: false, error: 'Uraian tidak ditemukan.' };
    if (!node.is_leaf) return { success: false, error: 'Target hanya boleh diatur pada baris pos penerimaan terendah.' };

    const existing = this.targets.find(t => t.uraian_id === uraianId && t.tahun === tahun);
    if (existing) {
      existing.jumlah = jumlah;
      existing.updated_at = new Date().toISOString();
    } else {
      this.targets.push({
        id: `tgt-${uraianId}-${tahun}`,
        uraian_id: uraianId,
        tahun,
        jumlah,
        updated_at: new Date().toISOString()
      });
    }

    this.logAudit({
      laporan_id: '-',
      action: 'UPDATE_TARGET',
      keterangan: `Update target anggaran untuk '${node.nama}' (${tahun}): Rp ${jumlah.toLocaleString('id-ID')}`
    });

    this.saveAll();
    return { success: true };
  }

  // --- Audit Logging ---
  private logAudit(entry: {
    laporan_id: string;
    action: AuditLog['action'];
    keterangan: string;
  }) {
    this.auditLogs.unshift({
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      laporan_id: entry.laporan_id,
      action: entry.action,
      user_name: this.currentUserName,
      user_role: this.currentRole,
      keterangan: entry.keterangan,
      timestamp: new Date().toISOString()
    });
  }
}

export const store = new DataStore();
