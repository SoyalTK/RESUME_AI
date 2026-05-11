import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('SUPABASE_URL or SUPABASE_KEY is missing in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export const initDb = async () => {
  try {
    // Quick test: try to access the `users` table to verify connection and schema
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      // Common case: tables not created yet
      console.warn('Connected to Supabase but encountered an error querying `users` table:', error.message || error);
      console.warn('If tables are not created, run the following SQL in Supabase SQL editor to create them:');
      console.warn(`
-- users table
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  gender text,
  bio text,
  location text,
  profile_image text,
  created_at timestamptz DEFAULT now()
);

-- history table
CREATE TABLE IF NOT EXISTS history (
  id serial PRIMARY KEY,
  user_id integer REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  job_description text,
  result_content text NOT NULL,
  resume_text_sample text,
  created_at timestamptz DEFAULT now()
);
      `);
    } else {
      console.log('✅ Connected to Supabase and `users` table is accessible.');
    }
  } catch (err) {
    console.error('❌ Failed to initialize Supabase:', err);
  }
};

export default supabase;
