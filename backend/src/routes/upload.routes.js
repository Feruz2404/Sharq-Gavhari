const router = require('express').Router();
const ctrl = require('../controllers/upload.controller');
const { requireAdmin } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/', requireAdmin, upload.single('file'), ctrl.uploadFile);

module.exports = router;
