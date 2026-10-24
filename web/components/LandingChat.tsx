import { IconoChat, IconoEscudo, IconoGuion, IconoOk, IconoPeligro } from "@/components/iconos";
import { partesNegrita } from "@/lib/simulador";
import type { demoLanding } from "@/lib/demo";
import styles from "./Landing.styles";

type Vista = ReturnType<typeof demoLanding>;

function Texto({ texto }: { texto: string }) {
  return partesNegrita(texto).map((p, i) => p.negrita ? <strong key={i}>{p.texto}</strong> : <span key={i}>{p.texto}</span>);
}

export default function LandingChat({ vista, familia = false }: { vista: Vista; familia?: boolean }) {
  return (
    <section className={`${styles.chat} ${familia ? styles.familyChat : ""}`} aria-label={familia ? "Ejemplo del grupo familiar" : "Ejemplo del WhatsApp de Marta"} data-kind="product">
      <div className={styles.chatHeader}>
        <span className={styles.chatAvatar}>{familia ? <IconoChat /> : vista.nombreChat[0]}</span>
        <div><strong>{familia ? "Familia de Marta" : vista.nombreChat}</strong><span>{familia ? "Marta, Lucía, Juli y Mula" : vista.guion.detalle}</span></div>
        <IconoGuion className={styles.chatHeaderIcon} />
      </div>
      <div className={styles.messages}>
        <span className={styles.day}>Hoy</span>
        {familia ? (
          vista.avisoFamilia ? <>
            <div className={styles.bubble}>
              <span className={styles.sender}><IconoEscudo /> Mula AI</span>
              <strong>Ojo con este mensaje.</strong>
              <p>{vista.avisoFamilia}</p>
              <time>14:33</time>
            </div>
            <div className={`${styles.bubble} ${styles.outgoing}`}><p>Ya la llamo. Gracias por avisar.</p><time>14:33 <span aria-label="Leído">✓✓</span></time></div>
          </> : <p className={styles.safeMessage}><IconoOk /> Sin alerta para la familia.</p>
        ) : <>
          {vista.guion.mensajes.map((m, i) => <div className={styles.bubble} key={`${vista.guion.id}-${i}`}><p><Texto texto={m} /></p><time>14:{30 + i}</time></div>)}
          {vista.avisoPersona ? <div className={`${styles.bubble} ${styles.mulaMessage}`}>
            <span className={styles.sender}><IconoEscudo /> Mula AI</span>
            <strong>Frená un segundo, Marta.</strong>
            <p>{vista.avisoPersona}</p>
            <div className={styles.risk}><span><IconoPeligro /> Posible estafa</span><b>{vista.guion.resultado.riesgo}/100</b></div>
          </div> : <p className={styles.safeMessage}><IconoOk /> Sin señales de estafa en este ejemplo.</p>}
        </>}
      </div>
      <div className={styles.composer} aria-hidden="true"><span>+</span><span>Mensaje</span><IconoChat /></div>
    </section>
  );
}
