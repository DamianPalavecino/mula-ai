// Carga (o actualiza) el protegido de la demo para un usuario de Clerk y le asigna sus alertas.
//   npm run protegido-demo -- <clerkUserId> [nombre="Abuela Marta"] [telefono]
//   (= node --env-file-if-exists=.env scripts/protegido-demo.mjs …)
// Necesita SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en el entorno, y supabase/auth.sql aplicado.
import { createClient } from '@supabase/supabase-js';

const [owner, nombre = 'Abuela Marta', telefonoRaw] = process.argv.slice(2);
if (!owner) { console.error('uso: protegido-demo <clerkUserId> [nombre] [telefono]'); process.exit(2); }
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY'); process.exit(3); }

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const die = (msg, error) => { console.error(`${msg}: ${error.message}`); process.exit(1); };

let telefono = null;
if (telefonoRaw) {
  const { data, error } = await db.rpc('normalizar', { tipo: 'telefono', valor: telefonoRaw });
  if (error) die('normalizar teléfono', error);
  telefono = data;
}

const fila = { owner, nombre, provincia: 'Santa Fe', familiares: [], contactos_confianza: [], ...(telefonoRaw ? { telefono } : {}) };
const { data: existentes, error: e1 } = await db.from('protegidos').select('id').eq('owner', owner).eq('nombre', nombre).order('id').limit(1);
if (e1) die('buscar protegido', e1);

const q = existentes.length
  ? db.from('protegidos').update(fila).eq('id', existentes[0].id)
  : db.from('protegidos').insert(fila);
const { data: prot, error: e2 } = await q.select().single();
if (e2) die('guardar protegido', e2);

const { data: asignadas, error: e3 } = await db.from('alertas').update({ protegido_id: prot.id })
  .eq('protegido', nombre).is('protegido_id', null).select('id');
if (e3) die('asignar alertas', e3);

console.log(existentes.length ? 'actualizado:' : 'creado:', prot);
console.log(`alertas asignadas a protegido_id=${prot.id}: ${asignadas.length}`);
