const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  webauthnRegisterStart,
  webauthnRegisterFinish,
  webauthnAuthStart,
  webauthnAuthFinish,
  webauthnListCredentials,
} = require('../controllers/webauthnController');

router.post('/webauthn/register/start', authMiddleware, webauthnRegisterStart);
router.post('/webauthn/register/finish', authMiddleware, webauthnRegisterFinish);
router.post('/webauthn/auth/start', authMiddleware, webauthnAuthStart);
router.post('/webauthn/auth/finish', authMiddleware, webauthnAuthFinish);
router.get('/webauthn/credentials', authMiddleware, webauthnListCredentials);

module.exports = router;