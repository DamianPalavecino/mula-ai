"use client";

import { useEffect, useRef, useState } from "react";
import type { RespuestaAnalizar } from "@/lib/tipos";
import { labelModalidad } from "@/lib/tipos";
import { MENSAJES_DEMO, analizar, lineaRed, partesNegrita, type ModoSimulador } from "@/lib/simulador";

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL;
const NUMERO_ESTAFADOR = "+54 9 11 3871-2290";
const MAX_CARACTERES = 2000;
// En modo demo la respuesta es instantánea: la demoramos para que se vea el "analizando".
const DEMORA_DEMO_MS = 1400;

interface Mensaje {
  id: number;
  texto: string;
  hora: string;
  respuesta: RespuestaAnalizar | null; // null = analizando
}

function hora(): string {
  return new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function ConNegrita({ texto }: { texto: string }) {
  return (
    <>
      {partesNegrita(texto).map((p, i) =>
        p.negrita ? <strong key={i}>{p.texto}</strong> : <span key={i}>{p.texto}</span>,
      )}
    </>
  );
}

function Telefono({
  etiqueta,
  contacto,
  detalle,
  inicial,
  compacto,
  cuerpoRef,
  children,
  pie,
}: {
  etiqueta: string;
  contacto: string;
  detalle: string;
  inicial: string;
  compacto: boolean;
  cuerpoRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
  pie?: React.ReactNode;
}) {
  return (
    <figure className="flex w-full flex-col items-center gap-2">
      <figcaption className="text-sm font-semibold text-tinta">{etiqueta}</figcaption>
      <div
        className={`flex w-full flex-col overflow-hidden rounded-[2rem] border-[6px] border-tinta bg-wa-fondo shadow-lg ${
          compacto ? "h-[440px] max-w-[290px]" : "h-[560px] max-w-[330px] lg:h-[600px]"
        }`}
      >
        <div className="flex items-center gap-2.5 bg-wa-barra px-3 py-2.5 text-white">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-sm font-semibold">
            {inicial}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold">{contacto}</p>
            <p className="truncate text-xs text-white/80">{detalle}</p>
          </div>
        </div>
        <div ref={cuerpoRef} className="flex flex-1 flex-col gap-2 overflow-y-auto px-2.5 py-3 [scrollbar-width:none]">
          {children}
        </div>
        {pie}
      </div>
    </figure>
  );
}

function Burbuja({ mia, texto, hora }: { mia: boolean; texto: string; hora: string }) {
  return (
    <div
      className={`max-w-[85%] animate-entrada rounded-lg px-2.5 py-1.5 text-[15px] leading-snug text-tinta shadow-sm ${
        mia ? "self-end rounded-tr-none bg-wa-propio" : "self-start rounded-tl-none bg-white"
      }`}
    >
      {texto}
      <span className="ml-2 inline-block translate-y-0.5 text-[11px] text-suave">
        {hora}
        {mia && " ✓✓"}
      </span>
    </div>
  );
}

function AlertaMula({ r }: { r: RespuestaAnalizar }) {
  const red = lineaRed(r.entidades);
  const redAparte = red && !r.alerta_persona.includes(red);
  return (
    <div
      role="alert"
      className="w-[92%] animate-entrada self-center overflow-hidden rounded-lg border-2 border-alerta bg-white shadow-md"
    >
      <div className="flex items-center justify-between gap-2 bg-alerta px-3 py-1.5 text-white">
        <span className="text-sm font-bold">⚠️ Mula AI</span>
        <span className="rounded bg-white/20 px-1.5 text-xs font-semibold">Riesgo {r.riesgo}/100</span>
      </div>
      <div className="px-3 py-2 text-[14px] leading-snug text-tinta">
        {redAparte && <p className="mb-1.5 font-semibold text-alerta">{red}</p>}
        <p>
          <ConNegrita
            texto={
              // El encabezado ya dice "⚠️ Mula AI": no lo repetimos.
              r.alerta_persona.replace(/^\s*⚠️?\s*\*?Mula AI\*?:\s*/u, "") ||
              "Este mensaje tiene el patrón de una estafa. No transfieras."
            }
          />
        </p>
        <p className="mt-1.5 text-xs text-suave">{labelModalidad(r.modalidad)}</p>
      </div>
    </div>
  );
}

function Estado({ texto, tono }: { texto: string; tono: "neutro" | "ok" }) {
  return (
    <p
      className={`animate-entrada self-center rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
        tono === "ok" ? "bg-emerald-50 text-emerald-800" : "bg-white/90 text-suave"
      }`}
    >
      {texto}
    </p>
  );
}

// Dos celulares: el del estafador (izquierda) y el de la abuela (derecha), con la
// misma IA y la misma red que el worker de WhatsApp (POST /analizar).
export default function Simulador({ compacto = false }: { compacto?: boolean }) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [enviarReal, setEnviarReal] = useState(false);
  const [modo, setModo] = useState<ModoSimulador | null>(null);
  const siguienteId = useRef(1);
  const cuerpoEstafador = useRef<HTMLDivElement>(null);
  const cuerpoAbuela = useRef<HTMLDivElement>(null);
  const montado = useRef(true);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
    };
  }, []);

  // Cada mensaje o alerta nueva baja el scroll de los dos chats.
  useEffect(() => {
    for (const el of [cuerpoEstafador.current, cuerpoAbuela.current]) {
      el?.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, [mensajes]);

  async function enviar(texto: string) {
    const limpio = texto.trim().slice(0, MAX_CARACTERES);
    if (!limpio) return;
    const id = siguienteId.current++;
    setMensajes((m) => [...m, { id, texto: limpio, hora: hora(), respuesta: null }]);
    setInput("");

    const inicio = Date.now();
    const { respuesta, modo } = await analizar(limpio, { url: WORKER_URL, enviarWhatsapp: enviarReal });
    if (modo === "demo") {
      const falta = DEMORA_DEMO_MS - (Date.now() - inicio);
      if (falta > 0) await new Promise((r) => setTimeout(r, falta));
    }
    if (!montado.current) return;
    setModo(modo);
    setMensajes((m) => m.map((x) => (x.id === id ? { ...x, respuesta } : x)));
  }

  const ultimaFamilia = [...mensajes].reverse().find((m) => m.respuesta?.es_sospechoso)?.respuesta;

  const composer = (
    <div className="border-t border-black/5 bg-wa-composer px-2 pt-2 pb-2.5">
      <div className="-mx-2 flex gap-1.5 overflow-x-auto px-2 pb-2">
        {MENSAJES_DEMO.map((m) => (
          <button
            key={m.etiqueta}
            type="button"
            onClick={() => enviar(m.texto)}
            className="shrink-0 cursor-pointer rounded-full border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-tinta hover:bg-panel"
          >
            {m.etiqueta}
          </button>
        ))}
      </div>
      <form
        className="flex items-center gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={MAX_CARACTERES}
          placeholder="Escribí un mensaje"
          aria-label="Mensaje del estafador"
          className="h-10 min-w-0 flex-1 rounded-full bg-white px-4 text-[15px] text-tinta placeholder:text-suave focus:outline-none"
        />
        <button
          type="submit"
          disabled={!input.trim()}
          aria-label="Enviar"
          className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-wa-barra text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
            <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.1 15 12 3.4 13.9z" />
          </svg>
        </button>
      </form>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid justify-items-center gap-6 sm:grid-cols-2">
        <Telefono
          etiqueta="Celular del estafador"
          contacto="Abu 💛"
          detalle="en línea"
          inicial="A"
          compacto={compacto}
          cuerpoRef={cuerpoEstafador}
          pie={composer}
        >
          {mensajes.length === 0 && (
            <Estado texto="Elegí un mensaje o escribí uno" tono="neutro" />
          )}
          {mensajes.map((m) => (
            <Burbuja key={m.id} mia texto={m.texto} hora={m.hora} />
          ))}
        </Telefono>

        <Telefono
          etiqueta="Celular de la abuela"
          contacto={NUMERO_ESTAFADOR}
          detalle="número desconocido"
          inicial="?"
          compacto={compacto}
          cuerpoRef={cuerpoAbuela}
        >
          {mensajes.length === 0 && <Estado texto="🛡️ Mula AI está vigilando" tono="neutro" />}
          {mensajes.map((m) => (
            <div key={m.id} className="flex flex-col gap-2">
              <Burbuja mia={false} texto={m.texto} hora={m.hora} />
              {!m.respuesta && <Estado texto="Mula AI analizando…" tono="neutro" />}
              {m.respuesta?.es_sospechoso && <AlertaMula r={m.respuesta} />}
              {m.respuesta && !m.respuesta.es_sospechoso && (
                <Estado texto="✓ Mula AI: sin señales de estafa" tono="ok" />
              )}
            </div>
          ))}
        </Telefono>
      </div>

      <div
        className={`mx-auto w-full rounded-lg border bg-fondo ${compacto ? "max-w-[604px]" : "max-w-[684px]"} ${
          ultimaFamilia ? "border-alerta-linea" : "border-linea"
        }`}
      >
        <div className="flex items-center gap-2 border-b border-linea px-4 py-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-panel text-sm" aria-hidden>
            👨‍👩‍👧
          </span>
          <p className="text-sm font-semibold text-tinta">Grupo familiar</p>
        </div>
        {ultimaFamilia ? (
          <p key={ultimaFamilia.alerta_familia} className="animate-entrada whitespace-pre-line px-4 py-3 text-base leading-relaxed text-tinta">
            <ConNegrita texto={ultimaFamilia.alerta_familia} />
          </p>
        ) : (
          <p className="px-4 py-3 text-sm text-suave">
            Cuando Mula AI detecta una estafa, la familia se entera acá al mismo tiempo.
          </p>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-[684px] flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-suave">
        {!compacto && WORKER_URL ? (
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={enviarReal}
              onChange={(e) => setEnviarReal(e.target.checked)}
              className="h-4 w-4 accent-tinta"
            />
            Mandar también al WhatsApp real
          </label>
        ) : (
          <span />
        )}
        <span className="flex items-center gap-3">
          {modo === "demo" && <span>modo demo</span>}
          {mensajes.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setMensajes([]);
                setModo(null);
              }}
              className="cursor-pointer underline underline-offset-2 hover:text-tinta"
            >
              Reiniciar
            </button>
          )}
        </span>
      </div>
    </div>
  );
}
