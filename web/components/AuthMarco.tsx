import Link from "next/link";
import { clerkActivo } from "@/lib/clerk";

// Marco común de /entrar y /registro: título corto, widget de Clerk centrado,
// o un aviso si Clerk todavía no está configurado.
export default function AuthMarco({
  titulo,
  bajada,
  children,
}: {
  titulo: string;
  bajada: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-12 sm:py-16">
      <h1 className="text-center text-3xl font-semibold tracking-tight text-tinta">{titulo}</h1>
      <p className="mt-2 max-w-md text-center text-base leading-relaxed text-texto">{bajada}</p>
      <div className="mt-8 flex w-full justify-center">
        {clerkActivo ? (
          children
        ) : (
          <div className="w-full max-w-md rounded-lg border border-linea bg-panel p-5 text-center">
            <p className="text-base font-semibold text-tinta">Login no configurado</p>
            <p className="mt-2 text-sm leading-relaxed text-texto">
              Faltan las keys de Clerk en este entorno. Mientras tanto podés recorrer la demo
              de la página de inicio.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex h-10 items-center justify-center rounded-md border border-linea bg-fondo px-4 text-sm font-medium text-tinta hover:bg-panel"
            >
              Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
