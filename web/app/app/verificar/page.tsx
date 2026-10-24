import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ResumenEntidad } from "@/lib/tipos";
import ResumenCard from "@/components/ResumenCard";

export const metadata: Metadata = {
  title: "Verificar antes de pagar",
  description:
    "Pegá un alias, CBU/CVU, teléfono, CUIT o link y fijate si tiene reportes de estafa en la red de Mula AI antes de transferir.",
};

const EJEMPLO = "juli.martinez.mp";

export default async function AppVerificarPage({
  searchParams,
}: {
  searchParams: Promise<{ valor?: string | string[] }>;
}) {
  await requireUser();
  const sp = await searchParams;
  const crudo = Array.isArray(sp.valor) ? sp.valor[0] : sp.valor;
  const valor = (crudo ?? "").trim().slice(0, 200);

  let resumen: ResumenEntidad | null = null;
  let fallo = false;
  if (valor) {
    try {
      const { data, error } = await supabaseAdmin().rpc("resumen_entidad", { valor, tipo: null });
      if (error || !data) fallo = true;
      else resumen = data as ResumenEntidad;
    } catch {
      fallo = true;
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <Link href="/app" className="text-sm font-medium text-suave hover:text-tinta">
        ← Mi panel
      </Link>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-tinta sm:text-4xl">
        ¿Esta cuenta tiene reportes?
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-texto">
        Pegá el alias, CBU/CVU, teléfono, CUIT o link que te pasaron. Te mostramos si ya fue reportado en la red
        de Mula AI.
      </p>
      <form method="GET" className="mt-8">
        <label htmlFor="valor" className="text-sm font-medium text-suave">
          Alias, CBU/CVU, teléfono, CUIT o link
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="valor"
            name="valor"
            defaultValue={valor}
            maxLength={200}
            placeholder={`ej. ${EJEMPLO}`}
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="h-12 w-full rounded-md border border-linea bg-fondo px-4 font-mono text-base text-tinta placeholder:text-suave focus:border-tinta focus:outline-none sm:flex-1"
          />
          <button
            type="submit"
            className="h-12 cursor-pointer rounded-md bg-tinta px-6 text-base font-medium text-white hover:bg-black"
          >
            Verificar
          </button>
        </div>
        <p className="mt-3 text-sm text-suave">
          Probá con{" "}
          <Link
            href={`/app/verificar?valor=${EJEMPLO}`}
            className="font-mono text-tinta underline underline-offset-2 hover:text-black"
          >
            {EJEMPLO}
          </Link>
        </p>
      </form>

      <div className="mt-6">
        {resumen && <ResumenCard resumen={resumen} />}
        {fallo && (
          <p className="rounded-lg border border-linea bg-panel p-4 text-base text-texto">
            No pudimos consultar la red. Probá de nuevo.
          </p>
        )}
      </div>
    </main>
  );
}
