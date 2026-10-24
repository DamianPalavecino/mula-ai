// cacheComponents: las páginas de /app leen la sesión (dato dinámico) → borde de Suspense.
export default function Cargando() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6 sm:py-12">
      <p className="text-sm text-suave">Cargando…</p>
    </main>
  );
}
