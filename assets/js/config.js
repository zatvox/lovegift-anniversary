/* ============================================
   NUESTRA HISTORIA — config.js
   Configuración de Supabase.
   La ANON_KEY es pública por diseño (protegida por RLS),
   segura para GitHub Pages. NUNCA pongas aquí la service_role key.
   ============================================ */

export const CONFIG = {
  // 👉 Pega aquí los valores de tu proyecto Supabase
  // (Dashboard → Settings → API)
  SUPABASE_URL: 'https://xhhazsciafiurnshtvpk.supabase.co/',        // ej: 'https://abcdefgh.supabase.co'
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaGF6c2NpYWZpdXJuc2h0dnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxOTEyMTgsImV4cCI6MjA5ODc2NzIxOH0.iGM88zyTGsy80LKwNh8rJmXE_z2zxa4JD1QisYD7uII',

  // Nombre de la tabla principal
  TABLA_ANALISIS: 'analisis_parejas',

  // URL base del sitio publicado (para generar el link compartible)
  // Se autodetecta; solo cámbiala si usas dominio propio.
  URL_BASE: null, // ej: 'https://usuario.github.io/nuestra-historia'
};

/** ¿Está configurado Supabase? (permite modo demo local sin backend) */
export function supabaseConfigurado() {
  return CONFIG.SUPABASE_URL.startsWith('https://')
    && CONFIG.SUPABASE_ANON_KEY.length > 20;
}
