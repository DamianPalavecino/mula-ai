import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextMiddleware } from "next/server";
import { clerkActivo } from "@/lib/clerk";
import { esPublicaSoloSinSesion } from "@/lib/rutas";

// Next 16: el middleware se llama proxy.ts. Protege /app/* y /admin/* (el rol admin se chequea
// en lib/auth.ts con ADMIN_EMAILS). Todo lo demás (landing, /entrar) es público.
// Con sesión, landing/entrar/registro mandan directo al panel.
// Sin keys de Clerk: passthrough (las páginas privadas igual redirigen con requireUser()).
const esPrivada = createRouteMatcher(["/app(.*)", "/admin(.*)"]);

const proxy: NextMiddleware = clerkActivo
  ? clerkMiddleware(async (auth, req) => {
      if (esPrivada(req)) {
        await auth.protect();
        return;
      }
      if (esPublicaSoloSinSesion(req.nextUrl.pathname) && (await auth()).userId) {
        return NextResponse.redirect(new URL("/app", req.url));
      }
    })
  : () => NextResponse.next();

export default proxy;

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
