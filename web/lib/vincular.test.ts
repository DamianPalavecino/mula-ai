import { test } from "node:test";
import assert from "node:assert/strict";
import { leerSesion, seguirConsultando, textoEstado } from "./vincular.ts";

test("leerSesion: acepta la respuesta del worker", () => {
  assert.deepEqual(leerSesion({ protegido_id: 2, estado: "qr", qr: "2@abc", telefono: null }), {
    estado: "qr",
    qr: "2@abc",
    telefono: null,
  });
  assert.deepEqual(leerSesion({ estado: "conectado", qr: null, telefono: "3415551234" }), {
    estado: "conectado",
    qr: null,
    telefono: "3415551234",
  });
});

test("leerSesion: rechaza basura y estados desconocidos", () => {
  assert.equal(leerSesion(null), null);
  assert.equal(leerSesion({ error: "x" }), null);
  assert.equal(leerSesion({ estado: "hackeado" }), null);
  assert.deepEqual(leerSesion({ estado: "qr", qr: 12, telefono: 5 }), { estado: "qr", qr: null, telefono: null });
});

test("seguirConsultando: solo mientras hay QR o reconecta", () => {
  assert.equal(seguirConsultando("qr"), true);
  assert.equal(seguirConsultando("desconectado"), true);
  assert.equal(seguirConsultando("conectado"), false);
  assert.equal(seguirConsultando("inactiva"), false);
});

test("textoEstado: cada estado tiene título", () => {
  for (const e of ["qr", "desconectado", "conectado", "inactiva"] as const) assert.ok(textoEstado(e, "Marta").titulo);
  assert.match(textoEstado("conectado", "Marta").titulo, /Marta/);
});
