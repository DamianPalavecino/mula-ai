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

test("landing: la advertencia es un mensaje aparte al chat propio, nunca al remitente", () => {
  for (const id of ["familiar", "anses"]) {
    const vista = demoLanding(id);
    assert.equal(vista.chatAviso?.destino, "propio");
    assert.equal(vista.chatAviso?.nombre, "Marta (vos)");
    assert.equal(vista.chatAviso?.texto, vista.avisoPersona);
    assert.equal(vista.chatAviso?.saliente, true);
    assert.notEqual(vista.chatAviso?.nombre, vista.nombreChat);
  }
  assert.equal(demoLanding("normal").chatAviso, null);
});
