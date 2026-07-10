-- ============================================
-- NUESTRA HISTORIA — schema.sql
-- Ejecutar en Supabase: SQL Editor → New query → Run
-- ============================================

CREATE TABLE IF NOT EXISTS analisis_parejas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  token_acceso    TEXT NOT NULL UNIQUE,          -- Token del link compartible
  nombre_el       TEXT NOT NULL,
  nombre_ella     TEXT NOT NULL,
  fecha_inicio    DATE NOT NULL,
  fecha_analisis  TIMESTAMPTZ DEFAULT now(),

  -- Resumen estadístico (sin mensajes reales — solo números y extractos mínimos)
  stats_json      JSONB NOT NULL,
  mensaje_personal TEXT,                          -- La carta de él para ella

  -- Datos opcionales del formulario
  datos_extra     JSONB DEFAULT '{}',            -- Apodos, canción, primera cita, etc.
  tono            TEXT DEFAULT 'completo'
                  CHECK (tono IN ('romantico', 'jugueton', 'completo')),

  -- Control
  vistas          INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 year')
);

-- Índice para lookup rápido por token
CREATE INDEX IF NOT EXISTS idx_analisis_token ON analisis_parejas(token_acceso);

-- Validaciones básicas a nivel de datos
ALTER TABLE analisis_parejas
  ADD CONSTRAINT chk_nombres CHECK (
    char_length(nombre_el) BETWEEN 1 AND 60
    AND char_length(nombre_ella) BETWEEN 1 AND 60
  );

ALTER TABLE analisis_parejas
  ADD CONSTRAINT chk_mensaje CHECK (
    mensaje_personal IS NULL OR char_length(mensaje_personal) <= 5000
  );

COMMENT ON TABLE analisis_parejas IS
  'Análisis de chats de pareja. PRIVACIDAD: solo estadísticas agregadas, nunca el chat completo.';
