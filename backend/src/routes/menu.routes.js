const router = require('express').Router();
const ctrl = require('../controllers/menu.controller');

// Public, anonymous-safe endpoint. The customer menu polls it every
// ~30 s so it stays under the SHORT_CACHE TTL set in the controller.
router.get('/version', ctrl.version);

module.exports = router;
