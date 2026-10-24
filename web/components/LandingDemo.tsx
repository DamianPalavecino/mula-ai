"use client";

import { useState } from "react";
import Link from "next/link";
import { GUIONES_DEMO } from "@/lib/demo";
import { demoLanding } from "@/lib/demo";
import { IconoChat, IconoEscudo, IconoFlecha, IconoOk } from "@/components/iconos";
import LandingChat from "./LandingChat";
import styles from "./Landing.styles";

export default function LandingDemo() {
  const [id, setId] = useState("familiar");
  const vista = demoLanding(id);
  return (
    <section className={styles.hero} aria-labelledby="landing-title">
      <div className={`${styles.container} ${styles.heroGrid}`}>
        <div className={styles.heroCopy}>
          <h1 id="landing-title">Antes de que<br />salga la plata.</h1>
          <p>Tu guardián de WhatsApp. Una alerta, toda tu familia.</p>
          <div className={styles.actions}>
            <Link className={styles.primary} href="/registro">Proteger a mi familia <IconoFlecha /></Link>
            <a className={styles.textLink} href="#como-funciona">Cómo te cuida <IconoChat /></a>
          </div>
        </div>
        <div className={styles.chatStage} id="demo" data-slot="landing-demo">
          <div className={styles.stageHeading}><span><IconoEscudo /> Así te cuida Mula</span><span>Demo</span></div>
          <LandingChat vista={vista} />
          <div className={styles.notification} role="status">
            {vista.avisar ? <IconoChat /> : <IconoOk />}
            <div><strong>{vista.avisar ? "Tu familia también se entera." : "Una charla normal sigue su curso."}</strong><span>{vista.avisar ? "El mismo aviso, en su WhatsApp." : "En este ejemplo no se manda ninguna alerta."}</span></div>
            <IconoOk />
          </div>
        </div>
      </div>
      <div className={`${styles.container} ${styles.demoControls}`}>
        <div className={styles.scenarios} role="group" aria-label="Elegí un guion de demostración">
          {GUIONES_DEMO.map((g) => <button className={styles.scenario} key={g.id} type="button" aria-pressed={id === g.id} onClick={() => setId(g.id)}>{g.etiqueta}</button>)}
        </div>
        <p>Demo con resultados precalculados. La detección real corre en el servidor.</p>
      </div>
    </section>
  );
}
