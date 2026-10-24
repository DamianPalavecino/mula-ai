import type { Metadata } from "next";
import Link from "next/link";
import Simulador from "@/components/Simulador";

export const metadata: Metadata = {
  title: { absolute: "Mula AI — Guardián de WhatsApp contra estafas" },
};

const QUE_HACE = [
  {
    titulo: "Detecta en vivo",
    texto:
      "Cada mensaje o audio de un desconocido se analiza: guion de estafa, suplantación de un familiar, pedido de plata, alias o CBU.",
  },
  {
    titulo: "Avisa a la familia",
    texto:
      "La alerta llega al WhatsApp de la persona y al grupo familiar. Alguien asustado decide mal; la familia puede verificar.",
  },
  {
    titulo: "Alimenta la red",
    texto:
      "Cada número y cada cuenta mula detectados quedan en una red compartida y protegen a todos los demás.",
  },
  {
    titulo: "Antes de pagar",
    texto:
      "Cualquiera puede pegar un alias, CBU o teléfono y ver si tiene reportes antes de transferir.",
  },
];

const PASOS = [
  {
    titulo: "Vinculá el WhatsApp de la persona",
    texto:
      "Escaneás un código QR desde su teléfono, igual que cuando abrís WhatsApp Web. No hay que instalarle nada.",
  },
  {
    titulo: "Cargá los contactos de confianza y el grupo familiar",
    texto:
      "Los mensajes de la familia no se analizan. Las alertas llegan al grupo que elijas.",
  },
  {
    titulo: "Listo",
    texto:
      "Desde ahí, cada mensaje de un desconocido se analiza en segundos. Si es una estafa, avisa antes de que salga la plata.",
  },
];

const botonPrimario =
  "inline-flex h-11 items-center justify-center rounded-md bg-tinta px-5 text-sm font-medium text-white hover:bg-black";
const botonSecundario =
  "inline-flex h-11 items-center justify-center rounded-md border border-linea px-5 text-sm font-medium text-tinta hover:bg-panel";

export default function Inicio() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24">
        <p className="text-sm font-medium text-suave">Guardián de WhatsApp contra estafas</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-tinta sm:text-5xl">
          Las estafas funcionan porque cada víctima está sola.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-texto">
          Mula AI vigila el WhatsApp de la persona, reconoce el guion de estafa y la
          cuenta mula en el momento en que llegan, y le avisa a ella y a su familia
          antes de que salga la plata.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/verificar" className={botonPrimario}>
            Verificar un alias antes de pagar
          </Link>
          <Link href="/red" className={botonSecundario}>
            Ver la red en vivo
          </Link>
        </div>
        <div className="mt-14">
          <p className="mb-6 text-center text-sm font-medium text-suave">
            Probalo: mandá un mensaje de estafa y mirá qué le llega a la abuela
          </p>
          <Simulador compacto />
        </div>
      </section>

      <section className="border-t border-linea">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-tinta">Qué hace</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUE_HACE.map((item) => (
              <div key={item.titulo} className="rounded-lg border border-linea p-5">
                <h3 className="text-base font-semibold text-tinta">{item.titulo}</h3>
                <p className="mt-2 text-base leading-relaxed text-texto">{item.texto}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-linea bg-panel">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-semibold tracking-tight text-tinta">
            Cómo se configura
          </h2>
          <ol className="mt-8 grid gap-4 lg:grid-cols-3">
            {PASOS.map((paso, i) => (
              <li key={paso.titulo} className="rounded-lg border border-linea bg-fondo p-5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-tinta text-sm font-semibold text-white">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-tinta">{paso.titulo}</h3>
                <p className="mt-2 text-base leading-relaxed text-texto">{paso.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-linea">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-tinta">
              ¿Te pasaron un alias para transferir?
            </h2>
            <p className="mt-2 text-base leading-relaxed text-texto">
              Fijate si alguien ya lo reportó antes de mandar la plata.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/verificar" className={botonPrimario}>
              Verificar ahora
            </Link>
            <Link href="/red" className={botonSecundario}>
              Ver la red
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-linea">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-suave sm:px-6">
          Prototipo para la hackatón shippe.ar. Los reportes previos de la red son
          sintéticos, generados para la demo.
        </p>
      </footer>
    </main>
  );
}
