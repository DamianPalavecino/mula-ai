import type { Metadata } from "next";
import Simulador from "@/components/Simulador";

export const metadata: Metadata = {
  title: "Simulador",
  description:
    "Un estafador le escribe a la abuela y Mula AI lo detecta en segundos: la misma IA y la misma red que el guardián de WhatsApp.",
};

export default function SimuladorPage() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-center text-3xl font-semibold tracking-tight text-tinta sm:text-4xl">
        Un estafador le escribe a la abuela
      </h1>
      <p className="mx-auto mt-3 max-w-2xl text-center text-base leading-relaxed text-texto">
        Mandá un mensaje desde el celular de la izquierda. Mula AI lo analiza con la misma IA
        y la misma red que el guardián de WhatsApp, y avisa a la abuela y a su familia.
      </p>
      <div className="mt-8">
        <Simulador />
      </div>
    </main>
  );
}
