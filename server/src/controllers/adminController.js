const { supabase } = require('../config/supabase');
const { authMiddleware } = require('../middleware/auth');

async function getHierarchyOptions(req, res) {
  const { level, parent_id } = req.query;

  try {
    let query;
    switch (level) {
      case 'counties':
        query = supabase.from('counties').select('id, code, name').order('code');
        break;
      case 'constituencies':
        query = supabase.from('constituencies').select('id, code, name, county_id').eq('county_id', parent_id).order('code');
        break;
      case 'wards':
        query = supabase.from('wards').select('id, code, name, constituency_id').eq('constituency_id', parent_id).order('code');
        break;
      case 'locations':
        query = supabase.from('locations').select('id, code, name, ward_id').eq('ward_id', parent_id).order('name');
        break;
      case 'sub_locations':
        query = supabase.from('sub_locations').select('id, code, name, location_id').eq('location_id', parent_id).order('name');
        break;
      case 'polling_stations':
        query = supabase.from('polling_stations').select('id, code, name, ward_id, sub_location_id').eq('ward_id', parent_id).eq('is_active', true).order('code');
        break;
      default:
        return res.status(400).json({ error: 'Invalid level' });
    }

    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch hierarchy' });
  }
}

async function getMetrics(req, res) {
  const { county_id, constituency_id, ward_id, polling_station_id } = req.query;

  try {
    let baseQuery = supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'voter');

    if (county_id) baseQuery = baseQuery.eq('county_id', county_id);
    if (constituency_id) baseQuery = baseQuery.eq('constituency_id', constituency_id);
    if (ward_id) baseQuery = baseQuery.eq('ward_id', ward_id);
    if (polling_station_id) baseQuery = baseQuery.eq('polling_station_id', polling_station_id);

    const { count: total, error: totalError } = await baseQuery;
    if (totalError) throw totalError;

    let verifiedQuery = supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'voter').eq('is_verified', true);
    if (county_id) verifiedQuery = verifiedQuery.eq('county_id', county_id);
    if (constituency_id) verifiedQuery = verifiedQuery.eq('constituency_id', constituency_id);
    if (ward_id) verifiedQuery = verifiedQuery.eq('ward_id', ward_id);
    if (polling_station_id) verifiedQuery = verifiedQuery.eq('polling_station_id', polling_station_id);
    const { count: verified } = await verifiedQuery;

    let biometricQuery = supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'voter').eq('is_biometric_enrolled', true);
    if (county_id) biometricQuery = biometricQuery.eq('county_id', county_id);
    if (constituency_id) biometricQuery = biometricQuery.eq('constituency_id', constituency_id);
    if (ward_id) biometricQuery = biometricQuery.eq('ward_id', ward_id);
    if (polling_station_id) biometricQuery = biometricQuery.eq('polling_station_id', polling_station_id);
    const { count: biometric } = await biometricQuery;

    let faceQuery = supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'voter').eq('face_enrolled', true);
    if (county_id) faceQuery = faceQuery.eq('county_id', county_id);
    if (constituency_id) faceQuery = faceQuery.eq('constituency_id', constituency_id);
    if (ward_id) faceQuery = faceQuery.eq('ward_id', ward_id);
    if (polling_station_id) faceQuery = faceQuery.eq('polling_station_id', polling_station_id);
    const { count: face } = await faceQuery;

    let fingerprintQuery = supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'voter').eq('fingerprint_enrolled', true);
    if (county_id) fingerprintQuery = fingerprintQuery.eq('county_id', county_id);
    if (constituency_id) fingerprintQuery = fingerprintQuery.eq('constituency_id', constituency_id);
    if (ward_id) fingerprintQuery = fingerprintQuery.eq('ward_id', ward_id);
    if (polling_station_id) fingerprintQuery = fingerprintQuery.eq('polling_station_id', polling_station_id);
    const { count: fingerprint } = await fingerprintQuery;

    return res.json({
      total: total || 0,
      verified: verified || 0,
      biometric_enrolled: biometric || 0,
      face_enrolled: face || 0,
      fingerprint_enrolled: fingerprint || 0,
      verification_rate: total ? ((verified || 0) / total * 100).toFixed(1) : 0,
      biometric_rate: total ? ((biometric || 0) / total * 100).toFixed(1) : 0,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch metrics' });
  }
}

async function searchVoters(req, res) {
  const {
    q,
    county_id,
    constituency_id,
    ward_id,
    location_id,
    sub_location_id,
    polling_station_id,
    is_verified,
    has_biometric,
    sex,
    page = 1,
    limit = 50,
    sort = 'created_at',
    order = 'desc',
  } = req.query;

  try {
    let query = supabase
      .from('users')
      .select(`
        id,
        full_name,
        first_name,
        middle_name,
        last_name,
        id_number,
        phone,
        email,
        date_of_birth,
        sex,
        is_verified,
        is_biometric_enrolled,
        face_enrolled,
        fingerprint_enrolled,
        polling_station_name,
        created_at,
        counties:county_id (id, code, name),
        constituencies:constituency_id (id, code, name),
        wards:ward_id (id, code, name),
        polling_stations:polling_station_id (id, code, name)
      `, { count: 'exact' })
      .eq('role', 'voter');

    if (q) {
      query = query.or(`full_name.ilike.%${q}%,id_number.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`);
    }
    if (county_id) query = query.eq('county_id', county_id);
    if (constituency_id) query = query.eq('constituency_id', constituency_id);
    if (ward_id) query = query.eq('ward_id', ward_id);
    if (location_id) query = query.eq('location_id', location_id);
    if (sub_location_id) query = query.eq('sub_location_id', sub_location_id);
    if (polling_station_id) query = query.eq('polling_station_id', polling_station_id);
    if (is_verified !== undefined) query = query.eq('is_verified', is_verified === 'true');
    if (has_biometric !== undefined) query = query.eq('is_biometric_enrolled', has_biometric === 'true');
    if (sex) query = query.eq('sex', sex);

    const allowedSorts = ['created_at', 'full_name', 'id_number', 'date_of_birth'];
    const sortField = allowedSorts.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.order(sortField, { ascending: sortOrder === 'asc' }).range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to search voters' });
  }
}

