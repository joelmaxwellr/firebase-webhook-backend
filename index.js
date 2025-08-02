const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());

// Configura el SDK de Firebase usando variables de entorno
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

// Endpoint general de prueba
app.get("/", (req, res) => {
  res.send("✅ Backend conectado a Firebase");
});

// Últimas 400 órdenes resumidas
app.get("/ordenes", async (req, res) => {
  try {
    const snapshot = await db.ref("ordenes").limitToLast(400).once("value");
    const data = snapshot.val();
    if (!data) return res.json([]);

    const ordenes = Object.entries(data)
      .reverse()
      .map(([id, orden]) => ({
        id,
        cliente: orden.cliente || null,
        total: orden.total || 0,
        fecha: orden.fecha || null
      }));

    res.json(ordenes);
  } catch (err) {
    console.error("Error al consultar ordenes:", err);
    res.status(500).send("Error interno al consultar Firebase");
  }
});

// Filtrar por cliente
app.get("/ordenes/cliente/:nombre", async (req, res) => {
  const nombre = req.params.nombre.toLowerCase();
  try {
    const snapshot = await db.ref("ordenes").limitToLast(400).once("value");
    const data = snapshot.val();
    if (!data) return res.json([]);

    const ordenes = Object.entries(data)
      .map(([id, orden]) => ({ id, ...orden }))
      .filter(o => o.cliente?.toLowerCase().includes(nombre));

    res.json(ordenes);
  } catch (err) {
    res.status(500).send("Error interno");
  }
});

// Últimas 10 órdenes detalladas
app.get("/ordenes/detalle", async (req, res) => {
  try {
    const snapshot = await db.ref("ordenes").limitToLast(10).once("value");
    const data = snapshot.val();
    res.json(data || {});
  } catch (err) {
    res.status(500).send("Error interno");
  }
});

// Puerto Render (usa PORT si existe o 3000 localmente)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});
