const fs = require('fs');
const path = require('path');
const { createUser } = require('../models/User');

const CSV_PATH = path.resolve(process.argv[2] || path.join(__dirname, '../../users.csv'));

async function importCsv() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.trim().split('\n');
  if (lines.length < 2) {
    console.error('CSV appears empty or missing header row.');
    process.exit(1);
  }

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  let success = 0, failed = 0;

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    const row = {};
    header.forEach((h, idx) => { row[h] = cols[idx] || ''; });

    try {
      await createUser({
        email: row.email,
        phone: row.phone,
        full_name: row.full_name || row.name,
        id_number: row.id_number || row.id,
        password: row.password || 'EngageLoop2026!',
        polling_station: row.polling_station,
      });
      success++;
    } catch (err) {
      failed++;
      console.error(`Row ${i + 1} failed: ${err.message}`);
    }
  }

  console.log(`Import complete: ${success} succeeded, ${failed} failed.`);
}

importCsv();