import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config.js';
import { dedupe, type Entidad, type TipoEntidadRed } from './entities.js';
import type { ResultadoClasificacion } from './classify.js';

/** Respuesta de `resumen_entidad` (contrato en CLAUDE.md). */
export interface ResumenEntidad {
  entidad_id: number | null;
  tipo: TipoEntidadRed;
  valor_normalizado: string;
  encontrada: boolean;
  reportes: number;
  provincias: string[];
  modalidades: string[];
  ultimo: string | null;
  monto_total: number | null;
}

export interface ReporteRegistrado {
  reporte_id: number;
  entidades: ResumenEntidad[];
}

let sb: SupabaseClient | null = null;
function supabase(): SupabaseClient {
  if (!sb) {
    if (!config.supabaseUrl || !config.supabaseServiceRoleKey)
      throw new Error('Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    sb = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return sb;
}

function confianzaDe(c: ResultadoClasificacion): number {
  // Detección automática del worker: el LLM pesa más que la heurística.
  return c.origen === 'llm' ? 80 : 50;
}

/**
 * Registra el caso en la red (`registrar_reporte`). Incluye el teléfono del remitente como
 * entidad `telefono`. Devuelve el reporte_id y el resumen de cada entidad (conteos ya incluyen
 * este reporte).
 */
export async function registrarReporte(
  c: ResultadoClasificacion,
  { texto, remitente, provincia = config.provinciaDefault }: { texto: string; remitente: string | null; provincia?: string },
): Promise<ReporteRegistrado> {
  const entidades: Entidad[] = dedupe([
    ...c.entidades,
    ...(remitente ? [{ tipo: 'telefono' as const, valor: remitente }] : []),
  ]);
  const payload = {
    fuente: 'whatsapp',
    modalidad: c.modalidad,
    provincia,
    monto: c.monto,
    texto,
    riesgo: c.riesgo,
    confianza: confianzaDe(c),
    senales: c.senales,
    suplanta_a: c.suplanta_a,
    remitente,
    entidades,
  };
  const { data, error } = await supabase().rpc('registrar_reporte', { payload });
  if (error) throw new Error(`registrar_reporte: ${error.message}`);
  const r = data as ReporteRegistrado;
  return { reporte_id: r.reporte_id, entidades: r.entidades ?? [] };
}

export interface AlertaPayload {
  reporte_id: number;
  protegido: string;
  riesgo: number;
  modalidad: string;
  mensaje_persona: string;
  mensaje_familia: string;
  enviada_a: string[];
  entidad_ids: number[];
}

/** Guarda la alerta (`registrar_alerta`); la web la ve por Realtime. */
export async function registrarAlerta(payload: AlertaPayload): Promise<{ alerta_id: number }> {
  const { data, error } = await supabase().rpc('registrar_alerta', { payload });
  if (error) throw new Error(`registrar_alerta: ${error.message}`);
  return data as { alerta_id: number };
}

/** Consulta una entidad en la red sin registrar nada (`resumen_entidad`). */
export async function consultarEntidad(valor: string, tipo: TipoEntidadRed | null = null): Promise<ResumenEntidad> {
  const { data, error } = await supabase().rpc('resumen_entidad', { valor, tipo });
  if (error) throw new Error(`resumen_entidad: ${error.message}`);
  return data as ResumenEntidad;
}

/** Liga la alerta a su protegido (`alertas.protegido_id`; `registrar_alerta` no lo recibe). */
export async function asociarAlerta(alertaId: number, protegidoId: number): Promise<void> {
  const { error } = await supabase().from('alertas').update({ protegido_id: protegidoId }).eq('id', alertaId);
  if (error) throw new Error(`asociar alerta: ${error.message}`);
}

/** Lo que la web cargó en /app/setup para un protegido. */
export interface ProtegidoConfig {
  id: number;
  nombre: string;
  telefono: string | null;
  provincia: string | null;
  contactos_confianza: string[];
  familiares: string[];
}

export async function cargarProtegido(id: number): Promise<ProtegidoConfig | null> {
  const { data, error } = await supabase()
    .from('protegidos')
    .select('id, nombre, telefono, provincia, contactos_confianza, familiares')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`protegidos: ${error.message}`);
  return (data as ProtegidoConfig | null) ?? null;
}
