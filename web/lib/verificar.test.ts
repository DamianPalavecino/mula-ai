import { test } from "node:test";
import assert from "node:assert/strict";
import { EJEMPLOS_VERIFICAR, validarValor } from "./verificar.ts";

test("vacío: no válido y sin mensaje (el botón queda deshabilitado)", () => {
  assert.deepEqual(validarValor("   "), { ok: false, error: null });
});

test("detecta alias, CBU, CVU, teléfono, CUIT y link", () => {
  assert.deepEqual(validarValor(" @Juli.Martinez.MP "), { ok: true, tipo: "alias" });
  assert.deepEqual(validarValor("0110599540000123456782"), { ok: true, tipo: "cbu" });
  assert.deepEqual(validarValor("0000007990 8765432101 24"), { ok: true, tipo: "cvu" });
  assert.deepEqual(validarValor("+54 9 11 6789-1234"), { ok: true, tipo: "telefono" });
  assert.deepEqual(validarValor("20-12345678-9"), { ok: true, tipo: "cuit" });
  assert.deepEqual(validarValor("https://gist.github.com/x"), { ok: true, tipo: "link" });
});

test("errores cortos para lo inválido", () => {
  const cbu = validarValor("01105995400001234567");
  assert.equal(cbu.ok, false);
  assert.match(cbu.ok ? "" : cbu.error ?? "", /22 dígitos/);
  const corto = validarValor("12345");
  assert.equal(corto.ok, false);
  const alias = validarValor("ab");
  assert.equal(alias.ok, false);
  assert.match(alias.ok ? "" : alias.error ?? "", /6 a 20/);
  assert.equal(validarValor("hola che!!").ok, false);
});

test("los ejemplos de un clic son válidos y hay uno limpio", () => {
  assert.ok(EJEMPLOS_VERIFICAR.length >= 4);
  for (const e of EJEMPLOS_VERIFICAR) assert.equal(validarValor(e.valor).ok, true, e.valor);
  assert.ok(EJEMPLOS_VERIFICAR.some((e) => e.limpio));
});
