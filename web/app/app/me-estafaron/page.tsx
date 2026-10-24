import type { Metadata } from "next";
import MeEstafaronForm from "@/components/MeEstafaronForm";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Me estafaron",
  description:
    "Subí las capturas del chat y del comprobante: Mula AI arma la denuncia y el pedido de bloqueo, y cruza las cuentas con la red de reportes.",
};

export default async function MeEstafaronPage() {
  await requireUser();
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-medium text-suave">Me estafaron</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-tinta sm:text-4xl">
        Ya transferiste. Todavía se puede hacer algo.
      </h1>
      <p className="mt-4 max-w-2xl text-lg leading-relaxed text-texto">
        Subí las capturas del chat y del comprobante. En menos de un minuto te armamos el pedido de
        bloqueo para el banco y la denuncia, y te mostramos si esa cuenta ya estafó a otras personas.
      </p>
      <div className="mt-8">
        <MeEstafaronForm />
      </div>
    </main>
  );
}
