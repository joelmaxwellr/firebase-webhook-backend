require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
app.use(cors());
app.use(express.json());

// Inicializar Firebase Admin con variables de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

// Utilidad: formatear una orden
const formatOrder = (id, order) => ({
  id,
  name: order.name,
  price: parseFloat(order.price) || 0,
  status: order.status,
  createdAt: order.createdAt || null,
  updatedAt: order.updatedAt || order.createdAt || null,
  store: order.store || '',
});

app.get("/", (req, res) => {
  res.send("✅ Backend conectado a Firebase");
});

// Obtener últimas N órdenes (resumidas)
app.get('/orders/latest/:limit', async (req, res) => {
  try {
    const limit = parseInt(req.params.limit, 10) || 100;
    const snapshot = await db.ref('orders').once('value');
    if (!snapshot.exists()) return res.status(200).json([]);

    const data = snapshot.val();
    const orders = Object.entries(data)
      .map(([id, order]) => formatOrder(id, order))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, limit);

    res.json(orders);
  } catch (error) {
    console.error('Error /orders/latest:', error);
    res.status(500).send('Error loading orders');
  }
});

// Configuración del usuario
app.get('/user/:uid/settings', async (req, res) => {
  try {
    const snapshot = await db.ref(`users/${req.params.uid}/settings`).once('value');
    if (!snapshot.exists()) return res.status(200).json({});
    res.json(snapshot.val());
  } catch (error) {
    res.status(500).send('Error loading settings');
  }
});

// Tipos de materiales
app.get('/material-types', async (req, res) => {
  try {
    const snapshot = await db.ref('materialTypes').once('value');
    res.json(snapshot.exists() ? snapshot.val() : {});
  } catch (error) {
    res.status(500).send('Error loading material types');
  }
});



// Categorías de materiales
app.get('/material-categories', async (req, res) => {
  try {
    const snapshot = await db.ref('materialCategories').once('value');
    res.json(snapshot.exists() ? snapshot.val() : {});
  } catch (error) {
    res.status(500).send('Error loading categories');
  }
});

// Buscar una orden por ID
app.get('/orders/id/:id', async (req, res) => {
  try {
    const snapshot = await db.ref(`orders/${req.params.id}`).once('value');
    if (!snapshot.exists()) return res.status(404).send('Order not found');
    res.json(formatOrder(req.params.id, snapshot.val()));
  } catch (error) {
    console.error('Error /orders/id/:id:', error);
    res.status(500).send('Error retrieving order');
  }
});

// Buscar órdenes por nombre parcial
app.get('/orders/search/:name', async (req, res) => {
  try {
    const nameSearch = req.params.name.toLowerCase();
    const snapshot = await db.ref('orders').once('value');
    if (!snapshot.exists()) return res.status(200).json([]);

    const data = snapshot.val();
    const filtered = Object.entries(data)
      .filter(([_, order]) =>
        order.name && order.name.toLowerCase().includes(nameSearch)
      )
      .map(([id, order]) => formatOrder(id, order));

    res.json(filtered.slice(0, 100)); // limitar resultados
  } catch (error) {
    console.error('Error /orders/search/:name:', error);
    res.status(500).send('Error searching orders');
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});


