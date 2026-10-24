// Roles puros (sin server-only ni Clerk) para poder testearlos con node --test.
// admin = email primario en ADMIN_EMAILS (server-only, separados por coma).
export type Rol = "admin" | "usuario";

export function esAdminEmail(
  email: string | null | undefined,
  lista: string | undefined = process.env.ADMIN_EMAILS,
): boolean {
  if (!email) return false;
  const admins = (lista ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.trim().toLowerCase());
}

export function rolDe(email: string | null | undefined, lista?: string): Rol {
  return esAdminEmail(email, lista ?? process.env.ADMIN_EMAILS) ? "admin" : "usuario";
}
