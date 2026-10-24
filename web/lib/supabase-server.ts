import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Clientes para route handlers. Este archivo nunca se importa desde un componente "use client".
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Solo server (sin NEXT_PUBLIC_): la usa /me-estafaron/registrar para sumar casos de víctimas a la red.
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const opciones = { auth: { persistSession: false, autoRefreshToken: false } };

export function supabaseAnon(): SupabaseClient | null {
  return url && anonKey ? createClient(url, anonKey, opciones) : null;
}

export function supabaseServicio(): SupabaseClient | null {
  return url && serviceKey ? createClient(url, serviceKey, opciones) : null;
}

export const puedeRegistrar = Boolean(url && serviceKey);
