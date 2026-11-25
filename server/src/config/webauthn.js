const crypto = require('crypto');

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost';
const RP_NAME = 'EngageLoop Biometric Verification';
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000';

function generateChallenge() {
  return crypto.randomBytes(32);
}

function base64urlEncode(buffer) {
  return Buffer.from(buffer)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64urlDecode(str) {
  const padding = '='.repeat((4 - (str.length % 4)) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  return Buffer.from(base64, 'base64');
}

function coerceToArrayBuffer(arg) {
  if (arg instanceof ArrayBuffer) return arg;
  if (arg && arg.buffer instanceof ArrayBuffer) return arg.buffer;
  if (arg && typeof arg === 'object') {
    if (arg.type === 'Buffer' && Array.isArray(arg.data)) {
      return Buffer.from(arg.data).buffer;
    }
    if (Array.isArray(arg)) {
      return Buffer.from(arg).buffer;
    }
  }
  throw new TypeError('Could not coerce to ArrayBuffer');
}

module.exports = {
  RP_ID,
  RP_NAME,
  ORIGIN,
  generateChallenge,
  base64urlEncode,
  base64urlDecode,
  coerceToArrayBuffer,
};