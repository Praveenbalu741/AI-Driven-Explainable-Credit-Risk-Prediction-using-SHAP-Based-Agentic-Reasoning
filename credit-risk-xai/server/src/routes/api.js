const express = require('express');
const router = express.Router();
const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fileStore = require('../models/fileStore');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { buildComplianceReportPDF } = require('../pdf/reportBuilder');

const upload = multer({ storage: multer.memoryStorage() });
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// POST /api/assess - Conduct full risk assessment via ML service
router.post('/assess', authenticateToken, async (req, res) => {
  try {
    const applicantData = req.body;
    
    // Call Python ML Microservice
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/assess`, applicantData, { timeout: 15000 });
    const assessment = mlResponse.data;

    // Create case entity
    const caseId = `CASE-${Date.now().toString().slice(-6)}`;
    const caseRecord = {
      id: caseId,
      ...applicantData,
      probability_of_default: assessment.probability_of_default,
      pd_percentage: assessment.pd_percentage,
      risk_band: assessment.risk_band,
      guardrails: assessment.guardrails,
      shap_explanation: assessment.shap_explanation,
      policy: assessment.policy,
      counterfactual: assessment.counterfactual,
      underwriting_memo: assessment.underwriting_memo,
      modelVersion: assessment.model_version,
      policyVersion: assessment.policy.policy_version,
      assessedBy: req.user.email,
      latency_ms: assessment.latency_ms,
      createdAt: new Date().toISOString()
    };

    // Store in audit and case store
    fileStore.saveCase(caseRecord);
    fileStore.logAudit({
      action: 'RISK_ASSESSMENT_COMPLETED',
      caseId: caseId,
      details: `Applicant evaluated with PD: ${assessment.pd_percentage} (${assessment.risk_band} Risk). Policy verdict: ${assessment.policy.verdict}.`,
      user: req.user.email,
      modelVersion: assessment.model_version,
      policyVersion: assessment.policy.policy_version
    });

    res.json(caseRecord);
  } catch (err) {
    const errMsg = err.response ? JSON.stringify(err.response.data) : err.message;
    res.status(500).json({ error: `ML Service Error: ${errMsg}` });
  }
});

// GET /api/cases - List stored cases
router.get('/cases', authenticateToken, (req, res) => {
  const cases = fileStore.getCases(100);
  res.json(cases);
});

// GET /api/cases/:id - Retrieve specific case
router.get('/cases/:id', authenticateToken, (req, res) => {
  const caseItem = fileStore.getCaseById(req.params.id);
  if (!caseItem) return res.status(404).json({ error: 'Case not found' });
  res.json(caseItem);
});

// POST /api/counterfactual/simulate - Live What-If interactive simulator
router.post('/counterfactual/simulate', authenticateToken, async (req, res) => {
  try {
    const applicantData = req.body;
    const mlResponse = await axios.post(`${ML_SERVICE_URL}/counterfactual`, applicantData, { timeout: 10000 });
    res.json(mlResponse.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/batch - Batch CSV upload and scoring
router.post('/batch', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'CSV file required' });
    }

    const form = new FormData();
    form.append('file', req.file.buffer, { filename: req.file.originalname });

    const mlResponse = await axios.post(`${ML_SERVICE_URL}/batch`, form, {
      headers: form.getHeaders(),
      timeout: 30000
    });

    fileStore.logAudit({
      action: 'BATCH_PORTFOLIO_SCORING',
      details: `Batch evaluated ${mlResponse.data.total_records} records. Portfolio avg PD: ${(mlResponse.data.average_pd * 100).toFixed(2)}%.`,
      user: req.user.email,
      modelVersion: mlResponse.data.model_version,
      policyVersion: 'POL-2026.1'
    });

    res.json(mlResponse.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/portfolio/stats - Dashboard KPI metrics
router.get('/portfolio/stats', authenticateToken, (req, res) => {
  const cases = fileStore.getCases(200);
  const total = cases.length;
  
  let lowCount = 0;
  let modCount = 0;
  let highCount = 0;
  let totalPd = 0;
  let manualReviews = 0;

  cases.forEach(c => {
    const pd = c.probability_of_default || 0;
    totalPd += pd;
    if (c.risk_band === 'Low') lowCount++;
    else if (c.risk_band === 'Moderate') modCount++;
    else highCount++;

    if (c.policy_verdict === 'MANUAL_REVIEW' || (c.guardrails && c.guardrails.requires_manual_review)) {
      manualReviews++;
    }
  });

  const avgPd = total > 0 ? (totalPd / total) : 0.18;
  const approvalRate = total > 0 ? (lowCount / total) : 0.65;

  res.json({
    totalAssessments: total,
    approvalRate: round(approvalRate, 4),
    averagePd: round(avgPd, 4),
    manualReviewsCount: manualReviews,
    distribution: {
      low: lowCount,
      moderate: modCount,
      high: highCount
    },
    recentCases: cases.slice(0, 8)
  });
});

function round(val, dec) {
  return Number(Math.round(val + 'e' + dec) + 'e-' + dec);
}

// GET /api/audit - Audit trail (Admin & Risk Manager)
router.get('/audit', authenticateToken, authorizeRoles('ADMIN', 'RISK_MANAGER'), (req, res) => {
  const logs = fileStore.getAuditLogs(150);
  res.json(logs);
});

// GET /api/policy - Get current thresholds
router.get('/policy', authenticateToken, (req, res) => {
  const settings = fileStore.getPolicySettings();
  res.json(settings);
});

// PUT /api/policy - Update underwriting thresholds (Admin only)
router.put('/policy', authenticateToken, authorizeRoles('ADMIN'), (req, res) => {
  const updated = fileStore.updatePolicySettings(req.body, req.user.email);
  fileStore.logAudit({
    action: 'POLICY_THRESHOLDS_UPDATED',
    details: `Admin modified risk governance thresholds: DTI cap ${updated.dti_cap}%, Min CS ${updated.min_credit_score}.`,
    user: req.user.email,
    modelVersion: 'N/A',
    policyVersion: 'POL-2026.1'
  });
  res.json(updated);
});

// GET /api/report/:id/pdf - Generate bank-grade compliance PDF report
router.get('/report/:id/pdf', async (req, res) => {
  try {
    const caseData = fileStore.getCaseById(req.params.id);
    if (!caseData) {
      return res.status(404).send('Case not found');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Credit_Risk_Report_${caseData.id}.pdf`);

    buildComplianceReportPDF(caseData, res);
  } catch (err) {
    res.status(500).send(`Error generating PDF: ${err.message}`);
  }
});

// GET /api/ml/metrics - Proxy to ML metrics
router.get('/ml/metrics', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/metrics`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ml/global-importance - Proxy to Global SHAP
router.get('/ml/global-importance', authenticateToken, async (req, res) => {
  try {
    const response = await axios.get(`${ML_SERVICE_URL}/global-importance`);
    res.json(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
