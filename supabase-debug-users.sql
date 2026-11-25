-- First, check what's in users table
SELECT count(*) as total_users, count(DISTINCT id_number) as unique_ids
FROM users;

-- Check specific conflicting id
SELECT id_number, count(*) FROM users WHERE id_number = '0012123' GROUP BY id_number;