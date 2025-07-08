const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'BarReservas Backend Running' });
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'BarReservas API v1.0' });
});

app.get('/api/tables', (req, res) => {
  res.json([
    { id: '1', numero: 1, capacidad: 4, tipo: 'estandar', estado: 'libre' },
    { id: '2', numero: 2, capacidad: 6, tipo: 'vip', estado: 'ocupada' },
    { id: '3', numero: 3, capacidad: 8, tipo: 'terraza', estado: 'reservada' }
  ]);
});

app.post('/api/reservations', (req, res) => {
  const { nombre, contacto, fecha, hora, personas, tipoMesa } = req.body;
  
  res.json({
    id: Date.now().toString(),
    nombre,
    contacto,
    fecha,
    hora,
    personas,
    tipoMesa,
    qr: `https://barreservas.vercel.app/member/${Date.now()}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BarReservas Backend running on port ${PORT}`);
});