-- Kenya Administrative Hierarchy & Voter Register Schema
-- Run this in Supabase SQL Editor

-- Enable extensions
create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ============================================
-- ADMINISTRATIVE HIERARCHY TABLES
-- ============================================

-- Counties (47)
create table if not exists counties (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  name text not null,
  created_at timestamptz default now()
);

-- Constituencies (290)
create table if not exists constituencies (
  id uuid default gen_random_uuid() primary key,
  county_id uuid references counties(id) on delete cascade,
  code text not null,
  name text not null,
  created_at timestamptz default now(),
  unique(county_id, code)
);

-- Wards (1,450) - referred to as CAW (County Assembly Ward)
create table if not exists wards (
  id uuid default gen_random_uuid() primary key,
  constituency_id uuid references constituencies(id) on delete cascade,
  code text not null,
  name text not null,
  created_at timestamptz default now(),
  unique(constituency_id, code)
);

-- Locations (administrative)
create table if not exists locations (
  id uuid default gen_random_uuid() primary key,
  ward_id uuid references wards(id) on delete cascade,
  code text,
  name text not null,
  created_at timestamptz default now(),
  unique(ward_id, name)
);

-- Sub-locations
create table if not exists sub_locations (
  id uuid default gen_random_uuid() primary key,
  location_id uuid references locations(id) on delete cascade,
  code text,
  name text not null,
  created_at timestamptz default now(),
  unique(location_id, name)
);

-- Polling Stations
create table if not exists polling_stations (
  id uuid default gen_random_uuid() primary key,
  sub_location_id uuid references sub_locations(id) on delete set null,
  ward_id uuid references wards(id) on delete cascade,
  code text unique not null,
  name text not null,
  address text,
  gps_lat double precision,
  gps_lng double precision,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Indexes for hierarchy queries
create index if not exists idx_constituencies_county on constituencies(county_id);
create index if not exists idx_wards_constituency on wards(constituency_id);
create index if not exists idx_locations_ward on locations(ward_id);
create index if not exists idx_sublocations_location on sub_locations(location_id);
create index if not exists idx_polling_stations_ward on polling_stations(ward_id);
create index if not exists idx_polling_stations_sublocation on polling_stations(sub_location_id);

-- ============================================
-- USERS / VOTERS TABLE
-- ============================================

create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique,
  phone text,
  full_name text not null,
  first_name text,
  middle_name text,
  last_name text,
  id_number text not null,
  id_type text default 'national_id',
  date_of_birth date,
  sex text check (sex in ('Male', 'Female', 'Other')),
  county_id uuid references counties(id),
  constituency_id uuid references constituencies(id),
  ward_id uuid references wards(id),
  location_id uuid references locations(id),
  sub_location_id uuid references sub_locations(id),
  polling_station_id uuid references polling_stations(id),
  polling_station_name text,
  password_hash text,
  role text default 'voter' check (role in ('voter', 'admin', 'registrar')),
  is_verified boolean default false,
  is_biometric_enrolled boolean default false,
  face_enrolled boolean default false,
  fingerprint_enrolled boolean default false,
  webauthn_credential_id text,
  source text default 'manual',
  import_batch_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique constraint on ID number (one voter per ID)
create unique index if not exists idx_users_id_number on users(id_number) where id_number is not null;
create index if not exists idx_users_phone on users(phone) where phone is not null;
create index if not exists idx_users_email on users(email) where email is not null;
create index if not exists idx_users_ward on users(ward_id);
create index if not exists idx_users_polling_station on users(polling_station_id);
create index if not exists idx_users_role on users(role);

-- ============================================
-- BIOMETRIC TEMPLATES (Encrypted)
-- ============================================

create table if not exists biometric_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  template_type text check (template_type in ('face', 'fingerprint')) not null,
  template_data text not null,
  device_id text,
  quality_score numeric(3,2),
  enrolled_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, template_type)
);

-- ============================================
-- WEBAUTHN CREDENTIALS (Fingerprint via Platform Authenticator)
-- ============================================

create table if not exists webauthn_credentials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  credential_id text unique not null,
  public_key text not null,
  counter bigint default 0,
  transports text[],
  device_type text default 'platform',
  created_at timestamptz default now(),
  last_used_at timestamptz
);

-- ============================================
-- VERIFICATION LOGS (Audit Trail)
-- ============================================

create table if not exists verification_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  admin_id uuid references users(id),
  device_id text,
  method text check (method in ('face', 'fingerprint', 'webauthn', 'manual')),
  status text check (status in ('success', 'failed', 'pending')),
  score numeric(5,4),
  ip_address text,
  user_agent text,
  location_lat double precision,
  location_lng double precision,
  notes text,
  created_at timestamptz default now()
);

create index if not exists idx_verification_logs_user on verification_logs(user_id);
create index if not exists idx_verification_logs_created on verification_logs(created_at desc);
create index if not exists idx_verification_logs_status on verification_logs(status);

-- ============================================
-- REGISTRATION SESSIONS (for widget)
-- ============================================

create table if not exists registration_sessions (
  id uuid default gen_random_uuid() primary key,
  session_token text unique not null,
  registrar_id uuid references users(id),
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'expired', 'cancelled')),
  voter_data jsonb,
  completed_user_id uuid references users(id),
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ============================================
-- IMPORT BATCHES (for CSV tracking)
-- ============================================

