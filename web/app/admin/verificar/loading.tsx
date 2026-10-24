// Límite de Suspense para cacheComponents: la página lee la sesión (dato dinámico),
// así que el build prerenderiza este fallback y el contenido se resuelve en el request.
export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 text-sm text-suave sm:px-6">
      Cargando…
    </main>
  );
}
