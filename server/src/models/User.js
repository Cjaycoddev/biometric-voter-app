const { supabase } = require('../config/supabase');

const TABLE = 'users';

async function createUser({ email, phone, full_name, id_number, password, role = 'voter', polling_station }) {
  const { hashSync } = require('bcryptjs');
  const password_hash = hashSync(password, Number(process.env.BCRYPT_SALT_ROUNDS) || 10);
  const { data, error } = await supabase
    .from(TABLE)
    .insert([
      { email, phone, full_name, id_number, password_hash, role, polling_station },
    ])
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function findByEmail(email) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('email', email)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function findByPhone(phone) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('phone', phone)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function findById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function verifyPassword(password, password_hash) {
  const { compareSync } = require('bcryptjs');
  return compareSync(password, password_hash);
}

module.exports = {
  createUser,
  findByEmail,
  findByPhone,
  findById,
  verifyPassword,
};