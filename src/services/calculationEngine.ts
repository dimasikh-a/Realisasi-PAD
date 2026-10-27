import Decimal from 'decimal.js';
import { UraianNode, TargetAnggaran, TransaksiPenerimaan, CalculatedRow } from '../types/pad';

// Configure Decimal precision
Decimal.set({ precision: 35, rounding: Decimal.ROUND_HALF_UP });

/**
 * Format a numeric value into Indonesian Rupiah representation:
 * - Dot as thousand separator, comma for decimals (e.g. 4.171.531.395.904,00)
 * - 0 is displayed as '-'
 * - Negative numbers displayed in parentheses, e.g. (544.079,00)
 */
export function formatRupiah(value: number | string | Decimal | null | undefined): string {
  if (value === null || value === undefined) return '-';
  const dec = new Decimal(value);
  if (dec.isZero()) return '-';

  const isNegative = dec.isNegative();
  const absDec = dec.abs();
  
  // Format with 2 decimals
  const fixed = absDec.toFixed(2);
  const [intPart, decPart] = fixed.split('.');

  // Add thousand separators (.)
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const result = `${formattedInt},${decPart}`;

  return isNegative ? `(${result})` : result;
}

/**
 * Format percentage:
 * - 2 decimals with comma (e.g. 67,37%)
 * - 0 is displayed as '-'
 * - Negative percentage displayed in parentheses, e.g. (53,63)%
 * - If target is 0 or value is null, return '-'
 */
export function formatPersen(value: number | string | Decimal | null | undefined, hasTarget: boolean = true): string {
  if (!hasTarget || value === null || value === undefined) return '-';
  const dec = new Decimal(value);
  if (dec.isZero()) return '-';

  const isNegative = dec.isNegative();
  const absDec = dec.abs();
  const formatted = absDec.toFixed(2).replace('.', ',');
  return isNegative ? `(${formatted}%)` : `${formatted}%`;
}

/**
 * Format numeric percentage column in official table (header already contains (%)):
 * Displays with 2 decimal places: e.g. 67.63, or (53.63) for negative, or '-' when target is 0
 */
export function formatPersenAngka(value: number | string | Decimal | null | undefined, hasTarget: boolean = true): string {
  if (!hasTarget || value === null || value === undefined) return '-';
  const dec = new Decimal(value);
  if (dec.isZero()) return '0.00';

  const isNegative = dec.isNegative();
  const absDec = dec.abs();
  const formatted = absDec.toFixed(2);
  return isNegative ? `(${formatted})` : formatted;
}

/**
 * Derives and ensures is_leaf is 100% consistent with parent_id structure:
 * A node with children is NEVER a leaf.
 * A node without children is ALWAYS a leaf.
 */
export function validateAndNormalizeTree(nodes: UraianNode[]): UraianNode[] {
  const parentIdSet = new Set<string>();
  for (const node of nodes) {
    if (node.parent_id) {
      parentIdSet.add(node.parent_id);
    }
  }

  return nodes.map(node => {
    const hasChildren = parentIdSet.has(node.id);
    const expectedLeaf = !hasChildren;
    return {
      ...node,
      is_leaf: expectedLeaf
    };
  });
}

/**
 * Get all descendant leaf IDs for a given node
 */
export function getDescendantLeafIds(nodeId: string, allNodes: UraianNode[]): string[] {
  const node = allNodes.find(n => n.id === nodeId);
  if (!node) return [];
  if (node.is_leaf) return [node.id];

  const children = allNodes.filter(n => n.parent_id === nodeId);
  const result: string[] = [];
  for (const child of children) {
    result.push(...getDescendantLeafIds(child.id, allNodes));
  }
  return result;
}

/**
 * Parse date parts assuming Jakarta/WIB context
 * e.g., '2026-09-30' -> year: 2026, month: 9, day: 30
 */
export function parseDateParts(dateStr: string) {
  const [yStr, mStr, dStr] = dateStr.split('-');
  return {
    year: parseInt(yStr, 10),
    month: parseInt(mStr, 10),
    day: parseInt(dStr, 10)
  };
}

export const INDONESIAN_MONTHS = [
  'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
  'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
];

export function getIndonesianMonthName(monthNumber: number): string {
  return INDONESIAN_MONTHS[monthNumber - 1] || '';
}

/**
 * Calculate report realization table for a given report date T:
 * - Target: Target of the year
 * - s_d_bulan_lalu: Receipts from 1 Jan to end of previous month
 * - s_d_kemarin: Receipts from 1st of current month to (T - 1). If T is 1st of month, s_d_kemarin = 0!
 * - hari_ini: Receipts strictly on date T
 * - jumlah_s_d_hari_ini: Bulan berjalan (s_d_kemarin + hari_ini)
 * - total_realisasi: s_d_bulan_lalu + s_d_kemarin + hari_ini
 * - Parent values: SUM of descendant leaf values
 * - Parent % and Sisa Target: Recalculated from parent sums!
 */
