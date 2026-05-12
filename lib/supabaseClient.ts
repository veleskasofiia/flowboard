import { createClient } from "@supabase/supabase-js";

// Use your project URL and anon key from Supabase
console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log("Supabase Key:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + "...");


// Export a single Supabase client instance
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
