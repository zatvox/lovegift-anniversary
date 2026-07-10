/* ============================================
   NUESTRA HISTORIA — ui-formulario.js
   Lógica de index.html: wizard de 4 pasos,
   validación, análisis local y guardado en Supabase.
   ============================================ */

import { parsearChat, validarArchivoChat } from './parser.js';
import { analizarChat } from './analizador.js';
import { extraerJSON, validarStatsImportadas } from './validador-stats.js';
import { MENSAJES_PROGRESO } from './narrativa.js';
import { guardarAnalisis, construirLinkHistoria } from './supabase-data.js';
import { supabaseConfigurado } from './config.js';
import { generarToken, mostrarToast, copiarAlPortapapeles } from './utils.js';

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

/* ---------- Estado ---------- */
const estado = {
  contenidoArchivo: null,   // .txt en bruto (modo local)
  statsImportadas: null,    // JSON validado (modo IA)
  nombreArchivo: null,
  pasoActual: 1,
};

/* ---------- Navegación del wizard ---------- */

function irAPaso(n) {
  estado.pasoActual = n;
  $$('.paso-wizard').forEach((s) => s.classList.remove('activo'));
  $(`#paso-${n}`).classList.add('activo');
  $$('.wizard-punto').forEach((p) => {
    const num = Number(p.dataset.paso);
    p.classList.toggle('activo', num === n);
    p.classList.toggle('completado', num < n);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ---------- Paso 1: tabs de instrucciones ---------- */

function iniciarTabs() {
  $$('.tab-so').forEach((tab) => {
    tab.addEventListener('click', () => {
      $$('.tab-so').forEach((t) => {
        t.classList.remove('activo');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('activo');
      tab.setAttribute('aria-selected', 'true');
      $('#pasos-android').classList.toggle('oculto', tab.dataset.so !== 'android');
      $('#pasos-ios').classList.toggle('oculto', tab.dataset.so !== 'ios');
    });
  });
}

/* ---------- Paso 2: archivo + validación ---------- */

function iniciarZonaDrop() {
  const zona = $('#zona-drop');
  const input = $('#input-archivo');

  const abrir = () => input.click();
  zona.addEventListener('click', abrir);
  zona.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrir(); }
  });

  ['dragover', 'dragenter'].forEach((ev) => zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.add('arrastrando');
  }));
  ['dragleave', 'drop'].forEach((ev) => zona.addEventListener(ev, (e) => {
    e.preventDefault();
    zona.classList.remove('arrastrando');
  }));

  zona.addEventListener('drop', (e) => {
    const archivo = e.dataTransfer?.files?.[0];
    if (archivo) leerArchivo(archivo);
  });
  input.addEventListener('change', () => {
    if (input.files?.[0]) leerArchivo(input.files[0]);
  });
}

function leerArchivo(archivo) {
  const errorEl = $('#error-archivo');
  errorEl.textContent = '';
  $('#zona-drop').parentElement.classList.remove('invalido');

  const nombre = archivo.name.toLowerCase();
  if (!nombre.endsWith('.txt') && !nombre.endsWith('.json')) {
    marcarErrorArchivo('El archivo debe ser .txt (chat exportado) o .json (análisis de IA).');
    return;
  }
  if (archivo.size > 60 * 1024 * 1024) {
    marcarErrorArchivo('El archivo es demasiado grande (máximo 60 MB).');
    return;
  }

  const lector = new FileReader();
  lector.onload = () => {
    const contenido = String(lector.result);

    // 1) ¿Es un JSON de análisis generado por IA? (auto-detección)
    const json = extraerJSON(contenido);
    if (json) {
      const { valido, errores, stats } = validarStatsImportadas(json);
      if (!valido) {
        marcarErrorArchivo(`El JSON no tiene el formato esperado: ${errores[0]} Revisa PROMPT_IA_ANALISIS.md.`);
        return;
      }
      estado.statsImportadas = stats;
      estado.contenidoArchivo = null;
      estado.nombreArchivo = archivo.name;
      $('#zona-drop').classList.add('cargado');
      $('#nombre-archivo').textContent = `✅ ${archivo.name} — análisis de IA validado 🤖`;
      return;
    }

    // 2) Si no es JSON, tratarlo como chat .txt en bruto (análisis local)
    const validacion = validarArchivoChat(contenido);
    if (!validacion.valido) {
      marcarErrorArchivo(validacion.motivo);
      return;
    }
    estado.contenidoArchivo = contenido;
    estado.statsImportadas = null;
    estado.nombreArchivo = archivo.name;
    $('#zona-drop').classList.add('cargado');
    $('#nombre-archivo').textContent = `✅ ${archivo.name} — se analizará aquí mismo 🔒`;
  };
  lector.onerror = () => marcarErrorArchivo('No se pudo leer el archivo. Intenta de nuevo.');
  lector.readAsText(archivo, 'utf-8');
}

