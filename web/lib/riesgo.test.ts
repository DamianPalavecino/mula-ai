import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import type { Nodo } from "@/lib/tipos";
import {
  colorRiesgo,
  distanciaOklab,
  ESCALA_RIESGO,
  etiquetaNodo,
  nivelRiesgo,
  tintaSobreRiesgo,
  topDenunciados,
} from "./riesgo.ts";

describe("escala de riesgo", () => {
  it("las paradas son los tokens --color-riesgo-1…5 de globals.css (DESIGN.md)", () => {
    const css = readFileSync(new URL("../app/globals.css", import.meta.url), "utf8");
    ESCALA_RIESGO.forEach((p, i) => {
      const m = css.match(new RegExp(`--color-riesgo-${i + 1}:\\s*(#[0-9a-f]{6});`, "i"));
      assert.ok(m, `falta --color-riesgo-${i + 1}`);
      assert.equal(m[1].toLowerCase(), p.color.toLowerCase());
    });
  });

  it("en cada parada da exactamente su color, y arriba de la última se queda en la última", () => {
    for (const p of ESCALA_RIESGO) assert.equal(colorRiesgo(p.desde), p.color.toLowerCase());
    assert.equal(colorRiesgo(80), ESCALA_RIESGO.at(-1)!.color.toLowerCase());
    assert.equal(colorRiesgo(0), ESCALA_RIESGO[0].color.toLowerCase());
  });

  it("es continua: entre dos paradas da un color intermedio", () => {
    const [a, b] = [colorRiesgo(3), colorRiesgo(6)];
    const medio = colorRiesgo(4);
    assert.notEqual(medio, a);
    assert.notEqual(medio, b);
    assert.ok(distanciaOklab(a, medio) < distanciaOklab(a, b));
  });

  it("escalones bien diferenciados (ΔE OKLab ≥ 0.08 entre paradas vecinas)", () => {
    for (let i = 1; i < ESCALA_RIESGO.length; i++) {
      const d = distanciaOklab(ESCALA_RIESGO[i - 1].color, ESCALA_RIESGO[i].color);
      assert.ok(d >= 0.08, `parada ${i}→${i + 1}: ΔE ${d.toFixed(3)}`);
    }
  });

  it("ícono oscuro sobre los colores claros y blanco sobre los oscuros (contraste ≥ 3:1)", () => {
    assert.equal(tintaSobreRiesgo(1), "#111418");
    assert.equal(tintaSobreRiesgo(3), "#111418");
    assert.equal(tintaSobreRiesgo(10), "#ffffff");
    assert.equal(tintaSobreRiesgo(30), "#ffffff");
  });

  it("nivelRiesgo: 1 neutro, 2–4, 5–9, 10+", () => {
    assert.deepEqual([0, 1, 2, 4, 5, 9, 10, 28].map(nivelRiesgo), [0, 0, 1, 1, 2, 2, 3, 3]);
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
