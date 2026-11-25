#!/usr/bin/env pwsh
# Full import via psql - runs as single transaction, bypasses SQL Editor issues

$conn = "postgresql://postgres.jizljdbungnbvhjnwxvt:Cjay@Gumama3@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require"

$dropStaging = @"
DROP TABLE IF EXISTS nyeri_staging;
"@

$createStaging = @"
CREATE TABLE nyeri_staging (
    fname text, mname text, sname text,
    phone text, id_passport_no text, date_of_birth text,
    sex text, constituency text, caw text,
    polling_station text, polling_center text,
    county text, register_date text
);
"@

$copy = @"
\copy nyeri_staging FROM 'C:/Users/JONAH/biometric-voter-app/nyeri.csv' WITH (FORMAT csv, HEADER true, DELIMITER ',', QUOTE '"', ESCAPE '"', ENCODING 'UTF8');
"@

$import = @"
BEGIN;

TRUNCATE TABLE users RESTART IDENTITY CASCADE;

WITH deduped AS (
  SELECT DISTINCT ON (s.id_passport_no)
    s.id_passport_no,
    s.fname, s.mname, s.sname,
    s.phone, s.date_of_birth, s.sex,
    s.constituency, s.caw,
    CASE WHEN s.polling_station = 'N/A' THEN s.polling_center ELSE s.polling_station END as polling_station_name
  FROM nyeri_staging s
  WHERE s.id_passport_no IS NOT NULL AND s.id_passport_no != ''
  ORDER BY s.id_passport_no
),
joined AS (
  SELECT
    d.id_passport_no as id_number,
    trim(d.fname || ' ' || coalesce(d.mname, '') || ' ' || d.sname) as full_name,
    d.fname as first_name, d.mname as middle_name, d.sname as last_name,
    CASE WHEN d.phone IS NOT NULL AND d.phone != '' THEN
      CASE WHEN regexp_replace(d.phone, '\D', '', 'g') LIKE '254%' THEN '+' || regexp_replace(d.phone, '\D', '', 'g')
           WHEN regexp_replace(d.phone, '\D', '', 'g') LIKE '0%' THEN '+254' || substr(regexp_replace(d.phone, '\D', '', 'g'), 2)
           ELSE '+254' || regexp_replace(d.phone, '\D', '', 'g') END
    END as phone,
    CASE WHEN d.date_of_birth ~ '^\d{2}/\d{2}/\d{4}$' THEN to_date(d.date_of_birth, 'DD/MM/YYYY') END as date_of_birth,
    d.sex,
    CASE WHEN length(d.id_passport_no) > 8 THEN 'passport' ELSE 'national_id' END as id_type,
    c.id as county_id, con.id as constituency_id, w.id as ward_id, ps.id as polling_station_id,
    d.polling_station_name,
    'EngageLoop2026!' as password_hash, 'voter' as role, 'csv_import' as source,
    CASE WHEN d.phone IS NOT NULL AND d.phone != '' THEN
      regexp_replace(d.phone, '\D', '', 'g') || '_' || d.id_passport_no || '_' || substr(md5(random()::text || clock_timestamp()::text), 1, 8) || '@voter.engageloop'
    END as email
  FROM deduped d
  JOIN counties c ON c.name ILIKE 'NYERI'
  JOIN constituencies con ON con.name = d.constituency AND con.county_id = c.id
  JOIN wards w ON w.name = d.caw AND w.constituency_id = con.id
  LEFT JOIN polling_stations ps ON ps.name = d.polling_station_name AND ps.ward_id = w.id
)
INSERT INTO users (email, phone, full_name, first_name, middle_name, last_name, id_number, id_type, date_of_birth, sex, county_id, constituency_id, ward_id, polling_station_id, polling_station_name, password_hash, role, source)
SELECT j.email, j.phone, j.full_name, j.first_name, j.middle_name, j.last_name, j.id_number, j.id_type, j.date_of_birth, j.sex, j.county_id, j.constituency_id, j.ward_id, j.polling_station_id, j.polling_station_name, j.password_hash, j.role, j.source
FROM joined j;

COMMIT;

SELECT COUNT(*) as imported_users FROM users;
SELECT COUNT(DISTINCT id_number) as unique_ids FROM users;
"@

try {
    Write-Host "Dropping staging table..." -ForegroundColor Yellow
    psql $conn -c $dropStaging

    Write-Host "Creating staging table..." -ForegroundColor Yellow
    psql $conn -c $createStaging

    Write-Host "Copying CSV..." -ForegroundColor Yellow
    psql $conn -c $copy

    Write-Host "Running import..." -ForegroundColor Yellow
    psql $conn -c $import

    Write-Host "Done!" -ForegroundColor Green
} catch {
    Write-Error $_.Exception.Message
}