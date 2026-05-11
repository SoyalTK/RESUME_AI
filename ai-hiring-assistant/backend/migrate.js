import dotenv from 'dotenv';
import { Client } from 'pg';
dotenv.config();

const sql = `
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
`;

const run = async () => {
  const client = new Client({
    host: process.env.PGHOST || process.env.SUPABASE_HOST || process.env.SUPABASE_URL?.replace('https://',''),
    port: process.env.PGPORT ? parseInt(process.env.PGPORT) : 5432,
    database: process.env.PGDATABASE || 'postgres',
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || process.env.SUPABASE_KEY,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to Postgres, running migrations...');
    await client.query(sql);
    console.log('Migrations applied.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
};

run();
