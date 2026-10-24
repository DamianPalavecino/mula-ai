import { Suspense } from "react";
import { redirect } from "next/navigation";

// Vieja ruta: todo vive en el panel único de /app.
async function Redirigir({ searchParams }: { searchParams: Promise<{ valor?: string | string[] }> }) {
  const sp = await searchParams;
  const valor = Array.isArray(sp.valor) ? sp.valor[0] : sp.valor;
  redirect(`/app?tab=ajustes${valor ? `&valor=${encodeURIComponent(valor)}` : ""}`);
  return null;
}

export default function Page({ searchParams }: { searchParams: Promise<{ valor?: string | string[] }> }) {
  return (
    <Suspense>
      <Redirigir searchParams={searchParams} />
    </Suspense>
  );
}
