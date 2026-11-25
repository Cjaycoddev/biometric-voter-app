const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function testWrite() {
  console.log('Testing write to users table with correct sex value...');
  
  // Try insert with 'Male'
  const { data: insertData, error: insertError } = await supabase
    .from('users')
    .insert({
      email: 'test2@test.com',
      phone: '+254700000001',
      full_name: 'Test User 2',
      first_name: 'Test',
      middle_name: '',
      last_name: 'User',
      id_number: 'TEST124',
      id_type: 'national_id',
      date_of_birth: '1990-01-01',
      sex: 'Male',
      password_hash: 'test',
      role: 'voter',
      source: 'test'
    })
    .select('id')
    .single();
    
  console.log('Insert test:', insertError ? 'FAILED - ' + JSON.stringify(insertError, null, 2) : 'OK - ' + JSON.stringify(insertData));
  
  // Clean up test rows
  await supabase.from('users').delete().in('id_number', ['TEST123', 'TEST124']);
  console.log('Cleanup done');
}

testWrite().catch(console.error);