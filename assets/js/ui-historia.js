/* ============================================
   NUESTRA HISTORIA — ui-historia.js
   Renderiza la experiencia de ella: sobre de bienvenida,
   10 secciones narrativas, contadores animados y confeti.
   ============================================ */

import { cargarAnalisis } from './supabase-data.js?v=2026070902';
import { generarNarrativa, filtrarMomentos, emojiTipoMomento } from './narrativa.js?v=2026070902';
import { iniciarContadorVivo } from './contador-tiempo.js?v=2026070902';
import {
  parametroURL, escaparHTML, formatearFecha, formatearNumero,
  formatearHora, animarContador, activarAnimacionesScroll, recortarTexto,
} from './utils.js?v=2026070902';

const $ = (sel) => document.querySelector(sel);

/* ==================================================
   CARGA INICIAL
   ================================================== */

async function init() {
  const token = parametroURL('t');
  const esDemo = parametroURL('demo') === '1';

  let registro = null;
  if (esDemo) {
    registro = registroDemo();
  } else if (token) {
    registro = await cargarAnalisis(token);
  }

  if (!registro) {
    $('#texto-carga').textContent = token
      ? 'No encontramos esta historia. Verifica que el link esté completo. 🥺'
      : 'Este link no es válido. Pídele que te lo envíe de nuevo. 💌';
    return;
  }

  prepararSobre(registro);
}

/* ==================================================
   SOBRE DE BIENVENIDA
   ================================================== */

function prepararSobre(registro) {
  const { nombre_el: el, nombre_ella: ella } = registro;

  $('#overlay-carga').classList.add('oculto');
  $('#overlay-sobre').classList.remove('oculto');
  $('#texto-sobre').textContent = `Para ${ella}, con motivo de su historia juntos 💌`;
  $('#subtexto-sobre').textContent = `${el} creó algo especial para ti`;

  const abrir = () => {
    $('#sobre').classList.add('abriendo');
    setTimeout(() => {
      $('#overlay-sobre').classList.add('cerrando');
      renderizarHistoria(registro);
      $('#historia').classList.remove('oculto');
      $('#btn-sonido').classList.remove('oculto');
      setTimeout(() => $('#overlay-sobre').remove(), 900);
    }, 1000);
  };

  $('#btn-abrir').addEventListener('click', abrir);
  $('#sobre').addEventListener('click', abrir);
}

/* ==================================================
   RENDERIZADO DE SECCIONES
   ================================================== */

