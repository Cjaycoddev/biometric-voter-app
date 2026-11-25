-- Check if DISTINCT ON is actually deduplicating
SELECT id_passport_no, count(*)
FROM (
  SELECT DISTINCT ON (id_passport_no) *
  FROM nyeri_staging
  WHERE id_passport_no IS NOT NULL AND id_passport_no != ''
  ORDER BY id_passport_no, constituency, caw
) t
GROUP BY id_passport_no
HAVING count(*) > 1;