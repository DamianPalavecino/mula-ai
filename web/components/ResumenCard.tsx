import type { ResumenEntidad } from "@/lib/tipos";
import { labelModalidad, TIPOS_ENTIDAD } from "@/lib/tipos";
import { fechaRelativa, monto } from "@/lib/formato";
import { IconoGuion, IconoOk, IconoPeligro, IconoPlata, IconoReloj, IconoUbicacion } from "@/components/iconos";

function Valor({ resumen, tono }: { resumen: ResumenEntidad; tono: "alerta" | "seguro" }) {
  return (
    <p className="flex min-w-0 flex-wrap items-center gap-2">
      <span
        className={`rounded px-1.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${
          tono === "alerta" ? "bg-alerta/10 text-alerta" : "bg-seguro/10 text-seguro"
        }`}
      >
        {TIPOS_ENTIDAD[resumen.tipo] ?? "Valor"}
      </span>
      <span className="min-w-0 font-mono text-base break-all text-tinta">{resumen.valor_normalizado}</span>
    </p>
  );
}

function Chips({ icono, items }: { icono: React.ReactNode; items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <li
          key={t}
          className="flex items-center gap-1 rounded-full border border-alerta-linea bg-fondo px-2.5 py-1 text-sm font-medium text-tinta"
        >
          <span className="text-alerta">{icono}</span>
          {t}
        </li>
      ))}
    </ul>
  );
}

// Resultado de resumen_entidad: rojo si tiene reportes, verde si no.
export default function ResumenCard({
  resumen,
  compacto = false,
}: {
  resumen: ResumenEntidad;
  compacto?: boolean;
}) {
  if (!resumen.reportes) {
    return (
      <div
        className={`animate-entrada rounded-xl border-2 border-seguro-linea bg-seguro-fondo ${compacto ? "p-4" : "p-5 sm:p-6"}`}
      >
        <div className="flex items-center gap-3 text-seguro">
          <IconoOk className={compacto ? "h-7 w-7" : "h-10 w-10"} />
          <p className={`font-bold tracking-tight ${compacto ? "text-xl" : "text-3xl"}`}>Sin reportes</p>
        </div>
        <div className="mt-4">
          <Valor resumen={resumen} tono="seguro" />
        </div>
        <p className="mt-3 text-sm text-texto">Si te apuran o piden plata, verificá por otro medio.</p>
      </div>
    );
  }

  const provincias = resumen.provincias ?? [];
  const modalidades = resumen.modalidades ?? [];
  const chico = "h-3.5 w-3.5";

  return (
    <div className="animate-entrada overflow-hidden rounded-xl border-2 border-alerta shadow-lg" role="alert">
      <div className={`bg-alerta text-white ${compacto ? "px-4 py-3" : "px-5 py-5 sm:px-7 sm:py-6"}`}>
        <div className="flex items-center gap-2.5">
          <IconoPeligro className={compacto ? "h-6 w-6" : "h-9 w-9"} />
          <p className={`font-extrabold tracking-tight ${compacto ? "text-xl" : "text-3xl sm:text-4xl"}`}>
            No transfieras
          </p>
        </div>
        <p className={`flex flex-wrap items-baseline gap-x-2 ${compacto ? "mt-1" : "mt-3"}`}>
          <span className={`font-extrabold tabular-nums ${compacto ? "text-3xl" : "text-6xl sm:text-7xl"}`}>
            {resumen.reportes}
          </span>
          <span className={`font-semibold ${compacto ? "text-base" : "text-xl sm:text-2xl"}`}>
            {resumen.reportes === 1 ? "reporte" : "reportes"}
            {provincias.length > 1 && ` en ${provincias.length} provincias`}
          </span>
        </p>
      </div>

      <div className={`flex flex-col gap-4 bg-alerta-fondo ${compacto ? "p-4" : "p-5 sm:p-7"}`}>
        <Valor resumen={resumen} tono="alerta" />
        {provincias.length > 0 && <Chips icono={<IconoUbicacion className={chico} />} items={provincias} />}
        {modalidades.length > 0 && (
          <Chips icono={<IconoGuion className={chico} />} items={modalidades.map(labelModalidad)} />
        )}
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-texto">
          {Number(resumen.monto_total) > 0 && (
            <span className="flex items-center gap-1.5" title="Monto total reportado">
              <IconoPlata className="h-4 w-4 text-alerta" />
              <strong className="text-tinta">{monto(resumen.monto_total)}</strong> reportados
            </span>
          )}
          <span className="flex items-center gap-1.5" title="Último reporte">
            <IconoReloj className="h-4 w-4 text-alerta" />
            último {fechaRelativa(resumen.ultimo)}
          </span>
        </div>
      </div>
    </div>
  );
}
