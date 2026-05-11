-- Migration: create users and history tables
-- Run this in Supabase SQL editor (SQL) or via psql connected to your Supabase Postgres

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
