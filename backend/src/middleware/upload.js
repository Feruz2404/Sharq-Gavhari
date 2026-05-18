const multer = require('multer');

// Maximum upload size in megabytes. Override with MAX_UPLOAD_MB on the
// backend service if needed.
//
// Default is 50 MB: the admin UI allows high-quality originals up to 50 MB,
// and the frontend (frontend/src/lib/imageCompression.js) compresses every
// selected image down to <= 2 MB before it is sent to this endpoint. The
// generous server-side default ensures that even an unlikely uncompressed
// fallback never trips a stale "Image is too large" error.
const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 50);
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) {
      const err = new Error('Unsupported file type');
      err.code = 'UNSUPPORTED_FILE_TYPE';
      return cb(err);
    }
    cb(null, true);
  },
});

module.exports = { upload, MAX_MB };
