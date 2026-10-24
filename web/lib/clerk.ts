// Clerk se activa solo si hay publishable key. Sin keys, la web compila y la landing
// anda igual (sin login). Se evalúa en módulo: NEXT_PUBLIC_* se inlinea en el build.
export const clerkActivo = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
