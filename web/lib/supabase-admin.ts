import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente con service role, SOLO para código de servidor (server components, route handlers,
// server actions) y SIEMPRE después de requireUser()/requireAdmin() de lib/auth.ts.
// El browser no tiene acceso a Supabase: anon está revocado (supabase/auth.sql).
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let cliente: SupabaseClient | null = null;

export function supabaseAdmin(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en el servidor.");
  }
  cliente ??= createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

export const hayBase = Boolean(url && serviceKey);
