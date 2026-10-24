"use client";

import { useEffect, useRef, useState } from "react";
import { PROVINCIAS, type RespuestaExtraer } from "@/lib/extraccion";
import MeEstafaronResultado from "@/components/MeEstafaronResultado";

type Estado =
  | { tipo: "inicial" }
  | { tipo: "cargando" }
  | { tipo: "listo"; respuesta: RespuestaExtraer; provincia: string }
  | { tipo: "error"; mensaje: string };

interface Captura {
  id: string;
  archivo: File;
  url: string;
}

const MAX_CAPTURAS = 4;
const LADO_MAX = 1600; // px: alcanza para leer un chat y entra holgado en el límite de Vercel (4,5 MB)

const EJEMPLO = `Ayer a la tarde me escribió un número que no tenía agendado: "hola abu, soy Juli, cambié de número, agendame este". Después me dijo que había chocado con el auto, que estaba en la comisaría y que necesitaba plata urgente para el abogado, que no le contara a mamá. Me pasó el alias juli.martinez.mp y le transferí $180.000 desde mi cuenta del Banco Nación. A la hora me pidió $95.000 más al mismo alias y también se los mandé. El número que me escribió es +54 9 341 555-0198. Cuando llamé a mi nieta al número de siempre me dijo que ella estaba bien y que nunca me había escrito.`;

const PASOS_CARGA = [
  "Leyendo las capturas…",
  "Buscando cuentas, montos y fechas…",
  "Cruzando con la red de reportes…",
  "Armando la denuncia y el pedido de bloqueo…",
];

// Achica la captura a JPEG antes de subirla (las de celular pesan varios MB).
async function comprimir(archivo: File): Promise<Blob> {
  if (archivo.type === "image/gif") return archivo;
  try {
    const bitmap = await createImageBitmap(archivo);
    const escala = Math.min(1, LADO_MAX / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, "image/jpeg", 0.85));
    return blob ?? archivo;
  } catch {
    return archivo;
  }
}

