/* ============================================
   NUESTRA HISTORIA — supabase-client.js
   Singleton del cliente Supabase (CDN ESM).
   ============================================ */

import { CONFIG, supabaseConfigurado } from './config.js';

let cliente = null;

/**
 * Devuelve la instancia única del cliente Supabase.
 * Carga la librería desde CDN solo cuando se necesita (lazy).
 * @returns {Promise<object|null>} null si Supabase no está configurado
 */
export async function obtenerCliente() {
  if (!supabaseConfigurado()) return null;
  if (cliente) return cliente;

  const { createClient } = await import(
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
  );
  cliente = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  return cliente;
}
