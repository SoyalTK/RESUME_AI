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
    const { data, error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      console.warn('Connected to Supabase but encountered an error querying `users` table:', error.message || error);
    } else {
      console.log('✅ Connected to Supabase and `users` table is accessible.');
    }
  } catch (err) {
    console.error('❌ Failed to initialize Supabase:', err);
  }
};

export default supabase;
