require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Telemetry = require('./models/Telemetry');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB conectado correctamente'))
  .catch(err => console.error('Error MongoDB:', err));

// === APIs ===

// POST: Recibe datos del ESP32 con DHT22
app.post('/api/datos', async (req, res) => {
  try {
    const { temp, hum, timestamp } = req.body;

    // Validación básica
    if (temp === undefined || hum === undefined || !timestamp) {
      return res.status(400).json({ error: 'Faltan campos: temp, hum o timestamp' });
    }

    // Convertir el string de timestamp (formato: "2025-04-05 14:32:10") a Date
    const fecha = new Date(timestamp);
    if (isNaN(fecha.getTime())) {
      return res.status(400).json({ error: 'Formato de timestamp inválido' });
    }

    const nuevoDato = new Telemetry({
      temp,
      hum,
      timestamp: fecha
    });

    await nuevoDato.save();

    console.log(`Dato guardado → ${temp}°C | ${hum}% | ${timestamp}`);
    res.status(201).json({ 
      message: 'Dato DHT22 guardado correctamente',
      id: nuevoDato._id 
    });

  } catch (err) {
    console.error('Error guardando dato:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Todos los registros (ordenados por fecha descendente)
app.get('/api/datos', async (req, res) => {
  try {
    const { limit, page, pageSize } = req.query;

    // Si se especifica limit, devolver últimos N registros
    if (limit) {
      const n = Math.max(1, Math.min(500, parseInt(String(limit), 10) || 20));
      const datos = await Telemetry.find()
        .sort({ timestamp: -1 })
        .limit(n);

      const datosFormateados = datos.map(d => ({
        temp: d.temp,
        hum: d.hum,
        timestamp_local: d.timestamp.toLocaleString('es-MX', {
          timeZone: 'America/Mexico_City'
        }),
        timestamp_utc: d.timestamp
      }));

      return res.json({ items: datosFormateados, total: datosFormateados.length });
    }

    // Paginación: page (1-based) y pageSize
    const p = Math.max(1, parseInt(page ? String(page) : '1', 10));
    const size = Math.max(1, Math.min(500, parseInt(pageSize ? String(pageSize) : '30', 10)));
    const skip = (p - 1) * size;

    const [items, total] = await Promise.all([
      Telemetry.find().sort({ timestamp: -1 }).skip(skip).limit(size),
      Telemetry.countDocuments()
    ]);

    const datosFormateados = items.map(d => ({
      temp: d.temp,
      hum: d.hum,
      timestamp_local: d.timestamp.toLocaleString('es-MX', {
        timeZone: 'America/Mexico_City'
      }),
      timestamp_utc: d.timestamp
    }));

    res.json({ items: datosFormateados, total, page: p, pageSize: size });

  } catch (err) {
    res.status(500).json({ error: err && err.message ? err.message : 'Unknown error' });
  }
});

// GET: Devuelve un intervalo aleatorio entre 4s y 60s
app.get('/api/update', (req, res) => {
  // Número entero aleatorio [4, 60]
  const intervalSeconds = Math.floor(Math.random() * (60 - 4 + 1)) + 4;
  res.json({ intervalSeconds });
});


// GET: Contador total
app.get('/api/datos/count', async (req, res) => {
  try {
    const count = await Telemetry.countDocuments();
    res.json({ total_registros: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ruta raíz (opcional, para ver que funciona)
app.get('/', (req, res) => {
  res.send(`
    <h1>ESP32 + DHT22</h1>
    <p><strong>Estado:</strong> API funcionando</p>
    <p><strong>Endpoint POST:</strong> <code>/api/datos</code></p>
    <p><strong>Endpoint GET para valor aleatorio entre 4s y 60s:</strong> <code>/api/update</code></p>
    <p><strong>Total registros:</strong> <span id="count">cargando...</span></p>
    <script>
      fetch('/api/datos/count').then(r => r.json()).then(d => {
        document.getElementById('count').textContent = d.total_registros;
      });
    </script>
  `);
});
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
