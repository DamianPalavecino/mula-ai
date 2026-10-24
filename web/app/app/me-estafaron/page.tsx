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
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-14">
      <p className="inline-flex rounded-full bg-alerta-fondo px-3 py-1 text-sm font-semibold text-alerta">
        Me estafaron
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-tinta sm:text-4xl">
        Todavía se puede frenar la plata.
      </h1>
      <p className="mt-2 text-lg text-texto">Capturas → pedido de bloqueo y denuncia, en 25 segundos.</p>
      <div className="mt-8">
        <MeEstafaronForm />
      </div>
    </main>
  );
}
