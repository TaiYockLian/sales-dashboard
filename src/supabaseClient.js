import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. " +
    "Create a .env file (see .env.example) with these values, " +
    "and add them as Environment Variables in your Vercel project settings."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
