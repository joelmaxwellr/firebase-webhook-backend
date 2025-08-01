const express = require("express");
const admin = require("firebase-admin");
const app = express();
app.use(express.json());

// Inicializa Firebase con tu clave privada
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://fireapp-35650-default-rtdb.firebaseio.com"
});

const db = admin.database();

// Webhook de Callbell
app.post("/webhook", async (req, res) => {
  const texto = req.body?.payload?.message?.text?.toLowerCase();

  console.log("📩 Mensaje recibido:", texto);

  if (!texto) {
    return res.status(200).send("Mensaje vacío");
  }

  try {
    const snapshot = await db.ref("materiales").once("value");
    const data = snapshot.val();

    const coincidencia = Object.values(data).find(item =>
      item.nombre?.toLowerCase()?.includes(texto)
    );

    if (coincidencia) {
      console.log("✅ Coincidencia encontrada:", coincidencia);
    } else {
      console.log("❌ No se encontró coincidencia");
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Error al consultar Firebase:", err);
    res.sendStatus(500);
  }
});

// Puerto para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});
