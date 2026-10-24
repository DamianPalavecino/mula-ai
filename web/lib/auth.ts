import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Roles: admin = email primario en ADMIN_EMAILS (server-only, separados por coma).
// Cualquier otro usuario logueado es "usuario" (familiar / persona protegida).
export type Rol = "admin" | "usuario";

export interface Sesion {
  userId: string;
  email: string | null;
  nombre: string | null;
  rol: Rol;
}

export function esAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const lista = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(email.trim().toLowerCase());
}

// Sesión actual o null (para el header y páginas públicas).
export async function getSesion(): Promise<Sesion | null> {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  return {
    userId,
    email,
    nombre: user?.firstName ?? user?.username ?? null,
    rol: esAdminEmail(email) ? "admin" : "usuario",
  };
}

// Páginas y routes de /app: exige login (redirige a /entrar).
export async function requireUser(): Promise<Sesion> {
  const sesion = await getSesion();
  if (!sesion) redirect("/entrar");
  return sesion;
}

// Páginas y routes de /admin: exige login + rol admin (si no, manda a /app).
export async function requireAdmin(): Promise<Sesion> {
  const sesion = await requireUser();
  if (sesion.rol !== "admin") redirect("/app");
  return sesion;
}

// Para route handlers (devuelven 401/403 en vez de redirigir).
export async function sesionApi(): Promise<Sesion | Response> {
  const sesion = await getSesion();
  if (!sesion) return Response.json({ error: "Necesitás iniciar sesión." }, { status: 401 });
  return sesion;
}

export async function sesionAdminApi(): Promise<Sesion | Response> {
  const s = await sesionApi();
  if (s instanceof Response) return s;
  if (s.rol !== "admin") return Response.json({ error: "Solo administradores." }, { status: 403 });
  return s;
}
