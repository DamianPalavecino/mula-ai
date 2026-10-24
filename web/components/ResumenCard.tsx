import type { ResumenEntidad } from "@/lib/tipos";
import { labelModalidad, TIPOS_ENTIDAD } from "@/lib/tipos";
import { fechaCorta, fechaRelativa, monto, plural } from "@/lib/formato";

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-suave">{label}</p>
      <div className="mt-1 text-base text-tinta">{children}</div>
    </div>
  );
}

function Consultado({ resumen }: { resumen: ResumenEntidad }) {
  return (
    <Dato label={TIPOS_ENTIDAD[resumen.tipo] ?? "Valor"}>
      <span className="font-mono break-all">{resumen.valor_normalizado}</span>
    </Dato>
  );
}

// Resultado de resumen_entidad. Rojo si tiene reportes, neutro si no.
export default function ResumenCard({
  resumen,
  compacto = false,
}: {
  resumen: ResumenEntidad;
  compacto?: boolean;
}) {
  const sujeto = resumen.tipo === "telefono" ? "Este número" : "Esta cuenta";

  if (!resumen.reportes) {
    return (
      <div className={`rounded-lg border border-linea bg-panel ${compacto ? "p-4" : "p-5 sm:p-6"}`}>
        <p className={`font-semibold text-tinta ${compacto ? "text-lg" : "text-2xl"}`}>
          Sin reportes en la red
        </p>
        <div className="mt-4">
          <Consultado resumen={resumen} />
        </div>
        <p className="mt-4 text-sm leading-relaxed text-texto">
          Que no tenga reportes no garantiza que sea segura. Si te apuran o te piden
          plata desde un número nuevo, verificá por otro medio antes de transferir.
        </p>
      </div>
    );
  }

  const provincias = resumen.provincias ?? [];
  const modalidades = resumen.modalidades ?? [];
  const titular = provincias.length
    ? `${sujeto} tiene ${plural(resumen.reportes, "reporte", "reportes")} en ${plural(provincias.length, "provincia", "provincias")}.`
    : `${sujeto} tiene ${plural(resumen.reportes, "reporte", "reportes")}.`;

  return (
    <div className="overflow-hidden rounded-lg border border-alerta" role="alert">
      <div className={`bg-alerta text-white ${compacto ? "px-4 py-3" : "px-5 py-5 sm:px-6"}`}>
        <p className={`font-bold tracking-tight ${compacto ? "text-xl" : "text-3xl sm:text-4xl"}`}>
          ⚠️ No transfieras
        </p>
        <p className={`mt-1 font-medium ${compacto ? "text-base" : "text-lg sm:text-xl"}`}>
          {titular}
        </p>
      </div>
      <div
        className={`grid gap-4 bg-alerta-fondo ${compacto ? "p-4" : "p-5 sm:grid-cols-2 sm:p-6"}`}
      >
        <Consultado resumen={resumen} />
        <Dato label="Monto total reportado">{monto(resumen.monto_total)}</Dato>
        {modalidades.length > 0 && (
          <Dato label="Modalidades">
            <ul className="flex flex-wrap gap-1.5">
              {modalidades.map((m) => (
                <li
                  key={m}
                  className="rounded-full border border-alerta-linea bg-fondo px-2.5 py-0.5 text-sm text-tinta"
                >
                  {labelModalidad(m)}
                </li>
              ))}
            </ul>
          </Dato>
        )}
        {provincias.length > 0 && <Dato label="Provincias">{provincias.join(", ")}</Dato>}
        <Dato label="Último reporte">
          {fechaRelativa(resumen.ultimo)}
          <span className="text-suave"> · {fechaCorta(resumen.ultimo)}</span>
        </Dato>
      </div>
    </div>
  );
}
