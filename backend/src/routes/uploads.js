const express = require("express");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const BUCKET = process.env.SUPABASE_BUCKET || "fotos";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.has(file.mimetype)) {
      return cb(new Error("Solo se permiten imágenes JPG, PNG, WEBP o GIF."));
    }
    cb(null, true);
  },
});

// POST /api/uploads — solo admin, hasta 10 imágenes por request.
// Sube cada foto al bucket de Supabase Storage y devuelve las URLs públicas.
router.post("/", requireAuth, (req, res) => {
  upload.array("photos", 10)(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    try {
      const urls = [];
      for (const file of req.files || []) {
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

        const { error } = await supabase.storage.from(BUCKET).upload(filename, file.buffer, {
          contentType: file.mimetype,
        });
        if (error) throw error;

        const { data } = supabase.storage.from(BUCKET).getPublicUrl(filename);
        urls.push(data.publicUrl);
      }
      res.status(201).json({ urls });
    } catch (e) {
      console.error("[Uploads] No se pudieron subir las fotos:", e.message);
      res.status(500).json({ error: "No se pudieron subir las fotos." });
    }
  });
});

module.exports = router;
