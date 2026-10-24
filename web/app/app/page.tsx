import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { misAlertas, misProtegidos } from "@/lib/misAlertas";
import { formatearTelefono } from "@/lib/setup";
import { PROVINCIAS } from "@/lib/extraccion";
import { alertaParaRol, calcularStats, entidadesDistintas } from "@/lib/adminStats";
import type { Alerta, Grafo, Protegido } from "@/lib/tipos";
import Panel, { TABS, type Tab } from "@/components/Panel";

export const metadata: Metadata = { title: "Mi panel" };

function primero(x: string | string[] | undefined): string {
  return (Array.isArray(x) ? x[0] : x) ?? "";
}

// Panel único: todo se carga server-side (sesión de Clerk + service role, filtrado por owner).
export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[]; valor?: string | string[] }>;
}) {
  const sesion = await requireUser();
  const sp = await searchParams;
  const tabPedida = primero(sp.tab) as Tab;
  const tabInicial: Tab = TABS.includes(tabPedida) ? tabPedida : "inicio";

  const sb = supabaseAdmin();
  let protegidos: Protegido[] = [];
  let alertas: Alerta[] = [];
  let error = false;
  try {
    protegidos = await misProtegidos(sb, sesion.userId);
    alertas = await misAlertas(sb, protegidos);
  } catch (e) {
    console.error("[app]", (e as Error).message);
    error = true;
  }

  const [grafoRes, alertasRes, reportesRes] = await Promise.all([
    sb.rpc("grafo"),
    sb.from("alertas").select("*").order("created_at", { ascending: false }).limit(30),
    sb.from("reportes").select("provincia, modalidad, fuente").limit(2000),
  ]);
  if (grafoRes.error || alertasRes.error || reportesRes.error) error = true;
  const grafo = (grafoRes.data ?? { nodes: [], links: [] }) as Grafo;
  const alertasRed = ((alertasRes.data ?? []) as Alerta[]).map((a) => alertaParaRol(a, sesion.rol));
  const stats = calcularStats(reportesRes.data ?? []);

  const p = protegidos[0];
  const lineas = (xs: string[] | null | undefined) => (xs ?? []).map(formatearTelefono).join("\n");

  return (
    <Panel
      tabInicial={tabInicial}
      valorVerificar={primero(sp.valor).trim().slice(0, 60)}
      protegido={
        p
          ? {
              nombre: p.nombre ?? "tu familiar",
              ubicacion: [formatearTelefono(p.telefono), p.provincia].filter(Boolean).join(" · "),
            }
          : null
      }
      misAlertas={alertas}
      probarConfigurado={Boolean(process.env.WORKER_URL && process.env.MULA_TOKEN)}
      grafo={grafo}
      alertasRed={alertasRed}
      stats={{
        reportes: stats.total,
        cuentas: entidadesDistintas(grafo),
        provincias: stats.provinciasConReportes,
        porProvincia: stats.porProvincia,
        porModalidad: stats.porModalidad,
      }}
      setup={{
        provincias: PROVINCIAS,
        valores: {
          nombre: p?.nombre ?? "",
          telefono: formatearTelefono(p?.telefono),
          provincia: p?.provincia ?? "",
          contactos: lineas(p?.contactos_confianza),
          familiares: lineas(p?.familiares),
        },
      }}
      error={error}
    />
  );
}
