-- =======================================================================
-- SISTEM INFORMASI LAPORAN REALISASI PAD & PENGAWASAN PENERIMAAN BAPENDA
-- Script Inisialisasi Database PostgreSQL (Compatible with PostgreSQL 13+)
-- Generated for Prisma ORM
-- =======================================================================

-- 1. Tabel Master Hierarki Uraian / Pos Penerimaan (Tree Bagan Akun)
CREATE TABLE IF NOT EXISTS "uraian_node" (
    "id" VARCHAR(100) NOT NULL,
    "kode" VARCHAR(50) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "parent_id" VARCHAR(100),
    "level" INTEGER NOT NULL DEFAULT 0,
    "is_leaf" BOOLEAN NOT NULL DEFAULT false,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "uraian_node_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "uraian_node_parent_id_fkey" FOREIGN KEY ("parent_id") 
        REFERENCES "uraian_node"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "uraian_node_parent_id_idx" ON "uraian_node"("parent_id");
CREATE INDEX IF NOT EXISTS "uraian_node_is_leaf_idx" ON "uraian_node"("is_leaf");

-- 2. Tabel Target Anggaran Tahunan APBD
CREATE TABLE IF NOT EXISTS "target_anggaran" (
    "id" VARCHAR(100) NOT NULL,
    "uraian_id" VARCHAR(100) NOT NULL,
    "tahun" INTEGER NOT NULL DEFAULT 2026,
    "jumlah" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "target_anggaran_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "target_anggaran_uraian_id_fkey" FOREIGN KEY ("uraian_id") 
        REFERENCES "uraian_node"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "target_anggaran_uraian_id_tahun_key" UNIQUE ("uraian_id", "tahun")
);

CREATE INDEX IF NOT EXISTS "target_anggaran_tahun_idx" ON "target_anggaran"("tahun");

-- 3. Tabel Transaksi Realisasi Harian (Pokok & Piutang)
CREATE TABLE IF NOT EXISTS "transaksi_penerimaan" (
    "id" VARCHAR(100) NOT NULL,
    "uraian_id" VARCHAR(100) NOT NULL,
    "tanggal" VARCHAR(10) NOT NULL, -- Format ISO YYYY-MM-DD
    "pokok" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "piutang" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "keterangan" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaksi_penerimaan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "transaksi_penerimaan_uraian_id_fkey" FOREIGN KEY ("uraian_id") 
        REFERENCES "uraian_node"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "transaksi_penerimaan_tanggal_idx" ON "transaksi_penerimaan"("tanggal");
CREATE INDEX IF NOT EXISTS "transaksi_penerimaan_uraian_id_idx" ON "transaksi_penerimaan"("uraian_id");

-- 4. Tabel Laporan Resmi & Snapshot Penguncian Periode
CREATE TABLE IF NOT EXISTS "laporan" (
    "id" VARCHAR(100) NOT NULL,
    "nomor_laporan" VARCHAR(100) NOT NULL,
    "tanggal_laporan" VARCHAR(10) NOT NULL,
    "periode_mulai" VARCHAR(10) NOT NULL,
    "periode_selesai" VARCHAR(10) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'draft',
    "total_pad" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "catatan" TEXT,
    "finalized_by" VARCHAR(100),
    "finalized_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "laporan_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "laporan_nomor_laporan_key" UNIQUE ("nomor_laporan")
);

CREATE INDEX IF NOT EXISTS "laporan_tanggal_laporan_idx" ON "laporan"("tanggal_laporan");
CREATE INDEX IF NOT EXISTS "laporan_status_idx" ON "laporan"("status");

-- 5. Tabel Snapshot Rincian Laporan (Laporan Detail per Pos)
CREATE TABLE IF NOT EXISTS "laporan_detail" (
    "id" VARCHAR(100) NOT NULL,
    "laporan_id" VARCHAR(100) NOT NULL,
    "uraian_id" VARCHAR(100) NOT NULL,
    "target" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "sd_bulan_lalu" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "sd_kemarin" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "hari_ini" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "jumlah_sd_hari_ini" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "total_realisasi" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "sisa_target" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "persen_capaian" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "keterangan" VARCHAR(500),

    CONSTRAINT "laporan_detail_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "laporan_detail_laporan_id_fkey" FOREIGN KEY ("laporan_id") 
        REFERENCES "laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "laporan_detail_laporan_id_uraian_id_key" UNIQUE ("laporan_id", "uraian_id")
);

CREATE INDEX IF NOT EXISTS "laporan_detail_laporan_id_idx" ON "laporan_detail"("laporan_id");

-- 6. Tabel Audit Trail untuk Transparansi & Governance
CREATE TABLE IF NOT EXISTS "audit_log" (
    "id" VARCHAR(100) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "laporan_id" VARCHAR(100),
    "keterangan" TEXT NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_log_timestamp_idx" ON "audit_log"("timestamp");
CREATE INDEX IF NOT EXISTS "audit_log_action_idx" ON "audit_log"("action");

-- 7. Tabel Pengguna (Admin & Operator Bapenda)
CREATE TABLE IF NOT EXISTS "users" (
    "id" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100),
    "name" VARCHAR(100) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'operator',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_username_key" UNIQUE ("username"),
    CONSTRAINT "users_email_key" UNIQUE ("email")
);

-- =======================================================================
-- DATA SEEDING AWAL (BAGAN AKUN HIERARKI BAPENDA)
-- =======================================================================
INSERT INTO "users" ("id", "username", "email", "name", "role")
VALUES 
    ('usr-admin', 'admin', 'admin.bapenda@pemda.go.id', 'Administrator Bapenda', 'admin'),
    ('usr-operator', 'operator', 'operator.penerimaan@pemda.go.id', 'Petugas Pengelola Penerimaan PAD', 'operator')
ON CONFLICT ("username") DO NOTHING;

-- Level 0 (Root)
INSERT INTO "uraian_node" ("id", "kode", "nama", "parent_id", "level", "is_leaf", "urutan")
VALUES ('pad', 'PAD', 'Jumlah Pendapatan Asli Daerah', NULL, 0, false, 99)
ON CONFLICT ("id") DO NOTHING;

-- Level 1
INSERT INTO "uraian_node" ("id", "kode", "nama", "parent_id", "level", "is_leaf", "urutan")
VALUES 
    ('pajak_daerah', '4.1.01', 'PAJAK DAERAH', 'pad', 1, false, 1),
    ('c_denda', 'C', 'C. Pendapatan Denda Pajak Daerah', 'pad', 1, false, 2)
ON CONFLICT ("id") DO NOTHING;

-- Level 2 Under Pajak Daerah
INSERT INTO "uraian_node" ("id", "kode", "nama", "parent_id", "level", "is_leaf", "urutan")
VALUES 
    ('a_pajak_daerah', 'A', 'A. Pajak Daerah Diluar Opsen', 'pajak_daerah', 2, false, 1),
    ('b_opsen_pajak', 'B', 'B. Opsen Pajak PKB dan BBNKB', 'pajak_daerah', 2, false, 2)
ON CONFLICT ("id") DO NOTHING;

-- Level 3 Under A
INSERT INTO "uraian_node" ("id", "kode", "nama", "parent_id", "level", "is_leaf", "urutan")
VALUES 
    ('a1_non_pbjt', '1', '1. Pajak Non PBJT', 'a_pajak_daerah', 3, false, 1),
    ('a2_pbjt', '2', '2. Pajak Barang dan Jasa Tertentu (PBJT)', 'a_pajak_daerah', 3, false, 2)
ON CONFLICT ("id") DO NOTHING;

-- Level 4 (Pos Leaf Non PBJT)
INSERT INTO "uraian_node" ("id", "kode", "nama", "parent_id", "level", "is_leaf", "urutan")
VALUES 
    ('leaf_reklame', '4.1.01.09', 'Pajak Reklame', 'a1_non_pbjt', 4, true, 1),
    ('leaf_air_tanah', '4.1.01.11', 'Pajak Air Tanah', 'a1_non_pbjt', 4, true, 2),
    ('leaf_mblb', '4.1.01.12', 'Pajak Mineral Bukan Logam dan Batuan (MBLB)', 'a1_non_pbjt', 4, true, 3),
    ('leaf_walet', '4.1.01.13', 'Pajak Sarang Burung Walet', 'a1_non_pbjt', 4, true, 4),
    ('leaf_pbb', '4.1.01.14', 'Pajak Bumi dan Bangunan Perdesaan dan Perkotaan (PBB-P2)', 'a1_non_pbjt', 4, true, 5),
    ('leaf_bphtb', '4.1.01.15', 'Bea Perolehan Hak atas Tanah dan Bangunan (BPHTB)', 'a1_non_pbjt', 4, true, 6)
ON CONFLICT ("id") DO NOTHING;

-- Level 4 (Pos Leaf PBJT)
INSERT INTO "uraian_node" ("id", "kode", "nama", "parent_id", "level", "is_leaf", "urutan")
VALUES 
    ('leaf_pbjt_mkn_mnm', '4.1.01.21.01', 'PBJT atas Makanan dan/atau Minuman', 'a2_pbjt', 4, true, 1),
    ('leaf_pbjt_listrik', '4.1.01.21.02', 'PBJT atas Tenaga Listrik', 'a2_pbjt', 4, true, 2),
    ('leaf_pbjt_hotel', '4.1.01.21.03', 'PBJT atas Jasa Perhotelan', 'a2_pbjt', 4, true, 3),
    ('leaf_pbjt_parkir', '4.1.01.21.04', 'PBJT atas Jasa Parkir', 'a2_pbjt', 4, true, 4),
    ('leaf_pbjt_hiburan', '4.1.01.21.05', 'PBJT atas Jasa Kesenian dan Hiburan', 'a2_pbjt', 4, true, 5)
ON CONFLICT ("id") DO NOTHING;

-- Level 3 (Pos Leaf Opsen Pajak)
INSERT INTO "uraian_node" ("id", "kode", "nama", "parent_id", "level", "is_leaf", "urutan")
VALUES 
    ('leaf_opsen_pkb', '4.1.01.22.01', 'Opsen Pajak Kendaraan Bermotor (PKB)', 'b_opsen_pajak', 3, true, 1),
    ('leaf_opsen_bbnkb', '4.1.01.22.02', 'Opsen Bea Balik Nama Kendaraan Bermotor (BBNKB)', 'b_opsen_pajak', 3, true, 2)
ON CONFLICT ("id") DO NOTHING;

-- Level 2 (Pos Leaf Denda Pajak Daerah - C)
INSERT INTO "uraian_node" ("id", "kode", "nama", "parent_id", "level", "is_leaf", "urutan")
VALUES 
    ('leaf_denda_hotel', '4.1.01.20.01', 'Pendapatan Denda Pajak Hotel', 'c_denda', 2, true, 1),
    ('leaf_denda_restoran', '4.1.01.20.02', 'Pendapatan Denda Pajak Restoran', 'c_denda', 2, true, 2),
    ('leaf_denda_hiburan', '4.1.01.20.03', 'Pendapatan Denda Pajak Hiburan', 'c_denda', 2, true, 3),
    ('leaf_denda_reklame', '4.1.01.20.04', 'Pendapatan Denda Pajak Reklame', 'c_denda', 2, true, 4),
    ('leaf_denda_listrik', '4.1.01.20.05', 'Pendapatan Denda Pajak Penerangan Jalan', 'c_denda', 2, true, 5),
    ('leaf_denda_parkir', '4.1.01.20.06', 'Pendapatan Denda Pajak Parkir', 'c_denda', 2, true, 6),
    ('leaf_denda_air_tanah', '4.1.01.20.07', 'Pendapatan Denda Pajak Air Tanah', 'c_denda', 2, true, 7),
    ('leaf_denda_mblb', '4.1.01.20.08', 'Pendapatan Denda Pajak Mineral Bukan Logam dan Batuan', 'c_denda', 2, true, 8),
    ('leaf_denda_pbb', '4.1.01.20.09', 'Pendapatan Denda PBB-P2', 'c_denda', 2, true, 9),
    ('leaf_denda_bphtb', '4.1.01.20.10', 'Pendapatan Denda BPHTB', 'c_denda', 2, true, 10)
ON CONFLICT ("id") DO NOTHING;
