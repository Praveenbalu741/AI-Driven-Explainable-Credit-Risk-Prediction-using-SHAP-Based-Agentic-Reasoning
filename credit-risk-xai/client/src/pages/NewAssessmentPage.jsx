import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  FilePlus2, 
  Sparkles, 
  AlertCircle, 
  ShieldCheck, 
  ArrowRight, 
  HelpCircle,
  Building,
  DollarSign,
  Percent,
  Clock,
  UserCheck
} from 'lucide-react';

export default function NewAssessmentPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    applicant_name: 'Jonathan Reynolds',
    annual_income: 82000,
    loan_amount: 15000,
    term_months: 36,
    interest_rate: 9.8,
    dti: 16.5,
    revolving_utilization: 24.0,
    credit_score: 735,
    credit_history_years: 12.5,
    open_credit_lines: 12,
    delinquencies_2yrs: 0,
    recent_inquiries: 0,
    employment_years: 6.0,
    home_ownership: 'MORTGAGE',
    notes: 'Senior Software Engineer applying for energy-efficiency solar installation loan.'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: ['applicant_name', 'home_ownership', 'notes'].includes(name) 
        ? value 
        : (name === 'term_months' || name === 'credit_score' || name === 'open_credit_lines' || name === 'delinquencies_2yrs' || name === 'recent_inquiries'
            ? parseInt(value, 10) || 0
            : parseFloat(value) || 0)
    }));
  };

  // Sample applicant presets for quick viva demonstration
  const loadPreset = (type) => {
    if (type === 'LOW') {
      setFormData({
        applicant_name: 'Catherine Vance (Prime Tier)',
        annual_income: 115000,
        loan_amount: 18000,
        term_months: 36,
        interest_rate: 7.2,
        dti: 12.0,
        revolving_utilization: 15.0,
        credit_score: 785,
        credit_history_years: 15.0,
        open_credit_lines: 14,
        delinquencies_2yrs: 0,
        recent_inquiries: 0,
        employment_years: 8.0,
        home_ownership: 'MORTGAGE',
        notes: 'Corporate director, prime credit history, pristine repayment track record.'
      });
    } else if (type === 'MODERATE') {
      setFormData({
        applicant_name: 'Marcus Bell (Near-Prime Tier)',
        annual_income: 54000,
        loan_amount: 16000,
        term_months: 60,
        interest_rate: 15.5,
        dti: 36.5,
        revolving_utilization: 62.0,
        credit_score: 642,
        credit_history_years: 7.0,
        open_credit_lines: 9,
        delinquencies_2yrs: 1,
        recent_inquiries: 2,
        employment_years: 3.5,
        home_ownership: 'RENT',
        notes: 'Small business logistics manager. Moderate utilization due to recent vehicle repair.'
      });
    } else if (type === 'HIGH') {
      setFormData({
        applicant_name: 'Derek Thornton (Subprime Distress)',
        annual_income: 34000,
        loan_amount: 24000,
        term_months: 60,
        interest_rate: 26.0,
        dti: 51.0,
        revolving_utilization: 88.0,
        credit_score: 550,
        credit_history_years: 3.0,
        open_credit_lines: 16,
        delinquencies_2yrs: 3,
        recent_inquiries: 4,
        employment_years: 1.0,
        home_ownership: 'RENT',
        notes: 'High debt leverage with multiple credit card accounts near max limit.'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/assess', formData);
      navigate(`/result/${res.data.id}`, { state: { caseData: res.data } });
    } catch (err) {
      setError(err.response?.data?.error || 'Assessment failed. Verify ML service is operational.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">New Credit Risk Assessment</h1>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end evaluation: Guardrails &bull; LightGBM Model &bull; TreeSHAP Local &bull; Policy &bull; Agentic Memo
          </p>
        </div>

        {/* Quick Fill Preset Buttons */}
        <div className="flex items-center space-x-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
          <span className="text-[10px] font-mono font-semibold text-slate-400 px-2 uppercase">Viva Demo Presets:</span>
          <button
            type="button"
            onClick={() => loadPreset('LOW')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
          >
            Low Risk
          </button>
          <button
            type="button"
            onClick={() => loadPreset('MODERATE')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition-all"
          >
            Moderate Risk
          </button>
          <button
            type="button"
            onClick={() => loadPreset('HIGH')}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition-all"
          >
            High Risk
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Applicant & Loan Exposure */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <Building className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">1. Applicant & Requested Loan Exposure</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Applicant Name / Identifier</label>
              <input
                type="text"
                name="applicant_name"
                value={formData.applicant_name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Annual Gross Income ($)</label>
              <input
                type="number"
                name="annual_income"
                value={formData.annual_income}
                onChange={handleChange}
                min="1000"
                step="500"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Requested Loan Amount ($)</label>
              <input
                type="number"
                name="loan_amount"
                value={formData.loan_amount}
                onChange={handleChange}
                min="500"
                step="500"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Loan Term (Months)</label>
              <select
                name="term_months"
                value={formData.term_months}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value={36}>36 Months (3 Years)</option>
                <option value={60}>60 Months (5 Years)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                name="interest_rate"
                value={formData.interest_rate}
                onChange={handleChange}
                min="1.0"
                max="40.0"
                step="0.1"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Residential Status</label>
              <select
                name="home_ownership"
                value={formData.home_ownership}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="MORTGAGE">Mortgage</option>
                <option value="RENT">Rent</option>
                <option value="OWN">Own (Full Equity)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Credit Profile & Solvency Metrics */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">2. Solvency & Credit Bureau History</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">FICO Credit Score</label>
                <span className="text-xs font-mono font-bold text-cyan-400">{formData.credit_score}</span>
              </div>
              <input
                type="range"
                name="credit_score"
                value={formData.credit_score}
                onChange={handleChange}
                min="450"
                max="850"
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Debt-to-Income (DTI %)</label>
                <span className="text-xs font-mono font-bold text-cyan-400">{formData.dti}%</span>
              </div>
              <input
                type="range"
                name="dti"
                value={formData.dti}
                onChange={handleChange}
                min="2.0"
                max="65.0"
                step="0.5"
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">Revolving Line Utilization (%)</label>
                <span className="text-xs font-mono font-bold text-cyan-400">{formData.revolving_utilization}%</span>
              </div>
              <input
                type="range"
                name="revolving_utilization"
                value={formData.revolving_utilization}
                onChange={handleChange}
                min="1.0"
                max="100.0"
                step="1.0"
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Credit History (Years)</label>
              <input
                type="number"
                name="credit_history_years"
                value={formData.credit_history_years}
                onChange={handleChange}
                min="0.5"
                step="0.5"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Open Credit Lines</label>
              <input
                type="number"
                name="open_credit_lines"
                value={formData.open_credit_lines}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Delinquencies (Past 2 Yrs)</label>
              <input
                type="number"
                name="delinquencies_2yrs"
                value={formData.delinquencies_2yrs}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Recent Inquiries (6 Mo)</label>
              <input
                type="number"
                name="recent_inquiries"
                value={formData.recent_inquiries}
                onChange={handleChange}
                min="0"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Qualitative Underwriter Notes & Guardrails */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">3. Qualitative Loan Notes & PII Sanitizer</h2>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Prompt Injection & PII Guardrails Active
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Free-text notes will be scanned for SSN/PII masking and screened against adversarial prompt injections before passing to the reasoning engine.
          </p>

          <textarea
            rows={3}
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Enter underwriting notes (e.g. employment stability remarks, collateral details)..."
            className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              <span>Executing TreeSHAP & Grounded Reasoning Pipeline...</span>
            </div>
          ) : (
            <>
              <span>Execute Risk Assessment & SHAP Explanation</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
