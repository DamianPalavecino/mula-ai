import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { TABS, tabInicial } from "./panel.ts";

describe("tabInicial", () => {
  it("acepta cada pestaña conocida", () => {
    for (const t of TABS) assert.equal(tabInicial(t), t);
  });

  it("cualquier otra cosa cae en inicio", () => {
    for (const t of ["", "admin", "INICIO", undefined]) assert.equal(tabInicial(t), "inicio");
  });

  // /app es server component: TABS no puede vivir en un módulo "use client" (llega como referencia, no como array).
  it("TABS es un array real", () => {
    assert.ok(Array.isArray(TABS));
  });
});
