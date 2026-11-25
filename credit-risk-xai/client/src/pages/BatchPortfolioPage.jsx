import React, { useState } from 'react';
import api from '../services/api';
import { UploadCloud, Layers, AlertCircle, CheckCircle2, Filter, FileSpreadsheet, Download } from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';

export default function BatchPortfolioPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [batchResults, setBatchResults] = useState(null);
  const [error, setError] = useState('');
  const [filterBand, setFilterBand] = useState('ALL');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBatchResults(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process portfolio CSV.');
    } finally {
      setUploading(false);
    }
  };

  const loadBenchmarkSample = async () => {
    try {
      setUploading(true);
      setError('');
      // Use standard CSV test payload
      const response = await fetch('/sample_batch_applicants.csv');
      const blob = await response.blob();
      const mockFile = new File([blob], 'german_credit_benchmark_sample.csv', { type: 'text/csv' });
      
      const formData = new FormData();
      formData.append('file', mockFile);
      const res = await api.post('/batch', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setBatchResults(res.data);
    } catch (err) {
      setError('Unable to load sample batch.');
    } finally {
      setUploading(false);
    }
  };

  const filteredRecords = batchResults?.records?.filter(r => {
    if (filterBand === 'ALL') return true;
    return r.risk_band === filterBand;
  }) || [];

  const doughnutData = batchResults ? {
    labels: ['Low Risk', 'Moderate Risk', 'High Risk'],
    datasets: [
      {
        data: [
          batchResults.distribution.Low,
          batchResults.distribution.Moderate,
          batchResults.distribution.High
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#F43F5E'],
        borderColor: '#0F172A',
        borderWidth: 2
      }
    ]
  } : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Batch Portfolio Underwriting</h1>
        <p className="text-xs text-slate-400 mt-1">
          High-throughput portfolio risk scoring &bull; Up to 10,000 applicants &bull; Real-time risk distribution
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Upload Box */}
      <div className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <form onSubmit={handleUpload} className="max-w-2xl mx-auto flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
            <UploadCloud className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-white mb-1">Upload Portfolio Loan Application File (CSV)</h2>
          <p className="text-xs text-slate-400 mb-6">
            CSV must contain standard columns: annual_income, loan_amount, term_months, credit_score, dti, etc.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
            <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center space-x-2">
              <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
              <span>{file ? file.name : 'Choose CSV File'}</span>
              <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
            </label>

            <button
              type="submit"
              disabled={!file || uploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
            >
              {uploading ? 'Scoring Portfolio Pipeline...' : 'Process Portfolio Batch'}
            </button>
          </div>
        </form>
      </div>

      {/* Batch Analytics & Results Table */}
      {batchResults && (
        <div className="space-y-6">
          {/* KPI Summary Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-xs text-slate-400">Total Scored Records</span>
              <p className="text-2xl font-extrabold font-mono text-white mt-1">{batchResults.total_records}</p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-xs text-slate-400">Approval Rate (&lt;25% PD)</span>
              <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                {(batchResults.approval_rate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-xs text-slate-400">Portfolio Mean PD</span>
              <p className="text-2xl font-extrabold font-mono text-cyan-400 mt-1">
                {(batchResults.average_pd * 100).toFixed(2)}%
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80">
              <span className="text-xs text-slate-400">Model Artifact Version</span>
              <p className="text-xs font-mono font-bold text-indigo-300 mt-2">{batchResults.model_version}</p>
            </div>
          </div>

          {/* Table with Risk Filter */}
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-sm font-bold text-white">Batch Results Roster</h2>
                <p className="text-xs text-slate-400">Showing {filteredRecords.length} of {batchResults.total_records} scored loans</p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                {['ALL', 'Low', 'Moderate', 'High'].map((band) => (
                  <button
                    key={band}
                    type="button"
                    onClick={() => setFilterBand(band)}
                    className={`px-3 py-1 rounded-md font-semibold transition-all ${
                      filterBand === band ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {band === 'ALL' ? 'All Tiers' : band}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 font-mono text-slate-400">
                  <tr>
                    <th className="py-2.5 px-3">Applicant ID</th>
                    <th className="py-2.5 px-3">Credit Score</th>
                    <th className="py-2.5 px-3">Annual Income</th>
                    <th className="py-2.5 px-3">Loan Amount</th>
                    <th className="py-2.5 px-3">DTI</th>
                    <th className="py-2.5 px-3">Probability of Default</th>
                    <th className="py-2.5 px-3">Risk Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredRecords.slice(0, 150).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 text-indigo-300">{r.applicant_id}</td>
                      <td className="py-2 px-3 text-white">{r.credit_score}</td>
                      <td className="py-2 px-3">${r.annual_income?.toLocaleString()}</td>
                      <td className="py-2 px-3">${r.loan_amount?.toLocaleString()}</td>
                      <td className="py-2 px-3">{r.dti}%</td>
                      <td className="py-2 px-3 font-bold text-white">{r.pd_percentage}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.risk_band === 'Low' 
                            ? 'bg-emerald-500/10 text-emerald-400' 
                            : r.risk_band === 'Moderate'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {r.risk_band}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
