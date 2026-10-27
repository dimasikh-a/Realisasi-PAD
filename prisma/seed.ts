import { PrismaClient } from '@prisma/client';
import { SEED_URAIAN, SEED_TARGETS_2026 } from '../src/services/seedData.ts';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Memulai Seeding Database PostgreSQL via Prisma ---');

  // 1. Seed Pengguna Awal
  console.log('Menyimpan Data Pengguna...');
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin.bappenda@pemda.go.id',
      name: 'Administrator Bappenda',
      role: 'admin'
    }
  });

  await prisma.user.upsert({
    where: { username: 'operator' },
    update: {},
    create: {
      username: 'operator',
      email: 'operator.penerimaan@pemda.go.id',
      name: 'Petugas Pengelola Penerimaan PAD',
      role: 'operator'
    }
  });

  // 2. Seed Master Hierarki Bagan Akun (UraianNode)
  console.log('Menyimpan Master Hierarki Bagan Akun PAD (22 Pos Leaf + Hierarki)...');
  // Simpan secara terurut dari level 0 ke level lebih dalam
  const sortedNodes = [...SEED_URAIAN].sort((a, b) => a.level - b.level);

  for (const node of sortedNodes) {
    await prisma.uraianNode.upsert({
      where: { id: node.id },
      update: {
        kode: node.kode,
        nama: node.nama,
        parentId: node.parent_id,
        level: node.level,
        isLeaf: node.is_leaf,
        urutan: node.urutan
      },
      create: {
        id: node.id,
        kode: node.kode,
        nama: node.nama,
        parentId: node.parent_id,
        level: node.level,
        isLeaf: node.is_leaf,
        urutan: node.urutan
      }
    });
  }

  // Bersihkan pos lama yang sudah dihapus dari master (seperti leaf_walet dan leaf_opsen_mblb)
  const validIds = SEED_URAIAN.map(u => u.id);
  try {
    await prisma.targetAnggaran.deleteMany({
      where: { uraianId: { notIn: validIds } }
    });
    await prisma.transaksiPenerimaan.deleteMany({
      where: { uraianId: { notIn: validIds } }
    });
    await prisma.uraianNode.deleteMany({
      where: { id: { notIn: validIds } }
    });
  } catch (cleanErr) {
    console.warn('Pembersihan data lama dilewati:', cleanErr);
  }

  // 3. Seed Target Anggaran APBD 2026
  console.log(`Menyimpan ${SEED_TARGETS_2026.length} Target Anggaran APBD 2026...`);
  for (const tgt of SEED_TARGETS_2026) {
    const parentNode = await prisma.uraianNode.findUnique({
      where: { id: tgt.uraian_id }
    });

    if (!parentNode) {
      console.warn(`Pos ${tgt.uraian_id} belum terdaftar di tabel uraian_node. Melewati...`);
      continue;
    }

    await prisma.targetAnggaran.upsert({
      where: {
        uraianId_tahun: {
          uraianId: tgt.uraian_id,
          tahun: tgt.tahun
        }
      },
      update: {
        jumlah: tgt.jumlah
      },
      create: {
        id: tgt.id,
        uraianId: tgt.uraian_id,
        tahun: tgt.tahun,
        jumlah: tgt.jumlah
      }
    });
  }

  // 4. Catat Audit Log Inisialisasi
  await prisma.auditLog.create({
    data: {
      user: 'SYSTEM',
      action: 'DATABASE_INITIALIZATION',
      keterangan: 'Inisialisasi 22 pos leaf penerimaan dan target APBD 2026 via Prisma'
    }
  });

  console.log('--- Seeding Selesai Berhasil! Seluruh 22 pos akun dan target telah tersimpan ---');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });