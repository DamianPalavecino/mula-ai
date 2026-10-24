import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { misProtegidos } from "@/lib/misAlertas";
import type { Protegido } from "@/lib/tipos";
import VincularWhatsapp from "@/components/VincularWhatsapp";

export const metadata: Metadata = { title: "Vincular WhatsApp" };

export default async function VincularPage() {
  const sesion = await requireUser();
  let p: Protegido | undefined;
  try {
    p = (await misProtegidos(supabaseAdmin(), sesion.userId))[0];
  } catch (e) {
    console.error("[app/vincular]", (e as Error).message);
  }
  const configurado = Boolean(process.env.WORKER_URL && process.env.MULA_TOKEN);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/app" className="text-sm font-medium text-suave hover:text-tinta">
        ← Mi panel
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-tinta">WhatsApp de {p?.nombre ?? "tu familiar"}</h1>
      <div className="mt-8">
        {!p ? (
          <div className="rounded-lg border border-linea bg-panel p-6">
            <p className="text-base text-texto">Primero contanos a quién querés proteger y a quién avisar.</p>
            <Link
              href="/app/setup"
              className="mt-4 inline-flex h-11 items-center rounded-md bg-tinta px-5 text-base font-medium text-white hover:bg-black"
            >
              Proteger a alguien
            </Link>
          </div>
        ) : !configurado ? (
          <p className="rounded-lg border border-linea bg-panel p-4 text-base text-texto">
            El guardián de WhatsApp no está disponible en este momento.
          </p>
        ) : (
          <VincularWhatsapp nombre={p.nombre ?? "tu familiar"} />
        )}
      </div>
      {p && (
        <p className="mt-10 rounded-lg border border-linea bg-panel p-4 text-sm leading-relaxed text-texto">
          Mula ignora a sus contactos de confianza y, si detecta un intento de estafa, le avisa a{" "}
          {p.nombre ?? "tu familiar"} en su propio chat y a los familiares que cargaste en{" "}
          <Link href="/app/setup" className="font-medium text-tinta underline underline-offset-2">
            la configuración
          </Link>
          . Nunca le responde al que escribe.
        </p>
      )}
    </main>
  );
}