export default function MeEstafaronForm() {
  const [capturas, setCapturas] = useState<Captura[]>([]);
  const [relato, setRelato] = useState("");
  const [provincia, setProvincia] = useState("");
  const [estado, setEstado] = useState<Estado>({ tipo: "inicial" });
  const [paso, setPaso] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);

  // Liberar las URLs de las miniaturas al desmontar.
  const capturasRef = useRef(capturas);
  capturasRef.current = capturas;
  useEffect(() => () => capturasRef.current.forEach((c) => URL.revokeObjectURL(c.url)), []);

  useEffect(() => {
    if (estado.tipo !== "cargando") return;
    setPaso(0);
    const t = setInterval(() => setPaso((p) => Math.min(p + 1, PASOS_CARGA.length - 1)), 6000);
    return () => clearInterval(t);
  }, [estado.tipo]);

  useEffect(() => {
    if (estado.tipo === "listo") resultadoRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [estado.tipo]);

  function agregar(archivos: FileList | File[]) {
    const imagenes = Array.from(archivos).filter((f) => f.type.startsWith("image/"));
    setCapturas((prev) =>
      [
        ...prev,
        ...imagenes.map((archivo) => ({
          id: `${archivo.name}-${archivo.size}-${Math.random().toString(36).slice(2)}`,
          archivo,
          url: URL.createObjectURL(archivo),
        })),
      ].slice(0, MAX_CAPTURAS),
    );
  }

  function quitar(id: string) {
    setCapturas((prev) => {
      const c = prev.find((x) => x.id === id);
      if (c) URL.revokeObjectURL(c.url);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function enviar() {
    if (!capturas.length && !relato.trim()) {
      setEstado({ tipo: "error", mensaje: "Subí al menos una captura o contá qué pasó." });
      return;
    }
    setEstado({ tipo: "cargando" });
    try {
      const form = new FormData();
      for (const [i, c] of capturas.entries()) {
        const blob = await comprimir(c.archivo);
        form.append("imagenes", blob, `captura-${i + 1}.${blob.type === "image/gif" ? "gif" : "jpg"}`);
      }
      form.append("relato", relato);
      form.append("provincia", provincia);
      const res = await fetch("/api/extraer", { method: "POST", body: form });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.extraccion) {
        setEstado({
          tipo: "error",
          mensaje: json?.error ?? "No pudimos analizar el caso. Probá de nuevo.",
        });
        return;
      }
      setEstado({ tipo: "listo", respuesta: json as RespuestaExtraer, provincia });
    } catch {
      setEstado({ tipo: "error", mensaje: "Se cortó la conexión. Probá de nuevo." });
    }
  }

  const cargando = estado.tipo === "cargando";

  return (
    <div className="flex flex-col gap-8">
      <form
        className="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <div>
          <p className="text-sm font-medium text-suave">
            Capturas del chat y de los comprobantes (hasta {MAX_CAPTURAS})
          </p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              agregar(e.dataTransfer.files);
            }}
            className={`mt-2 rounded-lg border-2 border-dashed p-5 ${
              arrastrando ? "border-tinta bg-panel" : "border-linea"
            }`}
          >
            {capturas.length > 0 && (
              <ul className="mb-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
                {capturas.map((c, i) => (
                  <li key={c.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.url}
                      alt={`Captura ${i + 1}`}
                      className="aspect-[9/16] w-full rounded-md border border-linea object-cover"
                    />
                    <span className="absolute top-1 left-1 rounded bg-tinta/80 px-1.5 text-xs font-medium text-white">
                      {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => quitar(c.id)}
                      disabled={cargando}
                      aria-label={`Quitar captura ${i + 1}`}
                      className="absolute top-1 right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-fondo text-sm text-tinta shadow hover:bg-panel"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-4">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={cargando || capturas.length >= MAX_CAPTURAS}
                className="h-11 cursor-pointer rounded-md border border-linea px-4 text-sm font-medium text-tinta hover:bg-panel disabled:cursor-not-allowed disabled:opacity-50"
              >
                {capturas.length ? "Agregar más capturas" : "Elegir capturas"}
              </button>
              <p className="text-sm text-suave">o arrastralas acá. Se procesan para este análisis y no se guardan.</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) agregar(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-4">
            <label htmlFor="relato" className="text-sm font-medium text-suave">
              Contá qué pasó (opcional si subiste capturas)
            </label>
            <button
              type="button"
              onClick={() => {
                setRelato(EJEMPLO);
                setProvincia("Santa Fe");
              }}
              disabled={cargando}
              className="cursor-pointer text-sm text-tinta underline underline-offset-2 hover:text-black"
            >
              Usar un caso de ejemplo
            </button>
          </div>
          <textarea
            id="relato"
            value={relato}
            onChange={(e) => setRelato(e.target.value)}
            rows={6}
            maxLength={8000}
            placeholder="Quién te escribió, qué te dijo, a qué alias o CBU transferiste, cuánto y cuándo."
            className="mt-2 w-full rounded-md border border-linea bg-fondo p-4 text-base leading-relaxed text-tinta placeholder:text-suave focus:border-tinta focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="sm:w-64">
            <label htmlFor="provincia" className="text-sm font-medium text-suave">
              Tu provincia
            </label>
            <select
              id="provincia"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="mt-2 h-12 w-full rounded-md border border-linea bg-fondo px-3 text-base text-tinta focus:border-tinta focus:outline-none"
            >
              <option value="">Elegí una</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={cargando}
            className="h-12 cursor-pointer rounded-md bg-tinta px-6 text-base font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1"
          >
            {cargando ? PASOS_CARGA[paso] : "Armar mi denuncia y el pedido de bloqueo"}
          </button>
        </div>
      </form>

      {estado.tipo === "error" && (
        <p className="rounded-lg border border-linea bg-panel p-4 text-base text-texto" role="alert">
          {estado.mensaje}
        </p>
      )}

      {estado.tipo === "listo" && (
        <div ref={resultadoRef} className="scroll-mt-6">
          <MeEstafaronResultado respuesta={estado.respuesta} provincia={estado.provincia} />
        </div>
      )}
    </div>
  );
}
