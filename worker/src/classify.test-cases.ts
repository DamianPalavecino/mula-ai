/**
 * 10 mensajes de estafa + 10 normales, rioplatenses. `npm run test:classify`.
 * Con ANTHROPIC_API_KEY corre el clasificador real (Claude). Sin key, avisa y corre solo la
 * heurística de fallback para ver cómo se comporta la demo si el LLM se cae.
 */
import { clasificar, clasificarHeuristico, type Modalidad } from './classify.js';
import { config } from './config.js';

interface Caso {
  texto: string;
  estafa: boolean;
  modalidad?: Modalidad;
  historial?: string[];
}

export const CASOS: Caso[] = [
  // ---------- estafas ----------
  {
    texto: 'hola abu, soy Juli, cambié de número. Choqué y necesito plata urgente, mandá a juli.martinez.mp',
    estafa: true,
    modalidad: 'familiar_numero_nuevo',
  },
  {
    texto: 'Ma soy yo, se me rompió el celu y este es mi número nuevo. Agendalo. Me podés hacer una transferencia de $85.000 que tengo que pagar algo hoy y desde mi cuenta no me deja? Te lo devuelvo mañana',
    estafa: true,
    modalidad: 'familiar_numero_nuevo',
  },
  {
    texto: 'Buenas tardes señora, le hablo de la Comisaría 3ra. Su hijo tuvo un accidente con el auto y lo tenemos detenido. Para que no quede preso hay que pagar la fianza ya, el abogado le pasa los datos. No corte ni le avise a nadie',
    estafa: true,
    modalidad: 'accidente_o_comisaria',
  },
  {
    texto: 'ANSES INFORMA: Usted tiene un bono de $70.000 pendiente de cobro. Para acreditarlo debe validar sus datos respondiendo con su CBU y el código de 6 dígitos que le llegará por SMS.',
    estafa: true,
    modalidad: 'falso_organismo',
  },
  {
    texto: 'Hola, te escribimos del Banco Nación. Detectamos un movimiento sospechoso en tu cuenta. Para bloquearlo necesitamos que nos dictes el token de tu home banking ahora mismo.',
    estafa: true,
    modalidad: 'falso_organismo',
  },
  {
    texto: 'FELICITACIONES!! Ganaste una Smart TV 50" en el sorteo aniversario de Coto 🎉 Para el envío abonás $12.500 al alias envios.coto.premios y te llega mañana',
    estafa: true,
    modalidad: 'premio_o_sorteo',
  },
  {
    texto: 'Hola! Te compro la bici de Marketplace. Ya te transferí por Mercado Pago pero te tiene que llegar un mail para liberar el pago, pasame el código que te llega así se acredita',
    estafa: true,
    modalidad: 'falso_comprador',
  },
  {
    texto: 'Hola, la heladera sigue disponible, me quedan 2 a ese precio. Si querés te la guardo con una seña del 50%, transferí al CVU 0000003110001234567898 y te la llevo el sábado',
    estafa: true,
    modalidad: 'falsa_venta',
  },
  {
    texto: 'Invertí desde $50.000 en nuestro fondo cripto y ganás 30% por semana garantizado. Ya somos 4 mil argentinos cobrando. Últimos cupos, escribime y te paso el alias',
    estafa: true,
    modalidad: 'inversion',
  },
  {
    texto: 'tia soy Nico, este es mi nuevo numero. Estoy en un quilombo, me robaron y necesito 150 mil para hoy, porfa no le digas a mamá. Pasame al alias nico.ayuda.ya',
    estafa: true,
    modalidad: 'familiar_numero_nuevo',
  },
  // ---------- normales ----------
  { texto: 'Hola Marta, soy Carla la vecina del 4B. Mañana cortan el agua de 9 a 13, avisale a tu marido', estafa: false },
  { texto: 'che te paso el alias para la vaquita del asado del sábado: asado.amigos.mp, son 8 lucas cada uno', estafa: false },
  { texto: 'Buen día, le confirmo el turno con la Dra. Pérez para el jueves 14 a las 10:30. Por favor traiga la orden y el carnet de la obra social.', estafa: false },
  { texto: 'Hola, soy el plomero, Ricardo. Paso mañana a las 9 por lo del calefón, si le parece bien', estafa: false },
  { texto: 'Abuela feliz cumple!! Te queremos mucho, el domingo vamos todos a comer a tu casa 🎂', estafa: false },
  { texto: 'Señora, de la verdulería: ya le preparé el pedido, son $14.300. Se lo llevo a las 18 y me paga en efectivo cuando llego', estafa: false },
  { texto: 'Hola, vi tu publicación del sillón. ¿Sigue disponible? ¿Puedo pasar a verlo el sábado a la tarde?', estafa: false },
  { texto: 'Recordatorio del club: la cuota de noviembre vence el 10. Se puede pagar en secretaría o por transferencia al alias club.atletico.sur', estafa: false },
  { texto: 'Hola, soy Andrea de la escuela de Tomi. Mañana la salida al museo es a las 8, que traiga vianda y gorrito', estafa: false },
  {
    texto: 'dale, te devuelvo los 20 mil del súper cuando cobro el viernes, ¿te los paso al mismo alias de siempre?',
    estafa: false,
    historial: ['che me prestás 20 mil para el súper? me olvidé la tarjeta', 'sí, ya te los mandé'],
  },
];

