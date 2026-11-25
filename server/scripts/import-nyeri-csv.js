const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CSV_PATH = path.resolve(process.argv[2] || path.join(__dirname, '../NYERI_sample_20k.csv'));
const BATCH_SIZE = 500;

function normalizeName(name) {
  return name.trim().toUpperCase();
}

function parseDate(dob) {
  if (!dob) return null;
  const parts = dob.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);
    if (year > 1900 && year < 2100 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }
  return null;
}

function formatPhone(phone) {
  if (!phone) return null;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('254') && cleaned.length === 12) return '+' + cleaned;
  if (cleaned.startsWith('0') && cleaned.length === 10) return '+254' + cleaned.slice(1);
  if (cleaned.length === 9) return '+254' + cleaned;
  return null;
}

async function getOrCreateCounty(name) {
  const normalized = normalizeName(name);
  // Use case-insensitive match on name
  let { data } = await supabase.from('counties').select('id').ilike('name', normalized).single();
  if (data) return data.id;

  // Find existing county code for NYERI (code '19')
  const code = normalized === 'NYERI' ? '19' : String(Math.floor(Math.random() * 47) + 1).padStart(2, '0');
  const { data: inserted, error } = await supabase
    .from('counties')
    .insert({ code, name: normalized })
    .select('id')
    .single();
  if (error) throw error;
  return inserted.id;
}

async function getOrCreateConstituency(countyId, name) {
  const normalized = normalizeName(name);
  let { data } = await supabase.from('constituencies').select('id').eq('county_id', countyId).ilike('name', normalized).single();
  if (data) return data.id;

  const { data: inserted, error } = await supabase
    .from('constituencies')
    .insert({ county_id: countyId, code: normalized.slice(0, 3).padStart(3, '0'), name: normalized })
    .select('id')
    .single();
  if (error) throw error;
  return inserted.id;
}

async function getOrCreateWard(constituencyId, name) {
  const normalized = normalizeName(name);
  let { data } = await supabase.from('wards').select('id').eq('constituency_id', constituencyId).ilike('name', normalized).single();
  if (data) return data.id;

  const { data: inserted, error } = await supabase
    .from('wards')
    .insert({ constituency_id: constituencyId, code: normalized.slice(0, 6), name: normalized })
    .select('id')
    .single();
  if (error) throw error;
  return inserted.id;
}

async function getOrCreatePollingStation(wardId, name, centerName) {
  const normalized = normalizeName(name);
  const displayName = normalized === 'N/A' ? normalizeName(centerName) : normalized;
  if (displayName === 'N/A') return null;

  let { data } = await supabase.from('polling_stations').select('id').eq('ward_id', wardId).ilike('name', displayName).single();
  if (data) return data.id;

  const code = `PS-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const { data: inserted, error } = await supabase
    .from('polling_stations')
    .insert({ ward_id: wardId, code, name: displayName, is_active: true })
    .select('id')
    .single();
  if (error) throw error;
  return inserted.id;
}

async function importCsv() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`CSV file not found: ${CSV_PATH}`);
    process.exit(1);
  }

  console.log(`Reading CSV: ${CSV_PATH}`);
  const raw = fs.readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.trim().split('\n');
  console.log(`Total lines: ${lines.length} (${lines.length - 1} data rows)`);

  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  console.log('Headers:', header);

  // Create import batch record
  const { data: batch, error: batchError } = await supabase
    .from('import_batches')
    .insert({ filename: path.basename(CSV_PATH), total_rows: lines.length - 1, status: 'processing' })
    .select('id')
    .single();

  if (batchError) throw batchError;
  const batchId = batch.id;
  let success = 0, failed = 0;
  const errors = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.length < header.length) continue;

    const row = {};
    header.forEach((h, idx) => { row[h] = cols[idx] || ''; });

    try {
      const countyId = await getOrCreateCounty(row.county);
      const constituencyId = await getOrCreateConstituency(countyId, row.constituency);
      const wardId = await getOrCreateWard(constituencyId, row.caw);
      const pollingStationId = await getOrCreatePollingStation(wardId, row.polling_station, row.polling_center);

      const fullName = [row.fname, row.mname, row.sname].filter(Boolean).join(' ');
      const phone = formatPhone(row.phone);
      const email = phone ? `${phone.replace(/\D/g, '')}@voter.engageloop` : null;
      const password = 'EngageLoop2026!';

      const { data: user, error: userError } = await supabase
        .from('users')
        .upsert({
          email,
          phone,
          full_name: fullName,
          first_name: row.fname,
          middle_name: row.mname,
          last_name: row.sname,
          id_number: row.id_passport_no,
          id_type: row.id_passport_no.length > 8 ? 'passport' : 'national_id',
          date_of_birth: parseDate(row.date_of_birth),
          sex: row.sex,
          county_id: countyId,
          constituency_id: constituencyId,
          ward_id: wardId,
          polling_station_id: pollingStationId,
          polling_station_name: pollingStationId ? (row.polling_station === 'N/A' ? row.polling_center : row.polling_station) : null,
          password_hash: password,
          role: 'voter',
          source: 'csv_import',
          import_batch_id: batchId,
        }, { onConflict: 'id_number' })
        .select('id')
        .single();

      if (userError && userError.code !== '23505') throw userError;
      success++;

      if (i % 100 === 0) console.log(`Processed ${i}/${lines.length - 1}...`);
    } catch (err) {
      failed++;
      errors.push({ row: i + 1, error: err.message, data: row });
      if (failed % 50 === 0) console.error(`Failed ${failed} rows so far...`);
    }
  }

  await supabase
    .from('import_batches')
    .update({ successful_rows: success, failed_rows: failed, errors, status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', batchId);

  console.log(`\nImport complete:`);
  console.log(`  Success: ${success}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Batch ID: ${batchId}`);
}

importCsv().catch(console.error);