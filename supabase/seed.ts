/**
 * Seed sintético de Mula AI.
 *
 *   npm run seed
 *
 * Lee SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY (del entorno o del archivo de entorno de la raíz).
 * Borra SOLO lo sintético (reportes fuente='sintetico', sus alertas y entidades huérfanas) y vuelve a
 * sembrar ~180 reportes de los últimos 90 días llamando a registrar_reporte (ejercita la normalización).
 * Determinístico: misma semilla → mismos datos (las fechas son relativas a "ahora").
 */
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
dotenv.config({ path: resolve(ROOT, '.env'), quiet: true })

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}
const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

// ---------------------------------------------------------------------------
// PRNG determinístico (mulberry32)
// ---------------------------------------------------------------------------
let _s = 20261024 >>> 0
function rnd(): number {
  _s = (_s + 0x6d2b79f5) >>> 0
  let t = _s
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1))
const pick = <T>(a: readonly T[]): T => a[Math.floor(rnd() * a.length)]
const chance = (p: number) => rnd() < p
function weighted<T>(items: readonly (readonly [T, number])[]): T {
  const total = items.reduce((s, [, w]) => s + w, 0)
  let r = rnd() * total
  for (const [v, w] of items) if ((r -= w) < 0) return v
  return items[items.length - 1][0]
}
function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
const digits = (n: number) => Array.from({ length: n }, () => int(0, 9)).join('')

// ---------------------------------------------------------------------------
// CBU / CVU con dígitos verificadores BCRA
// ---------------------------------------------------------------------------
const W1 = [7, 1, 3, 9, 7, 1, 3]
const W2 = [3, 9, 7, 1, 3, 9, 7, 1, 3, 9, 7, 1, 3]
const dv = (d: string, w: number[]) => String((10 - (w.reduce((s, wi, i) => s + wi * Number(d[i]), 0) % 10)) % 10)
function armarCbu(bloque1sinDv: string, cuenta13: string): string {
  return bloque1sinDv + dv(bloque1sinDv, W1) + cuenta13 + dv(cuenta13, W2)
}
function cbuValido(c: string): boolean {
  return /^\d{22}$/.test(c) && dv(c.slice(0, 7), W1) === c[7] && dv(c.slice(8, 21), W2) === c[21]
}
const BANCOS = ['011', '014', '007', '017', '072', '285', '191', '150', '034', '330', '020', '143'] // Nación, Provincia, Galicia, BBVA, Santander, Macro, Credicoop, HSBC, Patagonia, Santa Fe, Bancor, Brubank
const PSPS = ['0003', '0003', '0003', '0007', '0007', '0001'] // Mercado Pago, Ualá, otro PSP
const nuevoCbu = (banco = pick(BANCOS)) => armarCbu(banco + digits(4), digits(13))
const nuevoCvu = (psp = pick(PSPS)) => armarCbu('000' + psp, digits(13))

/** Escribe un CBU/CVU como lo pegaría una persona (a veces con espacios o guiones). */
function cuentaRuidosa(c: string): string {
  return weighted([
    [c, 6],
    [`${c.slice(0, 8)} ${c.slice(8)}`, 2],
    [`${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 15)}-${c.slice(15)}`, 1],
  ] as const)
}

// ---------------------------------------------------------------------------
// Teléfonos: un número canónico (área + local = 10 dígitos) y sus formas ruidosas
// ---------------------------------------------------------------------------
type Tel = { area: string; local: string }
const canonTel = (t: Tel) => t.area + t.local
function telRuidoso(t: Tel): string {
  const { area, local } = t
  const l1 = local.slice(0, local.length - 4)
  const l2 = local.slice(-4)
  return weighted([
    [`+54 9 ${area} ${l1}-${l2}`, 3],
    [`0${area} 15 ${l1} ${l2}`, 2],
    [`549${area}${local}`, 2],
    [`${area} ${local}`, 2],
    [`+549${area}${local}`, 1],
    [`(0${area}) 15-${l1}-${l2}`, 1],
  ] as const)
}
const AREAS = ['11', '11', '11', '11', '341', '351', '261', '381', '221', '223', '343', '387', '376', '362', '379', '2944', '299', '264', '388', '2966']
function nuevoTel(area = pick(AREAS)): Tel {
  return { area, local: String(int(2, 9)) + digits(10 - area.length - 1) }
}

