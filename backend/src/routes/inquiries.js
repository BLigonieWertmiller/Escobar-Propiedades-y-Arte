const express = require("express");
const { randomUUID } = require("crypto");
const rateLimit = require("express-rate-limit");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");
const { appendInquiryRow, updateInquiryStatusInSheet } = require("../googleSheets");

const router = express.Router();

const STATUSES = ["nueva", "negociacion", "vendida", "alquilada", "cancelada"];

// Máximo 15 consultas cada 30 minutos por IP — evita que un bot rellene la planilla de spam.
const inquiryLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas consultas en poco tiempo. Probá de nuevo más tarde." },
});

// POST /api/inquiries — se dispara solo cuando alguien toca "Consultar por WhatsApp".
// No le pedimos nada al visitante: solo registramos qué publicación consultó.
// El dueño completa nombre y teléfono a mano en la planilla cuando le llega el mensaje real.
router.post("/", inquiryLimiter, async (req, res) => {
  const { type, itemId, itemTitle } = req.body || {};

  if (type !== "propiedad" && type !== "arte") {
    return res.status(400).json({ error: "Tipo de consulta inválido." });
  }

  const id = randomUUID();
  const created_at = Date.now();

  db.prepare(`
    INSERT INTO inquiries (id, type, item_id, item_title, name, phone, status, sheet_row, created_at)
    VALUES (@id, @type, @item_id, @item_title, '', '', 'nueva', NULL, @created_at)
  `).run({
    id,
    type,
    item_id: itemId || "",
    item_title: itemTitle || "",
    created_at,
  });

  // Copiar a Google Sheets en segundo plano — si falla o no está configurado,
  // la consulta ya quedó guardada en la base de datos de todas formas.
  appendInquiryRow({
    type,
    item_title: itemTitle || "",
    name: "",
    phone: "",
    status: "nueva",
    created_at,
  }).then((rowNumber) => {
    if (rowNumber) {
      db.prepare("UPDATE inquiries SET sheet_row = ? WHERE id = ?").run(rowNumber, id);
    }
  });

  res.status(201).json({ id });
});

// GET /api/inquiries — solo admin
router.get("/", requireAuth, (req, res) => {
  const rows = db.prepare("SELECT * FROM inquiries ORDER BY created_at DESC").all();
  res.json(rows);
});

// PATCH /api/inquiries/:id/status — solo admin
router.patch("/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Estado inválido." });

  const existing = db.prepare("SELECT * FROM inquiries WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Consulta no encontrada." });

  db.prepare("UPDATE inquiries SET status = ? WHERE id = ?").run(status, req.params.id);

  if (existing.sheet_row) {
    updateInquiryStatusInSheet(existing.sheet_row, status);
  }

  const row = db.prepare("SELECT * FROM inquiries WHERE id = ?").get(req.params.id);
  res.json(row);
});

module.exports = router;
