const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const db = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// Máximo 8 intentos de login cada 15 minutos por IP — protección real contra fuerza bruta,
// aplicada en el servidor (a diferencia de un límite solo en el navegador).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de acceso. Probá de nuevo en unos minutos." },
});

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 12 * 60 * 60 * 1000,
    path: "/",
  };
}

router.post("/login", loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son obligatorios." });
  }

  const user = db.prepare("SELECT * FROM admin_users WHERE username = ?").get(username);
  // Mismo mensaje de error tanto si el usuario no existe como si la contraseña es incorrecta,
  // para no revelar qué usuarios existen.
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
  }

  const token = jwt.sign(
    { sub: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "12h" }
  );

  res.cookie("session", token, cookieOptions());
  res.json({ username: user.username });
});

router.post("/logout", (req, res) => {
  res.clearCookie("session", { ...cookieOptions(), maxAge: 0 });
  res.json({ ok: true });
});

router.get("/me", requireAuth, (req, res) => {
  res.json({ username: req.admin.username });
});

router.post("/change-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword || newPassword.length < 8) {
    return res.status(400).json({
      error: "Necesitás la contraseña actual y una nueva de al menos 8 caracteres.",
    });
  }
  const user = db.prepare("SELECT * FROM admin_users WHERE id = ?").get(req.admin.sub);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    return res.status(401).json({ error: "La contraseña actual no es correcta." });
  }
  const hash = bcrypt.hashSync(newPassword, 12);
  db.prepare("UPDATE admin_users SET password_hash = ? WHERE id = ?").run(hash, user.id);
  res.json({ ok: true });
});

module.exports = router;
