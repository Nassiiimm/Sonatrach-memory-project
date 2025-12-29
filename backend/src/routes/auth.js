const express = require('express');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const User = require('../models/User');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET || JWT_SECRET + '_refresh';

// Store refresh tokens (in production, use Redis)
const refreshTokens = new Map();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // 5 en prod, 100 en dev
  message: { message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post('/login', loginLimiter, async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ message: error.message });

  const { email, password } = value;
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: 'Identifiants invalides' });
  }

  // Access token - short lived (15 minutes)
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });

  // Refresh token - longer lived (7 days)
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const refreshExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
  refreshTokens.set(refreshToken, { userId: user._id.toString(), expiry: refreshExpiry });

  // Clean old refresh tokens
  for (const [token, data] of refreshTokens) {
    if (data.expiry < Date.now()) refreshTokens.delete(token);
  }

  // Set refresh token in httpOnly cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none', // Required for cross-origin
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    token,
    expiresIn: 15 * 60 * 1000, // 15 minutes in ms
    user: {
      id: user._id,
      name: user.name,
      role: user.role,
      email: user.email,
      matricule: user.matricule,
      regionAcronym: user.regionAcronym,
      department: user.department,
      region: user.region
    }
  });
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: 'Refresh token manquant' });
  }

  const tokenData = refreshTokens.get(refreshToken);
  if (!tokenData) {
    return res.status(401).json({ message: 'Refresh token invalide' });
  }

  if (tokenData.expiry < Date.now()) {
    refreshTokens.delete(refreshToken);
    return res.status(401).json({ message: 'Refresh token expire' });
  }

  const user = await User.findById(tokenData.userId);
  if (!user) {
    refreshTokens.delete(refreshToken);
    return res.status(401).json({ message: 'Utilisateur introuvable' });
  }

  // Generate new access token
  const newToken = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });

  // Optionally rotate refresh token
  const newRefreshToken = crypto.randomBytes(64).toString('hex');
  const newExpiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
  refreshTokens.delete(refreshToken);
  refreshTokens.set(newRefreshToken, { userId: user._id.toString(), expiry: newExpiry });

  res.cookie('refreshToken', newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none', // Required for cross-origin
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    token: newToken,
    expiresIn: 15 * 60 * 1000
  });
});

// Logout - invalidate refresh token
router.post('/logout', (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }
  res.clearCookie('refreshToken');
  res.json({ message: 'Deconnexion reussie' });
});

module.exports = router;