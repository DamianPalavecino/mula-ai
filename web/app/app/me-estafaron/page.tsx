import type { Metadata } from "next";
import MeEstafaronPanel from "@/components/MeEstafaronPanel";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Me estafaron",
  description:
    "Subí las capturas del chat y del comprobante: Mula AI arma la denuncia y el pedido de bloqueo, y cruza las cuentas con la red de reportes.",
};

// Ruta propia mientras el dashboard unificado no monte el panel (ver docs/agentes/estado/me-estafaron.md).
export default async function MeEstafaronPage() {
  await requireUser();
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
      <MeEstafaronPanel />
    </main>
  );
}