// ---------------------------------------------------------------------------
// Vocabulario
// ---------------------------------------------------------------------------
type Modalidad =
  | 'familiar_numero_nuevo' | 'accidente_o_comisaria' | 'falso_organismo' | 'premio_o_sorteo'
  | 'falso_comprador' | 'falsa_venta' | 'inversion' | 'otro'

const PROVINCIAS = [
  ['Buenos Aires', 38], ['CABA', 14], ['Córdoba', 16], ['Santa Fe', 15], ['Mendoza', 9], ['Tucumán', 7],
  ['Entre Ríos', 6], ['Salta', 6], ['Misiones', 5], ['Chaco', 5], ['Corrientes', 5], ['Santiago del Estero', 4],
  ['San Juan', 4], ['Jujuy', 3], ['Río Negro', 3], ['Neuquén', 3], ['Formosa', 2], ['Chubut', 2],
  ['San Luis', 2], ['Catamarca', 2], ['La Rioja', 1], ['La Pampa', 1], ['Santa Cruz', 1], ['Tierra del Fuego', 1],
] as const

const NOMBRES = ['juan', 'maria', 'lucas', 'sofi', 'martin', 'cami', 'nico', 'flor', 'santi', 'agus', 'mati', 'belen', 'facu', 'romi', 'gonza', 'lu', 'pablo', 'vale', 'diego', 'caro', 'fede', 'meli', 'tomi', 'ana']
const APELLIDOS = ['gomez', 'rodriguez', 'fernandez', 'lopez', 'diaz', 'perez', 'sosa', 'romero', 'alvarez', 'torres', 'ruiz', 'benitez', 'acosta', 'medina', 'herrera', 'suarez', 'aguirre', 'gimenez', 'molina', 'castro']
const SUFIJOS = ['mp', 'uala', 'bna', 'galicia', 'pago', 'cta', 'ok', 'ar', 'bbva', 'macro']
function nuevoAlias(): string {
  const n = pick(NOMBRES), a = pick(APELLIDOS)
  const s = weighted([
    [`${n}.${a}.${pick(SUFIJOS)}`, 5],
    [`${n}.${a}${int(1, 99)}`, 2],
    [`${pick(['mesa', 'sol', 'rio', 'gato', 'luna', 'casa', 'perro', 'vaso', 'flor'])}.${pick(['verde', 'azul', 'libre', 'rojo', 'feliz', 'alto'])}.${pick(['nube', 'pez', 'arbol', 'tren', 'pan'])}`, 2],
    [`${n}${a}.${pick(SUFIJOS)}`, 1],
  ] as const)
  return s.length <= 20 ? s : s.slice(0, 20).replace(/[.-]+$/, '')
}
/** Ruido de tipeo que la normalización tiene que absorber (mayúsculas, espacios, puntuación final). */
function aliasRuidoso(a: string): string {
  return weighted([
    [a, 6],
    [a.split('.').map((p) => p[0].toUpperCase() + p.slice(1)).join('.'), 2],
    [` ${a}.`, 1],
    [a.toUpperCase(), 1],
    [`${a},`, 1],
    [`${a} `, 1],
  ] as const)
}

const MONTOS: Record<Modalidad, [number, number, number]> = {
  // min, max, redondeo (ARS)
  familiar_numero_nuevo: [120_000, 950_000, 5_000],
  accidente_o_comisaria: [300_000, 2_500_000, 50_000],
  falso_organismo: [25_000, 280_000, 1_000],
  premio_o_sorteo: [15_000, 150_000, 500],
  falso_comprador: [60_000, 750_000, 1_000],
  falsa_venta: [40_000, 900_000, 5_000],
  inversion: [200_000, 5_000_000, 50_000],
  otro: [8_000, 250_000, 500],
}
const monto = (m: Modalidad) => {
  const [min, max, r] = MONTOS[m]
  return Math.round((min + rnd() * rnd() * (max - min)) / r) * r
}
const ars = (n: number) => '$' + n.toLocaleString('es-AR')

