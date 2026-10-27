-- CreateTable
CREATE TABLE "uraian_node" (
    "id" TEXT NOT NULL,
    "kode" VARCHAR(50) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "parent_id" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "is_leaf" BOOLEAN NOT NULL DEFAULT false,
    "urutan" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uraian_node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_anggaran" (
    "id" TEXT NOT NULL,
    "uraian_id" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL DEFAULT 2026,
    "jumlah" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "target_anggaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaksi_penerimaan" (
    "id" TEXT NOT NULL,
    "uraian_id" TEXT NOT NULL,
    "tanggal" VARCHAR(10) NOT NULL,
    "pokok" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "piutang" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "keterangan" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaksi_penerimaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan" (
    "id" TEXT NOT NULL,
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
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan_detail" (
    "id" TEXT NOT NULL,
    "laporan_id" TEXT NOT NULL,
    "uraian_id" TEXT NOT NULL,
    "target" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "sd_bulan_lalu" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "sd_kemarin" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "hari_ini" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "jumlah_sd_hari_ini" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "total_realisasi" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "sisa_target" DECIMAL(20,2) NOT NULL DEFAULT 0,
    "persen_capaian" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "keterangan" VARCHAR(500),

    CONSTRAINT "laporan_detail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user" VARCHAR(100) NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "laporan_id" VARCHAR(100),
    "keterangan" TEXT NOT NULL,
    "metadata" TEXT,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "email" VARCHAR(100),
    "name" VARCHAR(100) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'operator',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "uraian_node_parent_id_idx" ON "uraian_node"("parent_id");

-- CreateIndex
CREATE INDEX "uraian_node_is_leaf_idx" ON "uraian_node"("is_leaf");

-- CreateIndex
CREATE INDEX "target_anggaran_tahun_idx" ON "target_anggaran"("tahun");

-- CreateIndex
CREATE UNIQUE INDEX "target_anggaran_uraian_id_tahun_key" ON "target_anggaran"("uraian_id", "tahun");

-- CreateIndex
CREATE INDEX "transaksi_penerimaan_tanggal_idx" ON "transaksi_penerimaan"("tanggal");

-- CreateIndex
CREATE INDEX "transaksi_penerimaan_uraian_id_idx" ON "transaksi_penerimaan"("uraian_id");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_nomor_laporan_key" ON "laporan"("nomor_laporan");

-- CreateIndex
CREATE INDEX "laporan_tanggal_laporan_idx" ON "laporan"("tanggal_laporan");

-- CreateIndex
CREATE INDEX "laporan_status_idx" ON "laporan"("status");

-- CreateIndex
CREATE INDEX "laporan_detail_laporan_id_idx" ON "laporan_detail"("laporan_id");

-- CreateIndex
CREATE UNIQUE INDEX "laporan_detail_laporan_id_uraian_id_key" ON "laporan_detail"("laporan_id", "uraian_id");

-- CreateIndex
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log"("timestamp");

-- CreateIndex
CREATE INDEX "audit_log_action_idx" ON "audit_log"("action");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "uraian_node" ADD CONSTRAINT "uraian_node_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "uraian_node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_anggaran" ADD CONSTRAINT "target_anggaran_uraian_id_fkey" FOREIGN KEY ("uraian_id") REFERENCES "uraian_node"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaksi_penerimaan" ADD CONSTRAINT "transaksi_penerimaan_uraian_id_fkey" FOREIGN KEY ("uraian_id") REFERENCES "uraian_node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "laporan_detail" ADD CONSTRAINT "laporan_detail_laporan_id_fkey" FOREIGN KEY ("laporan_id") REFERENCES "laporan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