function renderizarHistoria(registro) {
  const stats = registro.stats_json;
  const el = registro.nombre_el;
  const ella = registro.nombre_ella;
  const tono = registro.tono ?? 'romantico';
  const extra = registro.datos_extra ?? {};
  stats.fechaInicio = `${registro.fecha_inicio}T00:00:00`;

  const n = generarNarrativa(stats, el, ella, tono, extra);
  const g = stats.general;
  const a = stats.amor;
  const r = stats.ritmo;
  const q = stats.curiosidades;
  const momentos = filtrarMomentos(stats.momentos, tono);
  const fechaInicio = new Date(stats.fechaInicio);

  const e = escaparHTML; // alias corto

  const secciones = [];

  /* --- 1. Portada --- */
  secciones.push(`
    <section class="seccion fondo-gradiente-rosa texto-centro" style="position:relative; min-height:92vh; display:grid; place-items:center;">
      <div class="decoracion-corazones" id="corazones-portada"></div>
      <div class="contenedor" style="position:relative; z-index:1;">
        <p class="etiqueta-seccion">Nuestra historia</p>
        <h1 class="headline">${e(el)} <em>&amp;</em> ${e(ella)}</h1>
        <p class="subheadline mt-2">${e(n.portada.subtitulo)}</p>
        <div class="mt-4">
          <span class="numero-grande" data-contador="${g.diasDesdeInicio}">0</span>
          <p class="subheadline">días juntos</p>
        </div>
        <p class="frase-narrativa mt-3">${e(n.portada.frase)}</p>
      </div>
    </section>`);

  /* --- 2. El comienzo --- */
  if (n.comienzo) {
    secciones.push(`
      <section class="seccion anim-scroll texto-centro">
        <div class="contenedor">
          <p class="etiqueta-seccion">Capítulo uno</p>
          <h2 class="titulo-seccion">El comienzo</h2>
          <p class="frase-narrativa mt-2">${e(n.comienzo.fecha)}</p>
          <div class="card mt-3" style="max-width:480px; margin-inline:auto;">
            <p class="nota">El primer mensaje, de ${e(n.comienzo.autor)}:</p>
            <p class="texto-carta mt-1" style="font-size:1.2rem;">"${e(recortarTexto(n.comienzo.primerTexto, 180))}"</p>
          </div>
          <p class="frase-narrativa mt-3">${e(n.comienzo.frase)}</p>
        </div>
      </section>`);
  }

  /* --- 3. Sus números --- */
  secciones.push(`
    <section class="seccion fondo-crema-profunda anim-scroll texto-centro">
      <div class="contenedor">
        <p class="etiqueta-seccion">Capítulo dos</p>
        <h2 class="titulo-seccion">Sus números</h2>
        <span class="emoji-grande mt-2">💬</span>
        <span class="numero-grande" data-contador="${g.totalMensajes}">0</span>
        <p class="subheadline">mensajes entre los dos</p>
        <p class="frase-narrativa mt-3">${e(n.numeros.frase)}</p>

        <div class="mt-4" style="max-width:520px; margin-inline:auto;">
          <div class="barra-comparativa" role="img" aria-label="${e(el)}: ${g.porPersona.el.porcentaje}%, ${e(ella)}: ${g.porPersona.ella.porcentaje}%">
            <div class="barra-el" style="--porcentaje-final:${g.porPersona.el.porcentaje}%;">${g.porPersona.el.porcentaje}%</div>
            <div class="barra-ella" style="--porcentaje-final:${g.porPersona.ella.porcentaje}%;">${g.porPersona.ella.porcentaje}%</div>
          </div>
          <div class="leyenda-barra"><span>💙 ${e(el)}</span><span>💗 ${e(ella)}</span></div>
        </div>

        <div class="grid-stats mt-4">
          <div class="card-stat"><span class="valor">${formatearNumero(g.promedioMensajesDiario)}</span><span class="etiqueta">mensajes al día</span></div>
          <div class="card-stat"><span class="valor">${formatearNumero(g.diasHablaron)}</span><span class="etiqueta">días conversando</span></div>
          ${g.diaConMasMensajes ? `<div class="card-stat"><span class="valor">${formatearNumero(g.diaConMasMensajes.cantidad)}</span><span class="etiqueta">su récord en un día</span></div>` : ''}
        </div>
        ${n.numeros.diaTop ? `<p class="frase-narrativa mt-3">${e(n.numeros.diaTop)}</p>` : ''}
      </div>
    </section>`);

  /* --- 4. Cuánto se aman --- */
  secciones.push(`
    <section class="seccion anim-scroll texto-centro" style="position:relative;">
      <div class="decoracion-corazones" id="corazones-amor"></div>
      <div class="contenedor" style="position:relative; z-index:1;">
        <p class="etiqueta-seccion">Capítulo tres</p>
        <h2 class="titulo-seccion">Cuánto se aman</h2>
        <span class="numero-grande latido" data-contador="${a.totalExpresionesAmor}">0</span>
        <p class="subheadline">veces se dijeron cosas de amor</p>
        <p class="frase-narrativa mt-3">${e(n.amor.frase)}</p>
        ${n.amor.detalle ? `<p class="frase-narrativa mt-2">${e(n.amor.detalle)}</p>` : ''}

        ${a.totalExpresionesAmor > 0 ? `
        <div class="fila-doble mt-4">
          <div class="donut" style="--pct-el:${a.porPersona.el.porcentaje}%;" role="img"
               aria-label="${e(el)}: ${a.porPersona.el.porcentaje}%, ${e(ella)}: ${a.porPersona.ella.porcentaje}%">
            <span class="centro">💛</span>
          </div>
          <div style="text-align:left; max-width:320px; margin-inline:auto;">
            ${n.amor.primeraVez ? `<p class="mt-2">🌱 ${e(n.amor.primeraVez)}</p>` : ''}
            ${n.amor.frecuencia ? `<p class="mt-2">⏳ ${e(n.amor.frecuencia)}</p>` : ''}
            ${n.amor.mesTop ? `<p class="mt-2">🌙 ${e(n.amor.mesTop)}</p>` : ''}
          </div>
        </div>` : ''}
      </div>
    </section>`);

  /* --- 5. Su ritmo --- */
  const maxHora = Math.max(...r.actividadPorHora, 1);
  const barrasHoras = r.actividadPorHora.map((c, h) => `
    <div class="hora-barra ${h === r.horaPico ? 'pico' : ''}"
         style="height:${Math.max((c / maxHora) * 100, 3)}%"
         title="${formatearHora(h)}: ${formatearNumero(c)} mensajes"></div>`).join('');

  secciones.push(`
    <section class="seccion fondo-lavanda anim-scroll texto-centro">
      <div class="contenedor">
        <p class="etiqueta-seccion">Capítulo cuatro</p>
        <h2 class="titulo-seccion">Su ritmo</h2>
        <span class="emoji-grande mt-2">🔥</span>
        <span class="numero-grande" data-contador="${r.rachaMasLarga}">0</span>
        <p class="subheadline">días seguidos sin dejar de hablarse</p>
        <p class="frase-narrativa mt-2">${e(n.ritmo.racha)}</p>

        <div class="mt-4">
          <p class="nota mb-2">Sus horas de conversación a lo largo del día</p>
          <div class="reloj-actividad">${barrasHoras}</div>
          <div class="etiquetas-reloj"><span>12 am</span><span>6 am</span><span>12 pm</span><span>6 pm</span><span>11 pm</span></div>
          <p class="frase-narrativa mt-2">${e(n.ritmo.horaPico)}</p>
        </div>

        <div class="grid-stats mt-4" style="grid-template-columns:1fr;">
          <div class="card-stat"><span class="etiqueta">📅 ${e(n.ritmo.diaTop)}</span></div>
          <div class="card-stat"><span class="etiqueta">☀️ ${e(n.ritmo.quienPrimero)}</span></div>
          ${n.ritmo.velocidad ? `<div class="card-stat"><span class="etiqueta">⚡ ${e(n.ritmo.velocidad)}</span></div>` : ''}
        </div>
      </div>
    </section>`);

  /* --- 6. Sus palabras --- */
  const palabrasAmor = (a.palabrasMasCarinosas ?? []).slice(0, 5);
  const collage = palabrasAmor.map((p, i) =>
    `<span class="palabra-collage" data-nivel="${i + 1}">${e(p.palabra)} · ${formatearNumero(p.count)}</span>`).join('');

  secciones.push(`
    <section class="seccion anim-scroll texto-centro">
      <div class="contenedor">
        <p class="etiqueta-seccion">Capítulo cinco</p>
        <h2 class="titulo-seccion">Sus palabras</h2>
        ${collage ? `<p class="subheadline mb-3">Lo que más se dicen, en sus propias palabras:</p><div class="collage-palabras">${collage}</div>` : ''}
        ${momentos?.apodos?.length ? `
        <p class="frase-narrativa mt-4">Y los nombres que solo ustedes usan:</p>
        <div class="collage-palabras mt-2">
          ${momentos.apodos.slice(0, 6).map((ap, i) =>
            `<span class="palabra-collage" data-nivel="${Math.min(i + 1, 5)}">"${e(ap.apodo)}"</span>`).join('')}
        </div>` : ''}
        ${extra.apodo ? `<p class="frase-narrativa mt-3">💕 ${e(extra.apodo)}</p>` : ''}

        <div class="fila-doble mt-4">
          ${q.emojiMasUsadoEl ? `
          <div class="card-stat">
            <span class="emoji-grande">${q.emojiMasUsadoEl.emoji}</span>
            <span class="etiqueta">el emoji favorito de ${e(el)} (${formatearNumero(q.emojiMasUsadoEl.count)} veces)</span>
          </div>` : ''}
          ${q.emojiMasUsadoElla ? `
          <div class="card-stat">
            <span class="emoji-grande">${q.emojiMasUsadoElla.emoji}</span>
            <span class="etiqueta">el emoji favorito de ${e(ella)} (${formatearNumero(q.emojiMasUsadoElla.count)} veces)</span>
          </div>` : ''}
        </div>
      </div>
    </section>`);

  /* --- 7. Las tormentas --- */
  secciones.push(`
    <section class="seccion fondo-crema-profunda anim-scroll texto-centro">
      <div class="contenedor">
        <p class="etiqueta-seccion">Capítulo seis</p>
        <h2 class="titulo-seccion">${e(n.tormentas.titulo)}</h2>
        <p class="frase-narrativa mt-3">${e(n.tormentas.frase)}</p>
        ${n.tormentas.reconciliacion ? `<p class="frase-narrativa mt-2">${e(n.tormentas.reconciliacion)}</p>` : ''}
        ${n.tormentas.mesCalma ? `<p class="frase-narrativa mt-2">${e(n.tormentas.mesCalma)}</p>` : ''}
        <span class="emoji-grande mt-3">🌈</span>
      </div>
    </section>`);

  /* --- 8. Momentos curiosos --- */
  secciones.push(`
    <section class="seccion anim-scroll texto-centro">
      <div class="contenedor">
        <p class="etiqueta-seccion">Capítulo siete</p>
        <h2 class="titulo-seccion">Momentos curiosos</h2>
        <div class="grid-stats mt-3" style="grid-template-columns:1fr; max-width:560px; margin-inline:auto;">
          <div class="card-stat"><span class="etiqueta">😏 ${e(n.curiosos.horaPico)}</span></div>
          ${n.curiosos.madrugada ? `<div class="card-stat"><span class="etiqueta">🌙 ${e(n.curiosos.madrugada)}</span></div>` : ''}
          ${n.curiosos.semanaTop ? `<div class="card-stat"><span class="etiqueta">📈 ${e(n.curiosos.semanaTop)}</span></div>` : ''}
        </div>
        ${q.mensajeMasLargo && q.mensajeMasLargo.longitud > 200 ? `
        <div class="card mt-4" style="max-width:560px; margin-inline:auto;">
          <p class="nota">${e(n.curiosos.masLargo ?? 'El mensaje más largo:')}</p>
          <p class="texto-carta mt-2" style="font-size:1.05rem;">"${e(recortarTexto(q.mensajeMasLargo.texto, 260))}"</p>
          <p class="nota mt-1">— ${e(q.mensajeMasLargo.autor)}, ${formatearFecha(new Date(q.mensajeMasLargo.fecha))}</p>
        </div>` : ''}
        ${n.detalles.length ? `
        <div class="marco-dorado mt-4" style="max-width:560px; margin-inline:auto;">
          <div style="padding:24px;">
            ${n.detalles.map((d) => `<p class="frase-narrativa" style="font-size:1.1rem;">${e(d)}</p>`).join('')}
          </div>
        </div>` : ''}
      </div>
    </section>`);

  /* --- 8b. Pequeñas historias que solo ustedes entienden (momentos IA) --- */
  if (momentos && (momentos.anecdotas.length || momentos.salidas.length)) {
    const cardAnecdota = (mo) => `
      <article class="momento-card">
        <span class="momento-emoji" aria-hidden="true">${emojiTipoMomento(mo.tipo)}</span>
        ${mo.fecha ? `<p class="momento-fecha">${formatearFecha(new Date(`${mo.fecha}T12:00:00`))}</p>` : ''}
        <h3 class="momento-titulo">${e(mo.titulo)}</h3>
        <p class="momento-descripcion">${e(mo.descripcion)}</p>
      </article>`;

    const cardSalida = (s) => `
      <article class="momento-card momento-salida">
        <span class="momento-emoji" aria-hidden="true">🥂</span>
        ${s.fecha ? `<p class="momento-fecha">${formatearFecha(new Date(`${s.fecha}T12:00:00`))}</p>` : ''}
        <h3 class="momento-titulo">${e(s.titulo)}</h3>
        ${s.descripcion ? `<p class="momento-descripcion">${e(s.descripcion)}</p>` : ''}
      </article>`;

    secciones.push(`
      <section class="seccion fondo-lavanda anim-scroll">
        <div class="contenedor texto-centro">
          <p class="etiqueta-seccion">Capítulo ocho</p>
          <h2 class="titulo-seccion">Pequeñas historias que solo ustedes entienden</h2>
          ${momentos.primeraCita ? `
          <p class="frase-narrativa mt-3">${momentos.primeraCita.fecha
            ? `El ${formatearFecha(new Date(`${momentos.primeraCita.fecha}T12:00:00`))}: ` : ''}${e(momentos.primeraCita.descripcion)}</p>` : ''}

          <div class="timeline-momentos mt-4">
            ${momentos.anecdotas.map(cardAnecdota).join('')}
            ${momentos.salidas.length ? `
            <p class="etiqueta-seccion" style="margin:16px 0 12px;">Sus salidas</p>
            ${momentos.salidas.map(cardSalida).join('')}` : ''}
          </div>

          ${momentos.cancion ? `
          <p class="frase-narrativa mt-3">🎵 ${momentos.cancion.titulo
            ? `Su canción: ${e(momentos.cancion.titulo)}.` : ''} ${e(momentos.cancion.evidencia ?? '')}</p>` : ''}

          ${momentos.fraseQueLosDefine ? `
          <div class="marco-dorado mt-4" style="max-width:520px; margin-inline:auto;">
            <div style="padding:24px;">
              <p class="texto-carta texto-centro" style="font-size:1.25rem;">"${e(momentos.fraseQueLosDefine)}"</p>
            </div>
          </div>` : ''}
        </div>
      </section>`);
  }

  /* --- 9. La carta --- */
  if (registro.mensaje_personal) {
    secciones.push(`
      <section class="seccion anim-scroll">
        <div class="contenedor">
          <p class="etiqueta-seccion texto-centro" style="display:block; text-align:center;">Capítulo final</p>
          <h2 class="titulo-seccion">${e(el)} quiere decirte algo...</h2>
          <div class="papel-carta mt-4">
            <p class="texto-carta">${e(registro.mensaje_personal)}</p>
            <p class="firma-carta">Con todo mi amor, ${e(el)}</p>
            <p class="nota" style="text-align:right;">${formatearFecha(new Date())}</p>
          </div>
        </div>
      </section>`);
  }

  /* --- 10. Cierre --- */
  secciones.push(`
    <section class="seccion fondo-gradiente-rosa texto-centro" id="seccion-final" style="min-height:80vh; display:grid; place-items:center;">
      <div class="contenedor anim-scroll">
        <p class="etiqueta-seccion">Y la historia continúa...</p>
        <h2 class="titulo-seccion">Llevan juntos</h2>
        <div id="contador-final" class="mt-3"></div>
        <p class="frase-narrativa mt-4">${e(n.cierre.frase)}</p>
        ${extra.cancion ? `<p class="frase-narrativa mt-2">🎵 Su canción: ${e(extra.cancion)}</p>` : ''}
        <div class="mt-4">
          <button class="btn btn-primario" id="btn-pdf">💾 Guardar mi historia</button>
        </div>
        <p class="nota mt-2">Se abrirá el diálogo de impresión: elige "Guardar como PDF"</p>
      </div>
    </section>`);

  $('#historia').innerHTML = secciones.join('');
  document.title = `${el} & ${ella} — Nuestra Historia 💌`;

  /* --- Activar interacciones --- */
  activarAnimacionesScroll('.anim-scroll', (elemento) => {
    // Contadores dentro de la sección visible
    elemento.querySelectorAll('[data-contador]').forEach((c) => {
      animarContador(c, Number(c.dataset.contador));
    });
  });
  // Contadores de la portada (visible de inmediato)
  document.querySelectorAll('section:first-child [data-contador]').forEach((c) => {
    animarContador(c, Number(c.dataset.contador));
  });

  crearCorazonesFlotantes('corazones-portada', 10);
  crearCorazonesFlotantes('corazones-amor', 14);
  iniciarContadorVivo($('#contador-final'), fechaInicio);
  prepararConfeti();
  prepararSonido();

  $('#btn-pdf').addEventListener('click', () => window.print());
}

