import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase environment variables are missing!");
  console.log("VITE_SUPABASE_URL:", supabaseUrl);
  console.log("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
// Test connection and data access
supabase.auth.getSession().then(({ error }) => {
  if (error) {
    console.error("Supabase auth connection failed:", error);
  } else {
    console.log("Supabase auth connected successfully");

    // Test data access
    supabase
      .from("deposit_transactions")
      .select("count")
      .then(({ data, error }) => {
        if (error) {
          console.error("Data access test failed:", error);
        } else {
          console.log("Data access test successful:", data);
        }
      });
  }
});
