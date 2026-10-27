import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __globalPrismaClient: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
  if (!globalThis.__globalPrismaClient) {
    globalThis.__globalPrismaClient = new PrismaClient({
      log: ['error', 'warn'],
    });
  }
  return globalThis.__globalPrismaClient;
}

export const prisma = getPrismaClient();

export async function checkPostgresConnection(): Promise<{
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
}> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return {
      isConnected: false,
      database: 'PostgreSQL',
      provider: 'Prisma Client',
      message: 'DATABASE_URL belum dikonfigurasi di file .env. Sistem berjalan dengan mode Local State.'
    };
  }

  try {
    // Jalankan query sederhana $queryRaw untuk memastikan koneksi ke postgres aktif
    await prisma.$queryRaw`SELECT 1 as connected;`;

    // Ambil rekap data jika terhubung
    const [uraianCount, targetCount, txCount, laporanCount] = await Promise.all([
      prisma.uraianNode.count().catch(() => 0),
      prisma.targetAnggaran.count().catch(() => 0),
      prisma.transaksiPenerimaan.count().catch(() => 0),
      prisma.laporan.count().catch(() => 0),
    ]);

    return {
      isConnected: true,
      database: 'PostgreSQL',
      provider: 'Prisma Client v6',
      message: 'Berhasil terhubung ke database PostgreSQL via Prisma ORM.',
      counts: {
        uraian: uraianCount,
        targets: targetCount,
        transactions: txCount,
        laporan: laporanCount,
      }
    };
  } catch (err: any) {
    return {
      isConnected: false,
      database: 'PostgreSQL',
      provider: 'Prisma Client',
      message: `Gagal terhubung ke PostgreSQL: ${err?.message || 'Koneksi ditolak atau timeout'}. Pastikan server PostgreSQL sedang berjalan.`
    };
  }
}
