export interface UraianNode {
  id: string;
  kode: string;
  nama: string;
  parent_id: string | null;
  level: number; // 0: PAD, 1: Pajak Daerah & C, 2: A, B & leaf Denda, 3: 1 & 2 & leaf Opsen, 4: leaf under 1 & 2
  is_leaf: boolean;
  urutan: number;
}

export interface TargetAnggaran {
  id: string;
  uraian_id: string;
  tahun: number;
  jumlah: number;
  keterangan?: string;
  updated_at?: string;
}

export interface TransaksiPenerimaan {
  id: string;
  uraian_id: string;
  tanggal: string; // YYYY-MM-DD
  pokok: number;
  piutang: number;
  total: number; // pokok + piutang
  keterangan?: string;
  created_at?: string;
}

export type StatusLaporan = 'draft' | 'final';

export interface Laporan {
  id: string;
  nomor_laporan: string;
  tanggal_laporan: string; // YYYY-MM-DD
  tahun: number;
  periode_mulai: string; // YYYY-01-01
  periode_selesai: string; // YYYY-MM-DD
  status: StatusLaporan;
  finalized_at?: string;
  finalized_by?: string;
  unlocked_at?: string;
  unlocked_by?: string;
  catatan?: string;
}

export interface LaporanDetail {
  id: string;
  laporan_id: string;
  uraian_id: string;
  target: number;
  s_d_bulan_lalu: number;
  s_d_kemarin: number;
  hari_ini: number;
  jumlah_s_d_hari_ini: number; // s_d_kemarin + hari_ini (di bawah subheader bulan)
  total_realisasi: number; // s_d_bulan_lalu + s_d_kemarin + hari_ini
  sisa_target: number; // target - total_realisasi
  persen_capaian: number; // (total_realisasi / target) * 100
  persen_sisa_target: number; // (sisa_target / target) * 100
  keterangan?: string;
}

export interface CalculatedRow {
  uraian: UraianNode;
  target: number;
  s_d_bulan_lalu: number;
  s_d_kemarin: number;
  hari_ini: number;
  jumlah_s_d_hari_ini: number; // Bulan berjalan s/d hari ini
  total_realisasi: number;
  sisa_target: number;
  persen_capaian: number;
  persen_sisa_target: number;
  keterangan: string;
  depth: number;
  isRootPAD?: boolean;
}

export interface AuditLog {
  id: string;
  laporan_id: string;
  action: 'FINALIZE' | 'UNLOCK_REVISION' | 'INPUT_TRANSAKSI' | 'UPDATE_TARGET' | 'HAPUS_TRANSAKSI' | 'REVISI_TRANSAKSI';
  user_name: string;
  user_role: 'admin' | 'operator';
  keterangan: string;
  timestamp: string;
}

export type UserRole = 'admin' | 'operator';
