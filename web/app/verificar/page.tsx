import type { Metadata } from "next";
import { Suspense } from "react";
import VerifyForm from "@/components/VerifyForm";

export const metadata: Metadata = {
  title: "Verificar antes de pagar",
  description:
    "Pegá un alias, CBU, CVU o teléfono y fijate si tiene reportes de estafa en la red de Mula AI antes de transferir.",
};

export default function VerificarPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-suave">Antes de pagar</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-tinta sm:text-4xl">
        ¿Esta cuenta tiene reportes?
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-texto">
        Pegá el alias, CBU, CVU o teléfono que te pasaron. Te mostramos si ya fue
        reportado en la red de Mula AI.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="h-28" />}>
          <VerifyForm />
        </Suspense>
      </div>
    </main>
  );
}
