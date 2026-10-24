import { test } from "node:test";
import assert from "node:assert/strict";
import { filtroMisAlertas } from "./misAlertas.ts";

test("filtroMisAlertas: ids y nombres escapados en un .or()", () => {
  assert.equal(
    filtroMisAlertas([3, 7], ["Abuela Marta", 'Tía "Coca", la de (Rosario)']),
    'protegido_id.in.(3,7),protegido.in.("Abuela Marta","Tía \\"Coca\\", la de (Rosario)")',
  );
});

test("filtroMisAlertas: sin protegidos → null (no se consulta)", () => {
  assert.equal(filtroMisAlertas([], []), null);
});

test("filtroMisAlertas: descarta ids no numéricos y nombres vacíos", () => {
  assert.equal(filtroMisAlertas([5, Number.NaN], ["", "  "]), "protegido_id.in.(5)");
});