const SENALES: Record<Modalidad, string[]> = {
  familiar_numero_nuevo: ['numero_nuevo', 'urgencia', 'pedido_transferencia', 'cuenta_de_tercero', 'evita_llamada'],
  accidente_o_comisaria: ['urgencia', 'autoridad_falsa', 'pedido_transferencia', 'presion_emocional', 'secreto'],
  falso_organismo: ['suplantacion_organismo', 'link_o_codigo', 'pedido_datos', 'beneficio_falso'],
  premio_o_sorteo: ['premio_inesperado', 'pago_previo', 'link_o_codigo', 'urgencia'],
  falso_comprador: ['comprobante_falso', 'cajero_o_homebanking', 'urgencia', 'pedido_codigo'],
  falsa_venta: ['precio_bajo', 'sena_anticipada', 'cuenta_de_tercero', 'urgencia'],
  inversion: ['rentabilidad_irreal', 'urgencia', 'cripto', 'testimonios_falsos'],
  otro: ['pago_previo', 'link_o_codigo', 'urgencia'],
}
const SUPLANTA: Record<Modalidad, (string | null)[]> = {
  familiar_numero_nuevo: ['hija', 'hijo', 'sobrina', 'nieto', 'hermano', 'ahijada', 'nieta'],
  accidente_o_comisaria: ['Policía', 'Comisaría', 'abogado', 'Hospital', 'fiscalía'],
  falso_organismo: ['ANSES', 'ARCA (ex AFIP)', 'PAMI', 'Banco Nación'],
  premio_o_sorteo: ['Personal', 'Movistar', 'Mercado Libre', 'Claro', 'Banco Galicia'],
  falso_comprador: [null, 'comprador de Marketplace', 'Mercado Libre'],
  falsa_venta: [null, 'vendedor de Marketplace'],
  inversion: ['asesor financiero', 'broker cripto', null],
  otro: ['Correo Argentino', 'Andreani', 'Aduana', null],
}
const PRODUCTOS = ['la heladera', 'el aire acondicionado', 'la bici', 'el sillón', 'la PS5', 'el celu', 'la mesa', 'las zapatillas', 'el lavarropas']

function texto(m: Modalidad, ctx: { pago?: string; tel?: string; monto?: number | null; quien?: string | null }): string {
  const pago = ctx.pago ?? 'la cuenta que te paso'
  const $ = ctx.monto ? ars(ctx.monto) : 'una plata'
  const quien = ctx.quien ?? ''
  const t: Record<Modalidad, string[]> = {
    familiar_numero_nuevo: [
      `Hola ma, cambié de número, agendame este. Necesito que me transfieras ${$} a ${pago} que es de un amigo, mañana te lo devuelvo`,
      `Tía soy yo, se me rompió el celu y este es mi número nuevo. Me podés pasar ${$} a ${pago}? Es urgente, después te explico`,
      `Hola abu, soy tu ${quien || 'nieto'}, no me llames que no puedo hablar. Pasame ${$} a ${pago} porfa que me quedé sin nada`,
      `Ma, tengo que pagar una deuda hoy sí o sí. Mandame ${$} al alias ${pago}, no le digas nada a papá`,
    ],
    accidente_o_comisaria: [
      `Señora, le hablo de la comisaría. Su ${pick(['hijo', 'hija', 'nieto'])} tuvo un accidente y quedó detenido. Para que salga hoy hay que depositar ${$} a ${pago}`,
      `Habla el abogado de su hijo, chocó a una persona y hay que pagar ${$} para evitar la causa. Transfiera ya a ${pago} y no cuelgue`,
      `Es urgente, su familiar está en la guardia y la obra social no cubre. Necesitamos ${$} a ${pago} antes de las 18`,
    ],
    falso_organismo: [
      `${quien || 'ANSES'}: tenés un bono de ${$} pendiente de cobro. Para acreditarlo comunicate con un operador al ${ctx.tel ?? 'número oficial'} y validá tus datos`,
      `Hola, le escribimos de ${quien || 'ANSES'}. Su beneficio quedó suspendido, para reactivarlo debe abonar ${$} a ${pago}`,
      `${quien || 'ANSES'} informa: tiene un reintegro a favor. Pase el código que le llega por SMS al ${ctx.tel ?? 'operador'} para cobrarlo`,
    ],
    premio_o_sorteo: [
      `Felicitaciones! Ganaste el sorteo de ${quien || 'Personal'}. Para recibir el premio pagá ${$} de envío a ${pago}`,
      `Sos el ganador de un celular de ${quien || 'Movistar'}. Abona ${$} de gastos administrativos al alias ${pago}`,
    ],
    falso_comprador: [
      `Hola, te compro ${pick(PRODUCTOS)} que publicaste. Ya te transferí, mirá el comprobante. Ahora andá al cajero y validá la operación con el código que te paso`,
      `Te pagué de más por error, me devolvés ${$} a ${pago}? Te mando captura del comprobante`,
      `Soy el comprador, Mercado Pago me pide que valides la venta. Pasame el código que te llegó o transferí ${$} a ${pago} y se libera`,
    ],
    falsa_venta: [
      `Vendo ${pick(['iPhone 13', 'una PS5', 'un aire split', 'una moto 110', 'un TV 55"'])} a ${$}, tengo varios interesados. Si me señás el 50% a ${pago} te lo reservo`,
      `El cachorro está listo para entregar, falta la seña de ${$} a ${pago} y te lo mando por micro`,
      `Departamento en alquiler temporario, para reservar la fecha transferí ${$} a ${pago} hoy`,
    ],
    inversion: [
      `Invertí con nosotros y duplicás tu plata en 7 días. Mínimo ${$}, transferí a ${pago} y te sumo al grupo VIP`,
      `Gané ${$} en una semana con este asesor, escribile al ${ctx.tel ?? 'número'} y transferí a ${pago} para arrancar`,
      `Plan de inversión en cripto garantizado, 30% mensual. Depositá ${$} a ${pago}`,
    ],
    otro: [
      `${quien || 'Correo Argentino'}: tu paquete quedó retenido. Pagá ${$} de tasa a ${pago} para liberarlo`,
      `Tenés una multa pendiente, pagala con descuento transfiriendo ${$} a ${pago}`,
    ],
  }
  return pick(t[m])
}

