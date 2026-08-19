const path = require("path");
const fs = require("fs");
const bcrypt = require("bcryptjs");
const Database = require("better-sqlite3");

const DATA_DIR = path.join(__dirname, "..", "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, "inmobiliaria.sqlite"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS properties (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    operation TEXT NOT NULL,
    type TEXT NOT NULL,
    price REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'USD',
    location TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL DEFAULT '',
    bedrooms INTEGER NOT NULL DEFAULT 0,
    bathrooms INTEGER NOT NULL DEFAULT 0,
    area REAL NOT NULL DEFAULT 0,
    description TEXT NOT NULL DEFAULT '',
    features TEXT NOT NULL DEFAULT '[]',
    photos TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'disponible',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS artworks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'ARS',
    description TEXT NOT NULL DEFAULT '',
    photos TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'disponible',
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    item_id TEXT NOT NULL DEFAULT '',
    item_title TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'nueva',
    sheet_row INTEGER,
    created_at INTEGER NOT NULL
  );
`);

// --- First-run seeding -------------------------------------------------

function seedAdminIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM admin_users").get().c;
  if (count > 0) return;

  const username = process.env.ADMIN_INITIAL_USER || "admin";
  const password = process.env.ADMIN_INITIAL_PASSWORD;

  if (!password || password === "cambiar-esta-contrasena") {
    console.warn(
      "\n[AVISO] No hay usuarios administradores todavía y ADMIN_INITIAL_PASSWORD no está configurada " +
        "(o sigue con el valor de ejemplo) en tu archivo .env.\n" +
        "Definí ADMIN_INITIAL_USER y ADMIN_INITIAL_PASSWORD con un valor real y reiniciá el servidor " +
        "para crear la cuenta de administrador inicial.\n"
    );
    return;
  }

  const hash = bcrypt.hashSync(password, 12);
  db.prepare(
    "INSERT INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)"
  ).run(username, hash, Date.now());
  console.log(`Usuario administrador inicial creado: "${username}". Cambiá la contraseña luego de tu primer login.`);
}

function seedSettingsIfEmpty() {
  const existing = db.prepare("SELECT value FROM settings WHERE key = 'phone'").get();
  if (!existing) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('phone', ?)").run("5490000000000");
  }
}

function seedDemoPropertiesIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM properties").get().c;
  if (count > 0) return;

  const demo = [
    {
      title: "Casa con parral y quincho",
      operation: "venta",
      type: "casa",
      price: 185000,
      currency: "USD",
      location: "Barrio Los Álamos",
      address: "Calle Los Álamos 450",
      bedrooms: 3,
      bathrooms: 2,
      area: 210,
      description:
        "Casa de una planta rodeada de viñedo propio, con galería techada, quincho y pileta.",
      features: ["Pileta", "Quincho", "Cochera doble"],
      photos: [],
      status: "disponible",
    },
    {
      title: "Departamento a estrenar con balcón",
      operation: "alquiler",
      type: "departamento",
      price: 320000,
      currency: "ARS",
      location: "Zona centro",
      address: "Av. San Martín 2100",
      bedrooms: 2,
      bathrooms: 1,
      area: 65,
      description: "Monoambiente en edificio nuevo con amenities y balcón terraza.",
      features: ["Amenities", "Balcón", "Seguridad 24hs"],
      photos: [],
      status: "disponible",
    },
  ];

  const insert = db.prepare(`
    INSERT INTO properties (id, title, operation, type, price, currency, location, address,
      bedrooms, bathrooms, area, description, features, photos, status, created_at)
    VALUES (@id, @title, @operation, @type, @price, @currency, @location, @address,
      @bedrooms, @bathrooms, @area, @description, @features, @photos, @status, @created_at)
  `);

  const { randomUUID } = require("crypto");
  const tx = db.transaction((rows) => {
    for (const row of rows) {
      insert.run({
        ...row,
        id: randomUUID(),
        features: JSON.stringify(row.features),
        photos: JSON.stringify(row.photos),
        created_at: Date.now(),
      });
    }
  });
  tx(demo);
}

function seedDemoArtworksIfEmpty() {
  const count = db.prepare("SELECT COUNT(*) AS c FROM artworks").get().c;
  if (count > 0) return;

  const demo = [
    {
      title: "Atardecer sobre la cordillera",
      category: "Pintura al óleo",
      price: 45000,
      currency: "ARS",
      description: "Óleo sobre tela, 60x80cm. Paisaje inspirado en la precordillera mendocina.",
      photos: [],
      status: "disponible",
    },
    {
      title: "Vasija en cerámica artesanal",
      category: "Cerámica",
      price: 12000,
      currency: "ARS",
      description: "Pieza única torneada y esmaltada a mano.",
      photos: [],
      status: "disponible",
    },
  ];

  const insert = db.prepare(`
    INSERT INTO artworks (id, title, category, price, currency, description, photos, status, created_at)
    VALUES (@id, @title, @category, @price, @currency, @description, @photos, @status, @created_at)
  `);

  const { randomUUID } = require("crypto");
  const tx = db.transaction((rows) => {
    for (const row of rows) {
      insert.run({ ...row, id: randomUUID(), photos: JSON.stringify(row.photos), created_at: Date.now() });
    }
  });
  tx(demo);
}

seedAdminIfEmpty();
seedSettingsIfEmpty();
seedDemoPropertiesIfEmpty();
seedDemoArtworksIfEmpty();

module.exports = db;