function marcarErrorArchivo(mensaje) {
  estado.contenidoArchivo = null;
  estado.statsImportadas = null;
  $('#zona-drop').classList.remove('cargado');
  $('#nombre-archivo').textContent = 'Solo .txt — nunca sale de tu dispositivo';
  const errorEl = $('#error-archivo');
  errorEl.textContent = mensaje;
  errorEl.parentElement.classList.add('invalido');
}

function validarPaso2() {
  let valido = true;

  if (!estado.contenidoArchivo && !estado.statsImportadas) {
    marcarErrorArchivo('Sube el .txt del chat o el .json del análisis de IA para continuar.');
    valido = false;
  }

  for (const id of ['#nombre-el', '#nombre-ella']) {
    const input = $(id);
    const ok = input.value.trim().length >= 2;
    input.closest('.campo').classList.toggle('invalido', !ok);
    if (!ok) valido = false;
  }

  const fecha = $('#fecha-inicio');
  const fechaOk = fecha.value && new Date(fecha.value) <= new Date();
  fecha.closest('.campo').classList.toggle('invalido', !fechaOk);
  if (!fechaOk) valido = false;

  return valido;
}

/* ---------- Paso 3: preview de la carta ---------- */

function iniciarPreviewCarta() {
  const textarea = $('#mensaje-personal');
  textarea.addEventListener('input', () => {
    const texto = textarea.value;
    $('#contador-caracteres').textContent = texto.length;
    $('#preview-carta').textContent = texto || 'Tu mensaje aparecerá aquí...';
    const nombre = $('#nombre-el').value.trim();
    $('#preview-firma').textContent = `Con todo mi amor, ${nombre || '...'}`;
  });
}

/* ---------- Paso 4: análisis + guardado ---------- */

