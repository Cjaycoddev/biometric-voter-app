-- Force delete the specific problematic id_number completely, then re-insert cleanly
DELETE FROM users WHERE id_number = '693737084';

-- Then delete ALL other duplicates
DELETE FROM users 
WHERE ctid NOT IN (
  SELECT min(ctid) 
  FROM users 
  WHERE id_number IS NOT NULL 
  GROUP BY id_number
);

-- Now insert with LEFT JOIN anti-join (guaranteed no conflicts)
WITH new_users AS (
  SELECT 
    CASE 
      WHEN s.phone IS NOT NULL AND s.phone != '' 
      THEN regexp_replace(s.phone, '\D', '', 'g') || '_' || s.id_passport_no || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '@voter.engageloop'
      ELSE NULL 
    END as email,
    CASE WHEN s.phone IS NOT NULL AND s.phone != '' THEN 
      CASE 
        WHEN regexp_replace(s.phone, '\D', '', 'g') LIKE '254%' THEN '+' || regexp_replace(s.phone, '\D', '', 'g')
        WHEN regexp_replace(s.phone, '\D', '', 'g') LIKE '0%' THEN '+254' || substr(regexp_replace(s.phone, '\D', '', 'g'), 2)
        ELSE '+254' || regexp_replace(s.phone, '\D', '', 'g')
      END ELSE NULL END as phone,
    trim(s.fname || ' ' || coalesce(s.mname, '') || ' ' || s.sname) as full_name,
    s.fname as first_name, s.mname as middle_name, s.sname as last_name,
    s.id_passport_no as id_number,
    CASE WHEN length(s.id_passport_no) > 8 THEN 'passport' ELSE 'national_id' END as id_type,
    CASE WHEN s.date_of_birth ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(s.date_of_birth, 'DD/MM/YYYY') ELSE NULL END as date_of_birth,
    s.sex, c.id as county_id, con.id as constituency_id, w.id as ward_id, ps.id as polling_station_id,
    CASE WHEN s.polling_station = 'N/A' THEN s.polling_center ELSE s.polling_station END as polling_station_name,
    'EngageLoop2026!' as password_hash, 'voter' as role, 'csv_import' as source
  FROM nyeri_staging s
  JOIN counties c ON c.name ILIKE 'NYERI'
  JOIN constituencies con ON con.name = s.constituency AND con.county_id = c.id
  JOIN wards w ON w.name = s.caw AND w.constituency_id = con.id
  LEFT JOIN polling_stations ps ON ps.name = CASE WHEN s.polling_station = 'N/A' THEN s.polling_center ELSE s.polling_station END AND ps.ward_id = w.id
  WHERE s.id_passport_no IS NOT NULL AND s.id_passport_no != ''
    AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id_number = s.id_passport_no)
)
INSERT INTO users (email, phone, full_name, first_name, middle_name, last_name, id_number, id_type, date_of_birth, sex, county_id, constituency_id, ward_id, polling_station_id, polling_station_name, password_hash, role, source)
SELECT email, phone, full_name, first_name, middle_name, last_name, id_number, id_type, date_of_birth, sex, county_id, constituency_id, ward_id, polling_station_id, polling_station_name, password_hash, role, source
FROM new_users;