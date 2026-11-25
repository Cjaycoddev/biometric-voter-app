const { upsertTemplate, getTemplate, listTemplates } = require('../models/BiometricTemplate');
const { createLog } = require('../models/VerificationLog');
const { authMiddleware } = require('../middleware/auth');
const { generateMockFaceTemplate, generateMockFingerprintTemplate, simulateMatch } = require('../services/biometricService');
const { logSimulation } = require('../utils/deviceLogger');
const crypto = require('crypto');

async function enroll(req, res) {
  const { userId } = req.user;
  const { template_type, template_data, device_id } = req.body;

  if (!['face', 'fingerprint'].includes(template_type)) {
    return res.status(400).json({ error: 'template_type must be face or fingerprint' });
  }

  await upsertTemplate({ user_id: userId, template_type, template_data });
  await createLog({ user_id: userId, device_id, method: 'enroll', status: 'success', ip_address: req.ip, user_agent: req.get('User-Agent') });

  return res.json({ message: 'Biometric template enrolled successfully' });
}

async function verify(req, res) {
  const { userId } = req.user;
  const { template_type, live_template, device_id } = req.body;

  if (!['face', 'fingerprint'].includes(template_type)) {
    return res.status(400).json({ error: 'template_type must be face or fingerprint' });
  }

  const stored = await getTemplate({ user_id: userId, template_type });
  if (!stored) {
    return res.status(404).json({ error: 'No biometric template enrolled for this method' });
  }

  const { matched, score } = simulateMatch(stored.template_data, live_template);

  await createLog({
    user_id: userId,
    device_id,
    method: template_type,
    status: matched ? 'success' : 'failed',
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
  });

  if (!matched) {
    return res.status(401).json({ error: 'Biometric verification failed', score });
  }

  return res.json({
    message: 'Biometric verification successful',
    verified: true,
    score,
    method: template_type,
  });
}

async function verifyFace(req, res) {
  const { userId } = req.user;
  const { image_base64, device_id } = req.body;

  if (!image_base64) {
    return res.status(400).json({ error: 'image_base64 is required' });
  }

  const stored = await getTemplate({ user_id: userId, template_type: 'face' });
  if (!stored) {
    return res.status(404).json({ error: 'No face template enrolled' });
  }

  // Simulate face matching from captured image
  // In production, you'd use a face recognition library (face-api.js, face-recognition, etc.)
  // For now, we generate a template from the image hash and compare
  const imageHash = crypto.createHash('sha256').update(image_base64).digest();
  const liveTemplate = Array.from(imageHash.slice(0, 128));

  const { matched, score } = simulateMatch(stored.template_data, liveTemplate);

  await createLog({
    user_id: userId,
    device_id: device_id || 'camera-phone',
    method: 'face',
    status: matched ? 'success' : 'failed',
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
  });

  if (!matched) {
    return res.status(401).json({ error: 'Face verification failed', score });
  }

  return res.json({
    message: 'Face verification successful',
    verified: true,
    score,
    method: 'face',
  });
}

async function enrollFace(req, res) {
  const { userId } = req.user;
  const { image_base64, device_id } = req.body;

  if (!image_base64) {
    return res.status(400).json({ error: 'image_base64 is required' });
  }

  // Generate template from image hash
  const imageHash = crypto.createHash('sha256').update(image_base64).digest();
  const templateData = Array.from(imageHash.slice(0, 128));

  await upsertTemplate({ user_id: userId, template_type: 'face', template_data: templateData });
  await createLog({ user_id: userId, device_id: device_id || 'camera-phone', method: 'face_enroll', status: 'success', ip_address: req.ip, user_agent: req.get('User-Agent') });

  return res.json({ message: 'Face enrolled successfully' });
}

async function simulateDevice(req, res) {
  const { method, session_id, payload } = req.body;
  const device_id = 'phone-simulator-' + session_id;

  await logSimulation({ device_id, method, session_id, payload, ip_address: req.ip });

  return res.json({
    message: 'Device simulation logged',
    device_id,
    method,
    simulated: true,
  });
}

async function getMyTemplates(req, res) {
  const { userId } = req.user;
  const templates = await listTemplates(userId);
  return res.json({ templates });
}

module.exports = { enroll, verify, verifyFace, enrollFace, simulateDevice, getMyTemplates };