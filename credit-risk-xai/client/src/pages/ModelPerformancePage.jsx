import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { LineChart as LineChartIcon, Zap, CheckCircle2, Trophy, BarChart2, Cpu } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';

export default function ModelPerformancePage() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ml/metrics')
      .then(res => setMetrics(res.data))
      .catch(err => console.error('Error fetching model performance metrics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading ML Benchmarks & Calibration Curves...</p>
        </div>
      </div>
    );
  }

  // ROC Curve Data
  const rocPoints = metrics?.metrics?.roc_curve || [];
  const rocChartData = {
    labels: rocPoints.map(p => p.fpr),
    datasets: [
      {
        label: 'LightGBM Champion (AUC = 0.8053)',
        data: rocPoints.map(p => p.tpr),
        borderColor: '#6366F1',
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        fill: true,
        tension: 0.2,
        pointRadius: 0
      },
      {
        label: 'Random Guess Baseline (AUC = 0.5000)',
        data: rocPoints.map(p => p.fpr),
        borderColor: '#64748B',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0
      }
    ]
  };

  const rocOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: '#94A3B8', font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => `TPR: ${(ctx.raw * 100).toFixed(1)}%`
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: 'False Positive Rate (1 - Specificity)', color: '#94A3B8' },
        ticks: { color: '#64748B' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        title: { display: true, text: 'True Positive Rate (Sensitivity / Recall)', color: '#94A3B8' },
        ticks: { color: '#64748B' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  // Latency Comparison Bar (TreeSHAP vs LIME)
  const latencyData = {
    labels: ['TreeSHAP (Optimized C++)', 'LIME (Local Perturbation)', 'KernelSHAP (Sampling)'],
    datasets: [
      {
        label: 'Mean Latency per Applicant (ms) [Logarithmic scale]',
        data: [1.2, 185.0, 320.0],
        backgroundColor: ['#10B981', '#F59E0B', '#F43F5E'],
        borderRadius: 6
      }
    ]
  };

  const latencyOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: false }
    },
    scales: {
      x: {
        type: 'logarithmic',
        title: { display: true, text: 'Latency (Milliseconds, Log Scale)', color: '#94A3B8' },
        ticks: { color: '#64748B' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        ticks: { color: '#E2E8F0', font: { size: 11, weight: 'bold' } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  const models = metrics?.metrics?.comparison || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Machine Learning Governance & Benchmark</h1>
        <p className="text-xs text-slate-400 mt-1">
          Model Version: <span className="text-indigo-400 font-mono">{metrics?.model_version}</span> &bull; 
          Probability Calibration: Sigmoid CalibratedClassifierCV (Brier Score: {metrics?.metrics?.calibrated_brier})
        </p>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center space-x-2 mb-4">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Candidate Model Comparison Matrix</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3 px-4">Architecture</th>
                <th className="py-3 px-4">AUC-ROC</th>
                <th className="py-3 px-4">F1-Score</th>
                <th className="py-3 px-4">Brier Score Loss</th>
                <th className="py-3 px-4">Training Time</th>
                <th className="py-3 px-4">Champion Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {models.map((m, idx) => {
                const isChampion = m.model.includes('Champion');
                return (
                  <tr key={idx} className={isChampion ? 'bg-indigo-500/10 font-semibold' : 'hover:bg-slate-800/30'}>
                    <td className="py-3 px-4 text-white flex items-center space-x-2">
                      <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{m.model}</span>
                    </td>
                    <td className="py-3 px-4 text-cyan-400 font-bold">{m.auc}</td>
                    <td className="py-3 px-4 text-slate-200">{m.f1}</td>
                    <td className="py-3 px-4 text-slate-200">{m.brier}</td>
                    <td className="py-3 px-4 text-slate-400">{m.train_time_sec}s</td>
                    <td className="py-3 px-4">
                      {isChampion ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          PROD CHAMPION
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Benchmark Baseline</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ROC Curve + Latency Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ROC Curve */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">Receiver Operating Characteristic (ROC)</h2>
            <p className="text-xs text-slate-400">Tradeoff between Sensitivity (TPR) and Specificity (FPR)</p>
          </div>
          <div className="h-72">
            <Line data={rocChartData} options={rocOptions} />
          </div>
        </div>

        {/* Explainability Latency Benchmark: TreeSHAP vs LIME */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-white">XAI Explainer Computational Latency Benchmark</h2>
            <p className="text-xs text-slate-400">TreeSHAP exact polynomial-time O(TLD^2) vs LIME / KernelSHAP exponential sampling</p>
          </div>
          <div className="h-72">
            <Bar data={latencyData} options={latencyOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
