const { supabase } = require('../config/supabase');

async function getCounties(req, res) {
  try {
    const { data, error } = await supabase.from('counties').select('id, code, name').order('code');
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch counties' });
  }
}

async function getConstituencies(req, res) {
  const { county_id } = req.query;
  try {
    let query = supabase.from('constituencies').select('id, code, name').order('code');
    if (county_id) query = query.eq('county_id', county_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch constituencies' });
  }
}

async function getWards(req, res) {
  const { constituency_id } = req.query;
  try {
    let query = supabase.from('wards').select('id, code, name').order('code');
    if (constituency_id) query = query.eq('constituency_id', constituency_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch wards' });
  }
}

async function getPollingStations(req, res) {
  const { ward_id } = req.query;
  try {
    let query = supabase.from('polling_stations').select('id, code, name').eq('is_active', true).order('code');
    if (ward_id) query = query.eq('ward_id', ward_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch polling stations' });
  }
}

async function validateIdNumber(req, res) {
  const { id_number } = req.query;
  if (!id_number) return res.status(400).json({ error: 'id_number required' });

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, id_number')
      .eq('id_number', id_number)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (data) return res.json({ exists: true, message: 'ID number already registered', voter: data });
    return res.json({ exists: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Validation failed' });
  }
}

async function validatePhone(req, res) {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'phone required' });

  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, phone')
      .eq('phone', phone)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    if (data) return res.json({ exists: true, message: 'Phone already registered', voter: data });
    return res.json({ exists: false });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Validation failed' });
  }
}

module.exports = {
  getCounties,
  getConstituencies,
  getWards,
  getPollingStations,
  validateIdNumber,
  validatePhone,
};