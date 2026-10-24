import { Suspense } from "react";
import { redirect } from "next/navigation";

async function Redirigir({ searchParams }: { searchParams: Promise<{ valor?: string | string[] }> }) {
  const sp = await searchParams;
  const valor = Array.isArray(sp.valor) ? sp.valor[0] : sp.valor;
  redirect(valor ? `/app/verificar?valor=${encodeURIComponent(valor)}` : "/app/verificar");
  return null;
}

export default function VerificarPublica({
  searchParams,
}: {
  searchParams: Promise<{ valor?: string | string[] }>;
}) {
  return (
    <Suspense>
      <Redirigir searchParams={searchParams} />
    </Suspense>
  );
}
