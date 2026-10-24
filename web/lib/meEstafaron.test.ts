import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { EntidadEnRed, EntidadExtraida } from "@/lib/extraccion";
import type { ResumenEntidad } from "@/lib/tipos";
import {
  antecedentesRed,
  armarTextos,
  crearRateLimiter,
  limpiarEntidades,
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

describe("armarTextos", () => {
  const datos = {
    modalidad: "familiar_numero_nuevo" as const,
    entidades: [ent("alias", "juli.martinez.mp"), { ...ent("telefono", "+54 9 11 4444-5555"), rol: "contacto_estafador" as const }],
    transferencias: [{ monto: 180000, fecha: "2026-10-23", destino: "juli.martinez.mp", titular_destino: null, comprobante: "OP-123" }],
    monto_total: 180000,
    fecha_hecho: "2026-10-23",
  };

  it("arma denuncia y pedido con las cuentas, el monto y los antecedentes", () => {
    const t = armarTextos(datos, "Santa Fe", "Antecedentes: juli.martinez.mp 23 reportes.");
    assert.ok(t.denuncia.startsWith("Formulo denuncia penal por estafa"));
    for (const x of ["juli.martinez.mp", "+54 9 11 4444-5555", "$180.000", "OP-123", "Antecedentes: juli", "[NOMBRE Y APELLIDO]", "Santa Fe"]) {
      assert.ok(t.denuncia.includes(x), `denuncia sin ${x}`);
    }
    assert.ok(t.pedido_bloqueo.includes("juli.martinez.mp") && t.pedido_bloqueo.includes("$180.000"));
    assert.ok(!t.pedido_bloqueo.includes("+54 9 11"), "el teléfono no es cuenta a bloquear");
    assert.ok(t.pasos.length >= 4);
  });

  it("muestra las fechas ISO como dd/mm/aaaa", () => {
    const t = armarTextos(datos, "", null);
    assert.ok(t.denuncia.includes("23/10/2026") && !t.denuncia.includes("2026-10-23"));
    assert.ok(t.pedido_bloqueo.includes("23/10/2026"));
  });

  it("sin datos deja marcadores y no inventa", () => {
    const t = armarTextos({ modalidad: "otro", entidades: [], transferencias: [], monto_total: null, fecha_hecho: null }, "", null);
    assert.ok(t.denuncia.includes("[MONTO]") && t.denuncia.includes("[FECHA DEL HECHO]"));
    assert.ok(t.pedido_bloqueo.includes("[CUENTA DE DESTINO]"));
    assert.ok(!t.denuncia.includes("Antecedentes"));
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
