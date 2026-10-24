import { sesionApi } from "@/lib/auth";
import { hayBase, supabaseAdmin } from "@/lib/supabase-admin";
import { PROVINCIAS, type RespuestaReporte } from "@/lib/extraccion";
import { crearRateLimiter } from "@/lib/meEstafaron";

// POST /app/api/registrar (exige sesión) — suma a la red el caso de una víctima ("Me estafaron") con
// registrar_reporte (fuente = 'victima'). Necesita SUPABASE_SERVICE_ROLE_KEY en el server.
//
// Body JSON: { modalidad, provincia, monto, texto, senales[], suplanta_a, entidades: [{tipo, valor}] }
// La base normaliza, valida y descarta entidades inválidas; acá solo acotamos tamaños.

const MAX_ENTIDADES = 10;
// Frena que alguien llene la red de reportes falsos: 3 casos por 10 minutos por IP.
const permitir = crearRateLimiter(3, 10 * 60_000);

function texto(v: unknown, max: number): string | null {
  return typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null;
}

export async function POST(request: Request) {
  const s = await sesionApi();
  if (s instanceof Response) return s;

  if (!hayBase) {
    return Response.json(
      { error: "Sumar casos a la red no está habilitado en este servidor." },
      { status: 503 },
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!permitir(ip)) {
    return Response.json({ error: "Ya sumaste varios casos. Probá más tarde." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body inválido." }, { status: 400 });
  }

  const entidades = (Array.isArray(body.entidades) ? body.entidades : [])
    .slice(0, MAX_ENTIDADES)
    .flatMap((e) => {
      const tipo = texto((e as { tipo?: unknown })?.tipo, 10);
      const valor = texto((e as { valor?: unknown })?.valor, 40);
      return valor ? [{ tipo, valor }] : [];
    });
  if (!entidades.length) {
    return Response.json(
      { error: "El caso no tiene ninguna cuenta ni teléfono para sumar a la red." },
      { status: 400 },
    );
  }

  const provincia = texto(body.provincia, 60);
  const monto = Number(body.monto);
  const payload = {
    fuente: "victima",
    modalidad: texto(body.modalidad, 40) ?? "otro",
    provincia: provincia && PROVINCIAS.includes(provincia) ? provincia : null,
    monto: Number.isFinite(monto) && monto > 0 ? monto : null,
    texto: texto(body.texto, 2000),
    // Denuncia autodeclarada desde la web, sin verificar: pesa menos que una detección del worker.
    riesgo: 90,
    confianza: 60,
    senales: (Array.isArray(body.senales) ? body.senales : [])
      .map((s) => texto(s, 80))
      .filter(Boolean)
      .slice(0, 10),
    suplanta_a: texto(body.suplanta_a, 80),
    remitente: null,
    entidades,
  };

  const { data, error } = await supabaseAdmin().rpc("registrar_reporte", { payload });
  if (error || !data) {
    console.error("[reportes] registrar_reporte falló:", error?.message);
    return Response.json({ error: "No pudimos sumar el caso a la red." }, { status: 502 });
  }
  return Response.json(data as RespuestaReporte);
}