create table if not exists import_batches (
  id uuid default gen_random_uuid() primary key,
  filename text not null,
  total_rows integer default 0,
  successful_rows integer default 0,
  failed_rows integer default 0,
  errors jsonb,
  imported_by uuid references users(id),
  status text default 'processing' check (status in ('processing', 'completed', 'failed')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- ============================================
-- VIEWS FOR ADMIN DASHBOARD METRICS
-- ============================================

-- Voter count by county
create or replace view voter_counts_by_county as
select
  c.id as county_id,
  c.code as county_code,
  c.name as county_name,
  count(u.id) as total_voters,
  count(u.id) filter (where u.is_verified) as verified_voters,
  count(u.id) filter (where u.is_biometric_enrolled) as biometric_enrolled,
  count(u.id) filter (where u.face_enrolled) as face_enrolled,
  count(u.id) filter (where u.fingerprint_enrolled) as fingerprint_enrolled
from counties c
left join users u on u.county_id = c.id and u.role = 'voter'
group by c.id, c.code, c.name
order by c.code;

-- Voter count by constituency
create or replace view voter_counts_by_constituency as
select
  con.id as constituency_id,
  con.code as constituency_code,
  con.name as constituency_name,
  c.id as county_id,
  c.name as county_name,
  count(u.id) as total_voters,
  count(u.id) filter (where u.is_verified) as verified_voters,
  count(u.id) filter (where u.is_biometric_enrolled) as biometric_enrolled
from constituencies con
join counties c on c.id = con.county_id
left join users u on u.constituency_id = con.id and u.role = 'voter'
group by con.id, con.code, con.name, c.id, c.name
order by c.code, con.code;

-- Voter count by ward
create or replace view voter_counts_by_ward as
select
  w.id as ward_id,
  w.code as ward_code,
  w.name as ward_name,
  con.id as constituency_id,
  con.name as constituency_name,
  c.id as county_id,
  c.name as county_name,
  count(u.id) as total_voters,
  count(u.id) filter (where u.is_verified) as verified_voters,
  count(u.id) filter (where u.is_biometric_enrolled) as biometric_enrolled
from wards w
join constituencies con on con.id = w.constituency_id
join counties c on c.id = con.county_id
left join users u on u.ward_id = w.id and u.role = 'voter'
group by w.id, w.code, w.name, con.id, con.name, c.id, c.name
order by c.code, con.code, w.code;

-- Voter count by polling station
create or replace view voter_counts_by_polling_station as
select
  ps.id as polling_station_id,
  ps.code as polling_station_code,
  ps.name as polling_station_name,
  w.id as ward_id,
  w.name as ward_name,
  con.id as constituency_id,
  con.name as constituency_name,
  c.id as county_id,
  c.name as county_name,
  count(u.id) as total_voters,
  count(u.id) filter (where u.is_verified) as verified_voters,
  count(u.id) filter (where u.is_biometric_enrolled) as biometric_enrolled
from polling_stations ps
left join sub_locations sl on sl.id = ps.sub_location_id
left join locations l on l.id = sl.location_id
left join wards w on w.id = ps.ward_id
left join constituencies con on con.id = w.constituency_id
left join counties c on c.id = con.county_id
left join users u on u.polling_station_id = ps.id and u.role = 'voter'
where ps.is_active = true
group by ps.id, ps.code, ps.name, w.id, w.name, con.id, con.name, c.id, c.name
order by c.code, con.code, w.code, ps.code;

-- ============================================
-- SEED DATA: 47 Counties
-- ============================================

insert into counties (code, name) values
  ('01', 'Mombasa'), ('02', 'Kwale'), ('03', 'Kilifi'), ('04', 'Tana River'), ('05', 'Lamu'),
  ('06', 'Taita-Taveta'), ('07', 'Garissa'), ('08', 'Wajir'), ('09', 'Mandera'), ('10', 'Marsabit'),
  ('11', 'Isiolo'), ('12', 'Meru'), ('13', 'Tharaka-Nithi'), ('14', 'Embu'), ('15', 'Kitui'),
  ('16', 'Machakos'), ('17', 'Makueni'), ('18', 'Nyandarua'), ('19', 'Nyeri'), ('20', 'Kirinyaga'),
  ('21', 'Murang''a'), ('22', 'Kiambu'), ('23', 'Turkana'), ('24', 'West Pokot'), ('25', 'Samburu'),
  ('26', 'Trans-Nzoia'), ('27', 'Uasin Gishu'), ('28', 'Elgeyo-Marakwet'), ('29', 'Nandi'), ('30', 'Baringo'),
  ('31', 'Laikipia'), ('32', 'Nakuru'), ('33', 'Narok'), ('34', 'Kajiado'), ('35', 'Kericho'),
  ('36', 'Bomet'), ('37', 'Kakamega'), ('38', 'Vihiga'), ('39', 'Bungoma'), ('40', 'Busia'),
  ('41', 'Siaya'), ('42', 'Kisumu'), ('43', 'Homa Bay'), ('44', 'Migori'), ('45', 'Kisii'),
  ('46', 'Nyamira'), ('47', 'Nairobi')
on conflict (code) do nothing;

-- ============================================
-- ROW LEVEL SECURITY (Enable for production)
-- ============================================

-- alter table users enable row level security;
-- alter table biometric_templates enable row level security;
-- alter table webauthn_credentials enable row level security;
-- alter table verification_logs enable row level security;

-- Example policy: voters can only see their own data
-- create policy "Voters see own data" on users for select using (auth.uid() = id or auth.jwt() ->> 'role' = 'admin');

-- Example policy: admins can see all
-- create policy "Admins see all" on users for all using (auth.jwt() ->> 'role' = 'admin');