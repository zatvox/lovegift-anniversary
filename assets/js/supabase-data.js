/* ============================================
   NUESTRA HISTORIA — supabase-data.js
   Capa de datos: guardar y cargar análisis.
   PRIVACIDAD: solo se guarda el JSON de estadísticas
   (números + extractos mínimos) — nunca el chat completo.
   Incluye fallback a localStorage para modo demo sin Supabase.
   ============================================ */

import { obtenerCliente } from './supabase-client.js?v=2026070902';
import { CONFIG } from './config.js?v=2026070902';

const PREFIJO_LOCAL = 'nuestra-historia:';

/**
 * Guarda un análisis y devuelve el token de acceso.
 * @param {object} registro  { token_acceso, nombre_el, nombre_ella, fecha_inicio,
 *                             stats_json, mensaje_personal, datos_extra, tono }
 * @returns {Promise<{ token: string, modo: 'supabase'|'local' }>}
 */
export async function guardarAnalisis(registro) {
  const supabase = await obtenerCliente();

  if (supabase) {
    const { error } = await supabase
      .from(CONFIG.TABLA_ANALISIS)
      .insert({
        token_acceso: registro.token_acceso,
        nombre_el: registro.nombre_el,
        nombre_ella: registro.nombre_ella,
        fecha_inicio: registro.fecha_inicio,
        stats_json: registro.stats_json,
        mensaje_personal: registro.mensaje_personal ?? null,
        datos_extra: registro.datos_extra ?? {},
        tono: registro.tono ?? 'romantico',
      });

    if (error) {
      console.error('[supabase-data] Error al guardar:', error.message);
      throw new Error('No se pudo guardar la historia. Revisa tu conexión e intenta de nuevo.');
    }
    return { token: registro.token_acceso, modo: 'supabase' };
  }

  // Modo demo: localStorage (solo funciona en este dispositivo)
  localStorage.setItem(
    PREFIJO_LOCAL + registro.token_acceso,
    JSON.stringify(registro),
  );
  return { token: registro.token_acceso, modo: 'local' };
}

/**
 * Carga un análisis por token.
 * @param {string} token
 * @returns {Promise<object|null>} el registro, o null si no existe
 */
export async function cargarAnalisis(token) {
  if (!token) return null;
  const supabase = await obtenerCliente();

  if (supabase) {
    const { data, error } = await supabase
      .from(CONFIG.TABLA_ANALISIS)
      .select('*')
      .eq('token_acceso', token)
      .maybeSingle();

    if (error) {
      console.error('[supabase-data] Error al cargar:', error.message);
      return null;
    }
    if (data) incrementarVistas(supabase, token, data.vistas ?? 0);
    return data;
  }

  // Modo demo
  const local = localStorage.getItem(PREFIJO_LOCAL + token);
  return local ? JSON.parse(local) : null;
}

/** Incrementa el contador de vistas (best effort, no bloquea) */
async function incrementarVistas(supabase, token, vistasActuales) {
  try {
    await supabase
      .from(CONFIG.TABLA_ANALISIS)
      .update({ vistas: vistasActuales + 1 })
      .eq('token_acceso', token);
  } catch {
    /* silencioso: las vistas no son críticas */
  }
}

/** Construye la URL compartible de la historia */
export function construirLinkHistoria(token) {
  const base = CONFIG.URL_BASE
    ?? `${location.origin}${location.pathname.replace(/index\.html$/, '').replace(/\/$/, '')}`;
  return `${base}/historia.html?t=${encodeURIComponent(token)}`;
}
