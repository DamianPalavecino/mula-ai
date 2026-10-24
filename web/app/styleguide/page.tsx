import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Styleguide from "@/components/Styleguide";

// Fuera del flujo de usuario: sin link en la navegación, sin datos reales ni llamadas a la base o al LLM.
export const metadata: Metadata = {
  title: "Styleguide",
  robots: { index: false, follow: false },
};

// Dinámica: ResumenCard muestra fechas relativas (Date.now), que no se pueden prerenderizar.
async function Contenido() {
  await connection();
  return <Styleguide />;
}

export default function StyleguidePage() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  );
}
