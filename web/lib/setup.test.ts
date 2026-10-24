import { test } from "node:test";
import assert from "node:assert/strict";
import { formatearTelefono, parseLineas, validarSetup } from "./setup.ts";

const PROV = ["Buenos Aires", "Santa Fe"];

test("parseLineas: una por línea (o coma), sin vacíos ni repetidos", () => {
  assert.deepEqual(parseLineas(" 341 555-1234 \n\n+54 9 11 2222 3333, 341 555-1234\n"), [
    "341 555-1234",
    "+54 9 11 2222 3333",
  ]);
  assert.deepEqual(parseLineas(""), []);
  assert.deepEqual(parseLineas(null), []);
});

test("parseLineas: corta en 20", () => {
  const muchas = Array.from({ length: 30 }, (_, i) => `34155500${String(i).padStart(2, "0")}`).join("\n");
  assert.equal(parseLineas(muchas).length, 20);
});

test("validarSetup: ok con datos completos", () => {
  const r = validarSetup({
    nombre: "  Abuela Marta ",
    telefono: "+54 9 341 555-1234",
    provincia: "Santa Fe",
    contactos: "341 555 0000",
    familiares: "11 2222 3333\n",
  }, PROV);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.datos.nombre, "Abuela Marta");
  assert.equal(r.datos.provincia, "Santa Fe");
  assert.deepEqual(r.datos.contactos, ["341 555 0000"]);
  assert.deepEqual(r.datos.familiares, ["11 2222 3333"]);
});

test("validarSetup: exige nombre y teléfono con 8+ dígitos", () => {
  const r = validarSetup({ nombre: " ", telefono: "12-34", provincia: "", contactos: "", familiares: "" }, PROV);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errores.nombre);
  assert.ok(r.errores.telefono);
});

test("validarSetup: provincia desconocida queda null, contacto inválido da error", () => {
  const r = validarSetup({
    nombre: "Marta",
    telefono: "3415551234",
    provincia: "Narnia",
    contactos: "hola",
    familiares: "",
  }, PROV);
  assert.equal(r.ok, false);
  if (r.ok) return;
  assert.ok(r.errores.contactos);
  const r2 = validarSetup({ nombre: "Marta", telefono: "3415551234", provincia: "Narnia", contactos: "", familiares: "" }, PROV);
  assert.equal(r2.ok && r2.datos.provincia, null);
});

test("formatearTelefono: 10 dígitos normalizados", () => {
  assert.equal(formatearTelefono("3415551234"), "341 555-1234");
  assert.equal(formatearTelefono("1122223333"), "11 2222-3333");
  assert.equal(formatearTelefono("123"), "123");
  assert.equal(formatearTelefono(null), "");
});
