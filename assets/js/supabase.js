const SUPABASE_URL = "https://wcrrxsrtbelcbycppieg.supabase.co";

const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndjcnJ4c3J0YmVsY2J5Y3BwaWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2MTM0ODQsImV4cCI6MjA5NjE";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);
