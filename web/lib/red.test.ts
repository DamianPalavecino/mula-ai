import { test } from "node:test";
import assert from "node:assert/strict";
import { fusionar } from "./red.ts";
import type { Grafo, Nodo } from "./tipos";

const g = (ids: string[], links: [string, string][] = []): Grafo => ({
  nodes: ids.map((id) => ({ id, tipo: id.startsWith("r_") ? "reporte" : "alias", label: id }) as Nodo),
  links: links.map(([source, target]) => ({ source, target })),
});

test("primera carga: no marca nada como nuevo", () => {
  const previos = new Map<string, Nodo>();
  const { grafo, nuevos } = fusionar(previos, g(["e_1", "r_1"], [["r_1", "e_1"]]));
  assert.equal(grafo.nodes.length, 2);
  assert.deepEqual(nuevos, []);
  assert.equal(previos.size, 2);
});

test("refresco: conserva el objeto (y su posición) y devuelve los ids nuevos", () => {
  const previos = new Map<string, Nodo>();
  const a = fusionar(previos, g(["e_1", "r_1"]));
  const e1 = a.grafo.nodes[0] as Nodo & { x?: number };
  e1.x = 42;
  const b = fusionar(previos, g(["e_1", "r_1", "r_2", "e_9"], [["r_2", "e_1"]]));
  assert.equal(b.grafo.nodes[0], e1);
  assert.equal((b.grafo.nodes[0] as Nodo & { x?: number }).x, 42);
  assert.deepEqual(b.nuevos, ["r_2", "e_9"]);
  assert.equal(b.grafo.links.length, 1);
});

test("refresco sin cambios: nada nuevo; los que desaparecen se van", () => {
  const previos = new Map<string, Nodo>();
  fusionar(previos, g(["e_1", "r_1", "r_2"]));
  const c = fusionar(previos, g(["e_1", "r_1"]));
  assert.deepEqual(c.nuevos, []);
  assert.equal(previos.has("r_2"), false);
});
