const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length < 16) {
  throw new Error('ENCRYPTION_KEY must be at least 16 characters');
}

function encrypt(text) {
  const ciphertext = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  return ciphertext;
}

function decrypt(ciphertext) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
