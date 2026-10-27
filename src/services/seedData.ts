import { UraianNode, TargetAnggaran, TransaksiPenerimaan } from '../types/pad';

export const SEED_URAIAN: UraianNode[] = [
  // Level 0: Akar / Root (PAD)
  {
    id: 'pad',
    kode: 'PAD',
    nama: 'Jumlah Pendapatan Asli Daerah',
    parent_id: null,
    level: 0,
    is_leaf: false,
    urutan: 99
  },

  // Level 1: PAJAK DAERAH & C. Pendapatan Denda Pajak Daerah
  {
    id: 'pajak_daerah',
    kode: '4.1.01',
    nama: 'PAJAK DAERAH',
    parent_id: 'pad',
    level: 1,
    is_leaf: false,
    urutan: 1
  },
  {
    id: 'c_denda',
    kode: 'C',
    nama: 'C. Pendapatan Denda Pajak Daerah',
    parent_id: 'pad',
    level: 1,
    is_leaf: false,
    urutan: 2
  },

  // Level 2: Under PAJAK DAERAH -> A dan B
  {
    id: 'a_pajak_daerah',
    kode: 'A',
    nama: 'A. Pajak Daerah Diluar Opsen',
    parent_id: 'pajak_daerah',
    level: 2,
    is_leaf: false,
    urutan: 1
  },
  {
    id: 'b_opsen_pajak',
    kode: 'B',
    nama: 'B. Opsen Pajak PKB dan BBNKB',
    parent_id: 'pajak_daerah',
    level: 2,
    is_leaf: false,
    urutan: 2
  },

  // Level 2: Under C. Pendapatan Denda Pajak Daerah -> Pos Leaf (Urutan 1 - 10)
  {
    id: 'leaf_denda_hotel',
    kode: '4.1.01.20.01',
    nama: 'Pendapatan Denda Pajak Hotel',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 1
  },
  {
    id: 'leaf_denda_restoran',
    kode: '4.1.01.20.02',
    nama: 'Pendapatan Denda Pajak Restoran',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 2
  },
  {
    id: 'leaf_denda_hiburan',
    kode: '4.1.01.20.03',
    nama: 'Pendapatan Denda Pajak Hiburan',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 3
  },
  {
    id: 'leaf_denda_reklame',
    kode: '4.1.01.20.04',
    nama: 'Pendapatan Denda Pajak Reklame',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 4
  },
  {
    id: 'leaf_denda_penerangan',
    kode: '4.1.01.20.05',
    nama: 'Pendapatan Denda Pajak Penerangan',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 5
  },
  {
    id: 'leaf_denda_parkir',
    kode: '4.1.01.20.06',
    nama: 'Pendapatan Denda Pajak Parkir',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 6
  },
  {
    id: 'leaf_denda_air_tanah',
    kode: '4.1.01.20.07',
    nama: 'Pendapatan Denda Pajak Air Tanah',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 7
  },
  {
    id: 'leaf_denda_mineral',
    kode: '4.1.01.20.08',
    nama: 'Pendapatan Denda Pajak Mineral',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 8
  },
  {
    id: 'leaf_denda_pbb_p2',
    kode: '4.1.01.20.09',
    nama: 'Pendapatan Denda PBBP2',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 9
  },
  {
    id: 'leaf_denda_bphtb',
    kode: '4.1.01.20.10',
    nama: 'Pendapatan Denda Bea Perolehan Harta',
    parent_id: 'c_denda',
    level: 2,
    is_leaf: true,
    urutan: 10
  },

  // Level 3: Under B -> Leaf Opsen (Urutan 11 dan 12)
  {
    id: 'leaf_opsen_pkb',
    kode: '4.1.01.16',
    nama: 'Opsen Pajak Kendaraan Bermotor (PKB)',
    parent_id: 'b_opsen_pajak',
    level: 3,
    is_leaf: true,
    urutan: 11
  },
  {
    id: 'leaf_opsen_bbnkb',
    kode: '4.1.01.17',
    nama: 'Opsen Bea Balik Nama Kendaraan Bermotor (BBNKB)',
    parent_id: 'b_opsen_pajak',
    level: 3,
    is_leaf: true,
    urutan: 12
  },

  // Level 3: Under A -> 1 dan 2
  {
    id: 'a1_non_pbjt',
    kode: '1',
    nama: '1. Pajak Diluar PBJT',
    parent_id: 'a_pajak_daerah',
    level: 3,
    is_leaf: false,
    urutan: 1
  },
  {
    id: 'a2_pbjt',
    kode: '2',
    nama: '2. Pajak Barang dan Jasa Tertentu',
    parent_id: 'a_pajak_daerah',
    level: 3,
    is_leaf: false,
    urutan: 2
  },

  // Level 4: Under 1. Pajak Diluar PBJT -> Leaf nodes (Urutan 13 - 17)
  {
    id: 'leaf_reklame',
    kode: '4.1.01.06',
    nama: 'Pajak Reklame',
    parent_id: 'a1_non_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 13
  },
  {
    id: 'leaf_air_tanah',
    kode: '4.1.01.07',
    nama: 'Pajak Air Tanah',
    parent_id: 'a1_non_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 14
  },
  {
    id: 'leaf_mblb',
    kode: '4.1.01.08',
    nama: 'Pajak Mineral Bukan Logam dan Batuan',
    parent_id: 'a1_non_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 15
  },
  {
    id: 'leaf_pbb_p2',
    kode: '4.1.01.14',
    nama: 'Pajak Bumi dan Bangunan Perdesaan dan Perkotaan (PBB-P2)',
    parent_id: 'a1_non_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 16
  },
  {
    id: 'leaf_bphtb',
    kode: '4.1.01.15',
    nama: 'Bea Perolehan Hak Atas Tanah dan Bangunan (BPHTB)',
    parent_id: 'a1_non_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 17
  },

  // Level 4: Under 2. PBJT -> Leaf nodes (Urutan 18 - 22)
  {
    id: 'leaf_pbjt_mamin',
    kode: '4.1.01.10',
    nama: 'PBJT-Makanan dan/atau Minuman',
    parent_id: 'a2_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 18
  },
  {
    id: 'leaf_pbjt_listrik',
    kode: '4.1.01.11',
    nama: 'PBJT-Tenaga Listrik',
    parent_id: 'a2_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 19
  },
  {
    id: 'leaf_pbjt_hotel',
    kode: '4.1.01.12',
    nama: 'PBJT-Jasa Perhotelan',
    parent_id: 'a2_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 20
  },
  {
    id: 'leaf_pbjt_parkir',
    kode: '4.1.01.13',
    nama: 'PBJT-Penyediaan atau Penyelenggaraan Parkir',
    parent_id: 'a2_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 21
  },
  {
    id: 'leaf_pbjt_hiburan',
    kode: '4.1.01.19',
    nama: 'PBJT-Jasa Kesenian dan Hiburan',
    parent_id: 'a2_pbjt',
    level: 4,
    is_leaf: true,
    urutan: 22
  }
];

