# EngageLoop - Kenyan Biometric Voter Verification

A secure web application that enables registered Kenyan voters to verify their identity using **face (camera)** or **fingerprint (phone's built-in sensor via WebAuthn)** biometrics. Includes polling station display after successful verification.

## Architecture

- **Client**: Next.js 14 (React) + Tailwind CSS — `client/`
- **Server**: Node.js + Express — `server/`
- **Database**: Supabase (PostgreSQL) — encrypted biometric templates, users, verification logs, WebAuthn credentials
- **Auth**: JWT + bcrypt password hashing
- **Encryption**: AES-256 (CryptoJS) for face templates at rest
- **Fingerprint**: WebAuthn Platform Authenticator (uses phone's actual fingerprint sensor / Face ID / Touch ID)

## Project Structure

```
engageloop/
├── server/                 # Express backend
│   ├── src/
│   │   ├── index.js        # App entry
│   │   ├── config/         # Supabase, encryption, WebAuthn config
│   │   ├── controllers/    # Auth, biometric, WebAuthn controllers
│   │   ├── middleware/     # Auth, validation, error handling
│   │   ├── models/         # User, BiometricTemplate, VerificationLog, WebAuthnCredential
│   │   ├── routes/         # API routes
│   │   ├── services/       # Biometric matching + device service
│   │   └── utils/          # Device simulation logger
│   ├── scripts/            # CSV import script
│   ├── .env.example
│   └── package.json
├── client/                 # Next.js frontend
│   ├── src/
│   │   ├── app/            # App Router pages (login, register, verify, dashboard)
│   │   ├── lib/            # API client
│   │   └── globals.css
│   ├── next.config.js
│   ├── tailwind.config.js
│   └── package.json
└── README.md
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Get your Project URL and Service Role Key from Settings > API
3. Copy `server/.env.example` to `server/.env` and fill in:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET` (strong random string)
   - `ENCRYPTION_KEY` (at least 16 chars)
   - `WEBAUTHN_RP_ID` (e.g., `localhost` or your domain)
   - `WEBAUTHN_ORIGIN` (e.g., `http://localhost:3000`)

4. Run this SQL in the Supabase SQL Editor to create tables:

```sql
-- Enable extensions
create extension if not exists "pgcrypto";

-- Users table
create table if not exists users (
  id uuid default gen_random_uuid() primary key,
  email text unique not null,
  phone text not null,
  full_name text not null,
  id_number text not null,
  password_hash text not null,
  role text default 'voter',
  polling_station text,
  created_at timestamptz default now()
);

-- Biometric templates (encrypted at rest) - for face
create table if not exists biometric_templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  template_type text check (template_type in ('face', 'fingerprint')) not null,
  template_data text not null, -- AES-encrypted JSON
  updated_at timestamptz default now(),
  unique(user_id, template_type)
);

-- WebAuthn credentials - for fingerprint (platform authenticator)
create table if not exists webauthn_credentials (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  credential_id text unique not null,
  public_key text not null,
  counter bigint default 0,
  transports text[],
  created_at timestamptz default now()
);

-- Verification logs (audit trail)
create table if not exists verification_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references users(id) on delete cascade,
  device_id text,
  method text,
  status text check (status in ('success', 'failed')),
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

-- Registered devices
create table if not exists registered_devices (
  id uuid default gen_random_uuid() primary key,
  device_id text unique not null,
  device_name text,
  device_type text,
  owner_id uuid references users(id),
  active boolean default true,
  registered_at timestamptz default now()
);

-- Device simulation logs
create table if not exists device_simulation_logs (
  id uuid default gen_random_uuid() primary key,
  device_id text,
  method text,
  session_id text,
  payload text,
  ip_address text,
  created_at timestamptz default now()
);
```

5. Enable Row Level Security (RLS) as needed for production.

## Installation & Running

### Backend (server)

```bash
cd server
cp .env.example .env
# edit .env with your Supabase credentials
npm install
npm run dev   # runs on http://localhost:5000
```

### Frontend (client)

```bash
cd client
npm install
npm run dev   # runs on http://localhost:3000
```

## How It Works

### Registration
1. User registers with full name, Kenyan ID number (7-8 digits), phone (+254...), email, password, optional polling station.
2. Password is hashed with bcrypt. User record stored in Supabase.

### Login
1. User logs in with email + password.
2. JWT issued and stored in `localStorage`.

### Face Enrollment & Verification (Camera)
1. **Enroll**: User allows camera access, system captures image, generates template from image hash, AES-encrypts and stores in `biometric_templates`.
2. **Verify**: User captures live image via camera, template generated and compared against enrolled template using similarity score (threshold 0.85).
3. Templates are encrypted at rest with AES-256.

### Fingerprint Enrollment & Verification (WebAuthn - Phone's Actual Sensor)
1. **Enroll**: User clicks "Enroll Fingerprint" → browser prompts for fingerprint on phone's sensor (Android) or Face ID/Touch ID (iOS) → WebAuthn credential created and stored in `webauthn_credentials`. **No fingerprint image ever leaves the device.**
2. **Verify**: User clicks "Verify Fingerprint" → browser prompts for fingerprint → WebAuthn authentication challenge signed by device's secure enclave → server verifies signature using stored public key.
3. This uses **WebAuthn Platform Authenticator** — the same technology used by banks, password managers, and government services worldwide.

### Polling Station Display
After successful verification (face OR fingerprint), the voter's full details and assigned polling station are displayed:
- Station name, code, ward, constituency, county
- Physical address and GPS coordinates
- One-click "Open in Google Maps" link

## Using Your Phone's Real Fingerprint Sensor (WebAuthn)

This is the **recommended approach** — no physical device needed:

1. **Run the app**: Start both server (`npm run dev` in server/) and client (`npm run dev` in client/)
2. **Access from phone**: 
   - Find your computer's IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
   - On your phone, open `http://<YOUR_COMPUTER_IP>:3000`
   - **Important**: Update `server/.env` with your phone-accessible URL:
     ```
     CLIENT_URL=http://<YOUR_COMPUTER_IP>:3000
     WEBAUTHN_ORIGIN=http://<YOUR_COMPUTER_IP>:3000
     WEBAUTHN_RP_ID=<YOUR_COMPUTER_IP>   # or use a domain with HTTPS for production
     ```
   - Restart server after changing `.env`

3. **Register/Login** on your phone
4. **Go to Verify page** → Select "Fingerprint ID"
5. **Click "Enroll Fingerprint"** → Phone prompts for fingerprint → Done
6. **Click "Verify Fingerprint"** → Phone prompts again → Verified!
7. **Polling station details displayed** automatically

### Why WebAuthn is Secure
- **Private key never leaves your phone's secure enclave**
- **No fingerprint image is ever transmitted or stored**
- **Challenge-response cryptography** prevents replay attacks
- **User verification required** (biometric or PIN) for every operation
- **Counter-based** prevents credential cloning

## Alternative: Simulated Biometrics (No Camera/Sensor)

If you can't use the camera or WebAuthn, the verify page also has a **simulation mode** that generates random templates for testing the full flow.

## CSV Import (Your User Dataset)

```bash
# In server/
node scripts/import-users.js path/to/your/users.csv
```

CSV format (see `server/users.csv.example`):
```csv
email,phone,full_name,id_number,password,polling_station
voter1@example.com,+254700123456,John Kamau,12345678,SecurePass1!,"Kasarani Primary School"
```

## Kenyan Context Notes

- **ID numbers**: validated as 7–8 digits (Kenyan national ID format).
- **Phone numbers**: validated with `+254` or `254` prefix followed by 9 digits (Safaricom/Airtel/Telkom format).
- **Polling stations**: stored per user, displayed after verification.
- **Production devices**: In production, replace WebAuthn/camera with real biometric kits (e.g. IEBC KIEMS kits, mobile biometric terminals) via their SDK/API.

## Security

- Face templates: AES-256 encrypted before storage (`ENCRYPTION_KEY`).
- Fingerprint: WebAuthn — private key never leaves device, only public key stored.
- Passwords: bcrypt (10 salt rounds).
- JWT-based auth with expiration.
- Rate limiting on all API endpoints (100 req/15 min).
- Helmet.js for security headers.
- All verification attempts logged for audit.

## License

MIT