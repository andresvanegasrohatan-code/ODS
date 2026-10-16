const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const situacionRoutes = require('./routes/situacionRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const oportunidadRoutes = require('./routes/oportunidadRoutes');
const { noEncontrado, manejarErrores } = require('./middleware/errorHandler');

const app = express();

const origenesPermitidos = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim());

app.use(helmet());
app.use(
  cors({
    origin: origenesPermitidos,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => res.json({ estado: 'ok', servicio: 'EquiGénero API' }));
app.use('/api/auth', authRoutes);
app.use('/api/situaciones', situacionRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/oportunidades', oportunidadRoutes);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api/') || !req.accepts('html')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use(noEncontrado);
app.use(manejarErrores);

module.exports = app;
