const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");
const cors = require("cors");

const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fireapp-35650-default-rtdb.firebaseio.com" // reemplaza si es necesario
});

const db = admin.database();
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Ruta POST para recibir mensajes del webhook (Callbell)
app.post("/webhook", async (req, res) => {
  try {
    const message = req.body.payload?.message?.text || "Mensaje vacío";

    return res.json({
      success: true,
      reply: `Mensaje recibido: ${message}`
    });
  } catch (error) {
    console.error("Error en POST /webhook:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Ruta GET para traer TODA la base de datos
app.get("/webhook", async (req, res) => {
  try {
    const snapshot = await db.ref("/").once("value"); // Trae TODO
    const data = snapshot.val();
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error en GET /webhook:", error);
    return res.status(500).json({ error: "Error al consultar Firebase" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
