import QRCode from "qrcode";
import { sesionApi } from "@/lib/auth";
import { misProtegidos } from "@/lib/misAlertas";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { leerSesion } from "@/lib/vincular";

// /app/api/whatsapp — sesión de WhatsApp de MI protegido (el primero del owner).
//   GET → estado (+ QR en SVG)   POST → vincular (pide QR)   DELETE → desvincular
// El browser nunca habla con el worker: va por acá con WORKER_URL y X-Mula-Token (server-only).

async function proxy(method: "GET" | "POST" | "DELETE") {
  const s = await sesionApi();
  if (s instanceof Response) return s;

  const url = process.env.WORKER_URL;
  const token = process.env.MULA_TOKEN;
  if (!url || !token) return Response.json({ error: "El guardián no está configurado." }, { status: 503 });

  let protegidoId: number | undefined;
  try {
    protegidoId = (await misProtegidos(supabaseAdmin(), s.userId))[0]?.id;
  } catch (e) {
    console.error("[app/api/whatsapp]", (e as Error).message);
    return Response.json({ error: "No pudimos leer tus datos." }, { status: 500 });
  }
  if (!protegidoId) return Response.json({ error: "Primero cargá a quién protegés." }, { status: 404 });

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/sesiones/${protegidoId}`, {
      method,
      headers: { "X-Mula-Token": token },
      signal: AbortSignal.timeout(20_000),
      cache: "no-store",
    });
    const json = await res.json().catch(() => null);
    const sesion = res.ok ? leerSesion(json) : null;
    if (!sesion) {
      const error = (json as { error?: string } | null)?.error ?? "Respuesta inválida del guardián.";
      return Response.json({ error }, { status: res.ok ? 502 : res.status });
    }
    const qr_svg = sesion.qr
      ? await QRCode.toString(sesion.qr, { type: "svg", margin: 1, errorCorrectionLevel: "L" })
      : null;
    return Response.json({ estado: sesion.estado, telefono: sesion.telefono, qr_svg });
  } catch (e) {
    const timeout = (e as Error).name === "TimeoutError";
    return Response.json(
      { error: timeout ? "El guardián tardó demasiado. Probá de nuevo." : "No pudimos contactar al guardián." },
      { status: timeout ? 504 : 502 },
    );
  }
}

export const GET = () => proxy("GET");
export const POST = () => proxy("POST");
export const DELETE = () => proxy("DELETE");
