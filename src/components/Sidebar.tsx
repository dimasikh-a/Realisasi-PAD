import React, { useState } from 'react';
import { 
  Building2, FileSpreadsheet, BarChart3, 
  Edit3, Target, Lock, X, ChevronRight,
  Trash2, AlertTriangle, Database
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onClearAllData?: () => void;
  onLoadOctoberData?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
  onClearAllData,
  onLoadOctoberData
}) => {
  const [showResetModal, setShowResetModal] = useState(false);
  const navItems: Array<{
    id: string;
    label: string;
    desc: string;
    icon: React.ElementType;
    badge?: string;
  }> = [
    { 
      id: 'dashboard', 
      label: 'Dashboard Eksekutif', 
      desc: 'Ringkasan & KPI Penerimaan',
      icon: BarChart3 
    },
    { 
      id: 'laporan', 
      label: 'Laporan Realisasi PAD', 
      desc: 'Tabel Resmi Format Bappenda',
      icon: FileSpreadsheet 
    },
    { 
      id: 'input', 
      label: 'Input Realisasi Harian', 
      desc: 'Pokok, Piutang & Input Massal',
      icon: Edit3 
    },
    { 
      id: 'target', 
      label: 'Target & Import APBD', 
      desc: 'Kelola & Import Excel APBD',
      icon: Target 
    },
    { 
      id: 'finalisasi', 
      label: 'Penguncian & Finalisasi', 
      desc: 'Kunci Periode & Revisi Laporan',
      icon: Lock 
    }
  ];

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-900 border-r border-slate-800 text-white flex flex-col justify-between transition-transform duration-300 ease-in-out shrink-0 print:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Branding & Close button */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-950 shadow-md shadow-[#0CBAA4]/20 font-bold"
              style={{ backgroundColor: '#0CBAA4' }}
            >
              <Building2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white">
                  SIP-PAD
                </span>
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
              <p className="text-[11px] text-slate-400 truncate max-w-[170px]">
                Laporan Realisasi 
              </p>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Middle Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 scrollbar-thin">
          <div className="px-3 pb-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Menu Utama
          </div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all group ${
                  isActive
                    ? 'text-slate-950 font-bold shadow-md shadow-[#0CBAA4]/20'
                    : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                }`}
                style={isActive ? { backgroundColor: '#0CBAA4' } : undefined}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-slate-800 text-slate-400 group-hover:text-[#0CBAA4] group-hover:bg-[#0CBAA4]/15'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate leading-tight">
                      {item.label}
                    </div>
                    <div
                      className={`text-[10px] truncate ${
                        isActive ? 'text-slate-950/80 font-medium' : 'text-slate-500'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>

                {item.badge ? (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 rounded font-bold shrink-0 border"
                    style={
                      isActive
                        ? {
                            backgroundColor: 'rgba(2, 6, 23, 0.25)',
                            color: '#020617',
                            borderColor: 'rgba(2, 6, 23, 0.2)'
                          }
                        : {
                            backgroundColor: 'rgba(12, 186, 164, 0.15)',
                            color: '#0CBAA4',
                            borderColor: 'rgba(12, 186, 164, 0.4)'
                          }
                    }
                  >
                    {item.badge}
                  </span>
                ) : (
                  <ChevronRight
                    className={`w-3.5 h-3.5 shrink-0 transition-opacity ${
                      isActive ? 'opacity-100 text-slate-950' : 'opacity-0 group-hover:opacity-100 text-slate-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Actions: Load Data & Clear Data */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          {onLoadOctoberData && (
            <button
              type="button"
              onClick={onLoadOctoberData}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 text-xs font-semibold transition-colors group"
              title="Muat data dummy tanggal 10, 11, 12, 13, 14 Oktober 2026"
            >
              <Database className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Muat Dummy Okt 10-14</span>
            </button>
          )}

          {onClearAllData && (
            <button
              type="button"
              onClick={() => setShowResetModal(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 text-xs font-semibold transition-colors group"
              title="Kosongkan seluruh data transaksi dan target"
            >
              <Trash2 className="w-4 h-4 text-rose-500 group-hover:text-rose-400" />
              <span>Kosongkan Semua Data</span>
            </button>
          )}
        </div>
      </aside>

      {/* Confirmation Modal: Reset All Data */}
      {showResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 sm:p-6 space-y-4 text-slate-800">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Kosongkan Semua Data?
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Seluruh catatan transaksi penerimaan, draf laporan, dan nilai target APBD akan dihapus / disetel ke <strong>0</strong> sehingga Anda dapat menginput data secara mandiri dari awal.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onClearAllData) {
                      onClearAllData();
                    }
                    setShowResetModal(false);
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Ya, Kosongkan Semua Data</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
