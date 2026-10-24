import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { esPublicaSoloSinSesion } from "./rutas.ts";

describe("esPublicaSoloSinSesion", () => {
  it("landing, /entrar y /registro (con subrutas de Clerk) mandan al panel si hay sesión", () => {
    for (const p of ["/", "/entrar", "/entrar/factor-one", "/registro", "/registro/verify-email-address"]) {
      assert.equal(esPublicaSoloSinSesion(p), true, p);
    }
  });

  it("no toca el callback de SSO (Clerk termina el login ahí y redirige solo)", () => {
    assert.equal(esPublicaSoloSinSesion("/entrar/sso-callback"), false);
    assert.equal(esPublicaSoloSinSesion("/registro/sso-callback"), false);
  });

  it("el resto de las rutas no", () => {
    for (const p of ["/app", "/admin", "/api/extraer", "/entrarx", "/registros", "/verificar"]) {
      assert.equal(esPublicaSoloSinSesion(p), false, p);
    }
  });
});
