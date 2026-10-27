/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { store } from './services/store';
import { UraianNode, TargetAnggaran, TransaksiPenerimaan, Laporan, AuditLog, UserRole } from './types/pad';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { LaporanView } from './components/LaporanView';
import { InputRealisasiView } from './components/InputRealisasiView';
import { TargetAnggaranView } from './components/TargetAnggaranView';
import { FinalisasiView } from './components/FinalisasiView';
import { DatabaseManagerView } from './components/DatabaseManagerView';
import { Menu } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-30');
  const [currentRole, setCurrentRole] = useState<UserRole>(store.currentRole);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Synced store data in state
  const [nodes, setNodes] = useState<UraianNode[]>([]);
  const [targets, setTargets] = useState<TargetAnggaran[]>([]);
  const [transactions, setTransactions] = useState<TransaksiPenerimaan[]>([]);
  const [laporanList, setLaporanList] = useState<Laporan[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [keteranganMap, setKeteranganMap] = useState<Record<string, string>>({});

  const refreshFromStore = useCallback(() => {
    setNodes([...store.uraian]);
    setTargets([...store.targets]);
    setTransactions([...store.transactions]);
    setLaporanList([...store.laporanList]);
    setAuditLogs([...store.auditLogs]);
    setCurrentRole(store.currentRole);

    // Build keteranganMap from current details
    const ketMap: Record<string, string> = {};
    for (const d of store.laporanDetails) {
      if (d.keterangan) {
        ketMap[d.uraian_id] = d.keterangan;
      }
    }
    setKeteranganMap(ketMap);
  }, []);

  useEffect(() => {
    refreshFromStore();
  }, [refreshFromStore]);

  const handleAddTransaction = (tx: {
    uraian_id: string;
    tanggal: string;
    pokok: number;
    piutang: number;
    keterangan?: string;
  }) => {
    const res = store.addTransaction(tx);
    if (res.success) {
      refreshFromStore();
    }
    return res;
  };

  const handleBulkAddTransactions = (
    tanggal: string,
    items: { uraian_id: string; pokok: number; piutang: number; keterangan?: string }[]
  ) => {
    const res = store.bulkAddTransactions(tanggal, items);
    if (res.success) {
      refreshFromStore();
    }
    return res;
  };

  const handleDeleteTransaction = (id: string) => {
    const res = store.deleteTransaction(id);
    if (res.success) {
      refreshFromStore();
    }
    return res;
  };

  const handleUpdateTransaction = (
    id: string,
    data: {
      uraian_id?: string;
      tanggal?: string;
      pokok: number;
      piutang: number;
      keterangan?: string;
    }
  ) => {
    const res = store.updateTransaction(id, data);
    if (res.success) {
      refreshFromStore();
    }
    return res;
  };

  const handleFinalize = (date: string, catatan?: string) => {
    const res = store.finalizeReport(date, catatan);
    if (res.success) {
      refreshFromStore();
      alert(`Laporan tanggal ${date} berhasil DIFINALISASI & TERKUNCI untuk periode 1 Januari s/d ${date}!`);
    } else {
      alert(`Gagal finalisasi: ${res.error}`);
    }
  };

  const handleUnlock = (laporanId: string, alasan: string) => {
    const res = store.unlockReport(laporanId, alasan);
    if (res.success) {
      refreshFromStore();
      alert('Laporan berhasil DIBUKA KUNCI dan dikembalikan ke status DRAFT untuk revisi.');
    } else {
      alert(`Gagal buka kunci: ${res.error}`);
    }
  };

  const handleSaveKeterangan = (uraianId: string, ket: string) => {
    store.saveKeterangan(uraianId, ket);
    setKeteranganMap(prev => ({ ...prev, [uraianId]: ket }));
  };

  const handleUpdateTarget = (uraianId: string, tahun: number, jumlah: number) => {
    const res = store.updateTarget(uraianId, tahun, jumlah);
    if (res.success) {
      refreshFromStore();
    }
    return res;
  };

  const handleBatchImportTransactions = (
    items: { uraian_id: string; tanggal: string; pokok: number; piutang: number; keterangan?: string }[]
  ) => {
    const res = store.batchImportTransactions(items);
    if (res.success && res.insertedCount > 0) {
      refreshFromStore();
    }
    return res;
  };

  const handleClearAllData = () => {
    store.clearAllData(true);
    refreshFromStore();
  };

  const handleClearTransactionsOnly = () => {
    store.clearTransactionsOnly();
    refreshFromStore();
  };

  const handleResetTargetsToZero = () => {
    store.clearAllData(true);
    refreshFromStore();
  };

  const handleLoadDefaultTargets = () => {
    store.loadDefaultTargets();
    refreshFromStore();
  };

  const handleLoadOctoberDummyData = () => {
    store.loadOctoberDummyData();
    refreshFromStore();
    setSelectedDate('2026-10-14');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileSidebarOpen}
        setMobileOpen={setMobileSidebarOpen}
        onClearAllData={handleClearAllData}
        onLoadOctoberData={handleLoadOctoberDummyData}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar (Visible on mobile & tablet) */}
        <header className="lg:hidden bg-slate-900 border-b border-slate-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label="Buka Menu Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-white">SIP-PAD</span>
              <span 
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border"
                style={{ 
                  color: '#0CBAA4', 
                  backgroundColor: 'rgba(12, 186, 164, 0.12)',
                  borderColor: 'rgba(12, 186, 164, 0.4)'
                }}
              >
                BAPPENDA
              </span>
            </div>
          </div>
        </header>

        {/* Main View Container */}
        <main className="flex-1 pb-16 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              nodes={nodes}
              targets={targets}
              transactions={transactions}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'laporan' && (
            <LaporanView
              nodes={nodes}
              targets={targets}
              transactions={transactions}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              laporanList={laporanList}
              keteranganMap={keteranganMap}
            />
          )}

          {activeTab === 'input' && (
            <InputRealisasiView
              nodes={nodes}
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onBulkAddTransactions={handleBulkAddTransactions}
              onBatchImportTransactions={handleBatchImportTransactions}
              onDeleteTransaction={handleDeleteTransaction}
              onUpdateTransaction={handleUpdateTransaction}
              isDateLocked={date => store.isDateLocked(date)}
              onClearAllTransactions={handleClearTransactionsOnly}
            />
          )}

          {activeTab === 'target' && (
            <TargetAnggaranView
              nodes={nodes}
              targets={targets}
              currentRole={currentRole}
              onUpdateTarget={handleUpdateTarget}
              onResetTargetsToZero={handleResetTargetsToZero}
              onLoadDefaultTargets={handleLoadDefaultTargets}
            />
          )}

          {activeTab === 'finalisasi' && (
            <FinalisasiView
              laporanList={laporanList}
              auditLogs={auditLogs}
              currentRole={currentRole}
              onFinalize={handleFinalize}
              onUnlock={handleUnlock}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
            />
          )}

          {activeTab === 'database' && (
            <DatabaseManagerView />
          )}
        </main>

        {/* Subtle Bottom System Status Footer */}
        <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-3 text-xs print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#0CBAA4' }} />
              <span>Sistem Informasi Realisasi PAD &amp; Pajak Daerah · Bappenda</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
