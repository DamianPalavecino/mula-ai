import type { Metadata } from "next";
import Link from "next/link";
import LandingDemo from "@/components/LandingDemo";
import LandingChat from "@/components/LandingChat";
import { IconoChat, IconoEscudo, IconoFlecha, IconoRed } from "@/components/iconos";
import { demoLanding } from "@/lib/demo";
import styles from "@/components/Landing.styles";

export const metadata: Metadata = {
  title: { absolute: "Mula AI — Guardián de WhatsApp contra estafas" },
};

export default function Inicio() {
  return (
    <main className={styles.landing} id="contenido">
      <LandingDemo />

      <section className={`${styles.container} ${styles.familySection}`} id="como-funciona" aria-labelledby="family-title">
        <div className={styles.familyCopy}>
          <h2 id="family-title">El mensaje le llega a una persona.<br />El aviso, a su familia.</h2>
          <p>Mula reconoce el guion de estafa y avisa antes de que salga la plata.</p>
          <ol className={styles.setup}>
            <li><span>1</span><div><strong>Vinculá su WhatsApp</strong><p>Con un QR, como WhatsApp Web. Sin instalar otra app.</p></div></li>
            <li><span>2</span><div><strong>Elegí a quién avisar</strong><p>Sumá familiares y contactos de confianza.</p></div></li>
            <li><span>3</span><div><strong>Mula se queda atento</strong><p>Si aparece una estafa, reciben el aviso.</p></div></li>
          </ol>
        </div>
        <div className={styles.familyExample} data-slot="family-example">
          <div className={styles.chatCaption}><IconoChat /> En el WhatsApp de tu familiar</div>
          <LandingChat vista={demoLanding()} familia />
        </div>
      </section>

      <section className={styles.networkSection} id="la-red" aria-labelledby="network-title">
        <div className={`${styles.container} ${styles.networkGrid}`}>
          <div><h2 id="network-title">La cuenta se repite.<br />La red se acuerda.</h2><p>Distintas personas. El mismo destino para la plata.</p><Link className={styles.outline} href="/entrar">Explorar la red <IconoFlecha /></Link></div>
          <figure className={styles.networkFigure}>
            <div className={styles.networkVisual} role="img" aria-label="Ejemplo ilustrativo: reportes de Santa Fe, Buenos Aires, Córdoba, Mendoza y Entre Ríos conectados al alias juli.martinez.mp">
              <svg className={styles.networkLines} viewBox="0 0 600 420" fill="none" preserveAspectRatio="none" aria-hidden="true">
                <path d="M114 55C114 150 240 100 300 185M468 63C468 150 350 100 300 185M114 294C114 230 230 260 300 185M486 294C486 230 370 260 300 185M300 374V185" />
                <circle cx="114" cy="55" r="5" /><circle cx="468" cy="63" r="5" /><circle cx="114" cy="294" r="5" /><circle cx="486" cy="294" r="5" /><circle cx="300" cy="374" r="5" />
              </svg>
              {[
                ["Santa Fe", "santaFe"], ["Buenos Aires", "buenosAires"], ["Córdoba", "cordoba"], ["Mendoza", "mendoza"], ["Entre Ríos", "entreRios"],
              ].map(([provincia, posicion]) => <div key={provincia} className={`${styles.networkCase} mula-case-${posicion}`}><IconoChat /><span>{provincia}</span></div>)}
              <div className={styles.networkAlias}><span className={styles.networkFlag}>Alias reportado</span><strong>juli.martinez.mp</strong><span className={styles.networkConnection}><IconoRed /> Una cuenta conecta los casos</span></div>
            </div>
            <figcaption>Así se conectan los casos. Ejemplo con datos sintéticos.</figcaption>
          </figure>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerTop}><h2>Que no te agarren<br />en soledad.</h2><Link className={styles.primary} href="/registro">Empezar a cuidar <IconoFlecha /></Link></div>
          <div className={styles.footerBottom}><Link className={styles.footerBrand} href="/"><IconoEscudo /> Mula AI</Link><Link href="/entrar">Ya tengo cuenta</Link><p>Prototipo para la hackatón shippe.ar. Los reportes previos de la red son sintéticos, generados para la demo.</p></div>
        </div>
      </footer>
    </main>
  );
}
