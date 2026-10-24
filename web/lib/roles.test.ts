import { test } from "node:test";
import assert from "node:assert/strict";
import { esAdminEmail, rolDe } from "./roles.ts";

test("esAdminEmail: matchea la lista sin importar mayúsculas ni espacios", () => {
  const lista = " Gobierno@Mula.ar , otra@x.com ,";
  assert.equal(esAdminEmail("gobierno@mula.ar", lista), true);
  assert.equal(esAdminEmail("  OTRA@x.com ", lista), true);
  assert.equal(esAdminEmail("familia@x.com", lista), false);
});

test("esAdminEmail: sin email o sin lista nunca es admin", () => {
  assert.equal(esAdminEmail(null, "a@b.com"), false);
  assert.equal(esAdminEmail(undefined, "a@b.com"), false);
  assert.equal(esAdminEmail("", "a@b.com"), false);
  assert.equal(esAdminEmail("a@b.com", ""), false);
  assert.equal(esAdminEmail("a@b.com", undefined), false);
});

test("esAdminEmail: por defecto lee ADMIN_EMAILS", () => {
  const antes = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = "admin@mula.ar";
  try {
    assert.equal(esAdminEmail("admin@mula.ar"), true);
    assert.equal(esAdminEmail("otro@mula.ar"), false);
  } finally {
    if (antes === undefined) delete process.env.ADMIN_EMAILS;
    else process.env.ADMIN_EMAILS = antes;
  }
});

test("rolDe: admin o usuario", () => {
  assert.equal(rolDe("a@b.com", "a@b.com"), "admin");
  assert.equal(rolDe("c@d.com", "a@b.com"), "usuario");
  assert.equal(rolDe(null, "a@b.com"), "usuario");
});
