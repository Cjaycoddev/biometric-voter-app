-- Check county table
select * from counties where code = '19' or name ilike '%nyeri%';

-- Check staging county values
select distinct county, length(county), octet_length(county) from nyeri_staging;