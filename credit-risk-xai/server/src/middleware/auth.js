const jwt = require('jsonwebtoken');
const fileStore = require('../models/fileStore');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_credit_risk_xai_jwt_key_2026!';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Missing bearer token.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired authentication token.' });
    }
    const user = fileStore.findUserById(decodedUser.id) || decodedUser;
    req.user = user;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: role '${req.user ? req.user.role : 'ANONYMOUS'}' lacks permissions for this resource.`
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
