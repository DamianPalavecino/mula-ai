import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import { Suspense } from "react";
import Header, { HeaderBase } from "@/components/Header";
import { clerkActivo } from "@/lib/clerk";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Mula AI — Guardián de WhatsApp contra estafas",
    template: "%s · Mula AI",
  },
  description:
    "Mula AI detecta guiones de estafa y cuentas mula en WhatsApp, avisa a la persona y a su familia, y suma cada caso a una red compartida.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const pagina = (
    <html
      lang="es-AR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* cacheComponents: el header lee la sesión (dato dinámico) → va en Suspense. */}
        <Suspense fallback={<HeaderBase />}>
          <Header />
        </Suspense>
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
  // Sin keys de Clerk la web anda igual (sin login): no montamos el provider.
  return clerkActivo ? <ClerkProvider localization={esES} afterSignOutUrl="/">{pagina}</ClerkProvider> : pagina;
}
