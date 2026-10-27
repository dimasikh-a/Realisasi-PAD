import * as XLSX from 'xlsx';
import { CalculatedRow, UraianNode } from '../types/pad';
import { formatRupiah, formatPersen, formatPersenAngka } from './calculationEngine';

/**
 * Generate official Bappenda Excel report (.xlsx) matching the official layout:
 * - Title and Header Metadata
 * - Multi-level column headers with current month name
 * - Column number row: 02, 03, 04, 05, 06, 07, 08(03-06), 09, 10
 * - Hierarchical indentations
 * - Jumlah PAD at the very bottom
 */
export function exportLaporanToExcel(
  rows: CalculatedRow[],
  tanggalLaporan: string,
  monthName: string,
  nomorLaporan?: string
) {
  const wsData: (string | number)[][] = [
    ['PEMERINTAH KABUPATEN / KOTA'],
    ['BADAN PENDAPATAN DAERAH (BAPPENDA)'],
    ['LAPORAN REALISASI PENERIMAAN PENDAPATAN ASLI DAERAH (PAD)'],
    [`Tanggal Laporan: ${tanggalLaporan}  |  Nomor: ${nomorLaporan || 'LAP-PAD/' + tanggalLaporan}`],
    [], // empty row
    // Multi-level Header Row 1
    [
      'NO',
      'URAIAN PENERIMAAN',
      'TARGET (APBD) (Rp)',
      'REALISASI S/D BULAN LALU (Rp)',
      `PENERIMAAN REALISASI - BULAN ${monthName.toUpperCase()}`,
      '',
      '',
      'TOTAL PENERIMAAN REALISASI S/D BULAN INI (Rp)',
      '(%)',
      'SISA TARGET (Rp)',
      '(%)',
      'Ket'
    ],
    // Multi-level Header Row 2 (Sub-headers)
    [
      '',
      '',
      '',
      '',
      's/d Kemarin',
      'Hari Ini',
      'Jumlah',
      '',
      '',
      '',
      '',
      ''
    ],
    // Column Number Row (Matching official layout: 01 to 10)
    [
      '01',
      '02',
      '03',
      '04',
      '05',
      '05',
      '05',
      '06',
      '07',
      '08(03-06)',
      '09',
      '10'
    ]
  ];

  let itemNum = 1;
  for (const r of rows) {
    const isLeaf = r.uraian.is_leaf;
    const indent = '  '.repeat(r.uraian.level);
    const displayName = `${indent}${r.uraian.nama}`;

    wsData.push([
      isLeaf ? itemNum++ : '',
      displayName,
      formatRupiah(r.target),
      formatRupiah(r.s_d_bulan_lalu),
      formatRupiah(r.s_d_kemarin),
      formatRupiah(r.hari_ini),
      formatRupiah(r.jumlah_s_d_hari_ini),
      formatRupiah(r.total_realisasi),
      formatPersenAngka(r.persen_capaian, r.target > 0),
      formatRupiah(r.sisa_target),
      formatPersenAngka(r.persen_sisa_target, r.target > 0),
      r.keterangan || ''
    ]);
  }

  // Create workbook and worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set merges for multi-level headers:
  // Cols 0, 1, 2, 3, 7, 8, 9, 10, 11 merge row 5 and 6 (index 5 to 6)
  // Cols 4, 5, 6 under 'PENERIMAAN REALISASI' span row 5 cols 4 to 6
  ws['!merges'] = [
    { s: { r: 5, c: 0 }, e: { r: 6, c: 0 } },  // 01 NO
    { s: { r: 5, c: 1 }, e: { r: 6, c: 1 } },  // 02 URAIAN
    { s: { r: 5, c: 2 }, e: { r: 6, c: 2 } },  // 03 TARGET
    { s: { r: 5, c: 3 }, e: { r: 6, c: 3 } },  // 04 BULAN LALU
    { s: { r: 5, c: 4 }, e: { r: 5, c: 6 } },  // 05 PENERIMAAN REALISASI (spans Kemarin, Hari Ini, Jumlah)
    { s: { r: 5, c: 7 }, e: { r: 6, c: 7 } },  // 06 TOTAL REALISASI
    { s: { r: 5, c: 8 }, e: { r: 6, c: 8 } },  // 07 (%) Capaian
    { s: { r: 5, c: 9 }, e: { r: 6, c: 9 } },  // 08 SISA TARGET
    { s: { r: 5, c: 10 }, e: { r: 6, c: 10 } }, // 09 (%) Sisa Target
    { s: { r: 5, c: 11 }, e: { r: 6, c: 11 } }  // 10 KET
  ];

  // Column widths
  ws['!cols'] = [
    { wch: 6 },  // 01 NO
    { wch: 45 }, // 02 URAIAN
    { wch: 24 }, // 03 TARGET (APBD)
    { wch: 24 }, // 04 S/D BULAN LALU
    { wch: 20 }, // 05 S/D KEMARIN
    { wch: 20 }, // 05 HARI INI
    { wch: 22 }, // 05 JUMLAH BULAN INI
    { wch: 26 }, // 06 TOTAL REALISASI S/D BULAN INI
    { wch: 10 }, // 07 (%) CAPAIAN
    { wch: 24 }, // 08 SISA TARGET
    { wch: 10 }, // 09 (%) SISA TARGET
    { wch: 25 }  // 10 KET
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `PAD_${tanggalLaporan}`);
  XLSX.writeFile(wb, `Laporan_PAD_${tanggalLaporan}.xlsx`);
}

