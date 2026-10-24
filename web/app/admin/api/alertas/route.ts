import { sesionAdminApi } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";


export async function GET(req: Request) {
  const s = await sesionAdminApi();
  if (s instanceof Response) return s;

  const desde = Number(new URL(req.url).searchParams.get("desde"));
  let q = supabaseAdmin().from("alertas").select("*");
  if (Number.isFinite(desde) && desde > 0) q = q.gt("id", desde);
  const { data, error } = await q.order("id", { ascending: false }).limit(30);
  if (error) return Response.json({ error: "No pudimos leer las alertas." }, { status: 500 });
  return Response.json({ alertas: data ?? [] });
}
