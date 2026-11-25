const { supabase } = require('../config/supabase');

const DEVICES_TABLE = 'registered_devices';

async function registerDevice({ device_id, device_name, device_type, owner_id }) {
  const { data, error } = await supabase
    .from(DEVICES_TABLE)
    .upsert([
      { device_id, device_name, device_type, owner_id, registered_at: new Date().toISOString(), active: true },
    ], { onConflict: ['device_id'] })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getDevice(device_id) {
  const { data, error } = await supabase
    .from(DEVICES_TABLE)
    .select('*')
    .eq('device_id', device_id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function isDeviceActive(device_id) {
  const device = await getDevice(device_id);
  return Boolean(device && device.active);
}

module.exports = {
  registerDevice,
  getDevice,
  isDeviceActive,
};
