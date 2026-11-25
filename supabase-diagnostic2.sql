-- Check actual data values
select distinct county from nyeri_staging;
select distinct constituency from nyeri_staging limit 10;
select distinct caw from nyeri_staging limit 10;

-- Check exact matches
select count(*) from nyeri_staging where county = 'NYERI';
select count(*) from nyeri_staging where upper(county) = 'NYERI';