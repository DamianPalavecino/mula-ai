// node --test (type stripping de Node 22): sin dependencias.
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  MENSAJES_DEMO,
  analizar,
  lineaRed,
  mockAnalizar,
  partesNegrita,
} from "./simulador.ts";

const [juli, anses, normal] = MENSAJES_DEMO.map((m) => m.texto);

test("hay 3 mensajes precargados: juli, ANSES y uno normal", () => {
  assert.equal(MENSAJES_DEMO.length, 3);
  assert.match(juli, /juli\.martinez\.mp/);
  assert.match(anses, /0000003100012345678901/);
  assert.match(normal, /domingo/);
});

test("mock: juli.martinez.mp es estafa de familiar con la red cargada", () => {
  const r = mockAnalizar(juli);
  assert.equal(r.es_sospechoso, true);
  assert.ok(r.riesgo >= 80);
  assert.equal(r.modalidad, "familiar_numero_nuevo");
  const alias = r.entidades.find((e) => e.valor_normalizado === "juli.martinez.mp");
  assert.ok(alias);
  assert.equal(alias.tipo, "alias");
  assert.equal(alias.reportes, 24);
  assert.equal(alias.provincias.length, 5);
  assert.match(r.alerta_persona, /24 reportes en 5 provincias/);
  assert.match(r.alerta_persona, /No transfieras/);
  assert.match(r.alerta_familia, /Juli/);
  assert.equal(r.fuente_clasificacion, "heuristica");
});

test("mock: ANSES con CVU es falso organismo", () => {
  const r = mockAnalizar(anses);
  assert.equal(r.es_sospechoso, true);
  assert.equal(r.modalidad, "falso_organismo");
  const cvu = r.entidades.find((e) => e.valor_normalizado === "0000003100012345678901");
  assert.ok(cvu);
  assert.equal(cvu.tipo, "cvu");
  assert.ok(cvu.reportes > 1);
});

test("mock: el mensaje normal no alerta", () => {
  const r = mockAnalizar(normal);
  assert.equal(r.es_sospechoso, false);
  assert.ok(r.riesgo < 40);
  assert.deepEqual(r.entidades, []);
  assert.equal(r.reporte_id, null);
  assert.equal(r.alerta_id, null);
});

test("mock: texto libre con pedido de plata y alias desconocido alerta", () => {
  const r = mockAnalizar("ma, cambié de número, necesito que me transfieras urgente a pepe.gomez.uala");
  assert.equal(r.es_sospechoso, true);
  const e = r.entidades.find((x) => x.valor_normalizado === "pepe.gomez.uala");
  assert.ok(e);
  assert.equal(e.encontrada, false);
});

test("lineaRed elige la cuenta más reportada y prefiere destino sobre teléfono", () => {
  const base = { entidad_id: 1, encontrada: true, modalidades: [], ultimo: null, monto_total: null };
  const linea = lineaRed([
    { ...base, tipo: "telefono", valor_normalizado: "1123456789", reportes: 40, provincias: ["A", "B"] },
    { ...base, tipo: "alias", valor_normalizado: "juli.martinez.mp", reportes: 24, provincias: ["A", "B", "C", "D", "E"] },
  ]);
  assert.equal(linea, "El alias juli.martinez.mp tiene 24 reportes en 5 provincias.");
  assert.equal(lineaRed([]), null);
  assert.equal(
    lineaRed([{ ...base, tipo: "cbu", valor_normalizado: "2850590940090418135201", reportes: 0, encontrada: false, provincias: [] }]),
    null,
  );
});

test("partesNegrita separa *negrita* estilo WhatsApp", () => {
  assert.deepEqual(partesNegrita("⚠️ *Mula AI*: ojo"), [
    { texto: "⚠️ ", negrita: false },
    { texto: "Mula AI", negrita: true },
    { texto: ": ojo", negrita: false },
  ]);
});

const respuestaWorker = { ...mockAnalizar(juli), fuente_clasificacion: "llm", reporte_id: 301, alerta_id: 55 };

test("analizar: sin URL usa el mock", async () => {
  let llamado = false;
  const r = await analizar(juli, {
    url: undefined,
    fetcher: (async () => {
      llamado = true;
      throw new Error("no");
    }) as typeof fetch,
  });
  assert.equal(llamado, false);
  assert.equal(r.modo, "demo");
  assert.equal(r.respuesta.es_sospechoso, true);
});

test("analizar: con URL pega a /analizar con el body del contrato", async () => {
  let pedido: { url: string; body: unknown } | null = null;
  const r = await analizar(juli, {
    url: "https://worker.test/",
    enviarWhatsapp: true,
    fetcher: (async (url: string, init: RequestInit) => {
      pedido = { url, body: JSON.parse(String(init.body)) };
      return new Response(JSON.stringify(respuestaWorker), { status: 200 });
    }) as unknown as typeof fetch,
  });
  assert.deepEqual(pedido, {
    url: "https://worker.test/analizar",
    body: { texto: juli, remitente: "simulador", enviar_whatsapp: true },
  });
  assert.equal(r.modo, "worker");
  assert.equal(r.respuesta.alerta_id, 55);
});

test("analizar: sin el toggle no manda enviar_whatsapp", async () => {
  let body: Record<string, unknown> = {};
  await analizar(normal, {
    url: "https://worker.test",
    fetcher: (async (_u: string, init: RequestInit) => {
      body = JSON.parse(String(init.body));
      return new Response(JSON.stringify(mockAnalizar(normal)), { status: 200 });
    }) as unknown as typeof fetch,
  });
  assert.equal("enviar_whatsapp" in body, false);
});

test("analizar: si el worker falla o responde error cae al mock", async () => {
  const caido = await analizar(juli, {
    url: "https://worker.test",
    fetcher: (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch,
  });
  assert.equal(caido.modo, "demo");
  assert.equal(caido.respuesta.es_sospechoso, true);

  const error500 = await analizar(juli, {
    url: "https://worker.test",
    fetcher: (async () =>
      new Response(JSON.stringify({ error: "boom" }), { status: 500 })) as unknown as typeof fetch,
  });
  assert.equal(error500.modo, "demo");
});
