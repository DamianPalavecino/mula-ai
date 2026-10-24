// DESIGN.md (raíz) es la fuente de verdad de los tokens: su bloque ```css tokens``` tiene que
// ser 1:1 (mismos nombres y valores) con el @theme de app/globals.css.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const leer = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");

function tokens(css: string): Map<string, string> {
  const m = new Map<string, string>();
  for (const [, nombre, valor] of css.matchAll(/^\s*(--[a-z0-9-]+)\s*:\s*([^;]+);/gm)) {
    m.set(nombre, valor.trim().replace(/\s+/g, " "));
  }
  return m;
}

function bloqueDesign(): string {
  const md = leer("../../DESIGN.md");
  const b = md.match(/```css tokens\r?\n([\s\S]*?)```/);
  assert.ok(b, "DESIGN.md no tiene el bloque ```css tokens");
  return b[1];
}

function bloqueTheme(): string {
  const css = leer("../app/globals.css");
  const ini = css.indexOf("@theme {");
  assert.ok(ini >= 0, "globals.css no tiene @theme");
  // Hasta el primer @keyframes (los keyframes no son tokens).
  const fin = css.indexOf("@keyframes", ini);
  return css.slice(ini, fin);
}

test("los tokens de DESIGN.md y de globals.css están en sync 1:1", () => {
  const design = tokens(bloqueDesign());
  const codigo = tokens(bloqueTheme());
  assert.ok(design.size > 10, "muy pocos tokens en DESIGN.md");
  const faltanEnCodigo = [...design.keys()].filter((k) => !codigo.has(k));
  const faltanEnDesign = [...codigo.keys()].filter((k) => !design.has(k));
  const distintos = [...design].filter(([k, v]) => codigo.has(k) && codigo.get(k) !== v).map(([k]) => k);
  assert.deepEqual({ faltanEnCodigo, faltanEnDesign, distintos }, { faltanEnCodigo: [], faltanEnDesign: [], distintos: [] });
});
