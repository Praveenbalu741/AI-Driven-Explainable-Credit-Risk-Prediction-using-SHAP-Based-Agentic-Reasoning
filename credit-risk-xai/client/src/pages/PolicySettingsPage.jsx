import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Sliders, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PolicySettingsPage() {
  const [settings, setSettings] = useState({
    dti_cap: 43.0,
    min_credit_score: 600,
    max_delinquencies: 1,
    max_loan_to_income: 0.50,
    max_utilization: 80.0,
    max_inquiries: 3
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/policy')
      .then(res => setSettings(res.data))
      .catch(err => console.error('Error fetching policy settings:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaved(false);
    setError('');

    try {
      const res = await api.put('/policy', settings);
      setSettings(res.data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update policy covenants.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">Institutional Underwriting Policy Covenants</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure rule-based covenant caps &bull; Changes immediately affect rule evaluations and audit logs
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Policy parameter covenants updated and logged into immutable audit trail.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSave} className="p-8 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              POL-DTI-01: Maximum Debt-to-Income Cap (%)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Standard Qualified Mortgage (QM) regulatory threshold</p>
            <input
              type="number"
              name="dti_cap"
              value={settings.dti_cap}
              onChange={handleChange}
              step="0.5"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              POL-CS-02: Minimum FICO Credit Score Floor
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Applicants below this score trigger mandatory adverse action or manual review</p>
            <input
              type="number"
              name="min_credit_score"
              value={settings.min_credit_score}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              POL-DELINQ-03: Max 24-Month Delinquencies
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Tolerance limit for recent 30+ day payment defaults</p>
            <input
              type="number"
              name="max_delinquencies"
              value={settings.max_delinquencies}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              POL-LTI-04: Max Loan-to-Income Exposure Ratio
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Principal amount as proportion of gross income</p>
            <input
              type="number"
              name="max_loan_to_income"
              value={settings.max_loan_to_income}
              onChange={handleChange}
              step="0.05"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              POL-UTIL-05: Max Revolving Utilization (%)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Credit card balance utilization ceiling</p>
            <input
              type="number"
              name="max_utilization"
              value={settings.max_utilization}
              onChange={handleChange}
              step="1"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1">
              POL-INQ-06: Velocity of Inquiries (Past 6 Months)
            </label>
            <p className="text-[11px] text-slate-500 mb-2">Credit seeking velocity ceiling</p>
            <input
              type="number"
              name="max_inquiries"
              value={settings.max_inquiries}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center space-x-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Save & Log Policy Threshold Modifications</span>
        </button>
      </form>
    </div>
  );
}
