import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Cpu, 
  Binary, 
  FileCheck2, 
  ArrowRight, 
  Zap, 
  Scale, 
  CheckCircle2, 
  Sparkles,
  BarChart3
} from 'lucide-react';

export default function LandingPage() {
  const architectureLayers = [
    {
      step: '01',
      title: 'Institutional Input & Guardrails',
      description: 'Strict ECOA/FCRA Fair Lending isolation of protected attributes, out-of-distribution anomaly gating, and prompt injection defense on applicant notes.',
      icon: ShieldCheck,
      badge: 'Safety First'
    },
    {
      step: '02',
      title: 'Calibrated ML Risk Estimation',
      description: 'Probability of default (PD) generated via LightGBM and XGBoost, calibrated with CalibratedClassifierCV to minimize Brier scoring error.',
      icon: Cpu,
      badge: 'Calibrated PD'
    },
    {
      step: '03',
      title: 'TreeSHAP & Counterfactual Recourse',
      description: 'Raw margin space TreeSHAP guarantees exact additivity |f(x) - (base + sum(phi))| < 1e-4. Constrained search computes actionable mutable recourse.',
      icon: Binary,
      badge: 'Exact Additivity'
    },
    {
      step: '04',
      title: 'Agentic Underwriting Reasoning',
      description: 'Four-section memo synthesized with deterministic numeric-grounding verification. Every monetary figure is anchored to mathematical ground truth.',
      icon: FileCheck2,
      badge: '100% Grounded'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Bar */}
      <header className="border-b border-slate-800/80 bg-[#0F172A]/40 backdrop-blur-md px-8 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-[2px]">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <span className="font-bold text-xl tracking-tight text-white">CredXAI</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            to="/login"
            className="px-5 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            to="/assess"
            className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/25 transition-all"
          >
            Launch Demo
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 py-16 flex-1 flex flex-col justify-center">
        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>FINAL-YEAR CAPSTONE PROJECT: SHAP-BASED AGENTIC REASONING</span>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight md:leading-[1.15] mb-6"
          >
            AI-Driven Explainable Credit Risk Prediction Using{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-cyan-400 bg-clip-text text-transparent">
              SHAP-Based Agentic Reasoning
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 font-normal max-w-3xl mx-auto mb-10"
          >
            Bridging black-box predictive machine learning and banking regulatory compliance. 
            Delivering mathematically verifiable TreeSHAP local attribution, constrained counterfactual recourse, 
            and 100% numerically grounded underwriting memos.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 text-white font-semibold flex items-center justify-center space-x-2 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] transition-all"
            >
              <span>Explore Interactive Underwriting Demo</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/model-performance"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <span>Model Benchmark & ROC</span>
            </Link>
          </motion.div>
        </div>

        {/* Highlight Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto w-full mb-20">
          {[
            { label: 'Calibrated Champion AUC-ROC', value: '0.8053', sub: 'LightGBM Tree Ensemble' },
            { label: 'TreeSHAP Additivity Leakage', value: '< 1e-4', sub: 'Exact Log-Odds Margin' },
            { label: 'Numeric Grounding Rate', value: '100%', sub: 'Zero Hallucination Guarantee' },
            { label: 'Underwriting Latency', value: '< 45ms', sub: 'Real-Time Inference' }
          ].map((stat, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
              <p className="text-2xl md:text-3xl font-extrabold font-mono text-cyan-400 mb-1">{stat.value}</p>
              <p className="text-sm font-semibold text-slate-200">{stat.label}</p>
              <p className="text-xs text-slate-500">{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* 4-Layer System Architecture Section */}
        <div className="mb-12">
          <div className="text-center mb-12">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-indigo-400">
              System Engineering Architecture
            </span>
            <h2 className="text-2xl md:text-3xl font-bold text-white mt-1">
              End-to-End Governance & Reasoning Pipeline
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {architectureLayers.map((layer, index) => {
              const Icon = layer.icon;
              return (
                <div
                  key={index}
                  className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between relative group"
                >
                  <div className="absolute top-4 right-4 text-[11px] font-mono font-bold text-slate-600 group-hover:text-indigo-400 transition-colors">
                    LAYER {layer.step}
                  </div>
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5 text-indigo-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 mb-3">
                      {layer.badge}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2">{layer.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{layer.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/80 px-8 py-6 text-center text-xs text-slate-500">
        <p>AI-Driven Explainable Credit Risk Prediction Using SHAP-Based Agentic Reasoning &bull; Final Year Capstone Project 2026</p>
      </footer>
    </div>
  );
}
