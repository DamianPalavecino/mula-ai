import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Nodo } from "@/lib/tipos";
import { etiquetaNodo, NIVELES_RIESGO, nivelRiesgo, topDenunciados } from "./riesgo.ts";

describe("nivelRiesgo", () => {
  it("1 = neutro, 2–4 = ámbar, 5–9 = naranja, 10+ = rojo", () => {
    assert.deepEqual(
      [0, 1, 2, 4, 5, 9, 10, 28].map(nivelRiesgo),
      [0, 0, 1, 1, 2, 2, 3, 3],
    );
  });
  it("la leyenda cubre los 4 niveles en orden", () => {
    assert.deepEqual(NIVELES_RIESGO.map((n) => n.rotulo), ["1", "2–4", "5–9", "10+"]);
  });
});

const e = (id: string, label: string, reportes: number): Nodo => ({ id, tipo: "alias", label, reportes });

describe("topDenunciados", () => {
  const nodos: Nodo[] = [
    e("e_1", "b.alias", 5),
    { id: "r_1", tipo: "reporte", label: "Otro" },
    e("e_2", "juli.martinez.mp", 28),
    e("e_3", "a.alias", 5),
    e("e_4", "uno.solo", 1),
  ];
  it("ordena por reportes y desempata por valor, sin nodos de reporte", () => {
    assert.deepEqual(
      topDenunciados(nodos, 3).map((n) => n.id),
      ["e_2", "e_3", "e_1"],
    );
  });
  it("deja afuera las entidades con un solo reporte", () => {
    assert.equal(topDenunciados(nodos, 10).length, 3);
  });
});

describe("etiquetaNodo", () => {
  it("valor · reportes", () => {
    assert.equal(etiquetaNodo(e("e_2", "juli.martinez.mp", 28)), "juli.martinez.mp · 28");
  });
});
