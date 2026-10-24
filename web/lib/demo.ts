// Demo guiada de la landing: guiones fijos con el resultado PRECALCULADO.
// Cero red y cero LLM desde el browser: la detección real corre en el servidor.
// Sin imports de runtime: se testea con `node --test` (lib/demo.test.ts).

export interface ResultadoDemo {
  es_sospechoso: boolean;
  riesgo: number;
  modalidad: string; // clave del contrato (familiar_numero_nuevo, falso_organismo, otro)
  modalidad_label: string;
  senales: string[];
  red: string | null; // lo que ya sabía la red sobre la cuenta
  alerta_persona: string; // *negrita* estilo WhatsApp
  alerta_familia: string;
}

export interface GuionDemo {
  id: string;
  etiqueta: string;
  remitente: string;
  detalle: string;
  mensajes: string[];
  resultado: ResultadoDemo;
}

export const GUIONES_DEMO: GuionDemo[] = [
  {
    id: "familiar",
    etiqueta: "Familiar con número nuevo",
    remitente: "+54 9 11 3871-2290",
    detalle: "número desconocido",
    mensajes: [
      "hola abu, soy Juli 😊 cambié de número, agendame este",
      "abu choqué el auto y necesito plata urgente para pagar el arreglo, no le digas a mamá",
      "mandame $180.000 a juli.martinez.mp que mañana te lo devuelvo",
    ],
    resultado: {
      es_sospechoso: true,
      riesgo: 94,
      modalidad: "familiar_numero_nuevo",
      modalidad_label: "Familiar con número nuevo",
      senales: [
        "Dice ser familiar desde un número nuevo",
        "Urgencia y pedido de secreto",
        "Pide una transferencia a un alias",
        "El alias ya tiene reportes en la red",
      ],
      red: "El alias juli.martinez.mp tiene 24 reportes en 5 provincias.",
      alerta_persona:
        "Ojo: este mensaje tiene el guion de *familiar con número nuevo*. El alias juli.martinez.mp ya fue reportado 24 veces. *No transfieras* y llamá a Juli a su número de siempre.",
      alerta_familia:
        "⚠️ *Mula AI* — La abuela Marta recibió un posible intento de estafa (riesgo 94/100).\nAlguien que dice ser *Juli* le pide $180.000 al alias *juli.martinez.mp* (24 reportes en 5 provincias).\nLlamala ahora para que no transfiera.",
    },
  },
  {
    id: "anses",
    etiqueta: "Falso ANSES",
    remitente: "+54 9 11 2210-4471",
    detalle: "número desconocido",
    mensajes: [
      "Buenas tardes, le hablamos de ANSES. Tiene un refuerzo de $85.000 pendiente de cobro.",
      "Para liberarlo debe transferir $5.000 de validación al CBU 0000003100012345678901 antes de las 18 hs.",
    ],
    resultado: {
      es_sospechoso: true,
      riesgo: 88,
      modalidad: "falso_organismo",
      modalidad_label: "Falso organismo o banco",
      senales: [
        "Dice ser un organismo (ANSES)",
        "Pide un pago para cobrar un beneficio",
        "Plazo urgente",
        "La cuenta ya tiene reportes en la red",
      ],
      red: "El CVU 0000003100012345678901 tiene 9 reportes en 3 provincias.",
      alerta_persona:
        "Ojo: *ANSES nunca pide plata* para cobrar un beneficio ni escribe por WhatsApp. Esa cuenta ya fue reportada 9 veces. *No transfieras.*",
      alerta_familia:
        "⚠️ *Mula AI* — La abuela Marta recibió un mensaje de un *falso ANSES* (riesgo 88/100).\nLe piden $5.000 de \"validación\" a una cuenta con 9 reportes.\nAvisale que ANSES no cobra por pagar beneficios.",
    },
  },
  {
    id: "normal",
    etiqueta: "Mensaje normal",
    remitente: "Carla (vecina)",
    detalle: "contacto agendado",
    mensajes: ["hola, ¿tenés el número del plomero? se me rompió la canilla 😩"],
    resultado: {
      es_sospechoso: false,
      riesgo: 4,
      modalidad: "otro",
      modalidad_label: "Sin estafa",
      senales: [],
      red: null,
      alerta_persona: "",
      alerta_familia: "",
    },
  },
];
