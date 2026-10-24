// Ejemplos de un clic de "Probar mensaje" y la línea de la red del resultado.
// Sin imports de runtime: se testea con `node --test` (lib/probar.test.ts).
import type { ResumenEntidad, TipoEntidad } from "./tipos";

export const EJEMPLOS_PROBAR: { etiqueta: string; texto: string; normal?: boolean }[] = [
  {
    etiqueta: "Familiar número nuevo",
    texto: "hola abu, soy Juli, cambié de número. Choqué y necesito plata urgente, mandá a juli.martinez.mp",
  },
  {
    etiqueta: "Falso ANSES",
    texto:
      "Buenas, le hablamos de ANSES. Para cobrar el refuerzo transfiera $5.000 de validación al CBU 0000003100012345678901",
  },
  { etiqueta: "Mensaje normal", texto: "abu, el domingo vamos a comer?", normal: true },
];

const NOMBRE: Record<TipoEntidad, string> = {
  alias: "El alias",
  cbu: "El CBU",
  cvu: "El CVU",
  telefono: "El número",
  cuit: "El CUIT",
  link: "El link",
};

/** "El alias juli.martinez.mp tiene 24 reportes en 5 provincias." (la cuenta de destino más reportada) */
export function lineaRed(entidades: ResumenEntidad[]): string | null {
  const e = entidades
    .filter((x) => (x.reportes ?? 0) > 0)
    .sort((a, b) => (a.tipo === "telefono" ? 1 : 0) - (b.tipo === "telefono" ? 1 : 0) || b.reportes - a.reportes)[0];
  if (!e) return null;
  const prov = e.provincias?.length ?? 0;
  return `${NOMBRE[e.tipo] ?? "La cuenta"} ${e.valor_normalizado} tiene ${e.reportes} ${
    e.reportes === 1 ? "reporte" : "reportes"
  }${prov > 1 ? ` en ${prov} provincias` : ""}.`;
}
