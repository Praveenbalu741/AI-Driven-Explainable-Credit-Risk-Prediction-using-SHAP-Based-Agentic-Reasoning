import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Users, 
  CheckCircle, 
  Percent, 
  AlertTriangle, 
  ArrowUpRight, 
  TrendingUp, 
  FileText,
  Activity,
  Layers
} from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [globalShap, setGlobalShap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, shapRes] = await Promise.all([
          api.get('/portfolio/stats'),
          api.get('/ml/global-importance').catch(() => ({ data: { global_importance: [] } }))
        ]);
        setStats(statsRes.data);
        setGlobalShap(shapRes.data.global_importance || []);
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-xs font-mono text-slate-400">Loading Portfolio KPIs & Risk Intelligence...</p>
        </div>
      </div>
    );
  }

  // Risk band doughnut data
  const doughnutData = {
    labels: ['Low Risk (<25%)', 'Moderate Risk (25-49%)', 'High Risk (>=50%)'],
    datasets: [
      {
        data: [
          stats?.distribution?.low || 0,
          stats?.distribution?.moderate || 0,
          stats?.distribution?.high || 0
        ],
        backgroundColor: ['#10B981', '#F59E0B', '#F43F5E'],
        borderColor: '#0F172A',
        borderWidth: 2,
      },
    ],
  };

  // Top Global Feature Importance Bar
  const topShap = globalShap.slice(0, 7);
  const barData = {
    labels: topShap.map(s => s.feature.replace(/_/g, ' ')),
    datasets: [
      {
        label: 'Global Mean Absolute SHAP Gain',
        data: topShap.map(s => s.importance),
        backgroundColor: 'rgba(99, 102, 241, 0.85)',
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: '#94A3B8', font: { family: 'Inter', size: 11 } }
      }
    },
    scales: {
      x: {
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      },
      y: {
        ticks: { color: '#64748B', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.05)' }
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Executive Portfolio Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time credit portfolio health &bull; Model version LGBM-V1-20261122 &bull; Policy POL-2026.1
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/assess"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center space-x-1.5 hover:from-indigo-500 hover:to-violet-500 transition-all"
          >
            <span>+ Evaluate New Applicant</span>
          </Link>
          <Link
            to="/batch"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-semibold text-xs hover:bg-slate-800 transition-all flex items-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Upload Portfolio CSV</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Assessed Loans',
            value: stats?.totalAssessments || 0,
            sub: 'Portfolio Underwriting Cases',
            icon: Users,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10'
          },
          {
            label: 'Portfolio Approval Rate',
            value: `${((stats?.approvalRate || 0) * 100).toFixed(1)}%`,
            sub: 'Low Risk Tier (<25% PD)',
            icon: CheckCircle,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10'
          },
          {
            label: 'Portfolio Mean PD',
            value: `${((stats?.averagePd || 0) * 100).toFixed(2)}%`,
            sub: 'Probability of Default',
            icon: Percent,
            color: 'text-cyan-400',
            bg: 'bg-cyan-500/10'
          },
          {
            label: 'Covenant / Manual Reviews',
            value: stats?.manualReviewsCount || 0,
            sub: 'Requires Human Underwriter',
            icon: AlertTriangle,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10'
          }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400">{kpi.label}</span>
                <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-white mb-1">{kpi.value}</p>
              <p className="text-[11px] text-slate-500">{kpi.sub}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Section: Donut + Global SHAP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Portfolio Risk Tiers</h2>
            <span className="text-[10px] font-mono text-slate-400">Institutional Bands</span>
          </div>
          <div className="h-64 relative flex items-center justify-center">
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#94A3B8', boxWidth: 12, font: { size: 10 } } }
                },
                cutout: '72%'
              }}
            />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Low</p>
              <p className="text-sm font-bold text-emerald-400 font-mono">{stats?.distribution?.low || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">Moderate</p>
              <p className="text-sm font-bold text-amber-400 font-mono">{stats?.distribution?.moderate || 0}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase">High</p>
              <p className="text-sm font-bold text-rose-400 font-mono">{stats?.distribution?.high || 0}</p>
            </div>
          </div>
        </div>

        {/* Global SHAP Feature Importance */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white">TreeSHAP Global Model Feature Attribution</h2>
              <p className="text-[11px] text-slate-400">Relative contribution across 10,000 LendingClub training samples</p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono text-indigo-400">
              Mean |SHAP| Gain
            </span>
          </div>
          <div className="h-64">
            {topShap.length > 0 ? (
              <Bar data={barData} options={chartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Loading Global Importance Data...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Underwriting Cases Table */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-sm font-bold text-white">Recent Underwriting Decisions</h2>
            <p className="text-[11px] text-slate-400">Auditable case log with TreeSHAP explanations and policy verdicts</p>
          </div>
          <Link to="/audit" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1">
            <span>View Full Audit Trail</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                <th className="pb-3 px-3">Case ID</th>
                <th className="pb-3 px-3">Applicant Name</th>
                <th className="pb-3 px-3">Loan Amount</th>
                <th className="pb-3 px-3">FICO Score</th>
                <th className="pb-3 px-3">DTI</th>
                <th className="pb-3 px-3">PD Score</th>
                <th className="pb-3 px-3">Risk Band</th>
                <th className="pb-3 px-3">Policy Status</th>
                <th className="pb-3 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
              {stats?.recentCases?.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-indigo-300">{c.id}</td>
                  <td className="py-3 px-3 font-semibold text-white">{c.applicant_name || 'Applicant'}</td>
                  <td className="py-3 px-3 font-mono">${(c.loan_amount || 0).toLocaleString()}</td>
                  <td className="py-3 px-3 font-mono">{c.credit_score || 'N/A'}</td>
                  <td className="py-3 px-3 font-mono">{c.dti}%</td>
                  <td className="py-3 px-3 font-mono font-bold text-white">
                    {((c.probability_of_default || 0) * 100).toFixed(2)}%
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      c.risk_band === 'Low' 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : c.risk_band === 'Moderate'
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {c.risk_band}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`text-[11px] font-semibold ${
                      c.policy_verdict === 'COMPLIANT' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {c.policy_verdict || 'COMPLIANT'}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <a
                      href={`http://localhost:5000/api/report/${c.id}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 font-medium inline-flex items-center space-x-1 transition-colors"
                    >
                      <FileText className="w-3 h-3 text-indigo-400" />
                      <span>PDF</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