// Target Anggaran 2026 per leaf (Exact 22 Leaf Accounts)
export const SEED_TARGETS_2026: TargetAnggaran[] = [
  // 1. Diluar PBJT (5 items: urutan 13 - 17)
  { id: 'tgt-reklame', uraian_id: 'leaf_reklame', tahun: 2026, jumlah: 105000000000 },
  { id: 'tgt-air-tanah', uraian_id: 'leaf_air_tanah', tahun: 2026, jumlah: 45000000000 },
  { id: 'tgt-mblb', uraian_id: 'leaf_mblb', tahun: 2026, jumlah: 12500000000 },
  { id: 'tgt-pbb', uraian_id: 'leaf_pbb_p2', tahun: 2026, jumlah: 1150000000000 },
  { id: 'tgt-bphtb', uraian_id: 'leaf_bphtb', tahun: 2026, jumlah: 1125000000000 },

  // 2. PBJT (5 items: urutan 18 - 22)
  { id: 'tgt-mamin', uraian_id: 'leaf_pbjt_mamin', tahun: 2026, jumlah: 520000000000 },
  { id: 'tgt-listrik', uraian_id: 'leaf_pbjt_listrik', tahun: 2026, jumlah: 410000000000 },
  { id: 'tgt-hotel', uraian_id: 'leaf_pbjt_hotel', tahun: 2026, jumlah: 285000000000 },
  { id: 'tgt-parkir', uraian_id: 'leaf_pbjt_parkir', tahun: 2026, jumlah: 75000000000 },
  { id: 'tgt-hiburan', uraian_id: 'leaf_pbjt_hiburan', tahun: 2026, jumlah: 65000000000 },

  // B. Opsen (2 items: urutan 11 - 12)
  { id: 'tgt-opsen-pkb', uraian_id: 'leaf_opsen_pkb', tahun: 2026, jumlah: 230000000000 },
  { id: 'tgt-opsen-bbnkb', uraian_id: 'leaf_opsen_bbnkb', tahun: 2026, jumlah: 149031395904 },

  // C. Denda (10 items: urutan 1 - 10)
  { id: 'tgt-denda-hotel', uraian_id: 'leaf_denda_hotel', tahun: 2026, jumlah: 5000000000 },
  { id: 'tgt-denda-restoran', uraian_id: 'leaf_denda_restoran', tahun: 2026, jumlah: 6000000000 },
  { id: 'tgt-denda-hiburan', uraian_id: 'leaf_denda_hiburan', tahun: 2026, jumlah: 2000000000 },
  { id: 'tgt-denda-reklame', uraian_id: 'leaf_denda_reklame', tahun: 2026, jumlah: 3000000000 },
  { id: 'tgt-denda-penerangan', uraian_id: 'leaf_denda_penerangan', tahun: 2026, jumlah: 4000000000 },
  { id: 'tgt-denda-parkir', uraian_id: 'leaf_denda_parkir', tahun: 2026, jumlah: 1500000000 },
  { id: 'tgt-denda-air-tanah', uraian_id: 'leaf_denda_air_tanah', tahun: 2026, jumlah: 1000000000 },
  { id: 'tgt-denda-mineral', uraian_id: 'leaf_denda_mineral', tahun: 2026, jumlah: 805371000 },
  { id: 'tgt-denda-pbb-p2', uraian_id: 'leaf_denda_pbb_p2', tahun: 2026, jumlah: 10000000000 },
  { id: 'tgt-denda-bphtb', uraian_id: 'leaf_denda_bphtb', tahun: 2026, jumlah: 8000000000 }
];

