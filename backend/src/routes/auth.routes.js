const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const { requireAdmin } = require('../middleware/auth');

router.post('/login', ctrl.login);
router.get('/me', requireAdmin, ctrl.me);

module.exports = router;
