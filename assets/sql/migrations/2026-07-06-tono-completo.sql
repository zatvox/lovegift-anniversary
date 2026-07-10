-- ============================================
-- MIGRACIÓN 2026-07-06: nuevo tono 'completo'
-- Ejecutar SOLO si ya creaste la tabla con el schema anterior.
-- (Si es instalación nueva, schema.sql ya lo incluye.)
-- ============================================

ALTER TABLE analisis_parejas
  DROP CONSTRAINT IF EXISTS analisis_parejas_tono_check;

ALTER TABLE analisis_parejas
  ADD CONSTRAINT analisis_parejas_tono_check
  CHECK (tono IN ('romantico', 'jugueton', 'completo'));

ALTER TABLE analisis_parejas
  ALTER COLUMN tono SET DEFAULT 'completo';