/* ==================================================
   EFECTOS
   ================================================== */

function crearCorazonesFlotantes(idContenedor, cantidad) {
  const contenedor = document.getElementById(idContenedor);
  if (!contenedor) return;
  const simbolos = ['💗', '💕', '💛', '🌸', '✨'];
  for (let i = 0; i < cantidad; i += 1) {
    const corazon = document.createElement('span');
    corazon.className = 'corazon-flotante';
    corazon.textContent = simbolos[i % simbolos.length];
    corazon.style.left = `${Math.random() * 95}%`;
    corazon.style.animationDelay = `${Math.random() * 7}s`;
    corazon.style.animationDuration = `${5 + Math.random() * 5}s`;
    contenedor.appendChild(corazon);
  }
}

/** Confeti suave al llegar a la sección final (Canvas, respeta reduced-motion) */
function prepararConfeti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = $('#canvas-confeti');
  const observer = new IntersectionObserver((entradas) => {
    if (entradas.some((en) => en.isIntersecting)) {
      observer.disconnect();
      lanzarConfeti(canvas);
    }
  }, { threshold: 0.4 });
  observer.observe($('#seccion-final'));
}

function lanzarConfeti(canvas) {
  canvas.classList.remove('oculto');
  canvas.width = innerWidth;
  canvas.height = innerHeight;
  const ctx = canvas.getContext('2d');
  const colores = ['#E8A0BF', '#C17B8A', '#C9A96E', '#E8D5E8', '#F5EBE0'];

  const particulas = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -20 - Math.random() * canvas.height * 0.5,
    tam: 5 + Math.random() * 7,
    vel: 1.2 + Math.random() * 2.2,
    balanceo: Math.random() * Math.PI * 2,
    color: colores[Math.floor(Math.random() * colores.length)],
    esCorazon: Math.random() < 0.25,
  }));

  const inicio = performance.now();
  const DURACION = 7000;

  const dibujar = (ahora) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const transcurrido = ahora - inicio;
    for (const p of particulas) {
      p.y += p.vel;
      p.x += Math.sin(p.balanceo + p.y / 40) * 0.8;
      ctx.fillStyle = p.color;
      if (p.esCorazon) {
        ctx.font = `${p.tam * 2}px serif`;
        ctx.fillText('💗', p.x, p.y);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.tam / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (transcurrido < DURACION) {
      requestAnimationFrame(dibujar);
    } else {
      canvas.classList.add('oculto');
    }
  };
  requestAnimationFrame(dibujar);
}

