const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { requireAdmin } = require('../middleware/auth');

router.get('/', ctrl.get);
router.put('/', requireAdmin, ctrl.update);

module.exports = router;
