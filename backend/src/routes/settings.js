const express = require("express");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET /api/settings — público (el sitio necesita el teléfono para el botón de WhatsApp)
router.get("/", async (req, res) => {
  const rows = await db.prepare("SELECT key, value FROM settings").all();
  const settings = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  res.json(settings);
});

// PUT /api/settings — solo admin
router.put("/", requireAuth, async (req, res) => {
  const { phone } = req.body || {};
  if (!phone || !/^\d{8,15}$/.test(phone)) {
    return res.status(400).json({ error: "El teléfono debe tener solo números, con código de país (8 a 15 dígitos)." });
  }
  await db.prepare(
    "INSERT INTO settings (key, value) VALUES ('phone', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(phone);
  res.json({ phone });
});

module.exports = router;