// ---------------------------------------------------------------------------
// Generación
// ---------------------------------------------------------------------------
type Ent = { tipo?: string; valor: string }
type Reporte = {
  fuente: 'sintetico'
  modalidad: Modalidad
  provincia: string
  monto: number | null
  texto: string
  riesgo: number
  confianza: number
  senales: string[]
  suplanta_a: string | null
  remitente: string | null
  created_at: string
  entidades: Ent[]
}

const NOW = Date.now()
const HORA = 3_600_000
const DIA = 24 * HORA
function fecha(maxDias: number, minDias = 0): string {
  const d = int(minDias, maxDias)
  const h = d === 0 ? int(1, 10) : int(0, 23)
  return new Date(NOW - d * DIA - h * HORA - int(0, 59) * 60_000).toISOString()
}

function reporte(
  m: Modalidad,
  provincia: string,
  ents: Ent[],
  opts: { pago?: string; tel?: string; remitente?: string | null; dias?: [number, number]; riesgo?: [number, number] } = {},
): Reporte {
  const mt = chance(0.1) ? null : monto(m)
  const quien = pick(SUPLANTA[m])
  const sen = shuffle([...SENALES[m]]).slice(0, int(2, 3))
  const [rmin, rmax] = opts.riesgo ?? [62, 97]
  const [dmin, dmax] = opts.dias ?? [0, 89]
  return {
    fuente: 'sintetico',
    modalidad: m,
    provincia,
    monto: mt,
    texto: texto(m, { pago: opts.pago, tel: opts.tel, monto: mt, quien }),
    riesgo: int(rmin, rmax),
    confianza: int(58, 96),
    senales: sen,
    suplanta_a: quien,
    remitente: opts.remitente ?? null,
    created_at: fecha(dmax, dmin),
    entidades: ents,
  }
}
const prov = () => weighted(PROVINCIAS)

const reportes: Reporte[] = []

// --- Cluster A: juli.martinez.mp (exactamente 23 reportes, 5 provincias) ---
const JULI = 'juli.martinez.mp'
const T1: Tel = { area: '341', local: '5551234' } // Rosario
const T2: Tel = { area: '11', local: '44445555' } // AMBA
const C1 = armarCbu('0000003', '0012345678901') // CVU Mercado Pago
const provJuli = shuffle([
  ...Array(7).fill('Santa Fe'), ...Array(6).fill('Buenos Aires'), ...Array(4).fill('CABA'),
  ...Array(4).fill('Córdoba'), ...Array(2).fill('Mendoza'),
] as string[])
const modJuli = shuffle([
  ...Array(14).fill('familiar_numero_nuevo'), ...Array(8).fill('accidente_o_comisaria'), 'falsa_venta',
] as Modalidad[])
for (let i = 0; i < 23; i++) {
  const aliasTxt = i < 2 ? JULI : aliasRuidoso(JULI) // los 2 primeros limpios; el resto con ruido
  const tel = chance(0.62) ? T1 : T2
  const telTxt = telRuidoso(tel)
  const ents: Ent[] = [{ tipo: 'alias', valor: aliasTxt }, { tipo: 'telefono', valor: telTxt }]
  if (chance(0.25)) ents.push({ tipo: 'cvu', valor: cuentaRuidosa(C1) })
  reportes.push(
    reporte(modJuli[i], provJuli[i], ents, {
      pago: aliasTxt.trim(), remitente: telTxt, dias: i === 0 ? [0, 0] : [1, 60], riesgo: [82, 98],
    }),
  )
}

