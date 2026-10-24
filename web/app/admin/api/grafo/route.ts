import { sesionAdminApi } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";


export async function GET() {
  const s = await sesionAdminApi();
  if (s instanceof Response) return s;

  const { data, error } = await supabaseAdmin().rpc("grafo");
  if (error) return Response.json({ error: "No pudimos leer la red." }, { status: 500 });
  return Response.json(data ?? { nodes: [], links: [] });
}
