// Uso: npm run seed:admin -- --user admin --password "unaContraseñaSegura123"
// Crea el usuario si no existe, o actualiza su contraseña si ya existe.

require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../db");

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const username = getArg("user", "admin");
const password = getArg("password");

if (!password || password.length < 8) {
  console.error("Uso: npm run seed:admin -- --user admin --password \"contraseñaDeAlMenos8Caracteres\"");
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 12);
const existing = db.prepare("SELECT id FROM admin_users WHERE username = ?").get(username);

if (existing) {
  db.prepare("UPDATE admin_users SET password_hash = ? WHERE username = ?").run(hash, username);
  console.log(`Contraseña actualizada para el usuario "${username}".`);
} else {
  db.prepare("INSERT INTO admin_users (username, password_hash, created_at) VALUES (?, ?, ?)").run(
    username,
    hash,
    Date.now()
  );
  console.log(`Usuario administrador "${username}" creado.`);
}
