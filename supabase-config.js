// Woeful Studio — Supabase Configuration

const SUPABASE_URL = "https://bivttqkiwrtxavoddnyo.supabase.co";
const SUPABASE_KEY = "sb_publishable_wQ5cIU3uCoyGN-tzJvp0FQ_Ae_phEFC";

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);
