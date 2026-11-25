-- First, let's see ALL duplicates in staging
SELECT id_passport_no, count(*) as cnt
FROM nyeri_staging
WHERE id_passport_no IS NOT NULL AND id_passport_no != ''
GROUP BY id_passport_no
HAVING count(*) > 1
ORDER BY cnt DESC;