import { test } from "node:test";
import assert from "node:assert/strict";
import { marcarVistas, noVistas } from "./alertasVistas.ts";

test("cuenta solo las alertas con id mayor al último visto", () => {
  assert.equal(noVistas([{ id: 5 }, { id: 9 }, { id: 12 }], 9), 1);
  assert.equal(noVistas([{ id: 5 }], 0), 1);
  assert.equal(noVistas([], 3), 0);
});

test("al abrir, el último visto pasa a ser el mayor id (nunca baja)", () => {
  assert.equal(marcarVistas([{ id: 5 }, { id: 12 }], 9), 12);
  assert.equal(marcarVistas([{ id: 5 }], 9), 9);
  assert.equal(noVistas([{ id: 12 }], marcarVistas([{ id: 12 }], 0)), 0);
});
