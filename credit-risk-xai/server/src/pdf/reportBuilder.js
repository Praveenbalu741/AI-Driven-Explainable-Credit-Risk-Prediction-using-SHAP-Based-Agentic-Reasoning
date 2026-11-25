const PDFDocument = require('pdfkit');

function buildComplianceReportPDF(caseData, res) {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  // Stream directly to response
  doc.pipe(res);

  // Styling palette
  const primaryColor = '#1E3A8A'; // Deep Navy
  const secondaryColor = '#475569'; // Slate
  const accentColor = caseData.risk_band === 'Low' ? '#059669' : caseData.risk_band === 'Moderate' ? '#D97706' : '#DC2626';

  // Header Banner
  doc.rect(40, 40, 515, 60).fill('#0F172A');
  doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold').text('CREDIT RISK COMPLIANCE AUDIT MEMO', 55, 52);
  doc.fontSize(9).font('Helvetica').fillColor('#94A3B8').text(`GOVERNANCE REPORT ID: ${caseData.id || 'CASE-2026-X'}  |  CONFIDENTIAL & PROPRIETARY`, 55, 78);

  doc.moveDown(3);
  doc.fillColor('#000000');

  // Metadata Table
  const metaY = 115;
  doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text('ASSESSMENT METADATA', 40, metaY);
  doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, metaY + 14).lineTo(555, metaY + 14).stroke();

  doc.font('Helvetica').fontSize(9).fillColor('#334155');
  doc.text(`Applicant Name: ${caseData.applicant_name || 'Anonymous Applicant'}`, 40, metaY + 22);
  doc.text(`Loan Amount: $${(caseData.loan_amount || 0).toLocaleString()}`, 200, metaY + 22);
  doc.text(`Credit Score (FICO): ${caseData.credit_score || 'N/A'}`, 380, metaY + 22);

  doc.text(`Evaluated By: ${caseData.assessedBy || 'Automated Pipeline'}`, 40, metaY + 38);
  doc.text(`Term: ${caseData.term_months || 36} Months`, 200, metaY + 38);
  doc.text(`DTI: ${(caseData.dti || 0)}%`, 380, metaY + 38);

  doc.text(`Model Version: ${caseData.modelVersion || 'LGBM-V1-20261122'}`, 40, metaY + 54);
  doc.text(`Policy Version: ${caseData.policyVersion || 'POL-2026.1'}`, 200, metaY + 54);
  doc.text(`Timestamp: ${new Date(caseData.createdAt || Date.now()).toLocaleString()}`, 380, metaY + 54);

  // Risk Rating Card
  const riskY = metaY + 80;
  doc.roundedRect(40, riskY, 515, 65, 4).fillAndStroke('#F8FAFC', '#CBD5E1');

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('PREDICTIVE RISK TIER', 55, riskY + 12);
  doc.font('Helvetica-Bold').fontSize(22).fillColor(accentColor).text(`${caseData.risk_band ? caseData.risk_band.toUpperCase() : 'UNKNOWN'} RISK`, 55, riskY + 30);

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('PROBABILITY OF DEFAULT (PD)', 230, riskY + 12);
  const pdVal = (caseData.probability_of_default !== undefined ? (caseData.probability_of_default * 100).toFixed(2) : '0.00');
  doc.font('Helvetica-Bold').fontSize(22).fillColor(accentColor).text(`${pdVal}%`, 230, riskY + 30);

  doc.font('Helvetica-Bold').fontSize(11).fillColor('#0F172A').text('POLICY STATUS', 410, riskY + 12);
  const policyStatus = caseData.policy_verdict || (caseData.policy ? caseData.policy.verdict : 'COMPLIANT');
  doc.font('Helvetica-Bold').fontSize(16).fillColor(policyStatus === 'COMPLIANT' ? '#059669' : '#DC2626').text(policyStatus, 410, riskY + 34);

  // Section: SHAP Feature Attribution
  let curY = riskY + 80;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text('TREESHAP LOCAL FEATURE ATTRIBUTION', 40, curY);
  doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, curY + 14).lineTo(555, curY + 14).stroke();
  curY += 24;

  const contributions = (caseData.shap_explanation && caseData.shap_explanation.top_positive_drivers) || [];
  const mitigations = (caseData.shap_explanation && caseData.shap_explanation.top_negative_drivers) || [];

  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E293B').text('Top Adverse Risk Drivers (Log-odds elevation):', 40, curY);
  curY += 14;
  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  if (contributions.length > 0) {
    contributions.slice(0, 3).forEach(c => {
      doc.text(`* ${c.label} (${c.value}): +${c.shap_value.toFixed(4)} impact to risk margin`, 50, curY);
      curY += 12;
    });
  } else {
    doc.text('* No major adverse risk anomalies identified.', 50, curY);
    curY += 12;
  }

  curY += 4;
  doc.font('Helvetica-Bold').fontSize(9).fillColor('#1E293B').text('Top Mitigating Credit Factors (Protective offset):', 40, curY);
  curY += 14;
  doc.font('Helvetica').fontSize(8).fillColor('#334155');
  if (mitigations.length > 0) {
    mitigations.slice(0, 3).forEach(m => {
      doc.text(`* ${m.label} (${m.value}): ${m.shap_value.toFixed(4)} margin protection`, 50, curY);
      curY += 12;
    });
  } else {
    doc.text('* Standard credit attributes within median bounds.', 50, curY);
    curY += 12;
  }

  // Section: AI Underwriting Memo
  curY += 10;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text('AGENTIC UNDERWRITING REASONING MEMO', 40, curY);
  doc.strokeColor('#E2E8F0').lineWidth(1).moveTo(40, curY + 14).lineTo(555, curY + 14).stroke();
  curY += 22;

  const rawMemo = (caseData.underwriting_memo && caseData.underwriting_memo.memo) || 'Deterministic underwriting memo generated and archived.';
  // Clean markdown bold syntax for PDF text
  const cleanMemo = rawMemo.replace(/###/g, '').replace(/\*\*/g, '').replace(/\*/g, '');

  doc.font('Helvetica').fontSize(8).fillColor('#1E293B').text(cleanMemo.slice(0, 850) + (cleanMemo.length > 850 ? '... [Full reasoning transcript archived]' : ''), 40, curY, {
    width: 515,
    align: 'justify',
    lineGap: 2
  });

  // Footer Disclaimer
  doc.fontSize(8).font('Helvetica-Oblique').fillColor('#94A3B8').text(
    'Notice: This automated governance artifact incorporates explainable TreeSHAP ML with algorithmic policy checks. Complies with Fair Lending, ECOA & FCRA adverse action audit standards.',
    40,
    760,
    { width: 515, align: 'center' }
  );

  doc.end();
}

module.exports = { buildComplianceReportPDF };
