import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { prisma, checkPostgresConnection } from './src/lib/prisma.ts';
import { SEED_URAIAN, SEED_TARGETS_2026 } from './src/services/seedData.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// --- API ROUTES (POSTGRESQL & PRISMA) ---

// 1. Cek status koneksi PostgreSQL & Prisma
app.get('/api/db/status', async (_req: Request, res: Response) => {
  try {
    const status = await checkPostgresConnection();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({
      isConnected: false,
      database: 'PostgreSQL',
      provider: 'Prisma Client',
      message: err?.message || 'Gagal memeriksa koneksi database'
    });
  }
});

// 2. Ambil schema.prisma content (untuk dokumentasi & visualizer)
app.get('/api/db/schema', (_req: Request, res: Response) => {
  try {
    const schemaPath = path.resolve(__dirname, 'prisma/schema.prisma');
    if (fs.existsSync(schemaPath)) {
      const content = fs.readFileSync(schemaPath, 'utf-8');
      res.json({ success: true, schema: content });
    } else {
      res.status(404).json({ success: false, message: 'File schema.prisma tidak ditemukan' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message });
  }
});

// 3. Ambil file init.sql (DDL PostgreSQL)
app.get('/api/db/init-sql', (_req: Request, res: Response) => {
  try {
    const sqlPath = path.resolve(__dirname, 'prisma/init.sql');
    if (fs.existsSync(sqlPath)) {
      const content = fs.readFileSync(sqlPath, 'utf-8');
      res.json({ success: true, sql: content });
    } else {
      res.status(404).json({ success: false, message: 'File init.sql tidak ditemukan' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, message: err?.message });
  }
});

// 4. API Master Hierarki Uraian Node
app.get('/api/uraian', async (_req: Request, res: Response) => {
  try {
    const dbCheck = await checkPostgresConnection();
    if (dbCheck.isConnected) {
      const nodes = await prisma.uraianNode.findMany({
        orderBy: [{ level: 'asc' }, { urutan: 'asc' }]
      });
      // Convert to format
      const formatted = nodes.map(n => ({
        id: n.id,
        kode: n.kode,
        nama: n.nama,
        parent_id: n.parentId,
        level: n.level,
        is_leaf: n.isLeaf,
        urutan: n.urutan
      }));
      res.json({ source: 'postgresql', data: formatted });
    } else {
      res.json({ source: 'fallback_seed', data: SEED_URAIAN });
    }
  } catch (e: any) {
    res.json({ source: 'fallback_seed', data: SEED_URAIAN, error: e?.message });
  }
});

// 5. API Target Anggaran
app.get('/api/targets', async (req: Request, res: Response) => {
  try {
    const tahun = parseInt(req.query.tahun as string, 10) || 2026;
    const dbCheck = await checkPostgresConnection();
    if (dbCheck.isConnected) {
      const targets = await prisma.targetAnggaran.findMany({
        where: { tahun }
      });
      const formatted = targets.map(t => ({
        id: t.id,
        uraian_id: t.uraianId,
        tahun: t.tahun,
        jumlah: Number(t.jumlah)
      }));
      res.json({ source: 'postgresql', data: formatted });
    } else {
      res.json({ source: 'fallback_seed', data: SEED_TARGETS_2026 });
    }
  } catch (e: any) {
    res.json({ source: 'fallback_seed', data: SEED_TARGETS_2026, error: e?.message });
  }
});

// 6. Update Target Anggaran
app.post('/api/targets', async (req: Request, res: Response) => {
  try {
    const { uraian_id, tahun, jumlah } = req.body;
    const dbCheck = await checkPostgresConnection();
    if (!dbCheck.isConnected) {
      return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak terhubung' });
    }

    const updated = await prisma.targetAnggaran.upsert({
      where: {
        uraianId_tahun: {
          uraianId: uraian_id,
          tahun: parseInt(tahun, 10) || 2026
        }
      },
      update: {
        jumlah: parseFloat(jumlah) || 0
      },
      create: {
        uraianId: uraian_id,
        tahun: parseInt(tahun, 10) || 2026,
        jumlah: parseFloat(jumlah) || 0
      }
    });

    res.json({ success: true, data: updated });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message });
  }
});

// 7. API Transaksi Penerimaan
app.get('/api/transaksi', async (req: Request, res: Response) => {
  try {
    const tanggal = req.query.tanggal as string | undefined;
    const dbCheck = await checkPostgresConnection();
    if (dbCheck.isConnected) {
      const txs = await prisma.transaksiPenerimaan.findMany({
        where: tanggal ? { tanggal } : undefined,
        orderBy: { createdAt: 'desc' }
      });
      const formatted = txs.map(t => ({
        id: t.id,
        uraian_id: t.uraianId,
        tanggal: t.tanggal,
        pokok: Number(t.pokok),
        piutang: Number(t.piutang),
        total: Number(t.total),
        keterangan: t.keterangan,
        created_at: t.createdAt.toISOString()
      }));
      res.json({ source: 'postgresql', data: formatted });
    } else {
      res.json({ source: 'not_connected', data: [] });
    }
  } catch (e: any) {
    res.status(500).json({ source: 'error', data: [], error: e?.message });
  }
});

// 8. Tambah Transaksi Penerimaan
app.post('/api/transaksi', async (req: Request, res: Response) => {
  try {
    const { uraian_id, tanggal, pokok, piutang, keterangan } = req.body;
    const dbCheck = await checkPostgresConnection();
    if (!dbCheck.isConnected) {
      return res.status(503).json({ success: false, error: 'Database PostgreSQL tidak terhubung' });
    }

    const p = parseFloat(pokok) || 0;
    const pi = parseFloat(piutang) || 0;

    const created = await prisma.transaksiPenerimaan.create({
      data: {
        uraianId: uraian_id,
        tanggal,
        pokok: p,
        piutang: pi,
        total: p + pi,
        keterangan: keterangan || null
      }
    });

    res.json({ success: true, data: created });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message });
  }
});

// 9. Seeding Otomatis PostgreSQL
app.post('/api/db/seed', async (_req: Request, res: Response) => {
  try {
    const dbCheck = await checkPostgresConnection();
    if (!dbCheck.isConnected) {
      return res.status(503).json({
        success: false,
        error: 'Database PostgreSQL belum terhubung. Konfigurasi DATABASE_URL di file .env terlebih dahulu.'
      });
    }

    // Seed users
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        email: 'admin.bapenda@pemda.go.id',
        name: 'Administrator Bapenda',
        role: 'admin'
      }
    });

    // Seed master nodes
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

    // Seed targets
    for (const tgt of SEED_TARGETS_2026) {
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

    res.json({ success: true, message: 'Berhasil melakukan seeding data master dan target 2026 ke PostgreSQL!' });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e?.message });
  }
});

// --- VITE MIDDLEWARE (DEV) ATAU STATIC SERVE (PROD) ---
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BAPENDA SERVER] Berjalan pada port ${PORT} (Mode: ${isProd ? 'Production' : 'Development'})`);
  });
}

startServer();