async function getVoterDetails(req, res) {
  const { id } = req.params;

  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        counties:county_id (id, code, name),
        constituencies:constituency_id (id, code, name),
        wards:ward_id (id, code, name),
        locations:location_id (id, code, name),
        sub_locations:sub_location_id (id, code, name),
        polling_stations:polling_station_id (id, code, name, address, gps_lat, gps_lng),
        biometric_templates (id, template_type, quality_score, enrolled_at),
        webauthn_credentials (id, device_type, created_at, last_used_at),
        verification_logs (id, method, status, score, created_at, device_id)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Voter not found' });

    return res.json({ data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch voter details' });
  }
}

async function getCountyStats(req, res) {
  try {
    const { data, error } = await supabase.from('voter_counts_by_county').select('*');
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch county stats' });
  }
}

async function getConstituencyStats(req, res) {
  const { county_id } = req.query;
  try {
    let query = supabase.from('voter_counts_by_constituency').select('*');
    if (county_id) query = query.eq('county_id', county_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch constituency stats' });
  }
}

async function getWardStats(req, res) {
  const { constituency_id } = req.query;
  try {
    let query = supabase.from('voter_counts_by_ward').select('*');
    if (constituency_id) query = query.eq('constituency_id', constituency_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch ward stats' });
  }
}

async function getPollingStationStats(req, res) {
  const { ward_id } = req.query;
  try {
    let query = supabase.from('voter_counts_by_polling_station').select('*');
    if (ward_id) query = query.eq('ward_id', ward_id);
    const { data, error } = await query;
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch polling station stats' });
  }
}

async function getVerificationLogs(req, res) {
  const { user_id, method, status, start_date, end_date, page = 1, limit = 100 } = req.query;

  try {
    let query = supabase
      .from('verification_logs')
      .select(`
        *,
        users:user_id (id, full_name, id_number, phone),
        admins:admin_id (id, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (user_id) query = query.eq('user_id', user_id);
    if (method) query = query.eq('method', method);
    if (status) query = query.eq('status', status);
    if (start_date) query = query.gte('created_at', start_date);
    if (end_date) query = query.lte('created_at', end_date);

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return res.json({
      data: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to fetch verification logs' });
  }
}

async function exportVoters(req, res) {
  const { county_id, constituency_id, ward_id, polling_station_id, format = 'csv' } = req.query;

  try {
    let query = supabase.from('users').select(`
      id_number,
      full_name,
      first_name,
      middle_name,
      last_name,
      phone,
      email,
      date_of_birth,
      sex,
      is_verified,
      is_biometric_enrolled,
      face_enrolled,
      fingerprint_enrolled,
      polling_station_name,
      counties:county_id (name),
      constituencies:constituency_id (name),
      wards:ward_id (name)
    `).eq('role', 'voter');

    if (county_id) query = query.eq('county_id', county_id);
    if (constituency_id) query = query.eq('constituency_id', constituency_id);
    if (ward_id) query = query.eq('ward_id', ward_id);
    if (polling_station_id) query = query.eq('polling_station_id', polling_station_id);

    const { data, error } = await query.limit(50000);
    if (error) throw error;

    if (format === 'csv') {
      const headers = [
        'ID Number', 'Full Name', 'First Name', 'Middle Name', 'Last Name',
        'Phone', 'Email', 'Date of Birth', 'Sex',
        'Verified', 'Biometric Enrolled', 'Face Enrolled', 'Fingerprint Enrolled',
        'Polling Station', 'County', 'Constituency', 'Ward'
      ];
      const rows = (data || []).map(u => [
        u.id_number,
        u.full_name,
        u.first_name || '',
        u.middle_name || '',
        u.last_name || '',
        u.phone || '',
        u.email || '',
        u.date_of_birth || '',
        u.sex || '',
        u.is_verified ? 'Yes' : 'No',
        u.is_biometric_enrolled ? 'Yes' : 'No',
        u.face_enrolled ? 'Yes' : 'No',
        u.fingerprint_enrolled ? 'Yes' : 'No',
        u.polling_station_name || '',
        u.counties?.name || '',
        u.constituencies?.name || '',
        u.wards?.name || '',
      ]);
      const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="voters-export-${Date.now()}.csv"`);
      return res.send(csv);
    }

    return res.json({ data: data || [] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to export voters' });
  }
}

module.exports = {
  getHierarchyOptions,
  getMetrics,
  searchVoters,
  getVoterDetails,
  getCountyStats,
  getConstituencyStats,
  getWardStats,
  getPollingStationStats,
  getVerificationLogs,
  exportVoters,
};