/**
 * Generate downloadable CSV / Excel Template for Target Anggaran Import
 */
export function downloadTargetTemplate(leafNodes: UraianNode[]) {
  const data = [
    ['KODE_REKENING', 'NAMA_POS_PENERIMAAN', 'TARGET_ANGGARAN_RP', 'KETERANGAN'],
    ...leafNodes.map(node => [
      node.kode,
      node.nama,
      1000000000,
      'Contoh pengisian target APBD 2026'
    ])
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 45 },
    { wch: 24 },
    { wch: 35 }
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Target');
  XLSX.writeFile(wb, 'Template_Import_Target_PAD.xlsx');
}

/**
 * Parse & Validate Target Anggaran Import File:
 * - Reject non-leaf rows
 * - Check positive numeric target
 * - Produce row-by-row errors list
 */
export interface TargetImportRow {
  rowNumber: number;
  kode: string;
  nama: string;
  target: number;
  uraian_id?: string;
  error?: string;
  isValid: boolean;
}

export function parseAndValidateTargetImport(
  fileData: ArrayBuffer,
  allNodes: UraianNode[]
): {
  rows: TargetImportRow[];
  validCount: number;
  errorCount: number;
} {
  const wb = XLSX.read(fileData, { type: 'array' });
  const firstSheetName = wb.SheetNames[0];
  const ws = wb.Sheets[firstSheetName];
  const json: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const rows: TargetImportRow[] = [];
  const leafNodes = allNodes.filter(n => n.is_leaf);
  const nonLeafNodes = allNodes.filter(n => !n.is_leaf);

  // Skip header (row 0)
  for (let i = 1; i < json.length; i++) {
    const rawRow = json[i];
    if (!rawRow || rawRow.length === 0) continue;

    const kode = String(rawRow[0] || '').trim();
    const nama = String(rawRow[1] || '').trim();
    const targetRaw = rawRow[2];

    const targetNum = Number(targetRaw);
    let error: string | undefined = undefined;
    let matchingLeaf: UraianNode | undefined = undefined;

    // Check if user accidentally entered a non-leaf node (e.g. PAJAK DAERAH or A. Pajak Daerah)
    const isNonLeaf = nonLeafNodes.find(
      n => n.kode.toLowerCase() === kode.toLowerCase() || n.nama.toLowerCase() === nama.toLowerCase()
    );

    if (isNonLeaf) {
      error = `Ditolak: '${isNonLeaf.nama}' adalah BARIS INDUK (Level ${isNonLeaf.level}), bukan leaf. Target hanya boleh untuk pos leaf.`;
    } else {
      matchingLeaf = leafNodes.find(
        n => (kode && n.kode.toLowerCase() === kode.toLowerCase()) || 
             (nama && n.nama.toLowerCase() === nama.toLowerCase())
      );

      if (!matchingLeaf) {
        error = `Pos penerimaan tidak ditemukan di Master Uraian Leaf (Kode: ${kode}, Nama: ${nama})`;
      } else if (isNaN(targetNum) || targetNum < 0) {
        error = `Nilai target tidak valid (${targetRaw}). Harus berupa angka >= 0`;
      }
    }

    rows.push({
      rowNumber: i + 1,
      kode,
      nama: matchingLeaf?.nama || nama,
      target: isNaN(targetNum) ? 0 : targetNum,
      uraian_id: matchingLeaf?.id,
      error,
      isValid: !error && !!matchingLeaf
    });
  }

  const validCount = rows.filter(r => r.isValid).length;
  const errorCount = rows.filter(r => !r.isValid).length;

  return { rows, validCount, errorCount };
}

