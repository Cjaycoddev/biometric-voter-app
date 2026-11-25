const crypto = require('crypto');

function similarityScore(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === b[i]) matches++;
  }
  return matches / a.length;
}

function hashTemplate(template) {
  return crypto.createHash('sha256').update(JSON.stringify(template)).digest('hex');
}

function generateMockFaceTemplate() {
  const template = [];
  for (let i = 0; i < 128; i++) {
    template.push(Math.round(Math.random() * 255));
  }
  return template;
}

function generateMockFingerprintTemplate() {
  const template = [];
  for (let i = 0; i < 256; i++) {
    template.push(Math.round(Math.random() * 255));
  }
  return template;
}

function simulateMatch(stored, live, threshold = 0.85) {
  const score = similarityScore(stored, live);
  return { score, matched: score >= threshold };
}

module.exports = {
  similarityScore,
  hashTemplate,
  generateMockFaceTemplate,
  generateMockFingerprintTemplate,
  simulateMatch,
};
