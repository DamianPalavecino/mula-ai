export default function FaltaConfig() {
  return (
    <div className="rounded-lg border border-linea bg-panel p-4 text-sm text-texto">
      <p className="font-semibold text-tinta">Falta configurar Supabase</p>
      <p className="mt-1">
        Definí <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
        <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> y volvé a
        levantar la web.
      </p>
    </div>
  );
}
