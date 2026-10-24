import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { alertasUltimas24h, calcularStats, entidadesDistintas } from "./adminStats.ts";

const filas = [
  { provincia: "Santa Fe", modalidad: "familiar_numero_nuevo" },
  { provincia: "Santa Fe", modalidad: "familiar_numero_nuevo" },
  { provincia: "Córdoba", modalidad: "inversion" },
  { provincia: null, modalidad: "raro" },
];

describe("calcularStats", () => {
  it("cuenta total, provincias y modalidades ordenadas desc", () => {
    const s = calcularStats(filas);
    assert.equal(s.total, 4);
    assert.deepEqual(s.porProvincia[0], { clave: "Santa Fe", label: "Santa Fe", n: 2 });
    assert.equal(s.provinciasConReportes, 2);
    assert.deepEqual(s.porModalidad[0], {
      clave: "familiar_numero_nuevo",
      label: "Familiar número nuevo",
      n: 2,
    });
    assert.equal(s.porModalidad.at(-1)?.label, "raro");
  });
  it("top 8 provincias", () => {
    const muchas = Array.from({ length: 12 }, (_, i) => ({ provincia: `P${i}`, modalidad: "otro" }));
    const s = calcularStats(muchas);
    assert.equal(s.porProvincia.length, 8);
    assert.equal(s.provinciasConReportes, 12);
  });
  it("vacío", () => {
    const s = calcularStats([]);
    assert.equal(s.total, 0);
    assert.deepEqual(s.porModalidad, []);
  });
});

describe("entidadesDistintas / alertasUltimas24h", () => {
  it("cuenta nodos e_*", () => {
    assert.equal(
      entidadesDistintas({ nodes: [{ id: "e_1" }, { id: "r_1" }, { id: "e_2" }], links: [] }),
      2,
    );
    assert.equal(entidadesDistintas(null), 0);
  });
  it("alertas de las últimas 24 h", () => {
    const ahora = Date.parse("2026-10-24T12:00:00Z");
    const a = [
      { created_at: "2026-10-24T11:00:00Z" },
      { created_at: "2026-10-23T11:00:00Z" },
    ];
    assert.equal(alertasUltimas24h(a, ahora), 1);
  });
});
