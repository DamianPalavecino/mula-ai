"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface LinkNav {
  href: string;
  label: string;
  corto?: string; // etiqueta en mobile (< sm)
  soloDesktop?: boolean;
}

function esActivo(pathname: string, href: string): boolean {
  if (href === "/" || href === "/app" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function HeaderNav({ links }: { links: LinkNav[] }) {
  const pathname = usePathname();
  return (
    <nav className="flex min-w-0 items-center gap-0.5 sm:gap-1">
      {links.map((link) => {
        const activo = esActivo(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={activo ? "page" : undefined}
            className={`shrink-0 rounded-md px-1.5 py-1.5 text-sm font-medium sm:px-3 ${
              link.soloDesktop ? "hidden sm:block" : ""
            } ${activo ? "bg-panel text-tinta" : "text-suave hover:text-tinta"}`}
          >
            {link.corto ? (
              <>
                <span className="sm:hidden">{link.corto}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </>
            ) : (
              link.label
            )}
          </Link>
        );
      })}
    </nav>
  );
}
