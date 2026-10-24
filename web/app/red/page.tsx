import type { Metadata } from "next";
import RedView from "@/components/RedView";

export const metadata: Metadata = {
  title: "La red",
  description:
    "Números y cuentas mula que se repiten entre víctimas, y las alertas de Mula AI en vivo.",
};

export default function RedPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-semibold tracking-tight text-tinta sm:text-4xl">La red</h1>
      <p className="mt-3 max-w-3xl text-base leading-relaxed text-texto">
        Cada punto gris es un reporte; cada punto de color, un número o una cuenta que
        aparece en ellos. Las cuentas grandes se repiten entre muchas víctimas. Tocá una
        para ver su resumen.
      </p>
      <div className="mt-6">
        <RedView />
      </div>
    </main>
  );
}
