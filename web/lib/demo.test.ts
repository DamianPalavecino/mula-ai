import { test } from "node:test";
import assert from "node:assert/strict";
import { GUIONES_DEMO } from "./demo.ts";

test("demo: 3 guiones (familiar, ANSES, normal) con id único", () => {
  assert.deepEqual(
    GUIONES_DEMO.map((g) => g.id),
    ["familiar", "anses", "normal"],
  );
});

test("demo: los guiones de estafa traen riesgo alto, modalidad, señales y las dos alertas", () => {
  for (const g of GUIONES_DEMO.filter((g) => g.resultado.es_sospechoso)) {
    assert.ok(g.resultado.riesgo >= 70, g.id);
    assert.ok(g.resultado.senales.length >= 2, g.id);
    assert.ok(g.resultado.alerta_persona.length > 0, g.id);
    assert.ok(g.resultado.alerta_familia.length > 0, g.id);
  }
  assert.equal(GUIONES_DEMO[0].resultado.modalidad, "familiar_numero_nuevo");
  assert.equal(GUIONES_DEMO[1].resultado.modalidad, "falso_organismo");
});

test("demo: el mensaje normal no alerta a nadie", () => {
  const normal = GUIONES_DEMO[2].resultado;
  assert.equal(normal.es_sospechoso, false);
  assert.ok(normal.riesgo < 30);
  assert.equal(normal.alerta_persona, "");
  assert.equal(normal.alerta_familia, "");
});
