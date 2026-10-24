// Rutas puras (sin Clerk) para poder testearlas con node --test.
// Landing, /entrar y /registro son para quien no tiene sesión: con sesión, el proxy manda a /app.
// El sso-callback queda afuera: ahí Clerk cierra el login y redirige él (respeta redirect_url).
export function esPublicaSoloSinSesion(pathname: string): boolean {
  if (pathname === "/") return true;
  const m = pathname.match(/^\/(entrar|registro)(\/.*)?$/);
  if (!m) return false;
  return !(m[2] ?? "").startsWith("/sso-callback");
}
