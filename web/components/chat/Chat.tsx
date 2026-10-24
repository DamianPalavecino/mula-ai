"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlusIcon, NetworkIcon, SettingsIcon, SparklesIcon, TriangleAlertIcon, XIcon, type LucideIcon } from "lucide-react";
import type { Tab } from "@/lib/panel";
import type { ResumenEntidad } from "@/lib/tipos";
import {
  MAX_IMAGENES_CHAT,
  MAX_TEXTO_CHAT,
  partesTexto,
  type MensajeChat,
  type RespuestaChat,
} from "@/lib/chat";
import ResumenCard from "@/components/ResumenCard";
import { IconoGiro } from "@/components/iconos";

interface Burbuja extends MensajeChat {
  id: number;
  cuentas?: ResumenEntidad[];
  error?: boolean;
}

const LADO_MAX = 1400;

// Achica la foto a JPEG (data URL) antes de mandarla: las de celular pesan varios MB.
async function aDataUrl(archivo: File): Promise<string | null> {
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    return canvas.toDataURL("image/jpeg", 0.82);
  } catch {
    return null;
  }
}

function Texto({ texto }: { texto: string }) {
  return (
    <p className="whitespace-pre-wrap">
      {partesTexto(texto).map((p, i) => (p.negrita ? <strong key={i}>{p.texto}</strong> : <span key={i}>{p.texto}</span>))}
    </p>
  );
}

type Seccion = Exclude<Tab, "inicio">;

// Atajos del estado vacío: unos preguntan en el chat, otros abren una sección del panel.
const ABRIR: { texto: string; seccion: Seccion; Icono: LucideIcon; riesgo?: boolean }[] = [
  { texto: "Más denunciados", seccion: "red", Icono: NetworkIcon },
  { texto: "Me estafaron", seccion: "me-estafaron", Icono: TriangleAlertIcon, riesgo: true },
  { texto: "Configurar", seccion: "ajustes", Icono: SettingsIcon },
];

function preguntas(protegido: string | null): string[] {
  return [
    "¿juli.martinez.mp es una cuenta de estafa?",
    'Me escribieron: "Hola abu, cambié de número, pasame plata al alias juli.martinez.mp". ¿Es estafa?',
    protegido ? `¿${protegido} tuvo alertas?` : "¿Qué hago si ya transferí?",
  ];
}

