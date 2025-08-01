const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Inicializa Firebase Admin SDK con tu configuración
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fireapp-35650-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Ruta GET para consultar las últimas 400 órdenes
app.get('/webhook', async (req, res) => {
  try {
    const ref = db.ref('ordenes'); // Asume que tus órdenes están bajo /ordenes
    const snapshot = await ref.limitToLast(400).once('value');
    const data = snapshot.val();

    if (!data) {
      return res.status(404).json({ message: 'No hay datos disponibles' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error al leer desde Firebase:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});
