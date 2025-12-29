const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

dotenv.config();

// Vérification des variables d'environnement critiques
if (!process.env.JWT_SECRET) {
  console.error('ERREUR FATALE: JWT_SECRET non défini. Créez un fichier .env basé sur .env.example');
  process.exit(1);
}

const app = express();

// Configuration CORS - support multiple origins
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:8080')
  .split(',')
  .map(o => o.trim());

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS non autorisé'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// CSRF Protection - Double Submit Cookie Pattern
const csrfTokens = new Map(); // In production, use Redis

const generateCsrfToken = () => crypto.randomBytes(32).toString('hex');

const csrfProtection = (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const tokenFromHeader = req.headers['x-csrf-token'];
  const tokenFromCookie = req.cookies['csrf-token'];

  if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
    return res.status(403).json({ message: 'CSRF token invalide' });
  }

  // Validate token exists in our store
  if (!csrfTokens.has(tokenFromCookie)) {
    return res.status(403).json({ message: 'CSRF token expire' });
  }

  next();
};

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  const token = generateCsrfToken();
  csrfTokens.set(token, Date.now());

  // Clean old tokens (older than 24h)
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  for (const [t, timestamp] of csrfTokens) {
    if (timestamp < oneDayAgo) csrfTokens.delete(t);
  }

  res.cookie('csrf-token', token, {
    httpOnly: false, // Frontend needs to read it
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24h
  });

  res.json({ csrfToken: token });
});

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply CSRF protection to all routes except auth
app.use('/api', (req, res, next) => {
  // Skip CSRF for login (no token yet)
  if (req.path === '/auth/login' || req.path === '/csrf-token') {
    return next();
  }
  csrfProtection(req, res, next);
});

app.use('/files', express.static(path.join(__dirname, 'files')));

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sonatrach_reservations';
const { initGridFS } = require('./src/utils/gridfs');

mongoose.connect(mongoUri)
  .then(() => {
    console.log('MongoDB connecté');
    initGridFS();
  })
  .catch(err => console.error('Erreur MongoDB', err));

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const hotelRoutes = require('./src/routes/hotels');
const requestRoutes = require('./src/routes/requests');
const facturesRoutes = require('./src/routes/factures');
const adminRoutes = require('./src/routes/admin');
const auditRoutes = require('./src/routes/audit');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/factures', facturesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/audit', auditRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'API Sonatrach Reservations v4 premium' });
});

app.use((req, res, next) => {
  res.status(404).json({ message: 'Route introuvable' });
});

app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err);
  res.status(err.status || 500).json({ message: err.message || 'Erreur serveur' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log('Backend démarré sur le port ' + port);
});