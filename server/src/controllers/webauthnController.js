const { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } = require('@simplewebauthn/server');
const { RP_ID, RP_NAME, ORIGIN, generateChallenge, base64urlEncode, base64urlDecode, coerceToArrayBuffer } = require('../config/webauthn');
const { createCredential, getCredential, updateCounter, listCredentials } = require('../models/WebAuthnCredential');
const { createLog } = require('../models/VerificationLog');
const { authMiddleware } = require('../middleware/auth');

const CHALLENGES = new Map(); // In production, use Redis with TTL

function storeChallenge(userId, challenge, type) {
  CHALLENGES.set(`${userId}:${type}`, { challenge: base64urlEncode(challenge), expires: Date.now() + 5 * 60 * 1000 });
}

function getAndClearChallenge(userId, type) {
  const key = `${userId}:${type}`;
  const entry = CHALLENGES.get(key);
  if (entry && entry.expires > Date.now()) {
    CHALLENGES.delete(key);
    return base64urlDecode(entry.challenge);
  }
  CHALLENGES.delete(key);
  return null;
}

async function webauthnRegisterStart(req, res) {
  const { userId } = req.user;
  const challenge = generateChallenge();
  storeChallenge(userId, challenge, 'register');

  const options = generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: userId,
    userName: req.user.email,
    userDisplayName: req.user.full_name || req.user.email,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform', // Use phone's built-in sensor
      userVerification: 'required',
      residentKey: 'preferred',
    },
    supportedAlgorithmIDs: [-7, -257], // ES256, RS256
    timeout: 60000,
    challenge,
  });

  return res.json({ options, challenge: base64urlEncode(challenge) });
}

async function webauthnRegisterFinish(req, res) {
  const { userId } = req.user;
  const { credential } = req.body;
  const expectedChallenge = getAndClearChallenge(userId, 'register');

  if (!expectedChallenge) {
    return res.status(400).json({ error: 'Challenge expired or invalid' });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    });
  } catch (err) {
    console.error('WebAuthn registration verification failed:', err);
    return res.status(400).json({ error: 'Registration verification failed' });
  }

  const { verified, registrationInfo } = verification;
  if (!verified || !registrationInfo) {
    return res.status(400).json({ error: 'Registration not verified' });
  }

  await createCredential({
    user_id: userId,
    credential_id: registrationInfo.credentialID,
    public_key: registrationInfo.credentialPublicKey,
    counter: registrationInfo.counter,
    transports: credential.response.transports || [],
  });

  await createLog({
    user_id: userId,
    device_id: 'webauthn-platform',
    method: 'fingerprint_enroll',
    status: 'success',
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
  });

  return res.json({ verified: true, message: 'Fingerprint enrolled successfully' });
}

async function webauthnAuthStart(req, res) {
  const { userId } = req.user;
  const credentials = await listCredentials(userId);

  if (!credentials.length) {
    return res.status(404).json({ error: 'No fingerprint enrolled' });
  }

  const challenge = generateChallenge();
  storeChallenge(userId, challenge, 'auth');

  const options = generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials: credentials.map(c => ({
      id: c.credential_id,
      type: 'public-key',
      transports: c.transports,
    })),
    userVerification: 'required',
    timeout: 60000,
    challenge,
  });

  return res.json({ options, challenge: base64urlEncode(challenge) });
}

async function webauthnAuthFinish(req, res) {
  const { userId } = req.user;
  const { credential } = req.body;
  const expectedChallenge = getAndClearChallenge(userId, 'auth');

  if (!expectedChallenge) {
    return res.status(400).json({ error: 'Challenge expired or invalid' });
  }

  const storedCredential = await getCredential(credential.id);
  if (!storedCredential) {
    return res.status(404).json({ error: 'Credential not found' });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      authenticator: {
        credentialID: storedCredential.credential_id,
        credentialPublicKey: storedCredential.public_key,
        counter: storedCredential.counter,
        transports: storedCredential.transports,
      },
      requireUserVerification: true,
    });
  } catch (err) {
    console.error('WebAuthn authentication verification failed:', err);
    return res.status(400).json({ error: 'Authentication verification failed' });
  }

  const { verified, authenticationInfo } = verification;
  if (!verified || !authenticationInfo) {
    return res.status(401).json({ error: 'Fingerprint verification failed' });
  }

  await updateCounter(storedCredential.credential_id, authenticationInfo.newCounter);

  await createLog({
    user_id: userId,
    device_id: 'webauthn-platform',
    method: 'fingerprint',
    status: 'success',
    ip_address: req.ip,
    user_agent: req.get('User-Agent'),
  });

  return res.json({
    verified: true,
    message: 'Fingerprint verified successfully',
    method: 'fingerprint',
  });
}

async function webauthnListCredentials(req, res) {
  const { userId } = req.user;
  const credentials = await listCredentials(userId);
  return res.json({
    credentials: credentials.map(c => ({
      credential_id: c.credential_id,
      transports: c.transports,
      created_at: c.created_at,
    })),
  });
}

module.exports = {
  webauthnRegisterStart,
  webauthnRegisterFinish,
  webauthnAuthStart,
  webauthnAuthFinish,
  webauthnListCredentials,
};