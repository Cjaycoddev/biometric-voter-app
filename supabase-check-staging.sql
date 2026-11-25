-- Check if 693737084 exists in staging
SELECT id_passport_no, count(*) 
FROM nyeri_staging 
WHERE id_passport_no = '693737084' 
GROUP BY id_passport_no;

-- Check all id_passport_no in staging that might conflict
SELECT s.id_passport_no, u.id_number
FROM nyeri_staging s
LEFT JOIN users u ON u.id_number = s.id_passport_no
WHERE s.id_passport_no = '693737084';