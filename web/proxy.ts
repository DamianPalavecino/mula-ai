import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextMiddleware } from "next/server";
import { clerkActivo } from "@/lib/clerk";

// Next 16: el middleware se llama proxy.ts. Protege /app/* y /admin/* (el rol admin se chequea
// en lib/auth.ts con ADMIN_EMAILS). Todo lo demás (landing, /entrar) es público.
// Sin keys de Clerk: passthrough (las páginas privadas igual redirigen con requireUser()).
const esPrivada = createRouteMatcher(["/app(.*)", "/admin(.*)"]);

const proxy: NextMiddleware = clerkActivo
  ? clerkMiddleware(async (auth, req) => {
      if (esPrivada(req)) await auth.protect();
    })
  : () => NextResponse.next();

export default proxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
