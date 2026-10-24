import { test } from "node:test";
import assert from "node:assert/strict";
import { demoLanding } from "./demo.ts";
import { GUIONES_DEMO } from "./demo.ts";

test("landing: arranca con el caso familiar y conserva el guion precalculado", () => {
  const vista = demoLanding();
  assert.equal(vista.guion, GUIONES_DEMO[0]);
  assert.equal(vista.avisar, true);
  assert.match(vista.avisoPersona!, /No transfieras/);
  assert.match(vista.avisoFamilia!, /Marta/);
});

test("landing: cambiar al falso ANSES conserva su riesgo y sus dos avisos", () => {
  const vista = demoLanding("anses");
  assert.equal(vista.guion.resultado.riesgo, 88);
  assert.match(vista.avisoPersona!, /ANSES/);
  assert.ok(vista.avisoFamilia);
});

test("landing: una conversación normal no muestra avisos de riesgo ni a la familia", () => {
  const vista = demoLanding("normal");
  assert.equal(vista.guion.resultado.es_sospechoso, false);
  assert.equal(vista.avisar, false);
  assert.equal(vista.avisoPersona, null);
  assert.equal(vista.avisoFamilia, null);
});

test("landing: una selección desconocida vuelve a un guion válido", () => {
  assert.equal(demoLanding("inexistente").guion.id, "familiar");
});
