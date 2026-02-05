import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Singleton client for the frontend. Never use service role keys in the browser.
// If env vars are missing, createClient will still work but auth calls will fail gracefully.
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} catch (error) {
  console.warn("Supabase client initialization failed:", error);
  // Create a minimal client that won't crash
  supabase = createClient("https://placeholder.supabase.co", "placeholder-key");
}

export { supabase };


