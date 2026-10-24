"use client";

import { useEffect, useRef, useState } from "react";
import { PROVINCIAS, type RespuestaExtraer } from "@/lib/extraccion";
import { validarArchivo } from "@/lib/meEstafaron";
import MeEstafaronResultado from "@/components/MeEstafaronResultado";
import {
  IconoAlerta,
  IconoBanco,
  IconoCheck,
  IconoImagen,
  IconoLey,
  IconoMagia,
  IconoMas,
  IconoRed,
  IconoReiniciar,
  IconoSubir,
  IconoX,
} from "@/components/MeEstafaronIconos";

// Un paso a la vez: 1) subir capturas, 2) analizando (~25 s), 3) resultado.
type Paso =
  | { tipo: "subir"; error?: string }
  | { tipo: "analizando" }
  | { tipo: "resultado"; respuesta: RespuestaExtraer; provincia: string };

interface Captura {
  id: string;
  archivo: File;
  url: string;
}

const MAX_CAPTURAS = 4;
const LADO_MAX = 1600; // px: alcanza para leer un chat y entra holgado en el límite de Vercel (4,5 MB)
const DURACION_ESTIMADA = 25; // segundos
const EJEMPLOS = ["/demo/chat.png", "/demo/comprobante.png"];
const PROVINCIA_EJEMPLO = "Santa Fe";

// Lo que se ve mientras analiza: ícono + frase corta, cambia cada ~5 s.
const ETAPAS = [
  { icono: IconoImagen, texto: "Leyendo capturas" },
  { icono: IconoBanco, texto: "Buscando cuentas y montos" },
  { icono: IconoRed, texto: "Cruzando con la red" },
  { icono: IconoLey, texto: "Armando la denuncia" },
];

