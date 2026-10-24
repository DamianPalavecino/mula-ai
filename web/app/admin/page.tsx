import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Alerta, Grafo } from "@/lib/tipos";
import { alertaParaRol, alertasUltimas24h, calcularStats, entidadesDistintas, type Conteo } from "@/lib/adminStats";
import AdminRed from "@/components/AdminRed";

export const metadata: Metadata = { title: "Red de estafas" };

function Tarjeta({ label, valor }: { label: string; valor: number }) {
  return (
    <div className="rounded-lg border border-linea bg-fondo p-4">
      <p className="text-sm font-medium text-suave">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight text-tinta">
        {valor.toLocaleString("es-AR")}
      </p>
    </div>
  );
}

function Barras({ titulo, items }: { titulo: string; items: Conteo[] }) {
  const max = Math.max(1, ...items.map((i) => i.n));
  return (
    <section className="rounded-lg border border-linea bg-fondo p-4">
      <h2 className="text-base font-semibold text-tinta">{titulo}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-suave">Sin datos todavía.</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {items.map((i) => (
            <li key={i.clave}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-tinta">{i.label}</span>
                <span className="shrink-0 text-suave">{i.n}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-panel">
                <div
                  className="h-2 rounded-full bg-tinta"
                  style={{ width: `${Math.max(2, (i.n / max) * 100)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default async function AdminPage() {
  const sesion = await requireUser();
  const sb = supabaseAdmin();
  const [grafoRes, alertasRes, reportesRes] = await Promise.all([
    sb.rpc("grafo"),
    sb.from("alertas").select("*").order("created_at", { ascending: false }).limit(30),
    sb.from("reportes").select("provincia, modalidad, fuente").limit(2000),
  ]);

  const grafo = (grafoRes.data ?? { nodes: [], links: [] }) as Grafo;
  const alertas = ((alertasRes.data ?? []) as Alerta[]).map((a) => alertaParaRol(a, sesion.rol));
  const stats = calcularStats(reportesRes.data ?? []);
  const hayError = grafoRes.error || alertasRes.error || reportesRes.error;

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-tinta sm:text-4xl">
          Red de estafas
        </h1>
        <a
          href="/admin/verificar"
          className="text-sm font-medium text-tinta underline underline-offset-2 hover:text-black"
        >
          Verificar una cuenta
        </a>
      </div>
      {hayError && (
        <p className="mt-4 rounded-lg border border-linea bg-panel p-3 text-sm text-texto">
          Algunos datos no se pudieron cargar. Recargá la página.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tarjeta label="Reportes" valor={stats.total} />
        <Tarjeta label="Cuentas y números distintos" valor={entidadesDistintas(grafo)} />
        <Tarjeta label="Alertas últimas 24 h" valor={alertasUltimas24h(alertas)} />
        <Tarjeta label="Provincias con reportes" valor={stats.provinciasConReportes} />
      </div>

      <div className="mt-6">
        <AdminRed grafoInicial={grafo} alertasIniciales={alertas} />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Barras titulo="Reportes por provincia" items={stats.porProvincia} />
        <Barras titulo="Reportes por modalidad" items={stats.porModalidad} />
      </div>
    </main>
  );
}
