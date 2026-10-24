"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/simulador", label: "Simulador" },
  { href: "/verificar", label: "Verificar" },
  { href: "/red", label: "Red" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="border-b border-linea bg-fondo">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-base font-semibold tracking-tight text-tinta">
          Mula AI
        </Link>
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const activo = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={activo ? "page" : undefined}
                className={`rounded-md px-2 py-1.5 text-sm font-medium sm:px-3 ${link.href === "/" ? "hidden sm:block" : ""} ${
                  activo ? "bg-panel text-tinta" : "text-suave hover:text-tinta"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
