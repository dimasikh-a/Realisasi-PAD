import Decimal from 'decimal.js';
import { calculateReportData, formatRupiah, formatPersen } from './calculationEngine';
import { SEED_URAIAN, SEED_TARGETS_2026, generateSeedTransactions } from './seedData';

export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  message?: string;
}

export function runAutomaticTests(): {
  allPassed: boolean;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: TestResult[];
} {
  const results: TestResult[] = [];
  const transactions = generateSeedTransactions();
  const reportDate = '2026-09-30';

  // Run calculation engine for reference date
  const { rows, padRow, pajakDaerahRow, cRow } = calculateReportData(
    SEED_URAIAN,
    SEED_TARGETS_2026,
    transactions,
    reportDate
  );

  // 1. Check PAD Target
  const padTargetFormatted = formatRupiah(padRow?.target);
  const expectedPadTarget = '4.212.836.766.904,00';
  results.push({
    name: 'Target Anggaran PAD 2026',
    category: 'Target & Aggregation',
    passed: padTargetFormatted === expectedPadTarget,
    expected: expectedPadTarget,
    actual: padTargetFormatted
  });

  // 2. Check Pajak Daerah Target
  const pdTargetFormatted = formatRupiah(pajakDaerahRow?.target);
  const expectedPdTarget = '4.171.531.395.904,00';
  results.push({
    name: 'Target Anggaran PAJAK DAERAH 2026 (A + B)',
    category: 'Target & Aggregation',
    passed: pdTargetFormatted === expectedPdTarget,
    expected: expectedPdTarget,
    actual: pdTargetFormatted
  });

  // 3. Check C. Pendapatan Denda Pajak Daerah Target
  const cTargetFormatted = formatRupiah(cRow?.target);
  const expectedCTarget = '41.305.371.000,00';
  results.push({
    name: 'Target C. Pendapatan Denda Pajak Daerah',
    category: 'Target & Aggregation',
    passed: cTargetFormatted === expectedCTarget,
    expected: expectedCTarget,
    actual: cTargetFormatted
  });

  // 4. Check PAD = PAJAK DAERAH + C. Denda (Section A)
  const pdTargetDec = new Decimal(pajakDaerahRow?.target || 0);
  const cTargetDec = new Decimal(cRow?.target || 0);
  const sumTargetDec = pdTargetDec.plus(cTargetDec);
  const padTargetDec = new Decimal(padRow?.target || 0);
  results.push({
    name: 'Aturan Struktur: PAD Target = Pajak Daerah + C. Denda',
    category: 'Tree Hierarchy',
    passed: sumTargetDec.equals(padTargetDec),
    expected: formatRupiah(padTargetDec),
    actual: formatRupiah(sumTargetDec),
    message: 'Memastikan C. Denda adalah anak langsung PAD sejajar Pajak Daerah, bukan anak Pajak Daerah'
  });

  // 5. Check PAD Total Realisasi
  const padRealisasiFormatted = formatRupiah(padRow?.total_realisasi);
  const expectedPadRealisasi = '2.837.990.298.349,00';
  results.push({
    name: 'Total Realisasi PAD Kumulatif',
    category: 'Realization & Capaian',
    passed: padRealisasiFormatted === expectedPadRealisasi,
    expected: expectedPadRealisasi,
    actual: padRealisasiFormatted
  });

  // 6. Check PAD Capaian %
  const padCapaianFormatted = formatPersen(padRow?.persen_capaian);
  const expectedPadCapaian = '67,37%';
  results.push({
    name: 'Persentase Capaian PAD',
    category: 'Realization & Capaian',
    passed: padCapaianFormatted === expectedPadCapaian,
    expected: expectedPadCapaian,
    actual: padCapaianFormatted,
    message: 'Dihitung dari (Total Realisasi PAD / Target PAD) * 100'
  });

  // 7. Check PAJAK DAERAH Penerimaan Hari Ini
  const pdHariIniFormatted = formatRupiah(pajakDaerahRow?.hari_ini);
  const expectedPdHariIni = '10.308.212.254,00';
  results.push({
    name: 'Penerimaan PAJAK DAERAH Hari Ini (30 Sep 2026)',
    category: 'Daily Realization',
    passed: pdHariIniFormatted === expectedPdHariIni,
    expected: expectedPdHariIni,
    actual: pdHariIniFormatted
  });

  // 8. Check Sisa Target & Persen Sisa
  const sisaTargetFormatted = formatRupiah(padRow?.sisa_target);
  const sisaPersen = padRow?.target ? ((padRow.sisa_target / padRow.target) * 100).toFixed(2).replace('.', ',') + '%' : '0%';
  results.push({
    name: 'Sisa Target PAD (Target - Realisasi)',
    category: 'Target & Aggregation',
    passed: sisaPersen === '32,63%',
    expected: '32,63% sisa (1.374.846.468.555,00)',
    actual: `${sisaPersen} sisa (${sisaTargetFormatted})`,
    message: 'Sisa target dihitung ulang dari selisih Target dan Total Realisasi'
  });

  // 9. Check Section B: Tanggal 1 bulan berjalan -> s_d_kemarin = 0
  const day1Calc = calculateReportData(
    SEED_URAIAN,
    SEED_TARGETS_2026,
    transactions,
    '2026-09-01' // Tanggal 1 September
  );
  const day1Kemarin = day1Calc.padRow?.s_d_kemarin || 0;
  results.push({
    name: 'Aturan Tanggal 1: s_d_kemarin bernilai 0',
    category: 'Calculation Rules',
    passed: day1Kemarin === 0,
    expected: '0',
    actual: day1Kemarin.toString(),
    message: 'Jika tanggal laporan jatuh pada tanggal 1 bulan berjalan, penerimaan s/d kemarin bernilai 0'
  });

  // 10. Check is_leaf consistency & validation
  const parentIds = new Set(SEED_URAIAN.map(n => n.parent_id).filter(Boolean));
  let leafConsistencyOk = true;
  for (const node of SEED_URAIAN) {
    const isParent = parentIds.has(node.id);
    if (isParent && node.is_leaf) leafConsistencyOk = false;
    if (!isParent && !node.is_leaf) leafConsistencyOk = false;
  }
  results.push({
    name: 'Konsistensi is_leaf (Validasi Pohon Hierarki)',
    category: 'Tree Hierarchy',
    passed: leafConsistencyOk,
    expected: 'Konsisten (Node dengan anak is_leaf=false, node tanpa anak is_leaf=true)',
    actual: leafConsistencyOk ? 'Konsisten' : 'Ada inkonsistensi'
  });

  // 11. Check Section D: Baris PAD berada di PALING BAWAH tabel
  const lastRow = rows[rows.length - 1];
  const isPadAtBottom = lastRow?.uraian.id === 'pad';
  results.push({
    name: 'Posisi Baris PAD di PALING BAWAH Tabel Laporan',
    category: 'Layout & Ordering',
    passed: isPadAtBottom,
    expected: 'pad (Jumlah Pendapatan Asli Daerah di baris terakhir)',
    actual: `${lastRow?.uraian.id} (${lastRow?.uraian.nama})`
  });

  // 12. Check Format Negatif dalam Kurung (Section C)
  const negVal = -544079;
  const negFormatted = formatRupiah(negVal);
  const negPersen = formatPersen(-53.63);
  const formatNegOk = negFormatted === '(544.079,00)' && negPersen === '(53,63%)';
  results.push({
    name: 'Format Angka Negatif dalam Kurung',
    category: 'Formatting',
    passed: formatNegOk,
    expected: '(544.079,00) dan (53,63%)',
    actual: `${negFormatted} dan ${negPersen}`
  });

  const passedTests = results.filter(r => r.passed).length;
  const failedTests = results.filter(r => !r.passed).length;

  return {
    allPassed: failedTests === 0,
    totalTests: results.length,
    passedTests,
    failedTests,
    results
  };
}