// Achica la captura a JPEG antes de subirla (las de celular pesan varios MB).
async function comprimir(archivo: File): Promise<Blob> {
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

function nuevaCaptura(archivo: File): Captura {
  return {
    id: `${archivo.name}-${archivo.size}-${Math.random().toString(36).slice(2)}`,
    archivo,
    url: URL.createObjectURL(archivo),
  };
}

function Pasos({ actual }: { actual: number }) {
  const pasos = [IconoSubir, IconoMagia, IconoCheck];
  return (
    <ol className="flex items-center" aria-label={`Paso ${actual + 1} de 3`}>
      {pasos.map((Icono, i) => (
        <li key={i} className="flex flex-1 items-center last:flex-none">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
              i < actual
                ? "bg-[var(--me-forest)] text-white"
                : i === actual
                  ? "bg-[var(--me-danger)] text-white ring-4 ring-[var(--me-danger-soft)]"
                  : "bg-[var(--me-paper-2)] text-[var(--me-muted)]"
            }`}
          >
            <Icono className="h-4 w-4" />
          </span>
          {i < pasos.length - 1 && (
            <span className={`mx-2 h-0.5 flex-1 rounded ${i < actual ? "bg-[var(--me-forest)]" : "bg-[var(--me-rule)]"}`} />
          )}
        </li>
      ))}
    </ol>
  );
}

function Analizando({ capturas }: { capturas: Captura[] }) {
  const [segundos, setSegundos] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const etapa = Math.min(Math.floor(segundos / 6), ETAPAS.length - 1);
  // Rápido al principio, se frena cerca del final y nunca llega al 100 %.
  const progreso = Math.min(95, (1 - Math.exp(-segundos / (DURACION_ESTIMADA * 0.6))) * 100);

  return (
    <div
      className="flex flex-col items-center gap-6 rounded-2xl bg-[var(--me-forest)] px-5 py-10 text-center text-white sm:py-14"
      role="status"
      aria-live="polite"
    >
      {capturas.length > 0 && (
        <div className="flex justify-center gap-2">
          {capturas.map((c, i) => (
            <div key={c.id} className="relative h-28 w-16 overflow-hidden rounded-lg sm:h-36 sm:w-20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.url} alt={`Captura ${i + 1}`} className="h-full w-full object-cover object-top opacity-50" />
              <span
                className="absolute inset-x-0 h-1 bg-[var(--me-danger)] shadow-[0_0_12px_4px] shadow-[var(--me-danger)]"
                style={{ top: `${(segundos * 23 + i * 30) % 100}%`, transition: "top 1s linear" }}
              />
            </div>
          ))}
        </div>
      )}
      <ul className="flex gap-3">
        {ETAPAS.map((e, i) => (
          <li
            key={e.texto}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-all ${
              i < etapa ? "bg-white/20 text-white" : i === etapa ? "scale-110 bg-[var(--me-danger)] text-white" : "bg-white/5 text-white/30"
            }`}
          >
            {i < etapa ? <IconoCheck className="h-5 w-5" /> : <e.icono className="h-5 w-5" />}
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-1">
        <p className="text-xl font-semibold">{ETAPAS[etapa].texto}…</p>
        <p className="text-sm text-white/60">~{DURACION_ESTIMADA} s · no cierres la página</p>
      </div>
      <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/15">
        <div
          className="h-full rounded-full bg-[var(--me-danger)] transition-[width] duration-1000 ease-linear"
          style={{ width: `${progreso}%` }}
        />
      </div>
    </div>
  );
}

export default function MeEstafaronForm() {
  const [capturas, setCapturas] = useState<Captura[]>([]);
  const [rechazos, setRechazos] = useState<string[]>([]);
  const [relato, setRelato] = useState("");
  const [verRelato, setVerRelato] = useState(false);
  const [provincia, setProvincia] = useState("");
  const [paso, setPaso] = useState<Paso>({ tipo: "subir" });
  const [arrastrando, setArrastrando] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const arribaRef = useRef<HTMLDivElement>(null);
  const primerRender = useRef(true);

  // Liberar las URLs de las miniaturas al desmontar.
  const capturasRef = useRef(capturas);
  useEffect(() => {
    capturasRef.current = capturas;
  }, [capturas]);
  useEffect(() => () => capturasRef.current.forEach((c) => URL.revokeObjectURL(c.url)), []);

  // Cada cambio de paso vuelve arriba (en el celu el resultado arranca fuera de pantalla).
  useEffect(() => {
    if (primerRender.current) {
      primerRender.current = false;
      return;
    }
    arribaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [paso.tipo]);

  function agregar(archivos: FileList | File[]) {
    const lista = Array.from(archivos);
    const errores: string[] = [];
    const validas = lista.filter((f) => {
      const err = validarArchivo(f);
      if (err) errores.push(`${f.name}: ${err}`);
      return !err;
    });
    const lugar = MAX_CAPTURAS - capturas.length;
    if (validas.length > lugar) errores.push(`Máximo ${MAX_CAPTURAS}`);
    setRechazos(errores);
    if (validas.length && lugar > 0) {
      setCapturas((prev) => [...prev, ...validas.slice(0, lugar).map(nuevaCaptura)]);
    }
    setPaso({ tipo: "subir" });
  }

  function quitar(id: string) {
    setRechazos([]);
    setCapturas((prev) => {
      const c = prev.find((x) => x.id === id);
      if (c) URL.revokeObjectURL(c.url);
      return prev.filter((x) => x.id !== id);
    });
  }

  async function analizar(lista: Captura[], texto: string, prov: string) {
    if (!lista.length && !texto.trim()) return;
    setRechazos([]);
    setPaso({ tipo: "analizando" });
    try {
      const form = new FormData();
      for (const [i, c] of lista.entries()) {
        const blob = await comprimir(c.archivo);
        form.append("imagenes", blob, `captura-${i + 1}.${blob.type === "image/png" ? "png" : "jpg"}`);
      }
      form.append("relato", texto);
      form.append("provincia", prov);
      const res = await fetch("/app/api/extraer", { method: "POST", body: form });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.extraccion) {
        setPaso({ tipo: "subir", error: json?.error ?? "No pudimos analizar. Probá de nuevo." });
        return;
      }
      setPaso({ tipo: "resultado", respuesta: json as RespuestaExtraer, provincia: prov });
    } catch {
      setPaso({ tipo: "subir", error: "Se cortó la conexión. Probá de nuevo." });
    }
  }

  // Un toque: carga las capturas de demo, completa la provincia y analiza.
  async function usarEjemplo() {
    try {
      const archivos = await Promise.all(
        EJEMPLOS.map(async (ruta) => {
          const blob = await (await fetch(ruta)).blob();
          return new File([blob], ruta.split("/").pop()!, { type: "image/png" });
        }),
      );
      capturas.forEach((c) => URL.revokeObjectURL(c.url));
      const lista = archivos.map(nuevaCaptura);
      setCapturas(lista);
      setProvincia(PROVINCIA_EJEMPLO);
      await analizar(lista, relato, PROVINCIA_EJEMPLO);
    } catch {
      setPaso({ tipo: "subir", error: "No se pudieron cargar las capturas de ejemplo." });
    }
  }

  function reiniciar() {
    capturas.forEach((c) => URL.revokeObjectURL(c.url));
    setCapturas([]);
    setRechazos([]);
    setRelato("");
    setVerRelato(false);
    setPaso({ tipo: "subir" });
  }

  const indice = paso.tipo === "subir" ? 0 : paso.tipo === "analizando" ? 1 : 2;
  const lleno = capturas.length >= MAX_CAPTURAS;
  const valido = capturas.length > 0 || relato.trim().length >= 20;

  return (
    <div ref={arribaRef} className="flex scroll-mt-20 flex-col gap-6">
      <Pasos actual={indice} />

      {paso.tipo === "analizando" && <Analizando capturas={capturas} />}

      {paso.tipo === "resultado" && (
        <div className="flex flex-col gap-8">
          <MeEstafaronResultado respuesta={paso.respuesta} provincia={paso.provincia} />
          <button
            type="button"
            onClick={reiniciar}
            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--me-rule)] px-6 text-base font-medium text-[var(--me-ink)] hover:bg-[var(--me-paper-2)]"
          >
            <IconoReiniciar className="h-4 w-4" />
            Otro caso
          </button>
        </div>
      )}

      {paso.tipo === "subir" && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (valido) analizar(capturas, relato, provincia);
          }}
        >
          {/* Zona de capturas: grande y tocable entera en el celu */}
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
            className={`rounded-2xl border-2 border-dashed transition-colors ${
              arrastrando ? "border-[var(--me-danger)] bg-[var(--me-danger-soft)]" : "border-[var(--me-rule)] bg-[var(--me-paper-2)]"
            }`}
          >
            {capturas.length === 0 ? (
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="group flex min-h-60 w-full cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl px-6 py-10 text-center"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--me-forest)] text-white transition-transform group-hover:scale-105">
                  <IconoSubir className="h-8 w-8" />
                </span>
                <span className="text-xl font-semibold text-[var(--me-ink)]">Subí las capturas</span>
                <span className="flex items-center gap-3 text-sm text-[var(--me-muted)]">
                  <span className="rounded-full bg-[var(--me-paper)] px-3 py-1">Chat</span>
                  <span className="rounded-full bg-[var(--me-paper)] px-3 py-1">Comprobante</span>
                  <span>PNG · JPG</span>
                </span>
              </button>
            ) : (
              <ul className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4 sm:p-4">
                {capturas.map((c, i) => (
                  <li key={c.id} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.url}
                      alt={`Captura ${i + 1}`}
                      className="aspect-[3/5] w-full rounded-xl border border-[var(--me-rule)] bg-[var(--me-paper)] object-cover object-top"
                    />
                    <span className="absolute bottom-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--me-accent)] text-white">
                      <IconoCheck className="h-3.5 w-3.5" />
                    </span>
                    <button
                      type="button"
                      onClick={() => quitar(c.id)}
                      aria-label={`Quitar captura ${i + 1}`}
                      className="absolute top-1.5 right-1.5 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[var(--me-paper)]/95 text-[var(--me-ink)] shadow hover:bg-[var(--me-danger)] hover:text-white"
                    >
                      <IconoX className="h-4 w-4" />
                    </button>
                  </li>
                ))}
                {!lleno && (
                  <li>
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      aria-label="Agregar captura"
                      className="flex aspect-[3/5] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[var(--me-rule)] bg-[var(--me-paper)] text-[var(--me-muted)] hover:border-[var(--me-forest)] hover:text-[var(--me-ink)]"
                    >
                      <IconoMas className="h-8 w-8" />
                    </button>
                  </li>
                )}
              </ul>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/png,image/jpeg"
              multiple
              hidden
              onChange={(e) => {
                if (e.target.files) agregar(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {rechazos.length > 0 && (
            <ul className="flex flex-col gap-1" role="alert">
              {rechazos.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm text-[var(--me-danger)]">
                  <IconoAlerta className="h-4 w-4 shrink-0" />
                  <span className="truncate">{r}</span>
                </li>
              ))}
            </ul>
          )}

          {capturas.length === 0 && (
            <button
              type="button"
              onClick={usarEjemplo}
              className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-[var(--me-danger-line)] bg-[var(--me-danger-soft)] px-5 text-base font-semibold text-[var(--me-danger)] hover:border-[var(--me-danger)]"
            >
              <IconoMagia className="h-5 w-5" />
              Usar capturas de ejemplo
            </button>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <select
              id="provincia"
              aria-label="Provincia"
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="h-12 w-full rounded-xl border border-[var(--me-rule)] bg-[var(--me-paper)] px-3 text-base text-[var(--me-ink)] focus:border-[var(--me-forest)] focus:outline-none sm:w-64"
            >
              <option value="">Provincia</option>
              {PROVINCIAS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {!verRelato && (
              <button
                type="button"
                onClick={() => setVerRelato(true)}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[var(--me-rule)] px-4 text-sm font-medium text-[var(--me-ink-2)] hover:bg-[var(--me-paper-2)]"
              >
                <IconoMas className="h-4 w-4" />
                Sin capturas: contalo
              </button>
            )}
          </div>

          {verRelato && (
            <textarea
              aria-label="Qué pasó"
              value={relato}
              onChange={(e) => setRelato(e.target.value)}
              rows={4}
              maxLength={8000}
              autoFocus
              placeholder="Quién te escribió, a qué alias transferiste, cuánto y cuándo."
              className="w-full rounded-xl border border-[var(--me-rule)] bg-[var(--me-paper)] p-4 text-base leading-relaxed text-[var(--me-ink)] placeholder:text-[var(--me-muted)] focus:border-[var(--me-forest)] focus:outline-none"
            />
          )}

          {paso.error && (
            <p className="flex items-center gap-2 rounded-xl bg-[var(--me-danger-soft)] p-3 text-sm font-medium text-[var(--me-danger)]" role="alert">
              <IconoAlerta className="h-4 w-4 shrink-0" />
              {paso.error}
            </p>
          )}

          <button
            type="submit"
            disabled={!valido}
            className="inline-flex h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[var(--me-danger)] px-6 text-lg font-semibold text-white shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:bg-[var(--me-rule)] disabled:text-[var(--me-muted)] disabled:shadow-none"
          >
            <IconoMagia className="h-5 w-5" />
            Analizar
          </button>
        </form>
      )}
    </div>
  );
}
