require("dotenv").config();
const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

require("./db"); // inicializa y migra la base de datos + siembra datos iniciales

const authRoutes = require("./routes/auth");
const propertyRoutes = require("./routes/properties");
const artworkRoutes = require("./routes/artworks");
const settingsRoutes = require("./routes/settings");
const uploadRoutes = require("./routes/uploads");
const inquiryRoutes = require("./routes/inquiries");

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

// Imágenes subidas, servidas como archivos estáticos
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
app.use("/uploads", express.static(UPLOAD_DIR));

app.use("/api/auth", authRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/artworks", artworkRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/inquiries", inquiryRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true }));

// Manejo de errores centralizado (evita filtrar detalles internos al cliente)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: "Error interno del servidor." });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API de la inmobiliaria escuchando en http://localhost:${PORT}`);
});
