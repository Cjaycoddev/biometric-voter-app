-- First, check exactly what's happening with 693737084
SELECT id_number, count(*), min(ctid), max(ctid), array_agg(ctid) 
FROM users 
WHERE id_number = '693737084' 
GROUP BY id_number;

-- Then check ALL duplicates
SELECT id_number, count(*) 
FROM users 
WHERE id_number IS NOT NULL 
GROUP BY id_number 
HAVING count(*) > 1 
ORDER BY count(*) DESC;