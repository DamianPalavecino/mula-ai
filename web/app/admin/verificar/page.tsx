import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { ResumenEntidad } from "@/lib/tipos";
import ResumenCard from "@/components/ResumenCard";

export const metadata: Metadata = { title: "Verificar cuenta" };

const EJEMPLO = "juli.martinez.mp";

export default async function AdminVerificarPage({
  searchParams,
}: {
  searchParams: Promise<{ valor?: string | string[] }>;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const crudo = Array.isArray(sp.valor) ? sp.valor[0] : sp.valor;
  const valor = (crudo ?? "").trim().slice(0, 60);

  let resumen: ResumenEntidad | null = null;
  let fallo = false;
  if (valor) {
    const { data, error } = await supabaseAdmin().rpc("resumen_entidad", { valor });
    if (error || !data) fallo = true;
    else resumen = data as ResumenEntidad;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <a href="/admin" className="text-sm font-medium text-suave hover:text-tinta">
        ← Panel de gobierno
      </a>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-tinta sm:text-4xl">
        Verificar una cuenta
      </h1>
      <form method="GET" className="mt-6">
        <label htmlFor="valor" className="text-sm font-medium text-suave">
          Alias, CBU/CVU o teléfono
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="valor"
            name="valor"
            defaultValue={valor}
            maxLength={60}
            placeholder="alias, CBU/CVU o teléfono"
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
          <a
            href={`/admin/verificar?valor=${EJEMPLO}`}
            className="font-mono text-tinta underline underline-offset-2 hover:text-black"
          >
            {EJEMPLO}
          </a>
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
