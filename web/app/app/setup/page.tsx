import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { misProtegidos } from "@/lib/misAlertas";
import { PROVINCIAS } from "@/lib/extraccion";
import { formatearTelefono } from "@/lib/setup";
import type { Protegido } from "@/lib/tipos";
import AppSetupForm from "@/components/AppSetupForm";

export const metadata: Metadata = { title: "A quién protegés" };

export default async function AppSetupPage() {
  const sesion = await requireUser();
  let p: Protegido | undefined;
  try {
    p = (await misProtegidos(supabaseAdmin(), sesion.userId))[0];
  } catch (e) {
    console.error("[app/setup]", (e as Error).message);
  }
  const lineas = (xs: string[] | null | undefined) => (xs ?? []).map(formatearTelefono).join("\n");

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <Link href="/app" className="text-sm font-medium text-suave hover:text-tinta">
        ← Mi panel
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-tinta">
        {p ? "Editar a quién protegés" : "¿A quién querés proteger?"}
      </h1>
      <div className="mt-8">
        <AppSetupForm
          provincias={PROVINCIAS}
          valores={{
            nombre: p?.nombre ?? "",
            telefono: formatearTelefono(p?.telefono),
            provincia: p?.provincia ?? "",
            contactos: lineas(p?.contactos_confianza),
            familiares: lineas(p?.familiares),
          }}
        />
      </div>
      <p className="mt-10 rounded-lg border border-linea bg-panel p-4 text-sm leading-relaxed text-texto">
        Estos datos se usan para que el guardián ignore a tus contactos de confianza y avise a tus
        familiares por WhatsApp. Después,{" "}
        <Link href="/app/vincular" className="font-medium text-tinta underline underline-offset-2">
          vinculá su WhatsApp con el código QR
        </Link>
        .
      </p>
    </main>
  );
}
