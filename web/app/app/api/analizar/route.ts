import { sesionApi } from "@/lib/auth";

// POST /app/api/analizar { texto } — "Probar un mensaje" del panel. El browser nunca llama al
// worker: va por acá con sesión, WORKER_URL y X-Mula-Token (server-only). No manda WhatsApp.

export async function POST(request: Request) {
  const s = await sesionApi();
  if (s instanceof Response) return s;

  const url = process.env.WORKER_URL;
  const token = process.env.MULA_TOKEN;
  if (!url || !token) {
    return Response.json({ error: "El analizador no está configurado." }, { status: 503 });
  }

  let texto = "";
  try {
    const body = await request.json();
    texto = typeof body?.texto === "string" ? body.texto.trim() : "";
  } catch {
    return Response.json({ error: "Body inválido." }, { status: 400 });
  }
  if (!texto) return Response.json({ error: "Pegá un mensaje para analizar." }, { status: 400 });

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/analizar`, {
      method: "POST",
      headers: { "content-type": "application/json", "X-Mula-Token": token },
      body: JSON.stringify({ texto: texto.slice(0, 2000), enviar_whatsapp: false }),
      signal: AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    const json = await res.json().catch(() => ({ error: "Respuesta inválida del analizador." }));
    return Response.json(json, { status: res.status });
  } catch (e) {
    const timeout = (e as Error).name === "TimeoutError";
    return Response.json(
      { error: timeout ? "El analizador tardó demasiado. Probá de nuevo." : "No pudimos contactar al analizador." },
      { status: timeout ? 504 : 502 },
    );
  }
}
