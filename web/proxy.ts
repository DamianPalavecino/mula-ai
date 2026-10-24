import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Next 16: el middleware se llama proxy.ts. Protege /app/* y /admin/* (el rol admin se chequea
// en lib/auth.ts con ADMIN_EMAILS). Todo lo demás (landing, /entrar) es público.
const esPrivada = createRouteMatcher(["/app(.*)", "/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (esPrivada(req)) await auth.protect();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
