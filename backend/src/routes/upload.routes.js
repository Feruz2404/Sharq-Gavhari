const router = require('express').Router();
const ctrl = require('../controllers/upload.controller');
const { requireAdmin } = require('../middleware/auth');
const { upload, MAX_MB } = require('../middleware/upload');

// Translate raw multer / file-validation errors into clean, user-facing
// JSON responses with stable error codes. Without this, multer errors leak
// through the default Express error handler as opaque 500s.
//
// User-facing strings are Uzbek-first to match the admin UI. The frontend
// also has its own Uzbek mapping in ImageUpload.jsx so the toast stays
// localized even if a brand-new error code shows up here.
function handleUploadErrors(err, _req, res, next) {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'Rasm hajmi juda katta. ' + MAX_MB + 'MB gacha rasm yuklang.',
      code: 'IMAGE_TOO_LARGE',
      maxMB: MAX_MB,
    });
  }
  if (
    err.code === 'UNSUPPORTED_FILE_TYPE' ||
    /Unsupported file type/i.test(String(err.message || ''))
  ) {
    return res.status(400).json({
      error: 'Noto\u2018g\u2018ri fayl turi. JPG, PNG yoki WEBP yuklang.',
      code: 'UNSUPPORTED_FILE_TYPE',
    });
  }
  return next(err);
}

router.post(
  '/',
  requireAdmin,
  (req, res, next) =>
    upload.single('file')(req, res, (err) => handleUploadErrors(err, req, res, next)),
  ctrl.uploadFile
);

module.exports = router;
