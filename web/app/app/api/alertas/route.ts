import { sesionApi } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { misAlertas, misProtegidos } from "@/lib/misAlertas";

// GET /app/api/alertas?desde=<id> — alertas de MIS protegidos (polling del panel /app).

export async function GET(request: Request) {
  const s = await sesionApi();
  if (s instanceof Response) return s;

  const desde = Number(new URL(request.url).searchParams.get("desde")) || null;
  try {
    const sb = supabaseAdmin();
    const protegidos = await misProtegidos(sb, s.userId);
    const alertas = await misAlertas(sb, protegidos, desde);
    return Response.json({ alertas });
  } catch (e) {
    console.error("[app/alertas]", (e as Error).message);
    return Response.json({ error: "No pudimos cargar las alertas." }, { status: 502 });
  }
}
