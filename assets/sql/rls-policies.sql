-- ============================================
-- NUESTRA HISTORIA — rls-policies.sql
-- Ejecutar DESPUÉS de schema.sql
-- ============================================

-- Habilitar Row-Level Security
ALTER TABLE analisis_parejas ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- SELECT: cualquiera puede leer (el filtro real
-- se hace en la query con WHERE token_acceso = ?
-- y los tokens son impredecibles).
-- Se excluyen historias expiradas.
-- ─────────────────────────────────────────────
CREATE POLICY "lectura_publica_por_token" ON analisis_parejas
  FOR SELECT
  USING (expires_at IS NULL OR expires_at > now());

-- ─────────────────────────────────────────────
-- INSERT: libre (el creador no necesita login).
-- El CHECK de la tabla limita tamaños de campos.
-- ─────────────────────────────────────────────
CREATE POLICY "insercion_libre" ON analisis_parejas
  FOR INSERT
  WITH CHECK (true);

-- ─────────────────────────────────────────────
-- UPDATE: solo para incrementar vistas.
-- ─────────────────────────────────────────────
CREATE POLICY "update_vistas" ON analisis_parejas
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Nota: sin política de DELETE → nadie puede borrar desde el cliente.
-- Nota producción: considerar rate-limiting con Edge Functions si hay abuso.