function pad(s: string, n: number): string {
  return s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n);
}

async function main(): Promise<void> {
  const usarLlm = !!config.anthropicApiKey;
  if (!usarLlm)
    console.log(
      'ANTHROPIC_API_KEY no está en el entorno: no corro el LLM. Muestro solo la heurística de fallback.\n',
    );
  console.log(`Clasificador: ${usarLlm ? config.classifierModel : 'heurística'}\n`);
  console.log(`${pad('#', 3)} ${pad('esperado', 9)} ${pad('obtenido', 9)} ${pad('ok', 3)} ${pad('riesgo', 6)} ${pad('modalidad', 22)} ${pad('origen', 10)} texto`);

  let aciertos = 0;
  let aciertosModalidad = 0;
  let conModalidad = 0;
  for (const [i, c] of CASOS.entries()) {
    const ctx = { historial: c.historial, remitente: null, protegido: 'la abuela' };
    const r = usarLlm ? await clasificar(c.texto, ctx) : { ...clasificarHeuristico(c.texto, ctx), monto: null };
    const acierto = r.es_sospechoso === c.estafa;
    if (acierto) aciertos++;
    if (c.modalidad) {
      conModalidad++;
      if (r.modalidad === c.modalidad) aciertosModalidad++;
    }
    console.log(
      `${pad(String(i + 1), 3)} ${pad(c.estafa ? 'estafa' : 'normal', 9)} ${pad(r.es_sospechoso ? 'estafa' : 'normal', 9)} ${pad(acierto ? '✓' : '✗', 3)} ${pad(String(r.riesgo), 6)} ${pad(r.modalidad + (c.modalidad && r.modalidad !== c.modalidad ? '*' : ''), 22)} ${pad(r.origen, 10)} ${pad(c.texto, 60)}`,
    );
    if (usarLlm && c.texto.startsWith('hola abu')) {
      console.log(`      suplanta_a=${r.suplanta_a} · entidades=${JSON.stringify(r.entidades)}`);
      console.log(`      persona: ${r.alerta_persona}`);
      console.log(`      familia: ${r.alerta_familia}`);
    }
  }
  console.log(
    `\nAcierto estafa/normal: ${aciertos}/${CASOS.length} (${Math.round((aciertos / CASOS.length) * 100)}%) · ` +
      `modalidad correcta en estafas: ${aciertosModalidad}/${conModalidad}  (* = modalidad distinta a la esperada)`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
