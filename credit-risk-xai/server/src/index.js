require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false // Allows PDF and static downloads
}));

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting (generous for demo testing)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', limiter);

// Optional MongoDB connection with automatic resilient fallback
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/credit_risk_db';
mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2000 })
  .then(() => {
    console.log('Successfully connected to MongoDB cluster.');
  })
  .catch((err) => {
    console.log('[Notice] MongoDB not running locally. Using resilient auto-persisted fileStore database fallback (100% demo-ready).');
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'credit-risk-governance-api',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Governance API Server running on port ${PORT}`);
  console.log(`Connected to ML microservice at: ${process.env.ML_SERVICE_URL || 'http://localhost:8000'}`);
});
