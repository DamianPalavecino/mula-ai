import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { EntidadEnRed, EntidadExtraida } from "@/lib/extraccion";
import type { ResumenEntidad } from "@/lib/tipos";
import {
  antecedentesRed,
  crearRateLimiter,
  insertarAntecedentes,
  limpiarEntidades,
  MARCA_RED,
  MAX_BYTES_ORIGINAL,
  validarArchivo,
} from "./meEstafaron.ts";

const ent = (tipo: EntidadExtraida["tipo"], valor: string): EntidadExtraida => ({
  tipo,
  valor,
  rol: "destino_plata",
  donde: "captura 1",
});

function resumen(valor: string, reportes: number, provincias: string[]): ResumenEntidad {
  return {
    entidad_id: reportes ? 1 : null,
    tipo: "alias",
    valor_normalizado: valor,
    encontrada: reportes > 0,
    reportes,
    provincias,
    modalidades: [],
    ultimo: null,
    monto_total: null,
  };
}

describe("limpiarEntidades", () => {
  it("normaliza alias y descarta los que la red ignoraría", () => {
    const out = limpiarEntidades([ent("alias", " @Juli.Martinez.MP. "), ent("alias", "abc")]);
    assert.deepEqual(out.map((e) => e.valor), ["juli.martinez.mp"]);
  });

  it("re-deriva cbu/cvu por el prefijo 000 y exige 22 dígitos", () => {
    const out = limpiarEntidades([
      ent("cbu", "0000003100012345678901"),
      ent("cvu", "2850590940090418135201"),
      ent("cbu", "28505909400904181352"),
    ]);
    assert.deepEqual(out.map((e) => [e.tipo, e.valor]), [
      ["cvu", "0000003100012345678901"],
      ["cbu", "2850590940090418135201"],
    ]);
  });

  it("acepta teléfonos de 8 a 13 dígitos y deduplica por dígitos", () => {
    const out = limpiarEntidades([
      ent("telefono", "+54 9 341 555-0198"),
      ent("telefono", "5493415550198"),
      ent("telefono", "1234"),
    ]);
    assert.equal(out.length, 1);
  });

  it("deduplica CUIT con y sin guiones y descarta dígito verificador o prefijo inválidos", () => {
    const out = limpiarEntidades([
      ent("cuit", "CUIT/CUIL: 20-12345678-6"),
      ent("cuit", "20123456786"),
      ent("cuit", "20-12345678-9"),
      ent("cuit", "21-12345678-6"),
      ent("cuit", "2012345678"),
    ]);
    assert.equal(out.length, 1);
    assert.deepEqual([out[0].tipo, out[0].valor], ["cuit", "20-12345678-6"]);
  });

  it("deduplica links con y sin https/www/barra final y descarta los que no tienen host", () => {
    const out = limpiarEntidades([
      ent("link", "https://www.Anses-Beneficios.com/"),
      ent("link", "anses-beneficios.com"),
      ent("link", "http://anses-beneficios.com"),
      ent("link", "bit.ly/AbC12"),
      ent("link", "localhost"),
      ent("link", "no es un link"),
    ]);
    assert.deepEqual(out.map((e) => e.valor), ["https://www.Anses-Beneficios.com/", "bit.ly/AbC12"]);
  });
});

describe("antecedentesRed", () => {
  it("null si ninguna entidad tiene reportes", () => {
    const red: EntidadEnRed[] = [{ entidad: ent("alias", "nuevo.alias"), resumen: resumen("nuevo.alias", 0, []) }];
    assert.equal(antecedentesRed(red), null);
  });

  it("cuenta reportes y provincias de cada entidad reportada", () => {
    const red: EntidadEnRed[] = [
      { entidad: ent("alias", "juli.martinez.mp"), resumen: resumen("juli.martinez.mp", 23, ["Santa Fe", "Córdoba", "Salta", "Mendoza", "CABA"]) },
      { entidad: ent("alias", "otro.alias"), resumen: null },
    ];
    const p = antecedentesRed(red)!;
    assert.ok(p.includes("juli.martinez.mp"));
    assert.ok(p.includes("23 reportes previos"));
    assert.ok(p.includes("5 provincias"));
    assert.ok(!p.includes("otro.alias"));
  });
});

describe("insertarAntecedentes", () => {
  it("reemplaza la marca", () => {
    assert.equal(insertarAntecedentes(`Hechos.\n\n${MARCA_RED}\n\nPido.`, "Antecedentes."), 
      "Hechos.\n\nAntecedentes.\n\nPido.",
    );
  });

  it("saca la marca si no hay antecedentes", () => {
    assert.equal(insertarAntecedentes(`Hechos.\n\n${MARCA_RED}\n\nPido.`, null), "Hechos.\n\nPido.");
  });

  it("agrega al final si el modelo no puso la marca", () => {
    assert.equal(insertarAntecedentes("Hechos.", "Antecedentes."), "Hechos.\n\nAntecedentes.");
    assert.equal(insertarAntecedentes("Hechos.", null), "Hechos.");
  });
});

describe("crearRateLimiter", () => {
  it("deja pasar hasta max por ventana y después corta", () => {
    const permitir = crearRateLimiter(2, 60_000);
    assert.equal(permitir("ip", 0), true);
    assert.equal(permitir("ip", 1), true);
    assert.equal(permitir("ip", 2), false);
    assert.equal(permitir("otra", 2), true);
    assert.equal(permitir("ip", 60_001), true);
  });
});

describe("validarArchivo", () => {
  const f = (type: string, size: number) => ({ type, size, name: "x" });
  it("acepta png y jpg dentro del tamaño", () => {
    assert.equal(validarArchivo(f("image/png", 1000)), null);
    assert.equal(validarArchivo(f("image/jpeg", 1000)), null);
  });
  it("rechaza vacío, otro tipo y muy pesado", () => {
    assert.equal(validarArchivo(f("image/png", 0)), "Archivo vacío");
    assert.equal(validarArchivo(f("image/webp", 1000)), "Solo PNG o JPG");
    assert.equal(validarArchivo(f("application/pdf", 1000)), "Solo PNG o JPG");
    assert.equal(validarArchivo(f("image/jpeg", MAX_BYTES_ORIGINAL + 1)), "Más de 10 MB");
  });
});