/**
 * Generate downloadable Excel Template for Realisasi Penerimaan Import
 * Contains sample valid rows and petunjuk pengisian
 */
export function downloadRealisasiTemplate(leafNodes: UraianNode[], defaultDate: string = '2026-10-14') {
  const wb = XLSX.utils.book_new();

  // Sheet 1: DATA_REALISASI
  const dataHeaders = [
    'NO',
    'KODE_REKENING',
    'NAMA_POS_PENERIMAAN',
    'TANGGAL',
    'POKOK_RP',
    'PIUTANG_RP',
    'KETERANGAN'
  ];

  const sampleRows = leafNodes.map((node, index) => {
    // Provide sample realistic values for first few rows, 0 for others
    let samplePokok = 0;
    let samplePiutang = 0;
    let sampleKet = 'Penerimaan harian kasda';

    if (node.kode === '4.1.01.09') {
      samplePokok = 25000000;
      samplePiutang = 2500000;
      sampleKet = 'Pajak Reklame Billboard Jalan Protokol';
    } else if (node.kode === '4.1.01.21.01') {
      samplePokok = 45000000;
      samplePiutang = 0;
      sampleKet = 'PBJT Restoran & Kafe';
    } else if (node.kode === '4.1.01.21.03') {
      samplePokok = 35000000;
      samplePiutang = 5000000;
      sampleKet = 'PBJT Hotel Bintang 4 & 5';
    } else if (node.kode === '4.1.01.22.01') {
      samplePokok = 60000000;
      samplePiutang = 0;
      sampleKet = 'Opsen PKB Samsat Bersama';
    } else if (node.kode.startsWith('4.1.01.20')) {
      samplePokok = 1500000;
      samplePiutang = 0;
      sampleKet = 'Denda Keterlambatan Pembayaran';
    }

    return [
      index + 1,
      node.kode,
      node.nama,
      defaultDate,
      samplePokok,
      samplePiutang,
      sampleKet
    ];
  });

  const wsData = [dataHeaders, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  ws['!cols'] = [
    { wch: 6 },  // NO
    { wch: 18 }, // KODE_REKENING
    { wch: 45 }, // NAMA_POS_PENERIMAAN
    { wch: 14 }, // TANGGAL (YYYY-MM-DD)
    { wch: 20 }, // POKOK_RP
    { wch: 20 }, // PIUTANG_RP
    { wch: 35 }  // KETERANGAN
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'DATA_REALISASI');

  // Sheet 2: PETUNJUK_PENGISIAN
  const guideData = [
    ['PETUNJUK PENGISIAN IMPORT REALISASI PENERIMAAN PAD BAPPENDA'],
    [],
    ['1. KOLOM TANGGAL', 'Gunakan format tahun-bulan-tanggal YYYY-MM-DD (Contoh: 2026-10-14).'],
    ['2. KOLOM POKOK_RP & PIUTANG_RP', 'Hanya masukkan angka murni (Contoh: 25000000). Jangan sertakan simbol Rp, titik, atau koma manual.'],
    ['3. HANYA UNTUK POS LEAF', 'Sistem hanya menerima pos penerimaan akhir (Leaf). Jangan menginput baris induk seperti PAJAK DAERAH atau PBJT karena induk dihitung otomatis oleh sistem.'],
    ['4. KODE REKENING ATAU NAMA', 'Pastikan KODE_REKENING atau NAMA_POS_PENERIMAAN tidak diubah agar sistem mengenali pos yang sesuai.'],
    ['5. BARIS DENGAN NILAI 0', 'Baris yang memiliki Pokok = 0 dan Piutang = 0 akan otomatis diabaikan atau dilewati saat disimpan.'],
    ['6. PENAMBAHAN BARIS', 'Anda dapat menambahkan baris baru dengan tanggal yang berbeda untuk melakukan import banyak hari sekaligus.']
  ];
  const wsGuide = XLSX.utils.aoa_to_sheet(guideData);
  wsGuide['!cols'] = [
    { wch: 30 },
    { wch: 80 }
  ];
  XLSX.utils.book_append_sheet(wb, wsGuide, 'PETUNJUK_PENGISIAN');

  XLSX.writeFile(wb, `Template_Import_Realisasi_PAD_${defaultDate}.xlsx`);
}

export interface RealisasiImportRow {
  rowNumber: number;
  kode: string;
  nama: string;
  tanggal: string;
  pokok: number;
  piutang: number;
  total: number;
  keterangan: string;
  uraian_id?: string;
  error?: string;
  isValid: boolean;
}

function parseAmount(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.max(0, val);
  let s = String(val).trim().replace(/Rp|\s/gi, '').trim();
  if (s.includes('.') && s.includes(',')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  } else if (s.includes('.')) {
    const parts = s.split('.');
    if (parts.length > 1 && parts.every((p, idx) => idx === 0 || p.length === 3)) {
      s = s.replace(/\./g, '');
    }
  }
  const num = parseFloat(s);
  return isNaN(num) ? 0 : Math.max(0, num);
}

function parseDateCell(val: any, defaultDate: string): string {
  if (val === null || val === undefined || val === '') return defaultDate;
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    if (val > 25000 && val < 65000) {
      const utcDays = Math.floor(val - 25569);
      const dateObj = new Date(utcDays * 86400 * 1000);
      const y = dateObj.getUTCFullYear();
      const m = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const dmyMatch = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  return defaultDate;
}

export function parseAndValidateRealisasiImport(
  fileData: ArrayBuffer,
  allNodes: UraianNode[],
  defaultDate: string
): {
  rows: RealisasiImportRow[];
  validCount: number;
  errorCount: number;
  totalPokok: number;
  totalPiutang: number;
  totalNominal: number;
} {
  const wb = XLSX.read(fileData, { type: 'array', cellDates: true });
  // Find sheet with realisasi data (or first sheet)
  const sheetName = wb.SheetNames.find(s => s.toLowerCase().includes('realisasi')) || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

  const rows: RealisasiImportRow[] = [];
  const leafNodes = allNodes.filter(n => n.is_leaf);
  const nonLeafNodes = allNodes.filter(n => !n.is_leaf);

  if (json.length < 2) {
    return { rows: [], validCount: 0, errorCount: 0, totalPokok: 0, totalPiutang: 0, totalNominal: 0 };
  }

  // Detect column mapping from header row (row 0)
  const headerRow: string[] = (json[0] || []).map((c: any) => String(c || '').toLowerCase().trim());
  let colKode = headerRow.findIndex(h => h.includes('kode'));
  let colNama = headerRow.findIndex(h => h.includes('nama') || h.includes('uraian'));
  let colTanggal = headerRow.findIndex(h => h.includes('tanggal') || h.includes('tgl') || h.includes('date'));
  let colPokok = headerRow.findIndex(h => h.includes('pokok'));
  let colPiutang = headerRow.findIndex(h => h.includes('piutang'));
  let colKet = headerRow.findIndex(h => h.includes('ket') || h.includes('catatan'));

  // Positional fallback if headers not recognized
  if (colKode === -1 && colNama === -1) {
    // Check if col 0 looks like NO or KODE
    const firstCell = String(json[1]?.[0] || '');
    if (/^\d+$/.test(firstCell) && firstCell.length <= 3) {
      // 0: NO, 1: KODE, 2: NAMA, 3: TANGGAL, 4: POKOK, 5: PIUTANG, 6: KET
      colKode = 1;
      colNama = 2;
      colTanggal = 3;
      colPokok = 4;
      colPiutang = 5;
      colKet = 6;
    } else {
      colKode = 0;
      colNama = 1;
      colTanggal = 2;
      colPokok = 3;
      colPiutang = 4;
      colKet = 5;
    }
  }

  if (colKode === -1) colKode = 1;
  if (colNama === -1) colNama = 2;
  if (colTanggal === -1) colTanggal = 3;
  if (colPokok === -1) colPokok = 4;
  if (colPiutang === -1) colPiutang = 5;
  if (colKet === -1) colKet = 6;

  for (let i = 1; i < json.length; i++) {
    const raw = json[i];
    if (!raw || raw.length === 0 || raw.every((c: any) => c === undefined || c === null || c === '')) {
      continue;
    }

    const kode = String(raw[colKode] || '').trim();
    const nama = String(raw[colNama] || '').trim();
    const tanggal = parseDateCell(raw[colTanggal], defaultDate);
    const pokok = parseAmount(raw[colPokok]);
    const piutang = parseAmount(raw[colPiutang]);
    const total = pokok + piutang;
    const keterangan = String(raw[colKet] || 'Import Excel Realisasi').trim();

    let error: string | undefined = undefined;
    let matchingLeaf: UraianNode | undefined = undefined;

    // Check if accidentally entered non-leaf parent
    const isNonLeaf = nonLeafNodes.find(
      n => (kode && n.kode.toLowerCase() === kode.toLowerCase()) || 
           (nama && n.nama.toLowerCase() === nama.toLowerCase())
    );

    if (isNonLeaf) {
      error = `Ditolak: '${isNonLeaf.nama}' adalah Kategori Induk (Level ${isNonLeaf.level}). Transaksi hanya boleh untuk pos penerimaan Leaf (akhir).`;
    } else {
      matchingLeaf = leafNodes.find(
        n => (kode && n.kode.toLowerCase() === kode.toLowerCase()) || 
             (nama && n.nama.toLowerCase() === nama.toLowerCase())
      );

      if (!matchingLeaf) {
        error = `Pos penerimaan tidak dikenali di Master Leaf Bappenda (Kode: ${kode || '-'}, Nama: ${nama || '-'})`;
      } else if (pokok === 0 && piutang === 0) {
        error = 'Nilai pokok dan piutang keduanya 0 (tidak ada nominal yang dapat dicatat).';
      }
    }

    rows.push({
      rowNumber: i + 1,
      kode: matchingLeaf?.kode || kode,
      nama: matchingLeaf?.nama || nama,
      tanggal,
      pokok,
      piutang,
      total,
      keterangan,
      uraian_id: matchingLeaf?.id,
      error,
      isValid: !error && !!matchingLeaf && total > 0
    });
  }

  const validRows = rows.filter(r => r.isValid);
  const validCount = validRows.length;
  const errorCount = rows.filter(r => !r.isValid).length;
  const totalPokok = validRows.reduce((sum, r) => sum + r.pokok, 0);
  const totalPiutang = validRows.reduce((sum, r) => sum + r.piutang, 0);
  const totalNominal = totalPokok + totalPiutang;

  return { rows, validCount, errorCount, totalPokok, totalPiutang, totalNominal };
}