async function generarHistoria() {
  irAPaso(4);
  $('#panel-progreso').classList.remove('oculto');
  $('#panel-resultado').classList.add('oculto');
  $('#panel-error').classList.add('oculto');

  const relleno = $('#relleno-progreso');
  const mensajeEl = $('#mensaje-progreso');
  let indiceMsg = 0;

  const avanzar = (pct) => { relleno.style.width = `${pct}%`; };
  const rotarMensaje = setInterval(() => {
    indiceMsg = (indiceMsg + 1) % MENSAJES_PROGRESO.length;
    mensajeEl.textContent = MENSAJES_PROGRESO[indiceMsg];
  }, 1600);

  try {
    const nombreEl = $('#nombre-el').value.trim();
    const nombreElla = $('#nombre-ella').value.trim();
    const fechaInicio = $('#fecha-inicio').value; // YYYY-MM-DD
    const tono = document.querySelector('input[name="tono"]:checked')?.value ?? 'completo';

    avanzar(15);
    // Ceder el hilo para que la UI pinte antes del trabajo pesado
    await new Promise((r) => setTimeout(r, 400));

    let stats;
    if (estado.statsImportadas) {
      // MODO IA: datos exactos ya calculados por la IA externa
      stats = estado.statsImportadas;
      avanzar(70);
      await new Promise((r) => setTimeout(r, 600));
    } else {
      // MODO LOCAL: parsear + analizar en el navegador
      const { mensajes } = parsearChat(
        estado.contenidoArchivo, nombreEl, nombreElla, new Date(`${fechaInicio}T00:00:00`),
      );
      avanzar(45);
      await new Promise((r) => setTimeout(r, 400));

      if (mensajes.length < 10) {
        throw new Error(
          'Encontramos muy pocos mensajes entre ustedes dos. Verifica que los nombres coincidan con los del chat.',
        );
      }

      stats = analizarChat(mensajes, new Date(`${fechaInicio}T00:00:00`));
      avanzar(70);
      await new Promise((r) => setTimeout(r, 400));
    }
    stats.fechaInicio = `${fechaInicio}T00:00:00`;

    // 3. Guardar SOLO estadísticas (nunca el chat)
    const token = generarToken(nombreEl, nombreElla, fechaInicio);
    const { modo } = await guardarAnalisis({
      token_acceso: token,
      nombre_el: nombreEl,
      nombre_ella: nombreElla,
      fecha_inicio: fechaInicio,
      stats_json: stats,
      mensaje_personal: $('#mensaje-personal').value.trim() || null,
      datos_extra: {
        primeraCita: $('#primera-cita').value.trim() || null,
        apodo: $('#apodo').value.trim() || null,
        cancion: $('#cancion').value.trim() || null,
        primerViaje: $('#primer-viaje').value.trim() || null,
      },
      tono,
    });
    avanzar(100);
    clearInterval(rotarMensaje);
    mensajeEl.textContent = '¡Listo! 💝';

    // Mostrar resultado
    const link = construirLinkHistoria(token);
    setTimeout(() => {
      $('#panel-progreso').classList.add('oculto');
      $('#panel-resultado').classList.remove('oculto');
      $('#link-generado').value = link;
      $('#btn-preview').href = link;
      $('#titulo-paso-4').textContent = '¡Su historia está lista! ✨';
      $('#aviso-modo-local').classList.toggle('oculto', modo !== 'local');
    }, 600);
  } catch (err) {
    clearInterval(rotarMensaje);
    $('#panel-progreso').classList.add('oculto');
    $('#panel-error').classList.remove('oculto');
    $('#texto-error').textContent = err.message;
    $('#titulo-paso-4').textContent = 'Ups...';
  }
}

/* ---------- Init ---------- */

function init() {
  // Fecha máxima: hoy
  $('#fecha-inicio').max = new Date().toISOString().slice(0, 10);

  iniciarTabs();
  iniciarZonaDrop();
  iniciarPreviewCarta();

  $('#btn-empezar').addEventListener('click', () => irAPaso(2));

  $$('[data-atras]').forEach((btn) => {
    btn.addEventListener('click', () => irAPaso(Number(btn.dataset.atras)));
  });

  $('#btn-a-paso-3').addEventListener('click', () => {
    if (validarPaso2()) {
      irAPaso(3);
    } else {
      mostrarToast('Revisa los campos marcados 💗', 'error');
    }
  });

  $('#toggle-opcionales').addEventListener('click', (e) => {
    const btn = e.currentTarget;
    const expandido = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expandido));
    $('#campos-opcionales').classList.toggle('oculto', expandido);
  });

  $('#btn-generar').addEventListener('click', generarHistoria);

  $('#btn-copiar').addEventListener('click', async () => {
    const ok = await copiarAlPortapapeles($('#link-generado').value);
    mostrarToast(ok ? '¡Link copiado! 💌' : 'No se pudo copiar', ok ? 'exito' : 'error');
  });

  $('#btn-otra').addEventListener('click', () => location.reload());

  if (!supabaseConfigurado()) {
    console.warn('[Nuestra Historia] Supabase sin configurar — modo demo con localStorage.');
  }
}

document.addEventListener('DOMContentLoaded', init);
