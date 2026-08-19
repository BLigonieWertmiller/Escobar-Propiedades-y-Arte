const express = require("express");
const { randomUUID } = require("crypto");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const OPERATIONS = ["venta", "alquiler"];
const TYPES = ["casa", "departamento", "ph", "terreno", "local"];
const STATUSES = ["disponible", "reservada", "vendida", "alquilada"];

function rowToProperty(row) {
  return {
    ...row,
    features: JSON.parse(row.features || "[]"),
    photos: JSON.parse(row.photos || "[]"),
  };
}

// GET /api/properties — listado público con filtros por query string
router.get("/", (req, res) => {
  const { operation, type, location, priceMin, priceMax, bedrooms, includeClosed } = req.query;

  let sql = "SELECT * FROM properties WHERE 1=1";
  const params = [];

  if (!includeClosed) {
    sql += " AND status NOT IN ('vendida', 'alquilada')";
  }
  if (operation && OPERATIONS.includes(operation)) {
    sql += " AND operation = ?";
    params.push(operation);
  }
  if (type && TYPES.includes(type)) {
    sql += " AND type = ?";
    params.push(type);
  }
  if (location) {
    sql += " AND (location LIKE ? OR address LIKE ?)";
    params.push(`%${location}%`, `%${location}%`);
  }
  if (priceMin) {
    sql += " AND price >= ?";
    params.push(Number(priceMin));
  }
  if (priceMax) {
    sql += " AND price <= ?";
    params.push(Number(priceMax));
  }
  if (bedrooms) {
    sql += " AND bedrooms >= ?";
    params.push(Number(bedrooms));
  }
  sql += " ORDER BY created_at DESC";

  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(rowToProperty));
});

// GET /api/properties/:id — detalle público de una propiedad
router.get("/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM properties WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Propiedad no encontrada." });
  res.json(rowToProperty(row));
});

function validatePayload(body) {
  const errors = [];
  if (!body.title || !body.title.trim()) errors.push("El título es obligatorio.");
  if (!OPERATIONS.includes(body.operation)) errors.push("Operación inválida.");
  if (!TYPES.includes(body.type)) errors.push("Tipo de propiedad inválido.");
  if (body.price === undefined || Number(body.price) < 0) errors.push("El precio debe ser un número válido.");
  if (!body.location || !body.location.trim()) errors.push("La ubicación es obligatoria.");
  if (body.status && !STATUSES.includes(body.status)) errors.push("Estado inválido.");
  return errors;
}

// POST /api/properties — crear (solo admin)
router.post("/", requireAuth, (req, res) => {
  const errors = validatePayload(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const b = req.body;
  const id = randomUUID();
  db.prepare(`
    INSERT INTO properties (id, title, operation, type, price, currency, location, address,
      bedrooms, bathrooms, area, description, features, photos, status, created_at)
    VALUES (@id, @title, @operation, @type, @price, @currency, @location, @address,
      @bedrooms, @bathrooms, @area, @description, @features, @photos, @status, @created_at)
  `).run({
    id,
    title: b.title.trim(),
    operation: b.operation,
    type: b.type,
    price: Number(b.price) || 0,
    currency: b.currency === "ARS" ? "ARS" : "USD",
    location: b.location.trim(),
    address: (b.address || "").trim(),
    bedrooms: Number(b.bedrooms) || 0,
    bathrooms: Number(b.bathrooms) || 0,
    area: Number(b.area) || 0,
    description: b.description || "",
    features: JSON.stringify(Array.isArray(b.features) ? b.features : []),
    photos: JSON.stringify(Array.isArray(b.photos) ? b.photos : []),
    status: STATUSES.includes(b.status) ? b.status : "disponible",
    created_at: Date.now(),
  });

  const row = db.prepare("SELECT * FROM properties WHERE id = ?").get(id);
  res.status(201).json(rowToProperty(row));
});

// PUT /api/properties/:id — editar (solo admin)
router.put("/:id", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM properties WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Propiedad no encontrada." });

  const errors = validatePayload(req.body);
  if (errors.length) return res.status(400).json({ error: errors.join(" ") });

  const b = req.body;
  db.prepare(`
    UPDATE properties SET
      title = @title, operation = @operation, type = @type, price = @price, currency = @currency,
      location = @location, address = @address, bedrooms = @bedrooms, bathrooms = @bathrooms,
      area = @area, description = @description, features = @features, photos = @photos, status = @status
    WHERE id = @id
  `).run({
    id: req.params.id,
    title: b.title.trim(),
    operation: b.operation,
    type: b.type,
    price: Number(b.price) || 0,
    currency: b.currency === "ARS" ? "ARS" : "USD",
    location: b.location.trim(),
    address: (b.address || "").trim(),
    bedrooms: Number(b.bedrooms) || 0,
    bathrooms: Number(b.bathrooms) || 0,
    area: Number(b.area) || 0,
    description: b.description || "",
    features: JSON.stringify(Array.isArray(b.features) ? b.features : []),
    photos: JSON.stringify(Array.isArray(b.photos) ? b.photos : []),
    status: STATUSES.includes(b.status) ? b.status : existing.status,
  });

  const row = db.prepare("SELECT * FROM properties WHERE id = ?").get(req.params.id);
  res.json(rowToProperty(row));
});

// PATCH /api/properties/:id/status — cambio rápido de estado (solo admin)
router.patch("/:id/status", requireAuth, (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) return res.status(400).json({ error: "Estado inválido." });

  const existing = db.prepare("SELECT * FROM properties WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Propiedad no encontrada." });

  db.prepare("UPDATE properties SET status = ? WHERE id = ?").run(status, req.params.id);
  const row = db.prepare("SELECT * FROM properties WHERE id = ?").get(req.params.id);
  res.json(rowToProperty(row));
});

// DELETE /api/properties/:id — eliminar (solo admin)
router.delete("/:id", requireAuth, (req, res) => {
  const existing = db.prepare("SELECT * FROM properties WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Propiedad no encontrada." });
  db.prepare("DELETE FROM properties WHERE id = ?").run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
