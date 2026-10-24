"use client";

import { useState } from "react";
import Link from "next/link";
import type { RespuestaExtraer, RespuestaReporte, RolEntidad } from "@/lib/extraccion";
import type { ResumenEntidad } from "@/lib/tipos";
import { labelModalidad, TIPOS_ENTIDAD } from "@/lib/tipos";
import { fechaCorta, monto, plural } from "@/lib/formato";
import ResumenCard from "@/components/ResumenCard";

const ROLES: Record<RolEntidad, string> = {
  destino_plata: "Adonde fue la plata",
  contacto_estafador: "Desde donde te escribieron",
  otro: "Mencionado en el chat",
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold tracking-tight text-tinta">{titulo}</h2>
      {children}
    </section>
  );
}

function escaparHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function imprimir(titulo: string, texto: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(
    `<!doctype html><html lang="es-AR"><head><meta charset="utf-8"><title>${escaparHtml(titulo)}</title>` +
      `<style>body{font:12pt/1.6 Georgia,serif;max-width:17cm;margin:2cm auto;color:#000}pre{white-space:pre-wrap;font:inherit}</style>` +
      `</head><body><pre>${escaparHtml(texto)}</pre></body></html>`,
  );
  w.document.close();
  w.focus();
  w.print();
}

function descargar(nombre: string, texto: string) {
  const url = URL.createObjectURL(new Blob([texto], { type: "text/plain;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

function Documento({ titulo, archivo, texto }: { titulo: string; archivo: string; texto: string }) {
  const [copiado, setCopiado] = useState(false);
  const boton =
    "h-10 cursor-pointer rounded-md border border-linea px-4 text-sm font-medium text-tinta hover:bg-panel";
  return (
    <div className="overflow-hidden rounded-lg border border-linea">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-linea bg-panel px-4 py-3">
        <p className="text-base font-semibold text-tinta">{titulo}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={boton}
            onClick={async () => {
              await navigator.clipboard.writeText(texto);
              setCopiado(true);
              setTimeout(() => setCopiado(false), 2000);
            }}
          >
            {copiado ? "Copiado" : "Copiar"}
          </button>
          <button type="button" className={boton} onClick={() => imprimir(titulo, texto)}>
            Imprimir
          </button>
          <button type="button" className={boton} onClick={() => descargar(archivo, texto)}>
            Descargar
          </button>
        </div>
      </div>
      <pre className="max-h-[28rem] overflow-y-auto bg-fondo p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-texto sm:p-5">
        {texto}
      </pre>
    </div>
  );
}

type EstadoRegistro =
  | { tipo: "inicial" }
  | { tipo: "enviando" }
  | { tipo: "listo"; entidades: ResumenEntidad[] }
  | { tipo: "error"; mensaje: string };

export default function MeEstafaronResultado({
  respuesta,
  provincia,
}: {
  respuesta: RespuestaExtraer;
  provincia: string;
}) {
  const { extraccion: x, red, puede_registrar } = respuesta;
  const [registro, setRegistro] = useState<EstadoRegistro>({ tipo: "inicial" });
  const conReportes = red.filter((r) => (r.resumen?.reportes ?? 0) > 0);
  const destino = red.find((r) => r.entidad.rol === "destino_plata")?.entidad.valor;

  async function sumarALaRed() {
    setRegistro({ tipo: "enviando" });
    try {
      const res = await fetch("/app/api/registrar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modalidad: x.modalidad,
          provincia,
          monto: x.monto_total,
          texto: x.resumen,
          senales: x.senales,
          suplanta_a: x.suplanta_a,
          entidades: x.entidades.map(({ tipo, valor }) => ({ tipo, valor })),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.reporte_id) {
        setRegistro({ tipo: "error", mensaje: json?.error ?? "No pudimos sumar el caso." });
        return;
      }
      setRegistro({ tipo: "listo", entidades: (json as RespuestaReporte).entidades ?? [] });
    } catch {
      setRegistro({ tipo: "error", mensaje: "Se cortó la conexión. Probá de nuevo." });
    }
  }

  return (
    <div className="flex flex-col gap-12 animate-entrada">
      {/* Resumen del caso */}
      <div className="overflow-hidden rounded-lg border border-alerta">
        <div className="bg-alerta px-5 py-5 text-white sm:px-6">
          <p className="text-sm font-medium opacity-90">{labelModalidad(x.modalidad)}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            {x.monto_total ? `Transferiste ${monto(x.monto_total)}` : "Tu caso"}
          </p>
          {conReportes.length > 0 && (
            <p className="mt-2 text-lg font-medium">
              No sos la única víctima:{" "}
              {conReportes
                .map(
                  (r) =>
                    `${r.entidad.valor} ya tiene ${plural(r.resumen!.reportes, "reporte", "reportes")}`,
                )
                .join(" · ")}
              .
            </p>
          )}
        </div>
        <div className="flex flex-col gap-4 bg-alerta-fondo p-5 sm:p-6">
          {!x.legible && (
            <p className="rounded-md border border-alerta-linea bg-fondo p-3 text-sm text-tinta">
              No pudimos leer bien todo lo que subiste. Revisá los datos y completá lo que falte.
            </p>
          )}
          <p className="text-base leading-relaxed text-tinta">{x.resumen}</p>
          {x.senales.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {x.senales.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-alerta-linea bg-fondo px-2.5 py-0.5 text-sm text-tinta"
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Qué hacer ahora */}
      {x.pasos.length > 0 && (
        <Seccion titulo="Qué hacer ahora">
          <ol className="flex flex-col gap-3">
            {x.pasos.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-lg border border-linea p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tinta text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <span className="text-base leading-relaxed text-tinta">{p}</span>
              </li>
            ))}
          </ol>
        </Seccion>
      )}

      {/* Cuentas y números + red */}
      <Seccion titulo="Cuentas y números del caso">
        {red.length === 0 ? (
          <p className="rounded-lg border border-linea bg-panel p-4 text-base text-texto">
            No encontramos ningún alias, CBU, CVU ni teléfono legible. Si los tenés, agregalos en el
            relato y volvé a armar el caso.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {red.map(({ entidad, resumen }) => (
              <li key={`${entidad.tipo}:${entidad.valor}`} className="flex flex-col gap-2">
                <div>
                  <p className="text-sm font-medium text-suave">
                    {ROLES[entidad.rol] ?? ROLES.otro} · {TIPOS_ENTIDAD[entidad.tipo]} · {entidad.donde}
                  </p>
                  <p className="mt-0.5 font-mono text-base break-all text-tinta">{entidad.valor}</p>
                </div>
                {resumen ? (
                  <ResumenCard resumen={resumen} compacto />
                ) : (
                  <p className="rounded-lg border border-linea bg-panel p-4 text-sm text-texto">
                    No pudimos consultar la red para este dato.
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}

        {x.transferencias.length > 0 && (
          <div className="overflow-x-auto rounded-lg border border-linea">
            <table className="w-full text-left text-sm">
              <thead className="bg-panel text-suave">
                <tr>
                  <th className="px-4 py-2 font-medium">Fecha</th>
                  <th className="px-4 py-2 font-medium">Monto</th>
                  <th className="px-4 py-2 font-medium">Destino</th>
                  <th className="px-4 py-2 font-medium">Operación</th>
                </tr>
              </thead>
              <tbody>
                {x.transferencias.map((t, i) => (
                  <tr key={i} className="border-t border-linea text-tinta">
                    <td className="px-4 py-2">
                      {t.fecha && /^\d{4}-\d{2}-\d{2}$/.test(t.fecha)
                        ? fechaCorta(`${t.fecha}T12:00:00`)
                        : (t.fecha ?? "—")}
                    </td>
                    <td className="px-4 py-2">{t.monto != null ? monto(t.monto) : "—"}</td>
                    <td className="px-4 py-2 font-mono break-all">
                      {t.destino ?? "—"}
                      {t.titular_destino && (
                        <span className="block font-sans text-suave">{t.titular_destino}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono">{t.comprobante ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Seccion>

      {/* Sumar a la red */}
      {red.length > 0 && (
        <Seccion titulo="Protegé al próximo">
          <div className="rounded-lg border border-linea bg-panel p-5 sm:p-6">
            {registro.tipo === "listo" ? (
              <div className="flex flex-col gap-3">
                <p className="text-lg font-semibold text-tinta">Listo, tu caso ya está en la red.</p>
                <ul className="flex flex-col gap-1 text-base text-texto">
                  {registro.entidades
                    .filter((e) => e.encontrada)
                    .map((e) => (
                      <li key={`${e.tipo}:${e.valor_normalizado}`}>
                        <span className="font-mono text-tinta">{e.valor_normalizado}</span> ahora tiene{" "}
                        {plural(e.reportes, "reporte", "reportes")}
                        {e.provincias.length > 0 &&
                          ` en ${plural(e.provincias.length, "provincia", "provincias")}`}
                        .
                      </li>
                    ))}
                </ul>
                <div className="flex flex-wrap gap-4 text-sm">
                  {destino && (
                    <Link
                      href={`/app/verificar?valor=${encodeURIComponent(destino)}`}
                      className="text-tinta underline underline-offset-2"
                    >
                      Ver cómo lo ve el próximo que quiera transferirle
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-base leading-relaxed text-texto">
                  Si sumás tu caso, la próxima persona que pegue estas cuentas en Mula AI o reciba un
                  mensaje desde estos números va a ver la advertencia. Solo guardamos las cuentas, los
                  números y el resumen; nunca tu nombre ni el del titular.
                </p>
                <button
                  type="button"
                  onClick={sumarALaRed}
                  disabled={!puede_registrar || registro.tipo === "enviando"}
                  className="h-12 shrink-0 cursor-pointer rounded-md bg-tinta px-6 text-base font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {registro.tipo === "enviando" ? "Sumando…" : "Sumar mi caso a la red"}
                </button>
              </div>
            )}
            {!puede_registrar && registro.tipo !== "listo" && (
              <p className="mt-3 text-sm text-suave">Sumar casos no está habilitado en este servidor.</p>
            )}
            {registro.tipo === "error" && (
              <p className="mt-3 text-sm text-alerta" role="alert">
                {registro.mensaje}
              </p>
            )}
          </div>
        </Seccion>
      )}

      {/* Documentos */}
      <Seccion titulo="Pedido de bloqueo al banco">
        <p className="text-base leading-relaxed text-texto">
          Mandalo ya: cuanto antes lo reciba el banco o la billetera, más chances hay de frenar la plata.
          Completá los datos entre corchetes.
        </p>
        <Documento titulo="Pedido de bloqueo" archivo="pedido-de-bloqueo.txt" texto={x.pedido_bloqueo} />
      </Seccion>

      <Seccion titulo="Denuncia">
        <p className="text-base leading-relaxed text-texto">
          Presentala en una comisaría, en la fiscalía o en la denuncia online del Ministerio Público de
          tu provincia, con las capturas impresas. Completá los datos entre corchetes.
        </p>
        <Documento titulo="Denuncia penal por estafa" archivo="denuncia.txt" texto={x.denuncia} />
      </Seccion>

      {x.cronologia.length > 0 && (
        <Seccion titulo="Cómo pasó">
          <ol className="flex flex-col gap-2 border-l-2 border-linea pl-4">
            {x.cronologia.map((c, i) => (
              <li key={i} className="text-base leading-relaxed text-texto">
                {c}
              </li>
            ))}
          </ol>
        </Seccion>
      )}
    </div>
  );
}
