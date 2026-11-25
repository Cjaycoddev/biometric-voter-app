const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { enroll, verify, verifyFace, enrollFace, simulateDevice, getMyTemplates } = require('../controllers/biometricController');

router.post('/enroll', authMiddleware, enroll);
router.post('/verify', authMiddleware, verify);
router.post('/verify-face', authMiddleware, verifyFace);
router.post('/enroll-face', authMiddleware, enrollFace);
router.post('/simulate-device', authMiddleware, simulateDevice);
router.get('/my-templates', authMiddleware, getMyTemplates);

module.exports = router;