import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import HeaderNav, { type LinkNav } from "@/components/HeaderNav";
import { getSesion } from "@/lib/auth";
import { clerkActivo } from "@/lib/clerk";

const LINKS_USUARIO: LinkNav[] = [
  { href: "/app", label: "Mi panel", corto: "Panel" },
  { href: "/app/setup", label: "Setup" },
  { href: "/app/verificar", label: "Verificar", soloDesktop: true },
  { href: "/app/me-estafaron", label: "Me estafaron", soloDesktop: true },
];

function Marco({ inicio, children }: { inicio: string; children?: React.ReactNode }) {
  return (
    <header className="border-b border-linea bg-fondo">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href={inicio} className="shrink-0 text-base font-semibold tracking-tight text-tinta">
          Mula AI
        </Link>
        <div className="flex min-w-0 items-center gap-1 sm:gap-2">{children}</div>
      </div>
    </header>
  );
}

// Fallback mientras se resuelve la sesión (Suspense en el layout).
export function HeaderBase() {
  return <Marco inicio="/" />;
}

// Server component: arma los links según sesión y rol. El resaltado del link activo
// (usePathname) vive en HeaderNav (client).
export default async function Header() {
  const sesion = await getSesion();
  const links: LinkNav[] = sesion
    ? [...LINKS_USUARIO, ...(sesion.rol === "admin" ? [{ href: "/admin", label: "Gobierno" }] : [])]
    : [{ href: "/", label: "Inicio" }];

  return (
    <Marco inicio={sesion ? "/app" : "/"}>
      <HeaderNav links={links} />
      {sesion ? (
        clerkActivo && <UserButton />
      ) : (
        <Link
          href="/entrar"
          className="inline-flex h-9 shrink-0 items-center rounded-md bg-tinta px-3.5 text-sm font-medium text-white hover:bg-black"
        >
          Entrar
        </Link>
      )}
    </Marco>
  );
}
