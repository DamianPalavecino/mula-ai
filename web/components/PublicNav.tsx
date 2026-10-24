"use client";

import { useId, useRef, useState } from "react";
import Link from "next/link";
import { IconoEscudo, IconoFlecha } from "@/components/iconos";
import "./PublicNav.css";

export default function PublicNav() {
  const [abierto, setAbierto] = useState(false);
  const menuId = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const cerrar = () => setAbierto(false);

  return (
    <header className="mula-publicHeader" onKeyDown={(e) => {
      if (e.key === "Escape" && abierto) { cerrar(); boton.current?.focus(); }
    }}>
      <div className="mula-publicBar">
        <Link className="mula-publicBrand" href="/" aria-label="Mula AI, inicio" onClick={cerrar}>Mula<span>AI</span><IconoEscudo /></Link>
        <nav className="mula-publicLinks" aria-label="Navegación principal"><Link href="/#como-funciona">Cómo funciona</Link><Link href="/#la-red">La red</Link></nav>
        <div className="mula-publicActions"><Link className="mula-publicLogin" href="/entrar">Entrar</Link><Link className="mula-publicSignup" href="/registro">Crear cuenta <IconoFlecha /></Link></div>
        <button ref={boton} className="mula-menuToggle" type="button" aria-label={abierto ? "Cerrar menú de navegación" : "Abrir menú de navegación"} aria-expanded={abierto} aria-controls={menuId} onClick={() => setAbierto(!abierto)}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">{abierto ? <path d="m6 6 12 12M6 18 18 6" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
        </button>
      </div>
      <nav className="mula-mobileNav" id={menuId} hidden={!abierto} aria-label="Navegación móvil"><Link href="/#como-funciona" onClick={cerrar}>Cómo funciona <IconoFlecha /></Link><Link href="/#la-red" onClick={cerrar}>La red compartida <IconoFlecha /></Link><Link className="mula-mobileSignup" href="/registro" onClick={cerrar}>Crear mi cuenta <IconoFlecha /></Link></nav>
    </header>
  );
}