export function calculateReportData(
  rawNodes: UraianNode[],
  targets: TargetAnggaran[],
  transactions: TransaksiPenerimaan[],
  reportDate: string,
  keteranganMap: Record<string, string> = {}
): {
  rows: CalculatedRow[];
  reportMonthName: string;
  padRow: CalculatedRow | null;
  pajakDaerahRow: CalculatedRow | null;
  cRow: CalculatedRow | null;
} {
  const nodes = validateAndNormalizeTree(rawNodes);
  const { year: reportYear, month: reportMonth, day: reportDay } = parseDateParts(reportDate);
  const reportMonthName = getIndonesianMonthName(reportMonth);

  // Group leaf targets
  const leafTargetMap = new Map<string, Decimal>();
  for (const t of targets) {
    if (t.tahun === reportYear) {
      leafTargetMap.set(t.uraian_id, new Decimal(t.jumlah || 0));
    }
  }

  // Pre-aggregate leaf transactions by time slice
  // s_d_bulan_lalu: date in same year, month < reportMonth
  // s_d_kemarin: date in same year, month === reportMonth, day < reportDay. (if reportDay === 1, this stays 0!)
  // hari_ini: date === reportDate
  const leafBulanLalu = new Map<string, Decimal>();
  const leafKemarin = new Map<string, Decimal>();
  const leafHariIni = new Map<string, Decimal>();

  for (const node of nodes) {
    if (node.is_leaf) {
      leafBulanLalu.set(node.id, new Decimal(0));
      leafKemarin.set(node.id, new Decimal(0));
      leafHariIni.set(node.id, new Decimal(0));
    }
  }

  for (const tx of transactions) {
    const { year: txYear, month: txMonth, day: txDay } = parseDateParts(tx.tanggal);
    if (txYear !== reportYear) continue;

    const txAmount = new Decimal(tx.total || 0);

    if (tx.tanggal === reportDate) {
      const current = leafHariIni.get(tx.uraian_id) || new Decimal(0);
      leafHariIni.set(tx.uraian_id, current.plus(txAmount));
    } else if (txMonth === reportMonth && txDay < reportDay) {
      // Current month up to yesterday (If reportDay === 1, this condition will never match, thus 0)
      const current = leafKemarin.get(tx.uraian_id) || new Decimal(0);
      leafKemarin.set(tx.uraian_id, current.plus(txAmount));
    } else if (txMonth < reportMonth) {
      // Prior months up to last month
      const current = leafBulanLalu.get(tx.uraian_id) || new Decimal(0);
      leafBulanLalu.set(tx.uraian_id, current.plus(txAmount));
    }
  }

  // Compute values for every node in the tree
  const calculatedMap = new Map<string, CalculatedRow>();

  for (const node of nodes) {
    const descendantLeafIds = getDescendantLeafIds(node.id, nodes);

    let targetDec = new Decimal(0);
    let bulanLaluDec = new Decimal(0);
    let kemarinDec = new Decimal(0);
    let hariIniDec = new Decimal(0);

    for (const leafId of descendantLeafIds) {
      targetDec = targetDec.plus(leafTargetMap.get(leafId) || 0);
      bulanLaluDec = bulanLaluDec.plus(leafBulanLalu.get(leafId) || 0);
      kemarinDec = kemarinDec.plus(leafKemarin.get(leafId) || 0);
      hariIniDec = hariIniDec.plus(leafHariIni.get(leafId) || 0);
    }

    const jumlahSdHariIniDec = kemarinDec.plus(hariIniDec);
    const totalRealisasiDec = bulanLaluDec.plus(jumlahSdHariIniDec);
    const sisaTargetDec = targetDec.minus(totalRealisasiDec);

    let persenCapaian = 0;
    let persenSisaTarget = 0;
    if (!targetDec.isZero()) {
      persenCapaian = totalRealisasiDec.dividedBy(targetDec).times(100).toNumber();
      persenSisaTarget = sisaTargetDec.dividedBy(targetDec).times(100).toNumber();
    }

    calculatedMap.set(node.id, {
      uraian: node,
      target: targetDec.toNumber(),
      s_d_bulan_lalu: bulanLaluDec.toNumber(),
      s_d_kemarin: kemarinDec.toNumber(),
      hari_ini: hariIniDec.toNumber(),
      jumlah_s_d_hari_ini: jumlahSdHariIniDec.toNumber(),
      total_realisasi: totalRealisasiDec.toNumber(),
      sisa_target: sisaTargetDec.toNumber(),
      persen_capaian: persenCapaian,
      persen_sisa_target: persenSisaTarget,
      keterangan: keteranganMap[node.id] || '',
      depth: node.level,
      isRootPAD: node.id === 'pad'
    });
  }

  // Order tree according to hierarchy specification:
  // Root 'pad' is at level 0.
  // Children of PAD:
  //   1) 'pajak_daerah'
  //       - 'a_pajak_daerah'
  //           - 'a1_non_pbjt' -> leaves
  //           - 'a2_pbjt' -> leaves
  //       - 'b_opsen_pajak' -> leaves
  //   2) 'c_denda' -> leaves
  // And as instructed in Section D:
  // "Baris Jumlah Pendapatan Asli Daerah ada di PALING BAWAH tabel (bukan di atas), meski secara struktur ia adalah akar pohon."
  
  const orderedRows: CalculatedRow[] = [];

  function traverse(nodeId: string) {
    const nodeRow = calculatedMap.get(nodeId);
    if (!nodeRow) return;

    // Do not push PAD during regular recursive traversal; PAD is placed at the end
    if (nodeId !== 'pad') {
      orderedRows.push(nodeRow);
    }

    const children = nodes
      .filter(n => n.parent_id === nodeId)
      .sort((a, b) => a.urutan - b.urutan);

    for (const child of children) {
      traverse(child.id);
    }
  }

  // Traverse children under PAD first
  const topChildren = nodes
    .filter(n => n.parent_id === 'pad')
    .sort((a, b) => a.urutan - b.urutan);

  for (const child of topChildren) {
    traverse(child.id);
  }

  // Append PAD at the very bottom!
  const padRow = calculatedMap.get('pad') || null;
  if (padRow) {
    orderedRows.push(padRow);
  }

  return {
    rows: orderedRows,
    reportMonthName,
    padRow,
    pajakDaerahRow: calculatedMap.get('pajak_daerah') || null,
    cRow: calculatedMap.get('c_denda') || null
  };
}
