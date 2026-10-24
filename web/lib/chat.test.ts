import { test } from "node:test";
import assert from "node:assert/strict";
import { candidatosEnTexto, validarChat, partesTexto, MAX_IMAGENES_CHAT } from "./chat.ts";

const img = "data:image/jpeg;base64,AAAA";

test("candidatosEnTexto encuentra alias, CBU, teléfono y link en una pregunta", () => {
  const c = candidatosEnTexto(
    "¿Es estafa juli.martinez.mp? Me pasaron el CBU 0110599540000123456782, el 11 6789-1234 y https://anses-bono.com/x",
  );
  assert.deepEqual(
    c.map((x) => x.tipo),
    ["alias", "cbu", "telefono", "link"],
  );
  assert.equal(c[0].valor, "juli.martinez.mp");
  assert.equal(c[1].valor, "0110599540000123456782");
});

test("candidatosEnTexto no toma palabras comunes como alias", () => {
  assert.deepEqual(candidatosEnTexto("hola, me escribió mi nieto diciendo que cambió de número"), []);
  assert.deepEqual(candidatosEnTexto("¿qué hago si me estafaron?"), []);
});

test("candidatosEnTexto acepta @alias y alias con guion, sin duplicados y con tope", () => {
  const c = candidatosEnTexto("@juli.martinez.mp y juli.martinez.mp y pepe-ventas.ok");
  assert.deepEqual(c.map((x) => x.valor), ["juli.martinez.mp", "pepe-ventas.ok"]);
  const muchos = Array.from({ length: 10 }, (_, i) => `cuenta.n${i}.mp`).join(" ");
  assert.equal(candidatosEnTexto(muchos).length, 5);
});

test("validarChat acepta historial y fotos solo en el último mensaje", () => {
  const r = validarChat({
    mensajes: [
      { rol: "usuario", texto: "hola" },
      { rol: "asistente", texto: "¿en qué te ayudo?" },
      { rol: "usuario", texto: "¿esto es estafa?", imagenes: [img] },
    ],
  });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.mensajes.at(-1)!.imagenes.length, 1);
});

test("validarChat rechaza vacío, último no del usuario, imágenes inválidas o demasiadas", () => {
  assert.equal(validarChat({}).ok, false);
  assert.equal(validarChat({ mensajes: [{ rol: "usuario", texto: "  " }] }).ok, false);
  assert.equal(validarChat({ mensajes: [{ rol: "asistente", texto: "hola" }] }).ok, false);
  assert.equal(validarChat({ mensajes: [{ rol: "usuario", texto: "x", imagenes: ["data:image/gif;base64,AA"] }] }).ok, false);
  const fotos = Array.from({ length: MAX_IMAGENES_CHAT + 1 }, () => img);
  assert.equal(validarChat({ mensajes: [{ rol: "usuario", texto: "", imagenes: fotos }] }).ok, false);
});

test("validarChat acepta solo una foto sin texto, recorta historial y descarta fotos viejas", () => {
  const largo = Array.from({ length: 30 }, (_, i) => ({ rol: i % 2 ? "asistente" : "usuario", texto: `m${i}`, imagenes: [img] }));
  largo.push({ rol: "usuario", texto: "", imagenes: [img] });
  const r = validarChat({ mensajes: largo });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.ok(r.mensajes.length <= 12);
    assert.ok(r.mensajes.slice(0, -1).every((m) => m.imagenes.length === 0));
  }
});

test("partesTexto separa negritas de WhatsApp y markdown", () => {
  assert.deepEqual(partesTexto("El alias *juli* tiene **23** reportes"), [
    { texto: "El alias ", negrita: false },
    { texto: "juli", negrita: true },
    { texto: " tiene ", negrita: false },
    { texto: "23", negrita: true },
    { texto: " reportes", negrita: false },
  ]);
  assert.deepEqual(partesTexto("sin formato"), [{ texto: "sin formato", negrita: false }]);
});
