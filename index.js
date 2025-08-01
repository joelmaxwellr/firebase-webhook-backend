const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Establecer timeout máximo de 9 segundos
app.use((req, res, next) => {
  res.setTimeout(9000, () => {
    console.warn('Tiempo de respuesta excedido');
    res.status(504).json({ error: 'Timeout del servidor' });
  });
  next();
});

// Inicializar Firebase desde variable de entorno
const serviceAccount = JSON.parse(process.env.FIREBASE_CONFIG);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fireapp-35650-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Endpoint optimizado
app.get('/webhook', async (req, res) => {
  try {
    const ref = db.ref('ordenes');
    const snapshot = await ref.limitToLast(400).once('value');

    const rawData = snapshot.val();

    if (!rawData) {
      return res.json([]); // Respuesta vacía rápida
    }

    // Convertir objeto a array ordenada (más rápida de procesar)
    const ordenes = Object.entries(rawData).map(([id, data]) => ({
      id,
      ...data
    }));

    res.json(ordenes);
  } catch (error) {
    console.error('Error al leer datos:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
