-- Check for duplicate id_passport_no in staging (this is the root cause)
SELECT id_passport_no, count(*) as cnt
FROM nyeri_staging
WHERE id_passport_no IS NOT NULL AND id_passport_no != ''
GROUP BY id_passport_no
HAVING count(*) > 1
ORDER BY cnt DESC
LIMIT 20;

-- Also check 0012123 specifically
SELECT * FROM nyeri_staging WHERE id_passport_no = '0012123';