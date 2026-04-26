const multer = require('multer');

const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 5);
const ALLOWED = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(new Error('Unsupported file type'));
    cb(null, true);
  },
});

module.exports = { upload };
