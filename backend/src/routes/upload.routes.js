const router = require('express').Router();
const ctrl = require('../controllers/upload.controller');
const { requireAdmin } = require('../middleware/auth');
const { upload, MAX_MB } = require('../middleware/upload');

// Translate raw multer / file-validation errors into clean, user-facing
// JSON responses with stable error codes. Without this, multer errors leak
// through the default Express error handler as opaque 500s.
function handleUploadErrors(err, _req, res, next) {
  if (!err) return next();
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: `Image is too large. Upload an image up to ${MAX_MB}MB.`,
      code: 'IMAGE_TOO_LARGE',
      maxMB: MAX_MB,
    });
  }
  if (
    err.code === 'UNSUPPORTED_FILE_TYPE' ||
    /Unsupported file type/i.test(String(err.message || ''))
  ) {
    return res.status(400).json({
      error: 'Unsupported file type. Use JPG, PNG or WEBP.',
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
