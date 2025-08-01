const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Cargar credenciales de servicio desde variables de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.database();

// Endpoint básico de prueba
app.get('/', (req, res) => {
  res.send('✅ API Firebase funcionando');
});

// Últimas 400 órdenes (resumen básico)
app.get('/orders/latest', async (req, res) => {
  try {
    const snapshot = await db.ref('ordenes').limitToLast(400).once('value');
    const data = snapshot.val();

    // Transformamos el objeto a arreglo y devolvemos solo lo esencial
    const resumen = Object.entries(data || {}).map(([key, value]) => ({
      id: key,
      cliente: value.cliente || 'N/D',
      fecha: value.fecha || 'N/D',
      total: value.total || 0,
      estado: value.estado || 'pendiente',
    }));

    res.json(resumen.reverse()); // Invertir orden: más reciente primero
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
});

// Obtener una orden por ID
app.get('/orders/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const snapshot = await db.ref(`ordenes/${id}`).once('value');
    const orden = snapshot.val();

    if (!orden) return res.status(404).json({ error: 'Orden no encontrada' });

    res.json(orden);
  } catch (error) {
    res.status(500).json({ error: 'Error al buscar la orden' });
  }
});

// Buscar órdenes por cliente
app.get('/orders/cliente/:nombre', async (req, res) => {
  try {
    const nombre = req.params.nombre.toLowerCase();
    const snapshot = await db.ref('ordenes').once('value');
    const data = snapshot.val();

    const resultados = Object.entries(data || {})
      .filter(([, value]) =>
        (value.cliente || '').toLowerCase().includes(nombre)
      )
      .map(([key, value]) => ({
        id: key,
        cliente: value.cliente || '',
        fecha: value.fecha || '',
        total: value.total || 0,
        estado: value.estado || '',
      }));

    res.json(resultados);
  } catch (error) {
    res.status(500).json({ error: 'Error al filtrar por cliente' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Servidor escuchando en el puerto ${PORT}`);
});
