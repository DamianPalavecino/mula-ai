"use client";

import { useState } from "react";
import Link from "next/link";
import type { EntidadEnRed, RespuestaExtraer, RespuestaReporte, RolEntidad } from "@/lib/extraccion";
import type { ResumenEntidad } from "@/lib/tipos";
import { labelModalidad, TIPOS_ENTIDAD } from "@/lib/tipos";
import { fechaCorta, monto, plural } from "@/lib/formato";
import {
  IconoAlerta,
  IconoBanco,
  IconoBilletera,
  IconoCheck,
  IconoCopiar,
  IconoDescargar,
  IconoEscudo,
  IconoExpandir,
  IconoImprimir,
  IconoLey,
  IconoTelefono,
} from "@/components/MeEstafaronIconos";

const VERDE = "bg-[#15803d]";

const ROLES: Record<RolEntidad, string> = {
  destino_plata: "Destino de la plata",
  contacto_estafador: "Te escribió",
  otro: "En el chat",
};

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

function useCopiar() {
  const [copiado, setCopiado] = useState<string | null>(null);
  async function copiar(id: string, texto: string) {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Fallback para navegadores sin permiso de portapapeles.
      const ta = document.createElement("textarea");
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setCopiado(id);
    setTimeout(() => setCopiado((c) => (c === id ? null : c)), 2500);
  }
  return { copiado, copiar };
}

type Icono = (p: { className?: string }) => React.ReactNode;

