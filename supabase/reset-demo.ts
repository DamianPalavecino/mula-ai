/**
 * Deja la red como recién sembrada, para ensayar y grabar la demo.
 *
 *   npm run reset-demo            # borra lo que dejaron los ensayos (fuente 'whatsapp' y 'victima')
 *   npm run reset-demo -- --dry   # solo muestra qué borraría
 *
 * Cada ensayo suma un reporte real a juli.martinez.mp (23 → 24 → 25…). Esto lo vuelve a 23, así en la
 * toma buena la alerta dice "24 reportes en 5 provincias". Las alertas y los vínculos se van por
 * cascade; las entidades que quedan sin reportes se borran. No toca lo sintético (para eso, `npm run seed`).
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
const DRY = process.argv.includes('--dry')
const FUENTES = ['whatsapp', 'victima']

function fallar(paso: string, error: { message: string } | null) {
  if (error) {
    console.error(`${paso}: ${error.message}`)
    process.exit(1)
  }
}

async function ids(tabla: string, col: string): Promise<number[]> {
  const out: number[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await sb.from(tabla).select(col).range(desde, desde + 999)
    fallar(`leer ${tabla}`, error)
    out.push(...(data as unknown as Record<string, number>[]).map((r) => r[col]))
    if (!data || data.length < 1000) return out
  }
}

async function main() {
  console.log(`Supabase: ${SUPABASE_URL}${DRY ? '  (dry run)' : ''}`)

  const { data: reps, error } = await sb.from('reportes').select('id, fuente, created_at').in('fuente', FUENTES)
  fallar('leer reportes', error)
  console.log(`Reportes de ensayo (${FUENTES.join(', ')}): ${reps!.length}`)

  if (!DRY && reps!.length) {
    const { error: e } = await sb.from('reportes').delete().in('fuente', FUENTES)
    fallar('borrar reportes', e)
  }

  const usadas = new Set(await ids('reporte_entidad', 'entidad_id'))
  const huerfanas = (await ids('entidades', 'id')).filter((id) => !usadas.has(id))
  console.log(`Entidades sin reportes: ${huerfanas.length}`)
  if (!DRY) {
    for (let i = 0; i < huerfanas.length; i += 200) {
      const { error: e } = await sb.from('entidades').delete().in('id', huerfanas.slice(i, i + 200))
      fallar('borrar entidades', e)
    }
  }

  const { data: juli, error: e2 } = await sb.rpc('resumen_entidad', { valor: 'juli.martinez.mp' })
  fallar('resumen_entidad', e2)
  console.log(`juli.martinez.mp: ${juli.reportes} reportes · ${juli.provincias.length} provincias`)
  if (!DRY && (juli.reportes !== 23 || juli.provincias.length !== 5)) {
    console.error('Ojo: debería dar 23 en 5. Corré `npm run seed`.')
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
