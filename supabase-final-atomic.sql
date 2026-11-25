-- Single statement: truncate + insert with inline deduplication
-- No temp tables, no CTEs, no intermediate steps
BEGIN;

TRUNCATE TABLE users RESTART IDENTITY CASCADE;

INSERT INTO users (email, phone, full_name, first_name, middle_name, last_name, id_number, id_type, date_of_birth, sex, county_id, constituency_id, ward_id, polling_station_id, polling_station_name, password_hash, role, source)
SELECT 
  CASE WHEN s.phone IS NOT NULL AND s.phone != '' THEN regexp_replace(s.phone, '\D', '', 'g') || '_' || s.id_passport_no || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '@voter.engageloop' ELSE NULL END,
  CASE WHEN s.phone IS NOT NULL AND s.phone != '' THEN CASE WHEN regexp_replace(s.phone, '\D', '', 'g') LIKE '254%' THEN '+' || regexp_replace(s.phone, '\D', '', 'g') WHEN regexp_replace(s.phone, '\D', '', 'g') LIKE '0%' THEN '+254' || substr(regexp_replace(s.phone, '\D', '', 'g'), 2) ELSE '+254' || regexp_replace(s.phone, '\D', '', 'g') END ELSE NULL END,
  trim(s.fname || ' ' || coalesce(s.mname, '') || ' ' || s.sname),
  s.fname, s.mname, s.sname,
  s.id_passport_no,
  CASE WHEN length(s.id_passport_no) > 8 THEN 'passport' ELSE 'national_id' END,
  CASE WHEN s.date_of_birth ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(s.date_of_birth, 'DD/MM/YYYY') ELSE NULL END,
  s.sex, c.id, con.id, w.id, ps.id,
  CASE WHEN s.polling_station = 'N/A' THEN s.polling_center ELSE s.polling_station END,
  'EngageLoop2026!', 'voter', 'csv_import'
FROM (
  SELECT DISTINCT ON (id_passport_no) *
  FROM nyeri_staging
  WHERE id_passport_no IS NOT NULL AND id_passport_no != ''
  ORDER BY id_passport_no, constituency, caw
) s
JOIN counties c ON c.name ILIKE 'NYERI'
JOIN constituencies con ON con.name = s.constituency AND con.county_id = c.id
JOIN wards w ON w.name = s.caw AND w.constituency_id = con.id
LEFT JOIN polling_stations ps ON ps.name = CASE WHEN s.polling_station = 'N/A' THEN s.polling_center ELSE s.polling_station END AND ps.ward_id = w.id;

COMMIT;