/** Música opcional (mute por defecto): melodía generada con Web Audio API */
function prepararSonido() {
  const btn = $('#btn-sonido');
  let audioCtx = null;
  let activo = false;
  let timeouts = [];

  // Melodía tipo caja de música (notas MIDI simplificadas, loop suave)
  const NOTAS = [523, 659, 784, 659, 880, 784, 659, 523, 587, 698, 880, 698, 784, 659, 587, 523];

  const reproducirLoop = () => {
    if (!activo) return;
    NOTAS.forEach((freq, i) => {
      const t = setTimeout(() => {
        if (!activo || !audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.9);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1);
      }, i * 550);
      timeouts.push(t);
    });
    timeouts.push(setTimeout(reproducirLoop, NOTAS.length * 550 + 800));
  };

  btn.addEventListener('click', () => {
    activo = !activo;
    btn.textContent = activo ? '🎵' : '🔇';
    btn.setAttribute('aria-pressed', String(activo));
    btn.setAttribute('aria-label', activo ? 'Silenciar música' : 'Activar música');
    if (activo) {
      audioCtx = audioCtx ?? new (window.AudioContext || window.webkitAudioContext)();
      reproducirLoop();
    } else {
      timeouts.forEach(clearTimeout);
      timeouts = [];
    }
  });
}