// --- Cluster B: falso comprador con CVU de Ualá (comparte T2 y C1 con A) ---
const C2 = armarCbu('0000007', '9087654321012') // CVU Ualá
const T3: Tel = { area: '351', local: '6667788' } // Córdoba
const ALIAS_B = 'lucas.ferreyra.uala'
for (let i = 0; i < 16; i++) {
  const m: Modalidad = i < 13 ? 'falso_comprador' : 'falsa_venta'
  const ents: Ent[] = [{ tipo: 'cvu', valor: cuentaRuidosa(C2) }]
  let rem: string | null = null
  if (i % 2 === 0) { rem = telRuidoso(T3); ents.push({ tipo: 'telefono', valor: rem }) }
  if (i < 7) ents.push({ tipo: 'alias', valor: aliasRuidoso(ALIAS_B) })
  if (i >= 13) { rem = telRuidoso(T2); ents.push({ tipo: 'telefono', valor: rem }) } // puente con A
  if (i === 5 || i === 9) ents.push({ valor: C1 }) // puente con A (tipo lo detecta la base)
  reportes.push(reporte(m, chance(0.45) ? 'Córdoba' : prov(), ents, { pago: i < 7 ? ALIAS_B : C2, remitente: rem, riesgo: [75, 96] }))
}

// --- Cluster C: falso organismo ANSES por teléfono (comparte CBU con D) ---
const T4: Tel = { area: '11', local: '67891234' }
const ALIAS_C = 'anses.bono.tramite'
const B1 = armarCbu('0110599', '4000012345678') // Banco Nación
for (let i = 0; i < 16; i++) {
  const m: Modalidad = i < 14 ? 'falso_organismo' : 'otro'
  const telTxt = telRuidoso(T4)
  const ents: Ent[] = [{ tipo: 'telefono', valor: telTxt }]
  if (i < 9) ents.push({ tipo: 'alias', valor: aliasRuidoso(ALIAS_C) })
  if (i >= 11) ents.push({ tipo: 'cbu', valor: cuentaRuidosa(B1) })
  const r = reporte(m, prov(), ents, { tel: telTxt, pago: i < 9 ? ALIAS_C : B1, remitente: telTxt, riesgo: [78, 97] })
  if (m === 'falso_organismo') {
    r.suplanta_a = 'ANSES'
    r.texto = texto(m, { tel: telTxt, pago: i < 9 ? ALIAS_C : B1, monto: r.monto, quien: 'ANSES' })
  }
  reportes.push(r)
}

// --- Cluster D: inversión (comparte B1 con C y C1 con A) ---
const ALIAS_D = 'rinde.mas.invest'
const T5: Tel = { area: '261', local: '4445566' } // Mendoza
const C3 = nuevoCvu('0003')
for (let i = 0; i < 12; i++) {
  const ents: Ent[] = []
  if (i < 10) ents.push({ tipo: 'alias', valor: aliasRuidoso(ALIAS_D) })
  if (i >= 8) ents.push({ tipo: 'cbu', valor: cuentaRuidosa(B1) })
  let rem: string | null = null
  if (i % 2 === 1) { rem = telRuidoso(T5); ents.push({ tipo: 'telefono', valor: rem }) }
  if (i < 4) ents.push({ tipo: 'cvu', valor: cuentaRuidosa(C3) })
  if (i === 6) ents.push({ tipo: 'cvu', valor: C1 })
  reportes.push(reporte('inversion', chance(0.35) ? 'Mendoza' : prov(), ents, { tel: rem ?? undefined, pago: i < 10 ? ALIAS_D : B1, remitente: rem, riesgo: [70, 95] }))
}

