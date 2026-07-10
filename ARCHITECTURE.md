# 🏗️ ARCHITECTURE — Nuestra Historia

## Flujo de datos

```
 ACTO 1: ÉL (index.html)                          ACTO 2: ELLA (historia.html)
┌─────────────────────────────┐                  ┌──────────────────────────────┐
│ 1. Sube chat .txt           │                  │ 1. Abre link ?t=TOKEN        │
│    (FileReader, local)      │                  │ 2. supabase-data.js          │
│ 2. parser.js  ──────────┐   │                  │    SELECT por token          │
│ 3. analizador.js        │   │   stats_json     │ 3. narrativa.js              │
│ 4. narrativa preview    │   │   (SOLO números) │    (frases con nombres)      │
│ 5. supabase-data.js ────┼───┼──── INSERT ────► │ 4. ui-historia.js            │
│    token → link único   │   │    Supabase      │    render 10 secciones       │
└─────────────────────────┘   │    PostgreSQL    │ 5. contador-tiempo.js (vivo) │
     el .txt NUNCA sale ──────┘    + RLS         └──────────────────────────────┘
     del navegador
```

## Patrón de capas (Three-Layer)

| Capa | Archivos | Responsabilidad |
|---|---|---|
| **UI** | `ui-formulario.js`, `ui-historia.js` | DOM, eventos, render, wizard, animaciones |
| **Datos** | `supabase-data.js` | Queries/mutations, fallback localStorage, manejo de errores |
| **Cliente** | `supabase-client.js`, `config.js` | Singleton Supabase, carga lazy desde CDN |
| **Dominio** (pura, testeable) | `parser.js`, `analizador.js`, `narrativa.js`, `utils.js`, `contador-tiempo.js` | Sin dependencia del DOM ni de Supabase |

Los módulos de dominio son funciones puras → se testean en Node sin navegador.

## El parser y sus edge cases

Auto-detección de formato probando las primeras líneas contra 2 regex:

1. **Con corchetes** `[16/02/2024, 9:43:05 a. m.] Luis: Hola` (Android/iOS moderno)
2. **Con guión** `16/2/24, 9:43 a. m. — Luis: Hola` (iOS clásico, guión largo/corto/medio)

Casos manejados:

- **Multilínea**: líneas sin timestamp se acumulan al mensaje anterior.
- **DD/MM vs MM/DD**: se detecta globalmente (si el 1er campo supera 12 → DD/MM); default latino.
- **a. m./p. m. en español e inglés**, con o sin segundos, años de 2 o 4 dígitos.
- **Caracteres invisibles** de WhatsApp (LRM/RLM/BOM/NBSP) → se limpian antes de parsear.
- **Mensajes de sistema** (cifrado, llamadas perdidas, eliminados) → se descartan.
- **Multimedia** (`<Multimedia omitido>`, stickers, audios...) → cuentan como mensaje pero no como texto.
- **Emojis en nombres** ("Ana María 💕") → se normalizan para el match.
- **Números de teléfono como autor** → se asignan al participante por descarte.
- **Chats de grupo** → solo se conservan los 2 participantes identificados.
- **Clamping de timestamps** (patrón wacrawl): fechas fuera de `[inicio_relación − 1 año, hoy + 1 día]` se descartan como sentinels inválidos.

## Modelo de privacidad (local-first)

1. El `.txt` se lee con `FileReader` y vive solo en memoria del navegador.
2. `analizador.js` produce un JSON de **estadísticas agregadas**. Únicos extractos de texto: primer mensaje, primera expresión de amor y mensaje más largo (recortados).
3. Solo ese JSON viaja a Supabase. No hay tabla de mensajes.
4. XSS: todo contenido dinámico pasa por `escaparHTML()` antes de insertarse en el DOM.

## Base de datos y tokens

**Tabla única** `analisis_parejas` (ver `assets/sql/schema.sql`): token único, nombres, fecha de inicio, `stats_json` (JSONB), carta personal, extras, tono, vistas y expiración a 1 año.

**RLS** (`rls-policies.sql`): SELECT público filtrado por expiración (la seguridad real está en la impredecibilidad del token: `luis-ana-0214-a3f2` → 36⁴ sufijos aleatorios), INSERT libre (sin login), UPDATE solo para vistas, DELETE sin política (bloqueado).

**Token**: `{4 letras él}-{4 letras ella}-{MMDD}-{4 chars aleatorios}` — legible, memorable y no enumerable.

## Decisiones técnicas

- **Sin bundler ni framework**: ES Modules nativos → deploy directo a GitHub Pages, cero build.
- **Supabase por CDN con import lazy**: la librería solo se descarga si hay credenciales configuradas; sin ellas el sistema degrada a localStorage (modo demo).
- **Charts en CSS puro** (conic-gradient para donut, flexbox para barras) → sin dependencias, rápido y con la estética del sitio.
- **PDF vía `window.print()`** + hoja `@media print` → cero librerías, funciona en todo navegador.
- **Confeti y música con Canvas/Web Audio API nativos**, respetando `prefers-reduced-motion` y mute por defecto.
- **Accesibilidad**: HTML semántico, ARIA en wizard/charts/toasts, focus visible, contraste AA.
