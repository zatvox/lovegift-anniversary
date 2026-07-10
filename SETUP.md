# ⚙️ SETUP — Nuestra Historia

Guía exacta para dejar el sistema funcionando en ~10 minutos.

## 1. Crear el proyecto en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project** (free tier basta).
2. Nombre: `nuestra-historia` · Región: la más cercana · Guarda la contraseña de DB.
3. Espera ~2 minutos a que el proyecto quede listo.

## 2. Crear la tabla y las políticas

1. En el dashboard: **SQL Editor → New query**.
2. Pega el contenido de `assets/sql/schema.sql` → **Run**.
3. Nueva query: pega `assets/sql/rls-policies.sql` → **Run**.
4. Verifica en **Table Editor** que existe `analisis_parejas` con el candado RLS activo.

## 3. Configurar las credenciales

1. Dashboard → **Settings → API**.
2. Copia **Project URL** y **anon public key**.
3. Abre `assets/js/config.js` y reemplaza:

```js
SUPABASE_URL: 'https://TUPROYECTO.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGc...',
```

> La anon key es pública por diseño (RLS la protege). **Nunca** uses la `service_role` key aquí.

## 4. Probar localmente

Los módulos ES requieren un servidor (no funciona con doble-click al archivo):

```bash
# opción 1 (Python)
cd nuestra-historia
python -m http.server 8080

# opción 2 (Node)
npx serve .
```

Abre `http://localhost:8080` → crea una historia de prueba.
También puedes ver el ejemplo sin datos: `http://localhost:8080/historia.html?demo=1`.

## 5. Subir a GitHub Pages

1. Crea un repositorio público llamado `nuestra-historia`.
2. Sube TODO el contenido de esta carpeta a la raíz del repo:

```bash
cd nuestra-historia
git init
git add .
git commit -m "Nuestra Historia v1.0"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/nuestra-historia.git
git push -u origin main
```

3. En GitHub: **Settings → Pages → Source: Deploy from a branch → main / (root) → Save**.
4. Espera 2–5 minutos. Tu sitio queda en:
   `https://TU_USUARIO.github.io/nuestra-historia/`

## 6. Verificación final

- [ ] `index.html` carga sin errores en la consola
- [ ] Subes un `.txt` real → genera link
- [ ] El link abre `historia.html` con la historia completa
- [ ] `historia.html?demo=1` muestra la historia de ejemplo
- [ ] En Supabase → Table Editor aparece la fila creada (solo stats, sin mensajes)

## Problemas comunes

| Problema | Solución |
|---|---|
| "No se pudo guardar la historia" | Revisa URL/anon key en `config.js`; verifica que corriste ambos SQL |
| CORS error | La URL de Supabase debe incluir `https://` y no terminar en `/` |
| Link no funciona en otro celular | Supabase no está configurado (estás en modo demo local) |
| GitHub Pages no actualiza | Ctrl+Shift+R (limpiar caché) y espera 5 min |
| Fuentes no cargan | Requiere internet (Google Fonts); hay fallback a Georgia/system-ui |
