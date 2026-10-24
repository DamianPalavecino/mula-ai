import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { clerkActivo } from "./clerk";
import { esAdminEmail, rolDe, type Rol } from "./roles";

// Roles: admin = email primario en ADMIN_EMAILS (server-only, separados por coma).
// Cualquier otro usuario logueado es "usuario" (familiar / persona protegida).
export type { Rol };
export { esAdminEmail };

export interface Sesion {
  userId: string;
  email: string | null;
  nombre: string | null;
  rol: Rol;
}

// Sesión actual o null (para el header y páginas públicas).
// Sin keys de Clerk no hay sesión posible: devolvemos null sin llamar a auth().
export async function getSesion(): Promise<Sesion | null> {
  if (!clerkActivo) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  return {
    userId,
    email,
    nombre: user?.firstName ?? user?.username ?? null,
    rol: rolDe(email),
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