export const SEED_TARGETS_EMPTY: TargetAnggaran[] = SEED_URAIAN
  .filter(n => n.is_leaf)
  .map(n => ({
    id: `tgt-${n.id}-2026`,
    uraian_id: n.id,
    tahun: 2026,
    jumlah: 0
  }));

export function generateOctoberDummyTransactions(): TransaksiPenerimaan[] {
  const transactions: TransaksiPenerimaan[] = [];
  let txIndex = 1;

  const dataPerDate: Record<string, Array<{ leaf_id: string; pokok: number; piutang: number; keterangan: string }>> = {
    // 10 Oktober 2026 (Sabtu)
    '2026-10-10': [
      { leaf_id: 'leaf_pbjt_mamin', pokok: 1450000000, piutang: 120000000, keterangan: 'Penerimaan QRIS & Kasda PBJT Restoran/Kuliner Weekend' },
      { leaf_id: 'leaf_pbjt_hotel', pokok: 820000000, piutang: 75000000, keterangan: 'Setoran Pajak Hotel & Akomodasi Weekend' },
      { leaf_id: 'leaf_pbjt_hiburan', pokok: 210000000, piutang: 25000000, keterangan: 'Pajak Bioskop, Konser & Rekreasi Sabtu' },
      { leaf_id: 'leaf_pbjt_parkir', pokok: 195000000, piutang: 15000000, keterangan: 'Penerimaan Parkir Mall & Pusat Keramaian' },
      { leaf_id: 'leaf_pbjt_listrik', pokok: 950000000, piutang: 0, keterangan: 'Pelunasan PPJ Tenaga Listrik' },
      { leaf_id: 'leaf_reklame', pokok: 280000000, piutang: 35000000, keterangan: 'Perpanjangan Izin Reklame Komersial' },
      { leaf_id: 'leaf_bphtb', pokok: 1850000000, piutang: 150000000, keterangan: 'Validasi SSPD BPHTB Transaksi Properti' },
      { leaf_id: 'leaf_pbb_p2', pokok: 1250000000, piutang: 380000000, keterangan: 'Pembayaran e-SPPT PBB Buku 1, 2, 3' },
      { leaf_id: 'leaf_opsen_pkb', pokok: 640000000, piutang: 0, keterangan: 'Bagi Hasil Opsen PKB Harian Samsat' },
      { leaf_id: 'leaf_opsen_bbnkb', pokok: 410000000, piutang: 0, keterangan: 'Bagi Hasil Opsen BBNKB Samsat' },
      { leaf_id: 'leaf_air_tanah', pokok: 95000000, piutang: 12000000, keterangan: 'Pajak Pengambilan Air Tanah Industri' },
      { leaf_id: 'leaf_mblb', pokok: 48500000, piutang: 5000000, keterangan: 'Pajak Galian Tambang Batuan' },
      { leaf_id: 'leaf_denda_hotel', pokok: 12500000, piutang: 0, keterangan: 'Denda Keterlambatan SPTPD Hotel' },
      { leaf_id: 'leaf_denda_restoran', pokok: 18000000, piutang: 0, keterangan: 'Denda Keterlambatan Pelaporan Restoran' },
      { leaf_id: 'leaf_denda_hiburan', pokok: 6500000, piutang: 0, keterangan: 'Sanksi Denda Pajak Hiburan' },
      { leaf_id: 'leaf_denda_pbb_p2', pokok: 32000000, piutang: 0, keterangan: 'Denda Keterlambatan Jatuh Tempo PBB-P2' },
      { leaf_id: 'leaf_denda_bphtb', pokok: 24000000, piutang: 0, keterangan: 'Denda Sanksi Administrasi BPHTB' }
    ],

    // 11 Oktober 2026 (Minggu)
    '2026-10-11': [
      { leaf_id: 'leaf_pbjt_mamin', pokok: 1620000000, piutang: 110000000, keterangan: 'Penerimaan PBJT Makanan/Minuman Minggu' },
      { leaf_id: 'leaf_pbjt_hotel', pokok: 780000000, piutang: 65000000, keterangan: 'Penerimaan Pajak Hotel Checkout Minggu' },
      { leaf_id: 'leaf_pbjt_hiburan', pokok: 260000000, piutang: 18000000, keterangan: 'Pajak Hiburan & Wahana Wisata Hari Libur' },
      { leaf_id: 'leaf_pbjt_parkir', pokok: 220000000, piutang: 10000000, keterangan: 'Penerimaan Parkir Wisata & Pusat Perbelanjaan' },
      { leaf_id: 'leaf_pbb_p2', pokok: 680000000, piutang: 120000000, keterangan: 'Pembayaran PBB Online Virtual Account/ATM' },
      { leaf_id: 'leaf_bphtb', pokok: 750000000, piutang: 0, keterangan: 'Setoran BPHTB Kanal Digital Bank Jatim' },
      { leaf_id: 'leaf_opsen_pkb', pokok: 380000000, piutang: 0, keterangan: 'Opsen PKB Pembayaran e-Samsat' },
      { leaf_id: 'leaf_opsen_bbnkb', pokok: 210000000, piutang: 0, keterangan: 'Opsen BBNKB Online' },
      { leaf_id: 'leaf_denda_restoran', pokok: 14000000, piutang: 0, keterangan: 'Denda Keterlambatan PBJT Restoran' },
      { leaf_id: 'leaf_denda_parkir', pokok: 5500000, piutang: 0, keterangan: 'Denda Administrasi Pajak Parkir' },
      { leaf_id: 'leaf_denda_pbb_p2', pokok: 18000000, piutang: 0, keterangan: 'Denda Tunggakan PBB-P2 Channel Digital' }
    ],

    // 12 Oktober 2026 (Senin)
    '2026-10-12': [
      { leaf_id: 'leaf_bphtb', pokok: 3450000000, piutang: 320000000, keterangan: 'Setoran Notaris/PPAT Transaksi Awal Pekan' },
      { leaf_id: 'leaf_pbb_p2', pokok: 2950000000, piutang: 850000000, keterangan: 'Setoran Kolektif PBB Kecamatan & Kelurahan' },
      { leaf_id: 'leaf_pbjt_listrik', pokok: 1450000000, piutang: 0, keterangan: 'Rekapitulasi Setoran PLN PPJ' },
      { leaf_id: 'leaf_pbjt_mamin', pokok: 1280000000, piutang: 95000000, keterangan: 'Setoran SPTPD Mingguan Restoran & Kafe' },
      { leaf_id: 'leaf_pbjt_hotel', pokok: 620000000, piutang: 80000000, keterangan: 'Penerimaan Pajak Hotel Bintang & Melati' },
      { leaf_id: 'leaf_reklame', pokok: 450000000, piutang: 60000000, keterangan: 'SKPD Reklame Billboard & Megatron' },
      { leaf_id: 'leaf_air_tanah', pokok: 165000000, piutang: 25000000, keterangan: 'Pajak Air Tanah Komersial & Hotel' },
      { leaf_id: 'leaf_mblb', pokok: 123000000, piutang: 12000000, keterangan: 'Pajak Mineral Sirtu dan Tanah Urug' },
      { leaf_id: 'leaf_opsen_pkb', pokok: 1150000000, piutang: 0, keterangan: 'Bagi Hasil Opsen PKB Layanan Samsat Induk' },
      { leaf_id: 'leaf_opsen_bbnkb', pokok: 780000000, piutang: 0, keterangan: 'Bagi Hasil Opsen BBNKB Kendaraan Baru' },
      { leaf_id: 'leaf_pbjt_parkir', pokok: 140000000, piutang: 15000000, keterangan: 'Setoran Pajak Parkir Pelataran & Gedung' },
      { leaf_id: 'leaf_pbjt_hiburan', pokok: 110000000, piutang: 12000000, keterangan: 'Pajak Hiburan Musik & Permainan Ketangkasan' },
      { leaf_id: 'leaf_denda_bphtb', pokok: 48000000, piutang: 0, keterangan: 'Denda Keterlambatan Validasi BPHTB' },
      { leaf_id: 'leaf_denda_pbb_p2', pokok: 65000000, piutang: 0, keterangan: 'Denda Tunggakan PBB-P2 Lewat Jatuh Tempo' },
      { leaf_id: 'leaf_denda_reklame', pokok: 15000000, piutang: 0, keterangan: 'Denda Keterlambatan Pajak Reklame' },
      { leaf_id: 'leaf_denda_penerangan', pokok: 22000000, piutang: 0, keterangan: 'Denda Keterlambatan PPJ Non-PLN' },
      { leaf_id: 'leaf_denda_air_tanah', pokok: 8500000, piutang: 0, keterangan: 'Denda Pajak Air Tanah' },
      { leaf_id: 'leaf_denda_mineral', pokok: 4500000, piutang: 0, keterangan: 'Denda Pajak Mineral Batuan' }
    ],

    // 13 Oktober 2026 (Selasa)
    '2026-10-13': [
      { leaf_id: 'leaf_bphtb', pokok: 2800000000, piutang: 210000000, keterangan: 'SSPD BPHTB Lelang & Hibah Wasiat' },
      { leaf_id: 'leaf_pbb_p2', pokok: 2450000000, piutang: 620000000, keterangan: 'Setoran PBB Bank Persepsi Loket & Online' },
      { leaf_id: 'leaf_pbjt_mamin', pokok: 1350000000, piutang: 80000000, keterangan: 'Setoran Restoran Cepat Saji & Katering' },
      { leaf_id: 'leaf_pbjt_hotel', pokok: 590000000, piutang: 45000000, keterangan: 'Penerimaan Pajak Hotel dan MICE' },
      { leaf_id: 'leaf_pbjt_listrik', pokok: 1100000000, piutang: 0, keterangan: 'Penerimaan Pajak Tenaga Listrik Industri' },
      { leaf_id: 'leaf_reklame', pokok: 380000000, piutang: 40000000, keterangan: 'Pembayaran SKPD Reklame Bando & JPO' },
      { leaf_id: 'leaf_opsen_pkb', pokok: 980000000, piutang: 0, keterangan: 'Opsen PKB Pelayanan Samsat Keliling' },
      { leaf_id: 'leaf_opsen_bbnkb', pokok: 650000000, piutang: 0, keterangan: 'Opsen BBNKB Dealer Resmi' },
      { leaf_id: 'leaf_air_tanah', pokok: 120000000, piutang: 18000000, keterangan: 'Pajak Air Tanah Sumur Dalam Perusahaan' },
      { leaf_id: 'leaf_pbjt_parkir', pokok: 135000000, piutang: 8000000, keterangan: 'Pajak Parkir Stasiun & Terminal' },
      { leaf_id: 'leaf_pbjt_hiburan', pokok: 95000000, piutang: 10000000, keterangan: 'Pajak Hiburan Karaoke & Pusat Olahraga' },
      { leaf_id: 'leaf_mblb', pokok: 62500000, piutang: 8000000, keterangan: 'Pajak Pengambilan Pasir & Andesit' },
      { leaf_id: 'leaf_denda_hotel', pokok: 8000000, piutang: 0, keterangan: 'Sanksi Keterlambatan Pembayaran Hotel' },
      { leaf_id: 'leaf_denda_restoran', pokok: 12000000, piutang: 0, keterangan: 'Sanksi Denda Keterlambatan Restoran' },
      { leaf_id: 'leaf_denda_pbb_p2', pokok: 45000000, piutang: 0, keterangan: 'Denda Keterlambatan Pembayaran PBB' },
      { leaf_id: 'leaf_denda_bphtb', pokok: 31000000, piutang: 0, keterangan: 'Denda Kurang Bayar BPHTB' }
    ],

    // 14 Oktober 2026 (Rabu)
    '2026-10-14': [
      { leaf_id: 'leaf_bphtb', pokok: 3100000000, piutang: 250000000, keterangan: 'Penerimaan BPHTB Jual Beli Perumahan' },
      { leaf_id: 'leaf_pbb_p2', pokok: 2750000000, piutang: 710000000, keterangan: 'Penerimaan PBB-P2 Perkantoran & Industri' },
      { leaf_id: 'leaf_pbjt_mamin', pokok: 1420000000, piutang: 90000000, keterangan: 'Pajak Restoran, Franchise & Foodcourt' },
      { leaf_id: 'leaf_pbjt_listrik', pokok: 1250000000, piutang: 0, keterangan: 'Setoran Rutin Pajak Penerangan Jalan' },
      { leaf_id: 'leaf_pbjt_hotel', pokok: 680000000, piutang: 60000000, keterangan: 'Pajak Hotel & Wisma Tamu' },
      { leaf_id: 'leaf_reklame', pokok: 320000000, piutang: 25000000, keterangan: 'Pajak Reklame Selebaran & Spanduk' },
      { leaf_id: 'leaf_opsen_pkb', pokok: 1050000000, piutang: 0, keterangan: 'Opsen PKB Pelayanan Drive Thru Samsat' },
      { leaf_id: 'leaf_opsen_bbnkb', pokok: 710000000, piutang: 0, keterangan: 'Opsen BBNKB Bea Balik Nama II' },
      { leaf_id: 'leaf_air_tanah', pokok: 140000000, piutang: 20000000, keterangan: 'Pajak Pemanfaatan Air Bawah Tanah' },
      { leaf_id: 'leaf_pbjt_parkir', pokok: 155000000, piutang: 12000000, keterangan: 'Pajak Parkir Rumah Sakit & Bandara' },
      { leaf_id: 'leaf_pbjt_hiburan', pokok: 125000000, piutang: 15000000, keterangan: 'Pajak Pagelaran Musik & Seni Budaya' },
      { leaf_id: 'leaf_mblb', pokok: 108000000, piutang: 6000000, keterangan: 'Pajak Tambang Tanah Liat & Kaolin' },
      { leaf_id: 'leaf_denda_pbb_p2', pokok: 52000000, piutang: 0, keterangan: 'Denda Pembayaran PBB Buku 4 dan 5' },
      { leaf_id: 'leaf_denda_bphtb', pokok: 36000000, piutang: 0, keterangan: 'Denda Keterlambatan Pelaporan BPHTB' },
      { leaf_id: 'leaf_denda_hotel', pokok: 10500000, piutang: 0, keterangan: 'Sanksi Bunga Administrasi Hotel' },
      { leaf_id: 'leaf_denda_restoran', pokok: 15500000, piutang: 0, keterangan: 'Sanksi Keterlambatan SPTPD Restoran' },
      { leaf_id: 'leaf_denda_hiburan', pokok: 7500000, piutang: 0, keterangan: 'Denda Sanksi Pajak Hiburan' },
      { leaf_id: 'leaf_denda_reklame', pokok: 11000000, piutang: 0, keterangan: 'Denda Penyelenggaraan Reklame Lewat Waktu' },
      { leaf_id: 'leaf_denda_penerangan', pokok: 14000000, piutang: 0, keterangan: 'Denda Pajak Penerangan Jalan Non-PLN' },
      { leaf_id: 'leaf_denda_parkir', pokok: 4800000, piutang: 0, keterangan: 'Denda Keterlambatan Setoran Parkir' },
      { leaf_id: 'leaf_denda_air_tanah', pokok: 6500000, piutang: 0, keterangan: 'Denda Pajak Air Bawah Tanah' },
      { leaf_id: 'leaf_denda_mineral', pokok: 3200000, piutang: 0, keterangan: 'Denda Keterlambatan Pajak Mineral' }
    ]
  };

  for (const [tanggal, items] of Object.entries(dataPerDate)) {
    for (const item of items) {
      transactions.push({
        id: `tx-oct-${tanggal}-${txIndex++}`,
        uraian_id: item.leaf_id,
        tanggal,
        pokok: item.pokok,
        piutang: item.piutang,
        total: item.pokok + item.piutang,
        keterangan: item.keterangan,
        created_at: `${tanggal}T16:00:00+07:00`
      });
    }
  }

  return transactions;
}

export function generateSeedTransactions(): TransaksiPenerimaan[] {
  return generateOctoberDummyTransactions();
}