/* ==================================================
   DATOS DEMO (historia.html?demo=1)
   ================================================== */

function registroDemo() {
  const hoy = new Date();
  const inicio = new Date(hoy.getFullYear() - 1, hoy.getMonth(), hoy.getDate());
  const iso = inicio.toISOString().slice(0, 10);
  return {
    nombre_el: 'Luis',
    nombre_ella: 'Ana',
    fecha_inicio: iso,
    tono: 'completo',
    mensaje_personal:
      'Ana:\n\nCada mensaje de este año fue un ladrillo más de lo que estamos construyendo. '
      + 'Gracias por cada risa, cada buenos días y cada te amo.\n\nEsto recién empieza.',
    datos_extra: { cancion: 'Perfect — Ed Sheeran', apodo: 'Yo la llamo "mi sol"' },
    stats_json: {
      version: 1,
      fechaInicio: `${iso}T00:00:00`,
      general: {
        totalMensajes: 48213, diasDesdeInicio: 365, diasHablaron: 358, diasSinHablar: 7,
        promedioMensajesDiario: 132.1,
        primerMensaje: { fecha: `${iso}T21:14:00`, autor: 'Luis', esEl: true, texto: 'Hola 😊 soy Luis, el del cumpleaños de Vale' },
        diaConMasMensajes: { fecha: iso, cantidad: 512 },
        porPersona: {
          el: { total: 24851, porcentaje: 52, promedioDiario: 68.1 },
          ella: { total: 23362, porcentaje: 48, promedioDiario: 64 },
        },
      },
      amor: {
        totalExpresionesAmor: 1847,
        porPersona: { el: { total: 1021, porcentaje: 55 }, ella: { total: 826, porcentaje: 45 } },
        primeraExpresion: { fecha: `${iso}T23:58:00`, autor: 'Ana', esEl: false, texto: 'te quiero mucho 🥺' },
        frecuenciaPromedioDias: 0.2,
        mesMasRomantico: `${hoy.getFullYear()}-02`,
        palabrasMasCarinosas: [
          { palabra: 'te amo', count: 892 }, { palabra: 'mi amor', count: 511 },
          { palabra: 'te quiero', count: 342 }, { palabra: 'mi vida', count: 61 },
          { palabra: 'hermosa', count: 41 },
        ],
      },
      ritmo: {
        rachaMasLarga: 214, rachaMasLargaInicio: iso, rachaSinHablar: 3,
        horaPico: 22,
        actividadPorHora: [310, 180, 60, 20, 10, 15, 90, 350, 800, 1200, 1500, 1800, 2200, 1900, 1700, 1800, 2100, 2500, 2900, 3400, 3900, 4300, 4600, 2100],
        diaSemanaTop: 0,
        quienEscribePrimero: 'el', porcentajePrimeroEl: 61, porcentajePrimeroElla: 39,
        velocidadRespuestaEl: 3.2, velocidadRespuestaElla: 5.8,
      },
      conflictos: {
        totalDetectados: 6, tiempoPromedioRecuperacion: 187,
        mesConMenosConflictos: `${hoy.getFullYear()}-04`, mesConMasConflictos: null, conflictos: [],
      },
      curiosidades: {
        mensajesMadrugada: 1204,
        mensajeMasLargo: { autor: 'Luis', esEl: true, longitud: 1847, fecha: `${iso}T02:31:00`, texto: 'No sé ni cómo empezar esto, pero hoy me di cuenta de que nunca le había escrito tanto a nadie, y de que contigo las palabras salen solas. Me gusta cómo te ríes de mis chistes malos, cómo me mandas fotos del cielo cuando está bonito, cómo me preguntas si ya comí...' },
        mensajeMasCorto: { autor: 'Ana', esEl: false, texto: '❤️', fecha: `${iso}T12:00:00`, longitud: 1 },
        emojiMasUsadoEl: { emoji: '😂', count: 3211 },
        emojiMasUsadoElla: { emoji: '🥺', count: 2876 },
        palabrasMasUsadas: [{ palabra: 'amor', count: 4211 }],
        totalEmojis: 18452,
        semanaConMasActividad: { inicio: iso, mensajes: 1893 },
      },
      momentos: {
        anecdotas: [
          { fecha: iso, titulo: 'El temblor y las prioridades', descripcion: 'Durante un temblor fuerte, lo primero que agarraste fue tu celular. En el segundo temblor, recién el anillo. Él nunca te dejó olvidarlo. 😄', tipo: 'gracioso' },
          { fecha: iso, titulo: 'La huella digital', descripcion: 'Un día él te dijo que ya le había puesto tu huella a su celular, "para que entres cuando quieras". Confianza total, sin discursos.', tipo: 'romantico' },
          { fecha: iso, titulo: 'Su código secreto', descripcion: 'Hay una canción que se volvió una amenaza cariñosa entre ustedes. Los demás no entienden nada. Ustedes sí. 😏', tipo: 'complice' },
        ],
        salidas: [
          { fecha: iso, titulo: 'La noche del imitador', descripcion: 'Él dudaba en ir, hasta que vio que también cantaban los favoritos de ella. Fueron, y valió cada minuto.' },
        ],
        apodos: [
          { apodo: 'esposita', quien: 'el', count: 120 },
          { apodo: 'mi sol', quien: 'el', count: 85 },
        ],
        cancion: { titulo: 'Perfect — Ed Sheeran', evidencia: 'Ella escribió "nuestra canción" al dedicársela.' },
        primeraCita: { fecha: iso, descripcion: 'Ella lo sorprendió apareciendo en persona. Caminaron, vieron un show de patinaje y esa noche él le dedicó la primera canción.', confianza: 'alta' },
        fraseQueLosDefine: 'El enojo se me pasa rápido, pero en serio me salvas cuando ando en un caos',
      },
    },
  };
}

document.addEventListener('DOMContentLoaded', init);
