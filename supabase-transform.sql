-- 1. Ensure Nyeri county exists
insert into counties (code, name) values ('19', 'NYERI')
on conflict (code) do nothing;

-- 2. Insert constituencies from staging
insert into constituencies (county_id, code, name)
select c.id, 
       lpad(row_number() over (partition by c.id order by s.constituency)::text, 3, '0'),
       s.constituency
from nyeri_staging s
join counties c on c.name = 'NYERI'
where s.constituency is not null and s.constituency != ''
on conflict (county_id, code) do nothing;

-- 3. Insert wards from staging
insert into wards (constituency_id, code, name)
select con.id,
       lpad(row_number() over (partition by con.id order by s.caw)::text, 6, '0'),
       s.caw
from nyeri_staging s
join constituencies con on con.name = s.constituency
join counties c on c.id = con.county_id and c.name = 'NYERI'
where s.caw is not null and s.caw != ''
on conflict (constituency_id, code) do nothing;

-- 4. Insert polling stations from staging (with ON CONFLICT DO NOTHING)
insert into polling_stations (ward_id, code, name, is_active)
select w.id,
       'PS-' || w.id::text || '-' || lpad(row_number() over (partition by w.id order by s.polling_station)::text, 4, '0'),
       case when s.polling_station = 'N/A' then s.polling_center else s.polling_station end,
       true
from nyeri_staging s
join wards w on w.name = s.caw
join constituencies con on con.id = w.constituency_id and con.name = s.constituency
where s.polling_station is not null and s.polling_station != ''
on conflict (code) do nothing;

-- 5. Insert users from staging (filter out existing IDs)
insert into users (
  email, phone, full_name, first_name, middle_name, last_name,
  id_number, id_type, date_of_birth, sex,
  county_id, constituency_id, ward_id, polling_station_id, polling_station_name,
  password_hash, role, source
)
select 
  case when phone is not null and phone != '' 
    then regexp_replace(phone, '\D', '', 'g') || '@voter.engageloop' 
    else null end,
  case when phone is not null and phone != '' 
    then 
      case 
        when regexp_replace(phone, '\D', '', 'g') like '254%' then '+' || regexp_replace(phone, '\D', '', 'g')
        when regexp_replace(phone, '\D', '', 'g') like '0%' then '+254' || substr(regexp_replace(phone, '\D', '', 'g'), 2)
        else '+254' || regexp_replace(phone, '\D', '', 'g')
      end
    else null end,
  trim(fname || ' ' || coalesce(mname, '') || ' ' || sname),
  fname, mname, sname,
  id_passport_no,
  case when length(id_passport_no) > 8 then 'passport' else 'national_id' end,
  case 
    when date_of_birth ~ '^\d{2}/\d{2}/\d{4}$' 
    then to_date(date_of_birth, 'DD/MM/YYYY')
    else null end,
  sex,
  c.id as county_id,
  con.id as constituency_id,
  w.id as ward_id,
  ps.id as polling_station_id,
  case when s.polling_station = 'N/A' then s.polling_center else s.polling_station end,
  'EngageLoop2026!',
  'voter',
  'csv_import'
from nyeri_staging s
join counties c on c.name = 'NYERI'
join constituencies con on con.name = s.constituency and con.county_id = c.id
join wards w on w.name = s.caw and w.constituency_id = con.id
left join polling_stations ps on ps.name = case when s.polling_station = 'N/A' then s.polling_center else s.polling_station end and ps.ward_id = w.id
where s.id_passport_no is not null and s.id_passport_no != ''
  and not exists (select 1 from users u where u.id_number = s.id_passport_no);

-- 6. Show counts
select 'counties' as table_name, count(*) from counties where name = 'NYERI'
union all select 'constituencies', count(*) from constituencies con join counties c on c.id = con.county_id where c.name = 'NYERI'
union all select 'wards', count(*) from wards w join constituencies con on con.id = w.constituency_id join counties c on c.id = con.county_id where c.name = 'NYERI'
union all select 'polling_stations', count(*) from polling_stations ps join wards w on w.id = ps.ward_id join constituencies con on con.id = w.constituency_id join counties c on c.id = con.county_id where c.name = 'NYERI'
union all select 'users', count(*) from users u join counties c on c.id = u.county_id where c.name = 'NYERI' and u.source = 'csv_import';