import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente browser. Solo anon key: la web nunca usa service_role.
// Si faltan las variables exportamos null y las páginas muestran un aviso
// (así el build no se rompe sin configuración).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;
