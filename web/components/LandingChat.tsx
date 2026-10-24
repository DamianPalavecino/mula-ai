import { IconoChat, IconoEscudo, IconoGuion, IconoOk } from "@/components/iconos";
import { partesNegrita } from "@/lib/simulador";
import type { demoLanding } from "@/lib/demo";
import styles from "./Landing.styles";

type Vista = ReturnType<typeof demoLanding>;

function Texto({ texto }: { texto: string }) {
  return partesNegrita(texto).map((p, i) => p.negrita ? <strong key={i}>{p.texto}</strong> : <span key={i}>{p.texto}</span>);
}

export default function LandingChat({ vista, familia = false }: { vista: Vista; familia?: boolean }) {
  return (
    <section className={`${styles.chat} ${familia ? styles.familyChat : ""}`} aria-label={familia ? "Ejemplo del aviso recibido por un familiar" : "Ejemplo del mensaje recibido de un desconocido"} data-kind="product">
      <div className={styles.chatHeader}>
        <span className={styles.chatAvatar}>{familia ? "M" : vista.nombreChat[0]}</span>
        <div><strong>{familia ? "Marta" : vista.nombreChat}</strong><span>{familia ? "En el WhatsApp de Lucía" : vista.guion.detalle}</span></div>
        <IconoGuion className={styles.chatHeaderIcon} />
      </div>
      <div className={styles.messages}>
        <span className={styles.day}>Hoy</span>
        {familia ? (
          vista.avisoFamilia ? <>
            <div className={styles.bubble}>
              <span className={styles.sender}><IconoEscudo /> Mula AI</span>
              <p>{vista.avisoFamilia}</p>
              <time>14:33</time>
            </div>
            <div className={`${styles.bubble} ${styles.outgoing}`}><p>Ya la llamo. Gracias por avisar.</p><time>14:33 <span aria-label="Leído">✓✓</span></time></div>
          </> : <p className={styles.safeMessage}><IconoOk /> Sin alerta para la familia.</p>
        ) : <>
          {vista.guion.mensajes.map((m, i) => <div className={styles.bubble} key={`${vista.guion.id}-${i}`}><p><Texto texto={m} /></p><time>14:{30 + i}</time></div>)}
        </>}
      </div>
      <div className={styles.composer} aria-hidden="true"><span>+</span><span>Mensaje</span><IconoChat /></div>
    </section>
  );
}

export function LandingOwnChat({ vista }: { vista: Vista }) {
  if (!vista.chatAviso) return null;
  return (
    <section className={`${styles.chat} ${styles.ownChat}`} aria-label="Ejemplo del aviso que Mula manda al chat propio" data-kind="product">
      <div className={styles.chatHeader}>
        <span className={styles.chatAvatar}>M</span>
        <div><strong>{vista.chatAviso.nombre}</strong><span>Mensajes a vos misma</span></div>
        <IconoEscudo className={styles.chatHeaderIcon} />
      </div>
      <div className={styles.messages}>
        <div className={`${styles.bubble} ${styles.outgoing}`}>
          <p><strong>Mula AI:</strong> Este mensaje tiene el patrón de una estafa.</p>
          <p>{vista.chatAviso.texto}</p>
          <time>14:33 <span aria-label="Enviado">✓✓</span></time>
        </div>
      </div>
    </section>
  );
}
