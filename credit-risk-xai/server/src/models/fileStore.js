/**
 * Universal Data Store with in-memory JSON fallback
 * Supports MongoDB when accessible, and transparently falls back to
 * a persistent JSON file database so the demo runs seamlessly with zero setup.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data_storage');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_FILE = path.join(DATA_DIR, 'db_fallback.json');

// Initialize default state
const defaultState = {
  users: [
    {
      id: 'usr_admin_01',
      name: 'Dr. Evelyn Reed (Chief Risk Officer)',
      email: 'admin@demo.com',
      passwordHash: bcrypt.hashSync('Demo@123', 10),
      role: 'ADMIN',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_manager_01',
      name: 'Marcus Vance (Credit Risk Manager)',
      email: 'manager@demo.com',
      passwordHash: bcrypt.hashSync('Demo@123', 10),
      role: 'RISK_MANAGER',
      createdAt: new Date().toISOString()
    },
    {
      id: 'usr_analyst_01',
      name: 'Sarah Chen (Senior Credit Analyst)',
      email: 'analyst@demo.com',
      passwordHash: bcrypt.hashSync('Demo@123', 10),
      role: 'ANALYST',
      createdAt: new Date().toISOString()
    }
  ],
  cases: [
    {
      id: 'CASE-2026-001',
      applicant_name: 'Johnathan Miller',
      annual_income: 85000,
      loan_amount: 15000,
      term_months: 36,
      interest_rate: 8.5,
      credit_score: 745,
      dti: 14.5,
      revolving_utilization: 22.0,
      delinquencies_2yrs: 0,
      recent_inquiries: 0,
      probability_of_default: 0.0842,
      risk_band: 'Low',
      policy_verdict: 'COMPLIANT',
      modelVersion: 'LGBM-V1-20261122',
      policyVersion: 'POL-2026.1',
      assessedBy: 'admin@demo.com',
      createdAt: new Date(Date.now() - 3600000 * 4).toISOString()
    },
    {
      id: 'CASE-2026-002',
      applicant_name: 'Elena Rostova',
      annual_income: 48000,
      loan_amount: 18000,
      term_months: 60,
      interest_rate: 16.2,
      credit_score: 630,
      dti: 38.2,
      revolving_utilization: 68.5,
      delinquencies_2yrs: 1,
      recent_inquiries: 2,
      probability_of_default: 0.3650,
      risk_band: 'Moderate',
      policy_verdict: 'COMPLIANT',
      modelVersion: 'LGBM-V1-20261122',
      policyVersion: 'POL-2026.1',
      assessedBy: 'analyst@demo.com',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: 'CASE-2026-003',
      applicant_name: 'David K. Henderson',
      annual_income: 38000,
      loan_amount: 25000,
      term_months: 60,
      interest_rate: 24.5,
      credit_score: 560,
      dti: 48.0,
      revolving_utilization: 89.0,
      delinquencies_2yrs: 3,
      recent_inquiries: 4,
      probability_of_default: 0.6840,
      risk_band: 'High',
      policy_verdict: 'MANUAL_REVIEW',
      modelVersion: 'LGBM-V1-20261122',
      policyVersion: 'POL-2026.1',
      assessedBy: 'manager@demo.com',
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 'AUD-001',
      action: 'SYSTEM_INITIALIZATION',
      details: 'Governance and Model Risk Audit trail online.',
      user: 'SYSTEM',
      modelVersion: 'LGBM-V1-20261122',
      policyVersion: 'POL-2026.1',
      timestamp: new Date().toISOString()
    }
  ],
  policySettings: {
    dti_cap: 43.0,
    min_credit_score: 600,
    max_delinquencies: 1,
    max_loan_to_income: 0.50,
    max_utilization: 80.0,
    max_inquiries: 3,
    low_risk_threshold: 0.25,
    moderate_risk_threshold: 0.50,
    updatedBy: 'admin@demo.com',
    updatedAt: new Date().toISOString()
  }
};

class FileStore {
  constructor() {
    this.init();
  }

  init() {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), 'utf-8');
    }
  }

  read() {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      return defaultState;
    }
  }

  write(state) {
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), 'utf-8');
  }

  // User methods
  findUserByEmail(email) {
    const db = this.read();
    return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    const db = this.read();
    return db.users.find(u => u.id === id);
  }

  createUser(user) {
    const db = this.read();
    db.users.push(user);
    this.write(db);
    return user;
  }

  // Case methods
  saveCase(caseData) {
    const db = this.read();
    db.cases.unshift(caseData);
    this.write(db);
    return caseData;
  }

  getCases(limit = 100) {
    const db = this.read();
    return db.cases.slice(0, limit);
  }

  getCaseById(id) {
    const db = this.read();
    return db.cases.find(c => c.id === id);
  }

  // Audit Log methods
  logAudit(logEntry) {
    const db = this.read();
    const entry = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...logEntry
    };
    db.auditLogs.unshift(entry);
    this.write(db);
    return entry;
  }

  getAuditLogs(limit = 150) {
    const db = this.read();
    return db.auditLogs.slice(0, limit);
  }

  // Policy Settings
  getPolicySettings() {
    const db = this.read();
    return db.policySettings;
  }

  updatePolicySettings(settings, userEmail) {
    const db = this.read();
    db.policySettings = {
      ...db.policySettings,
      ...settings,
      updatedBy: userEmail,
      updatedAt: new Date().toISOString()
    };
    this.write(db);
    return db.policySettings;
  }
}

module.exports = new FileStore();