// Chat con IA, vista por defecto de /app (contrato en docs/agentes/estado/chat.md): preguntar por un
// alias, mandar una captura o pedir qué hacer, sin usar el resto de la UI. Pasa por /app/api/chat
// (server, con sesión). El historial vive en memoria mientras el panel está abierto.
export default function Chat({ protegido, onIr }: { protegido: string | null; onIr?: (seccion: Seccion) => void }) {
  const [burbujas, setBurbujas] = useState<Burbuja[]>([]);
  const [texto, setTexto] = useState("");
  const [fotos, setFotos] = useState<string[]>([]);
  const [cargando, setCargando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);
  const archivo = useRef<HTMLInputElement>(null);
  const sig = useRef(1);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [burbujas, cargando]);

  async function agregarFotos(lista: FileList | File[]) {
    const imagenes = [...lista].filter((f) => f.type.startsWith("image/"));
    const urls = (await Promise.all(imagenes.map(aDataUrl))).filter((u): u is string => !!u);
    setFotos((f) => [...f, ...urls].slice(0, MAX_IMAGENES_CHAT));
  }

  async function enviar(t: string, imagenes = fotos) {
    const limpio = t.trim().slice(0, MAX_TEXTO_CHAT);
    if ((!limpio && !imagenes.length) || cargando) return;
    const nuevo: Burbuja = { id: sig.current++, rol: "usuario", texto: limpio, imagenes };
    const historial = [...burbujas.filter((b) => !b.error), nuevo];
    setBurbujas((b) => [...b, nuevo]);
    setTexto("");
    setFotos([]);
    setCargando(true);
    try {
      const res = await fetch("/app/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mensajes: historial.map((b) => ({ rol: b.rol, texto: b.texto, imagenes: b === nuevo ? b.imagenes : [] })),
        }),
      });
      const json = (await res.json().catch(() => null)) as (RespuestaChat & { error?: string }) | null;
      if (!res.ok || !json?.respuesta) throw new Error(json?.error ?? "No pude responder ahora.");
      setBurbujas((b) => [
        ...b,
        { id: sig.current++, rol: "asistente", texto: json.respuesta, imagenes: [], cuentas: json.cuentas },
      ]);
    } catch (e) {
      setBurbujas((b) => [
        ...b,
        { id: sig.current++, rol: "asistente", texto: (e as Error).message || "No pude responder ahora.", imagenes: [], error: true },
      ]);
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-tarjeta border border-linea bg-fondo">
      <div className="flex items-center gap-3 border-b border-linea px-4 py-3">
        <span className="flex size-9 items-center justify-center rounded-full bg-bosque text-lima">
          <SparklesIcon className="size-5" />
        </span>
        <div className="leading-tight">
          <p className="font-semibold text-tinta">Preguntale a Mula</p>
          <p className="text-xs text-suave">Alias, CBU, teléfonos, capturas o qué hacer</p>
        </div>
      </div>

      <div
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain bg-papel p-4"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          agregarFotos(e.dataTransfer.files);
        }}
      >
        {burbujas.length === 0 && (
          <div className="m-auto flex max-w-md flex-col items-center gap-4 text-center">
            <p className="text-2xl font-bold tracking-tight text-tinta">
              {protegido ? `¿Qué hacemos por ${protegido}?` : "¿Te llegó algo raro?"}
            </p>
            <p className="text-sm text-suave">Escribí el alias o el número, pegá el mensaje o subí una captura.</p>
            <div className="flex flex-col gap-2">
              {preguntas(protegido).map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => enviar(e, [])}
                  className="presionable cursor-pointer rounded-control border border-linea bg-fondo px-3 py-2.5 text-left text-sm font-medium text-tinta hover:bg-panel"
                >
                  {e}
                </button>
              ))}
            </div>
            {onIr && (
              <ul className="flex flex-wrap justify-center gap-2">
                {ABRIR.map(({ texto, seccion, Icono, riesgo }) => (
                  <li key={seccion}>
                    <button
                      type="button"
                      onClick={() => onIr(seccion)}
                      className={`presionable flex min-h-11 cursor-pointer items-center gap-2 rounded-pastilla border px-4 text-sm font-semibold ${
                        riesgo ? "border-alerta-linea bg-alerta-fondo text-alerta" : "border-seguro-linea bg-seguro-fondo text-bosque"
                      }`}
                    >
                      <Icono className="size-4" />
                      {texto}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {burbujas.map((b) =>
          b.rol === "usuario" ? (
            <div key={b.id} className="flex max-w-[85%] animate-entrada flex-col items-end gap-2 self-end">
              {b.imagenes.length > 0 && (
                <div className="flex flex-wrap justify-end gap-2">
                  {b.imagenes.map((src, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={src} alt={`Captura ${i + 1}`} className="h-28 w-auto rounded-control border border-linea object-cover" />
                  ))}
                </div>
              )}
              {b.texto && (
                <div className="rounded-2xl rounded-tr-none bg-bosque px-3.5 py-2 text-[15px] leading-snug text-bosque-tinta">
                  {b.texto}
                </div>
              )}
            </div>
          ) : (
            <div key={b.id} className="flex w-full max-w-[90%] animate-entrada flex-col gap-2 self-start">
              <div
                className={`rounded-2xl rounded-tl-none border px-3.5 py-2 text-[15px] leading-snug ${
                  b.error ? "border-linea bg-panel text-texto" : "border-linea bg-fondo text-tinta"
                }`}
              >
                <Texto texto={b.texto} />
              </div>
              {b.cuentas?.map((c) => (
                <ResumenCard key={`${c.tipo}:${c.valor_normalizado}`} resumen={c} compacto />
              ))}
            </div>
          ),
        )}

        {cargando && (
          <p className="flex items-center gap-2 self-start rounded-full bg-fondo px-3 py-1.5 text-sm font-medium text-suave">
            <IconoGiro className="h-4 w-4" /> Mula está mirando…
          </p>
        )}
        <div ref={fin} />
      </div>

      <div className="border-t border-linea bg-fondo p-3">
        {fotos.length > 0 && (
          <div className="mb-2 flex gap-2">
            {fotos.map((src, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt={`Foto ${i + 1}`} className="h-16 w-16 rounded-control border border-linea object-cover" />
                <button
                  type="button"
                  aria-label="Quitar foto"
                  onClick={() => setFotos((f) => f.filter((_, j) => j !== i))}
                  className="absolute -top-2 -right-2 flex size-6 cursor-pointer items-center justify-center rounded-full bg-tinta text-white"
                >
                  <XIcon className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <form
          className="flex items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
        >
          <input
            ref={archivo}
            type="file"
            accept="image/png,image/jpeg"
            multiple
            hidden
            onChange={(e) => {
              if (e.target.files) agregarFotos(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            aria-label="Adjuntar captura"
            disabled={cargando || fotos.length >= MAX_IMAGENES_CHAT}
            onClick={() => archivo.current?.click()}
            className="presionable flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-linea text-texto hover:bg-panel disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ImagePlusIcon className="size-5" />
          </button>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onPaste={(e) => {
              const imgs = [...e.clipboardData.files].filter((f) => f.type.startsWith("image/"));
              if (imgs.length) {
                e.preventDefault();
                agregarFotos(imgs);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(texto);
              }
            }}
            maxLength={MAX_TEXTO_CHAT}
            rows={1}
            placeholder="Preguntá o pegá un mensaje"
            aria-label="Pregunta para Mula"
            className="max-h-32 min-h-11 min-w-0 flex-1 resize-none rounded-3xl border border-linea bg-panel px-4 py-2.5 text-[15px] text-tinta placeholder:text-suave focus:border-seguro focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Enviar"
            disabled={cargando || (!texto.trim() && !fotos.length)}
            className="presionable flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-bosque text-bosque-tinta disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
              <path d="M3.4 20.4 21 12 3.4 3.6 3.4 10.1 15 12 3.4 13.9z" />
            </svg>
          </button>
        </form>
      </div>
    </section>
  );
}
