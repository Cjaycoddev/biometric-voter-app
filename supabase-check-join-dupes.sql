-- Check if joins are producing duplicates
SELECT s.id_passport_no, count(*)
FROM (
  SELECT DISTINCT ON (id_passport_no) *
  FROM nyeri_staging
  WHERE id_passport_no IS NOT NULL AND id_passport_no != ''
  ORDER BY id_passport_no, constituency, caw
) s
JOIN counties c ON c.name ILIKE 'NYERI'
JOIN constituencies con ON con.name = s.constituency AND con.county_id = c.id
JOIN wards w ON w.name = s.caw AND w.constituency_id = con.id
LEFT JOIN polling_stations ps ON ps.name = CASE WHEN s.polling_station = 'N/A' THEN s.polling_center ELSE s.polling_station END AND ps.ward_id = w.id
GROUP BY s.id_passport_no
HAVING count(*) > 1;