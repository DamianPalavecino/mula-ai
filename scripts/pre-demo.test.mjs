// node --test scripts/pre-demo.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluarReset, evaluarHealth, evaluarProd } from './pre-demo.mjs';

test('reset: 23 en 5 es verde', () => {
  const r = evaluarReset(0, 'Reportes de ensayo: 4\njuli.martinez.mp: 23 reportes · 5 provincias\n');
  assert.equal(r.ok, true);
  assert.match(r.detalle, /23 reportes · 5 provincias/);
});

test('reset: exit != 0 es rojo aunque imprima el conteo', () => {
  const r = evaluarReset(1, 'juli.martinez.mp: 27 reportes · 5 provincias\nOjo: debería dar 23 en 5.');
  assert.equal(r.ok, false);
  assert.match(r.detalle, /27 reportes/);
});

test('reset en dry: informa sin exigir 23', () => {
  const r = evaluarReset(0, 'juli.martinez.mp: 27 reportes · 5 provincias', { dry: true });
  assert.equal(r.ok, true);
  assert.match(r.detalle, /dry/);
});

test('health: conectado es verde', () => {
  assert.equal(evaluarHealth(0, '{"ok":true,"whatsapp":"conectado"}').ok, true);
});

test('health: qr o desconectado es rojo', () => {
  assert.equal(evaluarHealth(0, '{"ok":true,"whatsapp":"qr"}').ok, false);
  assert.equal(evaluarHealth(0, '{"ok":true,"whatsapp":"desconectado"}').ok, false);
});

test('health: ssh caído o basura es rojo', () => {
  assert.equal(evaluarHealth(255, '').ok, false);
  assert.equal(evaluarHealth(0, 'curl: (7) Failed to connect').ok, false);
});

test('prod: 0 verde, 3 (omitido) y 1 rojos', () => {
  assert.equal(evaluarProd(0, 'prod ok').ok, true);
  assert.equal(evaluarProd(3, '⏭️ faltan SUPABASE_URL').ok, false);
  const r = evaluarProd(1, 'PASS  a\nFAIL  web /red → 500\n\n1 fallas');
  assert.equal(r.ok, false);
  assert.match(r.detalle, /web \/red/);
});
