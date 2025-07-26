import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL or Service Role Key is missing from .env.local');
}

// NOTE: This client is for SERVER-SIDE use only in your API routes.
export const supabase = createClient(supabaseUrl, supabaseKey);