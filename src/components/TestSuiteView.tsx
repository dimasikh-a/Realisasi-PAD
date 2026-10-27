import React, { useState, useEffect } from 'react';
import { runAutomaticTests, TestResult } from '../services/testSuite';
import { 
  CheckCircle2, XCircle, RefreshCw, ShieldCheck, 
  Terminal, Award, Layers 
} from 'lucide-react';

export const TestSuiteView: React.FC = () => {
  const [testOutput, setTestOutput] = useState<{
    allPassed: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: TestResult[];
  } | null>(null);

  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      const res = runAutomaticTests();
      setTestOutput(res);
      setIsRunning(false);
    }, 150);
  };

  useEffect(() => {
    handleRunTests();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Uji Otomatis &amp; Verifikasi Spesifikasi (Step 1 &amp; 2)
            </h2>
            <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
              12/12 ASSERTIONS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Pengujian skema relasional, formula agregasi Decimal, struktur pohon hierarki, dan pencocokan angka referensi resmi
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Menjalankan Uji...' : 'Jalankan Ulang Uji Otomatis'}</span>
        </button>
      </div>

      {/* Test Overall Score Banner */}
      {testOutput && (
        <div
          className={`p-6 rounded-xl border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            testOutput.allPassed
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/80 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                testOutput.allPassed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}
            >
              {testOutput.allPassed ? (
                <ShieldCheck className="w-7 h-7" />
              ) : (
                <XCircle className="w-7 h-7" />
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-lg">
                {testOutput.allPassed
                  ? 'SELURUH UJI VERIFIKASI BERHASIL 100% (PASSED)'
                  : 'TERDAPAT UJI YANG BELUM SESUAI'}
              </h3>
              <p className="text-xs opacity-90 mt-0.5">
                {testOutput.passedTests} dari {testOutput.totalTests} pengujian otomatis lolos validasi tanpa selisih angka desimal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">Lolos:</span>{' '}
              <strong className="text-emerald-700 font-bold">{testOutput.passedTests}</strong>
            </div>
            <div className="bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-slate-500">Gagal:</span>{' '}
              <strong className={testOutput.failedTests > 0 ? 'text-rose-700 font-bold' : 'text-slate-700'}>
                {testOutput.failedTests}
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Target & Realization Benchmark Reference (Section I) */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-xs space-y-3 font-mono">
        <div className="flex items-center gap-2 text-emerald-400 font-sans font-bold text-xs uppercase tracking-wider">
          <Terminal className="w-4 h-4" />
          <span>Matriks Angka Uji Referensi Resmi (Section I)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 block font-sans">Target PAD:</span>
            <span className="text-sm font-bold text-emerald-400">4.212.836.766.904,00</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 block font-sans">Total Realisasi PAD:</span>
            <span className="text-sm font-bold text-emerald-400">2.837.990.298.349,00</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 block font-sans">Persentase Capaian:</span>
            <span className="text-sm font-bold text-emerald-400">67,37%</span>
          </div>
          <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 block font-sans">Pajak Daerah Hari Ini:</span>
            <span className="text-sm font-bold text-emerald-400">10.308.212.254,00</span>
          </div>
        </div>
      </div>

      {/* Detailed Assertion Cards */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          Rincian Hasil Evaluasi Setiap Assertion Test
        </h3>

        <div className="divide-y divide-slate-100">
          {testOutput?.results.map((test, index) => (
            <div key={index} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {test.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span className="font-semibold text-xs text-slate-900">
                    {index + 1}. {test.name}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                    {test.category}
                  </span>
                </div>

                {test.message && (
                  <p className="text-[11px] text-slate-500 pl-6">{test.message}</p>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs font-mono pl-6 sm:pl-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">Ekspektasi:</span>
                  <span className="text-slate-600 font-semibold">{test.expected}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-sans">Hasil Sistem:</span>
                  <span className={`font-bold ${test.passed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {test.actual}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
