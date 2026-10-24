import type { SupabaseClient } from "@supabase/supabase-js";
import type { Alerta, Protegido } from "@/lib/tipos";

// "Mis alertas" de /app: las de mis protegidos, por protegido_id o (fallback mientras el worker
// no setea el id) por nombre. El cliente es supabaseAdmin(), siempre después de requireUser().

export const MAX_ALERTAS = 30;

const comillas = (v: string) => `"${v.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;

// Filtro PostgREST para .or(). null si no hay nada que buscar.
export function filtroMisAlertas(ids: number[], nombres: string[]): string | null {
  const idsOk = ids.filter((n) => Number.isInteger(n));
  const nombresOk = nombres.map((n) => n.trim()).filter(Boolean);
  const partes: string[] = [];
  if (idsOk.length) partes.push(`protegido_id.in.(${idsOk.join(",")})`);
  if (nombresOk.length) partes.push(`protegido.in.(${nombresOk.map(comillas).join(",")})`);
  return partes.length ? partes.join(",") : null;
}

export async function misProtegidos(sb: SupabaseClient, owner: string): Promise<Protegido[]> {
  const { data, error } = await sb
    .from("protegidos")
    .select("*")
    .eq("owner", owner)
    .order("id", { ascending: true });
  if (error) throw new Error(`protegidos: ${error.message}`);
  return (data ?? []) as Protegido[];
}

export async function misAlertas(
  sb: SupabaseClient,
  protegidos: Protegido[],
  desde?: number | null,
): Promise<Alerta[]> {
  const filtro = filtroMisAlertas(
    protegidos.map((p) => p.id),
    protegidos.map((p) => p.nombre ?? ""),
  );
  if (!filtro) return [];
  let q = sb.from("alertas").select("*").or(filtro);
  if (desde && Number.isFinite(desde)) q = q.gt("id", desde);
  const { data, error } = await q.order("id", { ascending: false }).limit(MAX_ALERTAS);
  if (error) throw new Error(`alertas: ${error.message}`);
  return (data ?? []) as Alerta[];
}
