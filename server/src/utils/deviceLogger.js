const { supabase } = require('../config/supabase');

const DEVICE_LOG_TABLE = 'device_simulation_logs';

async function logSimulation({ device_id, method, session_id, payload, ip_address }) {
  const { data, error } = await supabase
    .from(DEVICE_LOG_TABLE)
    .insert([
      { device_id, method, session_id, payload: JSON.stringify(payload), ip_address, created_at: new Date().toISOString() },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

module.exports = { logSimulation };
