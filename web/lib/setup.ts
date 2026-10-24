// Alta/edición del protegido (/app/setup). Puro: lo usan la server action y los tests.

const MAX_LINEAS = 20;

export interface EntradaSetup {
  nombre: unknown;
  telefono: unknown;
  provincia: unknown;
  contactos: unknown;
  familiares: unknown;
}

export interface DatosSetup {
  nombre: string;
  telefono: string;
  provincia: string | null;
  contactos: string[];
  familiares: string[];
}

export type ErroresSetup = Partial<Record<keyof DatosSetup, string>>;

export type ResultadoSetup = { ok: true; datos: DatosSetup } | { ok: false; errores: ErroresSetup };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const digitos = (v: string) => v.replace(/\D/g, "");

// Uno por línea (también acepta comas). Sin vacíos ni repetidos, hasta 20.
export function parseLineas(texto: unknown): string[] {
  const vistos = new Set<string>();
  for (const parte of str(texto).split(/[\n,;]+/)) {
    const limpio = parte.trim();
    if (limpio) vistos.add(limpio);
  }
  return [...vistos].slice(0, MAX_LINEAS);
}

const telefonoValido = (v: string) => {
  const d = digitos(v);
  return d.length >= 8 && d.length <= 15;
};

export function validarSetup(entrada: EntradaSetup, provincias: readonly string[]): ResultadoSetup {
  const nombre = str(entrada.nombre).slice(0, 60);
  const telefono = str(entrada.telefono).slice(0, 30);
  const provincia = str(entrada.provincia);
  const contactos = parseLineas(entrada.contactos);
  const familiares = parseLineas(entrada.familiares);

  const errores: ErroresSetup = {};
  if (!nombre) errores.nombre = "Poné el nombre de la persona que protegés.";
  if (!telefonoValido(telefono)) errores.telefono = "Poné un teléfono válido, con característica.";
  const malContacto = contactos.find((c) => !telefonoValido(c));
  if (malContacto) errores.contactos = `"${malContacto}" no parece un teléfono.`;
  const malFamiliar = familiares.find((c) => !telefonoValido(c));
  if (malFamiliar) errores.familiares = `"${malFamiliar}" no parece un teléfono.`;

  if (Object.keys(errores).length) return { ok: false, errores };
  return {
    ok: true,
    datos: {
      nombre,
      telefono,
      provincia: provincias.includes(provincia) ? provincia : null,
      contactos,
      familiares,
    },
  };
}

// "3415551234" → "341 555-1234"; "1122223333" → "11 2222-3333". Otro formato: tal cual.
export function formatearTelefono(t: string | null | undefined): string {
  if (!t) return "";
  const d = digitos(t);
  if (d.length !== 10) return t;
  if (d.startsWith("11")) return `11 ${d.slice(2, 6)}-${d.slice(6)}`;
  return `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`;
}
