import { test } from "node:test";
import assert from "node:assert/strict";
import { EJEMPLOS_PROBAR, lineaRed } from "./probar.ts";

const base = { entidad_id: 1, encontrada: true, modalidades: [], ultimo: null, monto_total: null };

test("3 ejemplos de un clic: dos estafas y uno normal", () => {
  assert.equal(EJEMPLOS_PROBAR.length, 3);
  assert.equal(EJEMPLOS_PROBAR.filter((e) => e.normal).length, 1);
});

test("lineaRed prefiere la cuenta de destino y omite lo que no tiene reportes", () => {
  assert.equal(
    lineaRed([
      { ...base, tipo: "telefono", valor_normalizado: "1167891234", reportes: 40, provincias: ["A", "B"] },
      { ...base, tipo: "alias", valor_normalizado: "juli.martinez.mp", reportes: 24, provincias: ["A", "B", "C", "D", "E"] },
    ]),
    "El alias juli.martinez.mp tiene 24 reportes en 5 provincias.",
  );
  assert.equal(lineaRed([{ ...base, tipo: "alias", valor_normalizado: "x.y.z.w", reportes: 0, provincias: [] }]), null);
});