function Documento({
  id,
  icono: Icono,
  titulo,
  ayuda,
  archivo,
  texto,
  copiado,
  onCopiar,
}: {
  id: string;
  icono: Icono;
  titulo: string;
  ayuda: string;
  archivo: string;
  texto: string;
  copiado: boolean;
  onCopiar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const secundario =
    "inline-flex h-10 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-linea px-3 text-sm font-medium text-tinta hover:bg-panel sm:flex-none";
  return (
    <section id={id} className="scroll-mt-20 rounded-2xl border border-linea bg-fondo p-4 sm:p-5">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-alerta-fondo text-alerta">
            <Icono className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-tinta">{titulo}</h3>
            <p className="text-sm text-suave">{ayuda}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCopiar}
          className={`inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-base font-semibold text-white transition-colors ${
            copiado ? VERDE : "bg-tinta hover:bg-black"
          }`}
        >
          {copiado ? <IconoCheck className="h-5 w-5" /> : <IconoCopiar className="h-5 w-5" />}
          {copiado ? "Copiado" : "Copiar"}
        </button>
        <div className="relative">
          <pre
            className={`overflow-hidden rounded-xl bg-panel p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-texto ${
              abierto ? "" : "max-h-36"
            }`}
          >
            {texto}
          </pre>
          {!abierto && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 rounded-b-xl bg-gradient-to-t from-panel to-transparent" />
          )}
        </div>
        <div className="flex gap-2">
          <button type="button" className={secundario} onClick={() => setAbierto((a) => !a)}>
            <IconoExpandir className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`} />
            {abierto ? "Menos" : "Ver todo"}
          </button>
          <button type="button" className={secundario} onClick={() => descargar(archivo, texto)} aria-label="Descargar">
            <IconoDescargar className="h-4 w-4" />
            .txt
          </button>
          <button type="button" className={secundario} onClick={() => imprimir(titulo, texto)} aria-label="Imprimir">
            <IconoImprimir className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Cuenta({ item }: { item: EntidadEnRed }) {
  const { entidad, resumen } = item;
  const reportes = resumen?.reportes ?? 0;
  const provincias = resumen?.provincias ?? [];
  const rojo = reportes > 0;
  return (
    <li
      className={`flex flex-col gap-3 rounded-2xl border-2 p-4 sm:p-5 ${
        rojo ? "border-alerta bg-alerta-fondo" : "border-linea bg-panel"
      }`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            rojo ? "bg-alerta text-white" : "bg-fondo text-suave"
          }`}
        >
          {entidad.tipo === "telefono" ? <IconoTelefono className="h-5 w-5" /> : <IconoBilletera className="h-5 w-5" />}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-medium tracking-wide text-suave uppercase">
            {TIPOS_ENTIDAD[entidad.tipo]} · {ROLES[entidad.rol] ?? ROLES.otro}
          </p>
          <p className="mt-0.5 font-mono text-base font-semibold break-all text-tinta sm:text-lg">{entidad.valor}</p>
        </div>
      </div>
      {!resumen ? (
        <p className="text-sm text-suave">Red no disponible</p>
      ) : rojo ? (
        <>
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-5xl leading-none font-bold tracking-tight text-alerta">{reportes}</p>
              <p className="mt-1 text-sm font-semibold text-alerta">
                {reportes === 1 ? "reporte" : "reportes"}
                {provincias.length > 0 && ` · ${plural(provincias.length, "provincia", "provincias")}`}
              </p>
            </div>
            {resumen.monto_total ? (
              <p className="text-right text-sm text-texto">
                <span className="block text-suave">robado</span>
                <span className="font-semibold text-tinta">{monto(resumen.monto_total)}</span>
              </p>
            ) : null}
          </div>
          {provincias.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">
              {provincias.map((p) => (
                <li key={p} className="rounded-full bg-fondo px-2.5 py-0.5 text-xs font-medium text-tinta">
                  {p}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <p className="flex items-center gap-1.5 text-sm text-suave">
          <IconoCheck className="h-4 w-4" />
          Sin reportes previos
        </p>
      )}
    </li>
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
  const { copiado, copiar } = useCopiar();
  const [registro, setRegistro] = useState<EstadoRegistro>({ tipo: "inicial" });

  // Las cuentas con más reportes primero: es lo que tiene que saltar a la vista.
  const cuentas = [...red].sort((a, b) => (b.resumen?.reportes ?? 0) - (a.resumen?.reportes ?? 0));
  const peor = cuentas[0]?.resumen?.reportes ? cuentas[0] : null;
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
    <div className="flex animate-entrada flex-col gap-8">
      {/* 1. Lo que pasó, en una mirada */}
      <div className={`overflow-hidden rounded-2xl text-white ${peor ? "bg-alerta" : "bg-tinta"}`}>
        <div className="flex flex-col gap-3 p-5 sm:p-7">
          <div className="flex flex-wrap gap-2 text-sm font-medium">
            <span className="rounded-full bg-white/15 px-3 py-1">{labelModalidad(x.modalidad)}</span>
            {x.monto_total ? <span className="rounded-full bg-white/15 px-3 py-1">{monto(x.monto_total)}</span> : null}
          </div>
          {peor ? (
            <>
              <p className="flex items-center gap-2 text-3xl leading-tight font-bold tracking-tight sm:text-4xl">
                <IconoAlerta className="h-8 w-8 shrink-0" />
                No sos la única víctima
              </p>
              <p className="text-lg leading-snug font-medium">
                <span className="font-mono break-all">{peor.entidad.valor}</span> ·{" "}
                {plural(peor.resumen!.reportes, "reporte", "reportes")}
                {peor.resumen!.provincias.length > 0 &&
                  ` en ${plural(peor.resumen!.provincias.length, "provincia", "provincias")}`}
              </p>
            </>
          ) : (
            <p className="text-3xl leading-tight font-bold tracking-tight sm:text-4xl">Tu caso</p>
          )}
          <p className="text-base leading-relaxed text-white/90">{x.resumen}</p>
        </div>
        {!x.legible && (
          <p className="flex items-center gap-2 bg-black/20 px-5 py-3 text-sm sm:px-7">
            <IconoAlerta className="h-4 w-4 shrink-0" />
            Algunas capturas no se leían bien. Revisá los datos.
          </p>
        )}
      </div>

      {/* 2. Las cuentas y sus reportes */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-tinta">Cuentas del caso</h2>
        {cuentas.length === 0 ? (
          <p className="rounded-2xl border border-linea bg-panel p-4 text-base text-texto">
            No encontramos alias, CBU, teléfonos, CUIT ni links legibles.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {cuentas.map((item) => (
              <Cuenta key={`${item.entidad.tipo}:${item.entidad.valor}`} item={item} />
            ))}
          </ul>
        )}
      </section>

      {/* 3. Los dos textos, listos para copiar */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-tinta">Hacé esto ahora</h2>
        <Documento
          id="pedido-bloqueo"
          icono={IconoBanco}
          titulo="Pedido de bloqueo"
          ayuda="Ya, a tu banco y al de destino."
          archivo="pedido-de-bloqueo.txt"
          texto={x.pedido_bloqueo}
          copiado={copiado === "bloqueo"}
          onCopiar={() => copiar("bloqueo", x.pedido_bloqueo)}
        />
        <Documento
          id="denuncia"
          icono={IconoLey}
          titulo="Denuncia"
          ayuda="Comisaría, fiscalía o denuncia online."
          archivo="denuncia.txt"
          texto={x.denuncia}
          copiado={copiado === "denuncia"}
          onCopiar={() => copiar("denuncia", x.denuncia)}
        />
        <p className="text-sm text-suave">Completá lo que está entre [corchetes].</p>
      </section>

      {/* 4. Pasos */}
      {x.pasos.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-tinta">Próximas horas</h2>
          <ol className="flex flex-col divide-y divide-linea rounded-2xl border border-linea">
            {x.pasos.map((p, i) => (
              <li key={i} className="flex gap-3 p-4">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-tinta text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="text-base leading-relaxed text-tinta">{p}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* 5. Sumar a la red */}
      {red.length > 0 && (
        <section className="rounded-2xl border border-linea bg-panel p-5 sm:p-6">
          {registro.tipo === "listo" ? (
            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-2 text-lg font-semibold text-tinta">
                <IconoEscudo className="h-6 w-6 text-[#15803d]" />
                Tu caso ya protege al próximo
              </p>
              <ul className="flex flex-col gap-1 text-base text-texto">
                {registro.entidades
                  .filter((e) => e.encontrada)
                  .map((e) => (
                    <li key={`${e.tipo}:${e.valor_normalizado}`}>
                      <span className="font-mono break-all text-tinta">{e.valor_normalizado}</span> ·{" "}
                      {plural(e.reportes, "reporte", "reportes")}
                    </li>
                  ))}
              </ul>
              <div className="flex flex-wrap gap-4 text-sm">
                {destino && (
                  <Link
                    href={`/app/verificar?valor=${encodeURIComponent(destino)}`}
                    className="text-tinta underline underline-offset-4"
                  >
                    Verificar {destino}
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tinta text-white">
                  <IconoEscudo className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-lg font-semibold text-tinta">Protegé al próximo</p>
                  <p className="text-sm text-suave">Solo las cuentas, nunca tu nombre.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={sumarALaRed}
                disabled={!puede_registrar || registro.tipo === "enviando"}
                className="h-12 w-full shrink-0 cursor-pointer rounded-xl bg-tinta px-6 text-base font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
              >
                {registro.tipo === "enviando" ? "Sumando…" : "Sumar a la red"}
              </button>
            </div>
          )}
          {!puede_registrar && registro.tipo !== "listo" && (
            <p className="mt-3 text-sm text-suave">No habilitado en este servidor.</p>
          )}
          {registro.tipo === "error" && (
            <p className="mt-3 flex items-center gap-2 text-sm text-alerta" role="alert">
              <IconoAlerta className="h-4 w-4 shrink-0" />
              {registro.mensaje}
            </p>
          )}
        </section>
      )}

      {/* 6. Detalle, plegado */}
      {(x.transferencias.length > 0 || x.cronologia.length > 0) && (
        <details className="group rounded-2xl border border-linea">
          <summary className="flex cursor-pointer list-none items-center justify-between p-4 text-base font-medium text-tinta">
            Detalle
            <IconoExpandir className="h-4 w-4 text-suave transition-transform group-open:rotate-180" />
          </summary>
          <div className="flex flex-col gap-5 border-t border-linea p-4">
            {x.transferencias.length > 0 && (
              <ul className="flex flex-col gap-3">
                {x.transferencias.map((t, i) => (
                  <li key={i} className="rounded-xl bg-panel p-3 text-sm text-texto">
                    <p className="text-base font-semibold text-tinta">
                      {t.monto != null ? monto(t.monto) : "—"}
                      <span className="font-normal text-suave">
                        {" · "}
                        {t.fecha && /^\d{4}-\d{2}-\d{2}$/.test(t.fecha)
                          ? fechaCorta(`${t.fecha}T12:00:00`)
                          : (t.fecha ?? "—")}
                      </span>
                    </p>
                    {t.destino && <p className="mt-1 font-mono break-all">{t.destino}</p>}
                    {t.titular_destino && <p className="mt-0.5">Titular: {t.titular_destino}</p>}
                    {t.comprobante && <p className="mt-0.5">Operación: {t.comprobante}</p>}
                  </li>
                ))}
              </ul>
            )}
            {x.cronologia.length > 0 && (
              <ol className="flex flex-col gap-2 border-l-2 border-linea pl-4">
                {x.cronologia.map((c, i) => (
                  <li key={i} className="text-sm leading-relaxed text-texto">
                    {c}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </details>
      )}

      {/* Barra fija en el celu: los dos textos siempre a mano */}
      <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t border-linea bg-fondo/95 px-4 py-3 backdrop-blur sm:hidden">
        <button
          type="button"
          onClick={() => copiar("bloqueo", x.pedido_bloqueo)}
          className={`inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-semibold text-white ${
            copiado === "bloqueo" ? VERDE : "bg-tinta"
          }`}
        >
          {copiado === "bloqueo" ? <IconoCheck className="h-4 w-4" /> : <IconoCopiar className="h-4 w-4" />}
          {copiado === "bloqueo" ? "Copiado" : "Bloqueo"}
        </button>
        <button
          type="button"
          onClick={() => copiar("denuncia", x.denuncia)}
          className={`inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-semibold ${
            copiado === "denuncia" ? `${VERDE} text-white` : "border border-tinta text-tinta"
          }`}
        >
          {copiado === "denuncia" ? <IconoCheck className="h-4 w-4" /> : <IconoCopiar className="h-4 w-4" />}
          {copiado === "denuncia" ? "Copiado" : "Denuncia"}
        </button>
      </div>
    </div>
  );
}
