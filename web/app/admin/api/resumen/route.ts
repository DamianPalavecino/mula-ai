import { sesionAdminApi } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";


export async function GET(req: Request) {
  const s = await sesionAdminApi();
  if (s instanceof Response) return s;

  const p = new URL(req.url).searchParams;
  const valor = (p.get("valor") ?? "").trim();
  if (!valor || valor.length > 60) {
    return Response.json({ error: "Falta el valor (máx 60 caracteres)." }, { status: 400 });
  }
  const tipo = p.get("tipo") || null;
  const { data, error } = await supabaseAdmin().rpc("resumen_entidad", { valor, tipo });
  if (error) return Response.json({ error: "No pudimos consultar la red." }, { status: 500 });
  return Response.json(data);
}
