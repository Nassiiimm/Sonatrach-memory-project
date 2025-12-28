const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');

dotenv.config();

// Vérification des variables d'environnement critiques
if (!process.env.JWT_SECRET) {
  console.error('ERREUR FATALE: JWT_SECRET non défini. Créez un fichier .env basé sur .env.example');
  process.exit(1);
}

const app = express();

// Configuration CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan('dev'));

app.use('/files', express.static(path.join(__dirname, 'files')));

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sonatrach_reservations';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connecté'))
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