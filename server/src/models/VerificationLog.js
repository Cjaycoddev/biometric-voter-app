const { supabase } = require('../config/supabase');

const TABLE = 'verification_logs';

async function createLog({ user_id, device_id, method, status, ip_address, user_agent }) {
  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      { user_id, device_id, method, status, ip_address, user_agent, created_at: new Date().toISOString() },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function listLogs({ user_id, limit = 50, offset = 0 } = {}) {
  let query = supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (user_id) query = query.eq('user_id', user_id);
  query = query.range(offset, offset + limit - 1);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

module.exports = {
  createLog,
  listLogs,
};
