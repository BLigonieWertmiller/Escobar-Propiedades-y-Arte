const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF."));
    }
    cb(null, true);
  },
});

// POST /api/uploads — solo admin, hasta 10 imágenes por request
router.post("/", requireAuth, (req, res) => {
  upload.array("photos", 10)(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    const urls = (req.files || []).map((f) => `/uploads/${f.filename}`);
    res.status(201).json({ urls });
  });
});

module.exports = router;
