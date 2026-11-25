-- NUCLEAR OPTION: Complete cleanup of ALL duplicates across ALL tables
-- Run this ONCE and be done

BEGIN;

-- ============================================
-- 1. CLEAN USERS TABLE
-- ============================================
DELETE FROM users 
WHERE ctid NOT IN (
  SELECT min(ctid) FROM users WHERE id_number IS NOT NULL GROUP BY id_number
);

-- ============================================
-- 2. CLEAN WARDS TABLE  
-- ============================================
DELETE FROM wards 
WHERE ctid NOT IN (
  SELECT min(ctid) FROM wards WHERE constituency_id IS NOT NULL AND code IS NOT NULL GROUP BY constituency_id, code
);

-- ============================================
-- 3. CLEAN POLLING_STATIONS TABLE
-- ============================================
DELETE FROM polling_stations 
WHERE ctid NOT IN (
  SELECT min(ctid) FROM polling_stations WHERE code IS NOT NULL GROUP BY code
);

-- ============================================
-- 4. CLEAN CONSTITUENCIES TABLE
-- ============================================
DELETE FROM constituencies 
WHERE ctid NOT IN (
  SELECT min(ctid) FROM constituencies WHERE county_id IS NOT NULL AND code IS NOT NULL GROUP BY county_id, code
);

-- ============================================
-- 5. CLEAN COUNTIES TABLE
-- ============================================
DELETE FROM counties 
WHERE ctid NOT IN (
  SELECT min(ctid) FROM counties WHERE code IS NOT NULL GROUP BY code
);

-- ============================================
-- 6. VERIFY ALL TABLES CLEAN
-- ============================================
SELECT 'users' as table_name, count(*) as total, count(DISTINCT id_number) as unique_keys FROM users WHERE id_number IS NOT NULL
UNION ALL SELECT 'wards', count(*), count(DISTINCT code) FROM wards
UNION ALL SELECT 'polling_stations', count(*), count(DISTINCT code) FROM polling_stations
UNION ALL SELECT 'constituencies', count(*), count(DISTINCT code) FROM constituencies
UNION ALL SELECT 'counties', count(*), count(DISTINCT code) FROM counties;

COMMIT;