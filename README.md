# 💌 Nuestra Historia

**Regalo digital de aniversario — WhatsApp Chat Analyzer**

Convierte el `.txt` exportado de un chat de WhatsApp de pareja en una experiencia visual romántica y personalizada. No es un dashboard de estadísticas: es una **carta de amor narrada con datos**.

## ¿Cómo funciona?

1. **Él** abre `index.html`, sube el chat exportado, completa nombres, fecha de inicio y escribe una carta personal.
2. El chat se analiza **100% en el navegador** (nunca se sube a ningún servidor). Solo las estadísticas agregadas se guardan en Supabase.
   - **Modo IA (recomendado para máxima precisión):** procesa el `.txt` con Claude/ChatGPT usando el prompt de `PROMPT_IA_ANALISIS.md` y sube el `.json` resultante en el mismo formulario — se detecta automáticamente y se usan esos datos exactos.
3. Se genera un **link único** (ej: `historia.html?t=luis-ana-0214-a3f2`).
4. **Ella** abre el link y descubre su historia: un sobre que se abre, 10 capítulos narrativos con animaciones, la carta de él y un contador en vivo del tiempo juntos.

## Vista rápida

- `index.html` → wizard de 4 pasos para crear el regalo
- `historia.html` → la experiencia de ella (scroll narrativo con animaciones)
- `historia.html?demo=1` → historia de ejemplo sin necesidad de configurar nada

## Requisitos

- Cualquier navegador moderno (Chrome, Edge, Firefox, Safari). Sin instalación.
- Cuenta gratuita de [Supabase](https://supabase.com) (solo para links compartibles).
- GitHub Pages (o cualquier hosting estático) para publicar.

> Sin Supabase configurado, el sistema funciona en **modo demo**: el link solo abre en el mismo dispositivo (localStorage).

## Estructura

```
nuestra-historia/
├── index.html               # Formulario del creador (wizard 4 pasos)
├── historia.html            # Experiencia de ella
├── assets/
│   ├── css/                 # styles, romantico, components, animaciones, responsive
│   ├── js/                  # config, supabase-*, parser, analizador, narrativa, ui-*, contador, utils
│   ├── images/              # logo corazón, sobre animado, favicons, og-image
│   └── sql/                 # schema.sql + rls-policies.sql
├── site.webmanifest
├── README.md · SETUP.md · ARCHITECTURE.md
└── .env.example
```

## Privacidad 🔒

- El archivo `.txt` **nunca** sale del dispositivo: parser y análisis corren en el navegador.
- A Supabase solo viaja el JSON de estadísticas (números + 3 extractos mínimos: primer mensaje, primera expresión de amor, mensaje más largo).
- Los tokens de acceso son impredecibles y las historias expiran en 1 año.

## Tecnologías

HTML5 · CSS3 (variables, grid, conic-gradient) · JavaScript vanilla ES Modules · Supabase (PostgreSQL + RLS) · GitHub Pages

## Uso en 3 pasos

1. Sigue [SETUP.md](SETUP.md) para configurar Supabase y publicar.
2. Abre el sitio, crea el regalo y copia el link.
3. Envíaselo. 💝

---
Creado por Luis (zatvox) · Licencia MIT
