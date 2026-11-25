-- Diagnostic: Check staging data
select 
  count(*) as total_rows,
  count(distinct county) as counties,
  count(distinct constituency) as constituencies,
  count(distinct caw) as wards,
  count(distinct polling_station) as polling_stations,
  count(id_passport_no) as with_id
from nyeri_staging;

-- Check sample values
select distinct county from nyeri_staging;
select distinct constituency from nyeri_staging limit 10;
select distinct caw from nyeri_staging limit 10;
select distinct polling_station from nyeri_staging limit 10;