import { test } from "node:test";
import assert from "node:assert/strict";
import { partesNegrita } from "./simulador.ts";

test("partesNegrita separa *negrita* estilo WhatsApp", () => {
  assert.deepEqual(partesNegrita("⚠️ *Mula AI*: ojo"), [
    { texto: "⚠️ ", negrita: false },
    { texto: "Mula AI", negrita: true },
    { texto: ": ojo", negrita: false },
  ]);
});

test("partesNegrita deja intacto el texto sin asteriscos", () => {
  assert.deepEqual(partesNegrita("hola"), [{ texto: "hola", negrita: false }]);
});
