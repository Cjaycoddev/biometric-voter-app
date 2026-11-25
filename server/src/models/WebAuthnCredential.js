const { supabase } = require('../config/supabase');

const TABLE = 'webauthn_credentials';

async function createCredential({ user_id, credential_id, public_key, counter, transports }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      { user_id, credential_id, public_key, counter, transports, created_at: new Date().toISOString() },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getCredential(credential_id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('credential_id', credential_id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function listCredentials(user_id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', user_id);
  if (error) throw error;
  return data || [];
}

async function updateCounter(credential_id, counter) {
  const { data, error } = await supabase
    .from(TABLE)
    .update({ counter })
    .eq('credential_id', credential_id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = {
  createCredential,
  getCredential,
  listCredentials,
  updateCounter,
};