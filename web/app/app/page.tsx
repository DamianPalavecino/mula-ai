import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { misAlertas, misProtegidos } from "@/lib/misAlertas";
import { formatearTelefono } from "@/lib/setup";
import type { Alerta, Protegido } from "@/lib/tipos";
import AppAlertas from "@/components/AppAlertas";
import AppProbarMensaje from "@/components/AppProbarMensaje";

export const metadata: Metadata = { title: "Mi panel" };

const ATAJOS = [
  { href: "/app/verificar", titulo: "Verificar una cuenta", texto: "Antes de transferir, fijate si tiene reportes." },
  { href: "/app/me-estafaron", titulo: "Me estafaron", texto: "Armá la denuncia y el pedido de bloqueo." },
];

export default async function AppPage() {
  const sesion = await requireUser();

  let protegidos: Protegido[] = [];
  let alertas: Alerta[] = [];
  let fallo = false;
  try {
    const sb = supabaseAdmin();
    protegidos = await misProtegidos(sb, sesion.userId);
    alertas = await misAlertas(sb, protegidos);
  } catch (e) {
    console.error("[app]", (e as Error).message);
    fallo = true;
  }
  const p = protegidos[0];
  const configurado = Boolean(process.env.WORKER_URL && process.env.MULA_TOKEN);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-sm font-medium text-suave">
        Mi panel{sesion.nombre ? ` · ${sesion.nombre}` : ""}
      </p>

      {fallo ? (
        <p className="mt-6 rounded-lg border border-linea bg-panel p-4 text-base text-texto">
          No pudimos cargar tus datos. Recargá en unos segundos.
        </p>
      ) : !p ? (
        <div className="mt-6 rounded-lg border border-linea bg-panel p-6 sm:p-8">
          <h1 className="text-2xl font-semibold tracking-tight text-tinta sm:text-3xl">
            Todavía no protegés a nadie
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-texto">
            Cargá a la persona que querés cuidar y a quién avisar. Cuando le llegue un mensaje
            sospechoso por WhatsApp, te enterás acá y en tu teléfono.
          </p>
          <Link
            href="/app/setup"
            className="mt-5 inline-flex h-11 items-center rounded-md bg-tinta px-5 text-base font-medium text-white hover:bg-black"
          >
            Proteger a alguien
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-tinta sm:text-3xl">
              Protegés a {p.nombre}
            </h1>
            <Link href="/app/setup" className="text-sm font-medium text-tinta underline underline-offset-2 hover:text-black">
              Editar
            </Link>
          </div>
          <p className="mt-1 text-base text-suave">
            {[formatearTelefono(p.telefono), p.provincia].filter(Boolean).join(" · ")}
          </p>
          <div className="mt-6">
            <AppAlertas iniciales={alertas} nombre={p.nombre ?? "tu familiar"} />
          </div>
        </>
      )}

      {configurado && p && (
        <div className="mt-6">
          <AppProbarMensaje />
        </div>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {ATAJOS.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="rounded-lg border border-linea bg-fondo p-4 hover:bg-panel sm:p-5"
          >
            <p className="text-base font-semibold text-tinta">{a.titulo}</p>
            <p className="mt-1 text-sm text-suave">{a.texto}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
