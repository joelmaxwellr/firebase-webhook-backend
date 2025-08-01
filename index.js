const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

// Ruta optimizada para Callbell
app.get('/webhook', async (req, res) => {
  try {
    const snapshot = await db.ref('ordenes').limitToLast(400).once('value');

    const data = snapshot.val() || {};
    const ordenes = Object.entries(data)
      .map(([key, value]) => ({ id: key, ...value }))
      .sort((a, b) => b.timestamp - a.timestamp); // orden descendente

    res.json({
      success: true,
      total: ordenes.length,
      data: ordenes,
    });
  } catch (error) {
    console.error('Error al consultar Firebase:', error);
    res.status(500).json({ success: false, error: 'Error al obtener los datos.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