// --- Fondo: casos sueltos, con algo de reutilización para que haya pares/tríos ---
const MOD_FONDO = [
  ['familiar_numero_nuevo', 20], ['accidente_o_comisaria', 8], ['falso_organismo', 12], ['premio_o_sorteo', 12],
  ['falso_comprador', 15], ['falsa_venta', 18], ['inversion', 8], ['otro', 7],
] as const
const pool: { tipo: string; canon: string; ruido: () => string }[] = []
const PROHIBIDOS = new Set([JULI, ALIAS_B, ALIAS_C, ALIAS_D])
function entidadFondo(): { tipo: string; canon: string; ruido: () => string } {
  if (pool.length > 5 && chance(0.12)) return pick(pool)
  const tipo = weighted([['alias', 5], ['cbu', 2], ['cvu', 3], ['telefono', 3]] as const)
  let e: { tipo: string; canon: string; ruido: () => string }
  if (tipo === 'alias') {
    let a = nuevoAlias()
    while (PROHIBIDOS.has(a)) a = nuevoAlias()
    e = { tipo, canon: a, ruido: () => aliasRuidoso(a) }
  } else if (tipo === 'cbu' || tipo === 'cvu') {
    const c = tipo === 'cbu' ? nuevoCbu() : nuevoCvu()
    e = { tipo, canon: c, ruido: () => cuentaRuidosa(c) }
  } else {
    const t = nuevoTel()
    e = { tipo, canon: canonTel(t), ruido: () => telRuidoso(t) }
  }
  pool.push(e)
  return e
}
const TOTAL = 180
while (reportes.length < TOTAL) {
  const m = weighted(MOD_FONDO) as Modalidad
  const n = weighted([[1, 6], [2, 3], [0, 1]] as const)
  const ents: Ent[] = []
  let pago: string | undefined
  let rem: string | null = null
  for (let k = 0; k < n; k++) {
    const e = entidadFondo()
    const v = e.ruido()
    ents.push(chance(0.85) ? { tipo: e.tipo, valor: v } : { valor: v })
    if (e.tipo === 'telefono') rem = v
    else pago ??= v.trim()
  }
  if (!rem && chance(0.5)) rem = telRuidoso(nuevoTel())
  reportes.push(reporte(m, prov(), ents, { pago, remitente: rem }))
}

// ---------------------------------------------------------------------------
// Chequeos locales antes de tocar la base
// ---------------------------------------------------------------------------
for (const c of [C1, C2, C3, B1, ...pool.filter((p) => p.tipo === 'cbu' || p.tipo === 'cvu').map((p) => p.canon)]) {
  if (!cbuValido(c)) throw new Error(`CBU/CVU con verificador inválido: ${c}`)
}
reportes.sort((a, b) => a.created_at.localeCompare(b.created_at))

// ---------------------------------------------------------------------------
// Escritura
// ---------------------------------------------------------------------------
async function rpc<T = any>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await sb.rpc(fn, args)
  if (error) throw new Error(`${fn}: ${error.message}`)
  return data as T
}

async function main() {
  console.log(`Supabase: ${SUPABASE_URL}`)
  const borrado = await rpc('limpiar_sintetico')
  console.log('Borrado sintético previo:', borrado)

  let ok = 0
  const t0 = Date.now()
  const CONC = 6
  for (let i = 0; i < reportes.length; i += CONC) {
    await Promise.all(reportes.slice(i, i + CONC).map((payload) => rpc('registrar_reporte', { payload }).then(() => ok++)))
  }
  console.log(`Insertados ${ok} reportes en ${((Date.now() - t0) / 1000).toFixed(1)}s`)

  const { count: nEnt } = await sb.from('entidades').select('*', { count: 'exact', head: true })
  const { count: nLinks } = await sb.from('reporte_entidad').select('*', { count: 'exact', head: true })
  console.log(`Entidades en la base: ${nEnt} · vínculos reporte↔entidad: ${nLinks}`)

  for (const [v, t] of [[ALIAS_B, 'alias'], [canonTel(T4), 'telefono'], [ALIAS_D, 'alias'], [B1, null]] as const) {
    const r = await rpc('resumen_entidad', { valor: v, tipo: t })
    console.log(`  ${r.tipo.padEnd(8)} ${r.valor_normalizado.padEnd(22)} ${r.reportes} reportes · ${r.provincias.length} provincias`)
  }

  const juli = await rpc('resumen_entidad', { valor: JULI })
  console.log('\nresumen_entidad("juli.martinez.mp"):')
  console.log(JSON.stringify(juli, null, 2))
  if (juli.reportes !== 23 || juli.provincias.length !== 5) {
    console.error('ERROR: juli.martinez.mp debería tener 23 reportes en 5 provincias')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
