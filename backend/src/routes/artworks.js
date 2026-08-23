const express = require("express");
const { randomUUID } = require("crypto");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const STATUSES = ["disponible", "vendida"];

function rowToArtwork(row) {
  return { ...row, photos: JSON.parse(row.photos || "[]") };
}

// GET /api/artworks — listado público, con búsqueda opcional por título/categoría
router.get("/", async (req, res) => {
  const { search, includeSold } = req.query;

  let sql = "SELECT * FROM artworks WHERE 1=1";
  const params = [];

  if (!includeSold) {
    sql += " AND status != 'vendida'";
  }
  if (search) {
    sql += " AND (title ILIKE ? OR category ILIKE ?)";
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " ORDER BY created_at DESC";

  const rows = await db.prepare(sql).all(...params);
  res.json(rows.map(rowToArtwork));
});

// GET /api/artworks/:id — detalle público
router.get("/:id", async (req, res) => {
  const row = await db.prepare("SELECT * FROM artworks WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Obra no encontrada." });
  res.json(rowToArtwork(row));
});

function validatePayload(body) {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push("El título es obligatorio.");
  if (body.price !== undefined && Number(body.price) < 0) errors.push("El precio debe ser un número válido.");
  if (body.status && !STATUSES.includes(body.status)) errors.push("Estado inválido.");
  return errors;
}

// POST /api/artworks — crear (solo admin)
router.post("/", requireAuth, async (req, res) => {
  const errors = validatePayload(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const b = req.body;
  const id = randomUUID();
  await db.prepare(`
    INSERT INTO artworks (id, title, category, price, currency, description, photos, status, created_at)
    VALUES (@id, @title, @category, @price, @currency, @description, @photos, @status, @created_at)
  `).run({
    id,
    title: b.title.trim(),
    category: (b.category || "").trim(),
    price: Number(b.price) || 0,
    currency: b.currency === "USD" ? "USD" : "ARS",
    description: b.description || "",
    photos: JSON.stringify(Array.isArray(b.photos) ? b.photos : []),
    status: STATUSES.includes(b.status) ? b.status : "disponible",
    created_at: Date.now(),
  });

  const row = await db.prepare("SELECT * FROM artworks WHERE id = ?").get(id);
  res.status(201).json(rowToArtwork(row));
});

// PUT /api/artworks/:id — editar (solo admin)
router.put("/:id", requireAuth, async (req, res) => {
  const existing = await db.prepare("SELECT * FROM artworks WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Obra no encontrada." });

  const errors = validatePayload(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const b = req.body;
  await db.prepare(`
    UPDATE artworks SET
      title = @title, category = @category, price = @price, currency = @currency,
      description = @description, photos = @photos, status = @status
    WHERE id = @id
  `).run({
    id: req.params.id,
    title: b.title.trim(),
    category: (b.category || "").trim(),
    price: Number(b.price) || 0,
    currency: b.currency === "USD" ? "USD" : "ARS",
    description: b.description || "",
    photos: JSON.stringify(Array.isArray(b.photos) ? b.photos : []),
    status: STATUSES.includes(b.status) ? b.status : existing.status,
  });

  const row = await db.prepare("SELECT * FROM artworks WHERE id = ?").get(req.params.id);
  res.json(rowToArtwork(row));
});

// PATCH /api/artworks/:id/status — cambio rápido de estado (solo admin)
router.patch("/:id/status", requireAuth, async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Estado inválido." });

  const existing = await db.prepare("SELECT * FROM artworks WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Obra no encontrada." });

  await db.prepare("UPDATE artworks SET status = ? WHERE id = ?").run(status, req.params.id);
  const row = await db.prepare("SELECT * FROM artworks WHERE id = ?").get(req.params.id);
  res.json(rowToArtwork(row));
});

// DELETE /api/artworks/:id — eliminar (solo admin)
router.delete("/:id", requireAuth, async (req, res) => {
  const existing = await db.prepare("SELECT * FROM artworks WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Obra no encontrada." });
  await db.prepare("DELETE FROM artworks WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
