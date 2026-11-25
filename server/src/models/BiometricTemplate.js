const { supabase } = require('../config/supabase');
const { encrypt, decrypt } = require('../config/encryption');

const TABLE = 'biometric_templates';

async function upsertTemplate({ user_id, template_type, template_data }) {
  const encrypted = encrypt(JSON.stringify(template_data));
  const { data, error } = await supabase
    .from(TABLE)
    .upsert([
      { user_id, template_type, template_data: encrypted, updated_at: new Date().toISOString() },
    ], { onConflict: ['user_id', 'template_type'] })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getTemplate({ user_id, template_type }) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', user_id)
    .eq('template_type', template_type)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  if (!data) return null;
  const decrypted = decrypt(data.template_data);
  return { ...data, template_data: JSON.parse(decrypted) };
}

async function listTemplates(user_id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('user_id', user_id);
  if (error) throw error;
  return data || [];
}

module.exports = {
  upsertTemplate,
  getTemplate,
  listTemplates,
};