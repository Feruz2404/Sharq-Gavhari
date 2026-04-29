const multer = require('multer');

// Maximum upload size in megabytes. Override with MAX_UPLOAD_MB on the
// backend service to allow even larger high-quality images. Default is 15MB
// so that admins can upload high-resolution restaurant photography for the
// global app background without manual env tweaking.
const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 15);
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
