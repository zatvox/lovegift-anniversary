/* ============================================
   NUESTRA HISTORIA — parser.js
   Parser del .txt exportado de WhatsApp.
   Auto-detecta formato Android/iOS, agrupa multilínea,
   filtra mensajes de sistema y multimedia.
   Todo ocurre en el navegador — nada se sube a servidor.
   ============================================ */

import { normalizarTexto, esNumeroTelefono } from './utils.js?v=2026070902';

/* ---------- Formatos soportados ---------- */

// [16/02/2024, 9:43:05 a.m.] Luis: Hola amor   (Android/iOS con corchetes)
const REGEX_CORCHETES =
  /^\[(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s(\d{1,2}:\d{2}(?::\d{2})?\s?(?:[aApP]\.?\s?[mM]\.?)?)\]\s(.+?):\s([\s\S]*)$/;

// 16/2/24, 9:43 a.m. — Luis: Hola   (iOS con guión largo o corto)
const REGEX_GUION =
  /^(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s(\d{1,2}:\d{2}(?::\d{2})?\s?(?:[aApP]\.?\s?[mM]\.?)?)\s[—–-]\s(.+?):\s([\s\S]*)$/;

// Igual que el anterior pero SIN autor (mensaje de sistema): "16/2/24, 9:43 - Los mensajes están cifrados..."
const REGEX_SISTEMA_SIN_AUTOR =
  /^\[?(\d{1,2})\/(\d{1,2})\/(\d{2,4}),?\s(\d{1,2}:\d{2}(?::\d{2})?\s?(?:[aApP]\.?\s?[mM]\.?)?)\]?\s?[—–-]?\s?(.*)$/;

/* ---------- Mensajes de sistema y multimedia a filtrar ---------- */

const PATRONES_SISTEMA = [
  /omitiste los mensajes de este chat/i,
  /los mensajes y las llamadas est[aá]n cifrados/i,
  /messages and calls are end-to-end encrypted/i,
  /se elimin[oó] este mensaje/i,
  /este mensaje fue eliminado/i,
  /you deleted this message/i,
  /this message was deleted/i,
  /cambi[oó] su c[oó]digo de seguridad/i,
  /cre[oó] el grupo/i,
  /te a[ñn]adi[oó]/i,
  /cambi[oó] el asunto/i,
  /llamada de voz perdida/i,
  /videollamada perdida/i,
  /^llamada de voz/i,
  /^videollamada/i,
  /missed voice call/i,
  /missed video call/i,
];

const PATRONES_MEDIA = [
  /<?multimedia omitido>?/i,
  /<?media omitted>?/i,
  /sticker omitido/i,
  /audio omitido/i,
  /video omitido/i,
  /imagen omitida/i,
  /GIF omitido/i,
  /documento omitido/i,
  /sticker omitted/i,
  /image omitted/i,
  /video omitted/i,
  /audio omitted/i,
  /document omitted/i,
];

/* ---------- Helpers internos ---------- */

function esMensajeSistema(texto) {
  return PATRONES_SISTEMA.some((re) => re.test(texto));
}

function esMensajeMedia(texto) {
  return PATRONES_MEDIA.some((re) => re.test(texto));
}

/**
 * Convierte los grupos capturados en un Date.
 * Auto-detecta DD/MM vs MM/DD: si el "mes" capturado es > 12, invierte.
 * La preferencia por DD/MM (formato latino) se decide globalmente en detectarOrdenFecha.
 */
function construirFecha(p1, p2, anio, horaTxt, ordenDMY) {
  let dia = Number(p1);
  let mes = Number(p2);
  if (!ordenDMY) [dia, mes] = [mes, dia];
  // Corrección defensiva si el orden elegido produce mes inválido
  if (mes > 12 && dia <= 12) [dia, mes] = [mes, dia];

  let y = Number(anio);
  if (y < 100) y += 2000;

  // Hora: "9:43:05 a. m." | "21:43" | "9:43 PM"
  const limpia = horaTxt.replace(/\s/g, ' ').trim();
  const m = limpia.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s?([aApP])?\.?\s?[mM]?\.?/);
  let hh = Number(m?.[1] ?? 0);
  const mm = Number(m?.[2] ?? 0);
  const ss = Number(m?.[3] ?? 0);
  const ampm = m?.[4]?.toLowerCase();
  if (ampm === 'p' && hh < 12) hh += 12;
  if (ampm === 'a' && hh === 12) hh = 0;

  return new Date(y, mes - 1, dia, hh, mm, ss);
}

/**
 * Recorre las primeras líneas para decidir si las fechas son DD/MM o MM/DD.
 * Si algún primer campo es > 12 → es día → DD/MM. Si algún segundo campo es > 12 → MM/DD.
 * Por defecto asume DD/MM (formato latinoamericano).
 */
function detectarOrdenFecha(lineas) {
  for (const linea of lineas) {
    const m = linea.match(REGEX_CORCHETES) ?? linea.match(REGEX_GUION);
    if (!m) continue;
    const a = Number(m[1]);
    const b = Number(m[2]);
    if (a > 12) return true;   // DD/MM
    if (b > 12) return false;  // MM/DD
  }
  return true; // default: DD/MM
}

/** Limpia caracteres invisibles que WhatsApp inserta (LRM, RLM, NBSP, BOM) */
function limpiarLinea(linea) {
  return linea.replace(/[\u200e\u200f\u202a-\u202e\ufeff]/g, '').replace(/\u00a0/g, ' ');
}

/* ---------- API principal ---------- */

/**
 * Parsea el contenido completo del .txt exportado.
 *
 * @param {string} contenido        Texto completo del archivo
 * @param {string} nombreEl         Nombre de él (del formulario)
 * @param {string} nombreElla       Nombre de ella (del formulario)
 * @param {Date}   [fechaInicioRel] Fecha de inicio de la relación (para clamping de fechas inválidas)
 * @returns {{ mensajes: Array, autores: string[], errores: string[] }}
 */
export function parsearChat(contenido, nombreEl, nombreElla, fechaInicioRel = null) {
  const lineas = contenido.split(/\r?\n/).map(limpiarLinea);
  const ordenDMY = detectarOrdenFecha(lineas.slice(0, 200));

  const mensajes = [];
  const conteoAutores = new Map();
  const errores = [];

  // Clamping tipo wacrawl: fechas fuera de rango razonable se descartan
  const minFecha = fechaInicioRel
    ? new Date(fechaInicioRel.getTime() - 366 * 24 * 3600 * 1000)
    : new Date(2009, 0, 1); // WhatsApp no existía antes de 2009
  const maxFecha = new Date(Date.now() + 24 * 3600 * 1000);

  let actual = null; // mensaje en construcción (para multilínea)

  const cerrarActual = () => {
    if (!actual) return;
    actual.texto = actual.texto.trim();
    mensajes.push(actual);
    actual = null;
  };

  for (const linea of lineas) {
    if (!linea.trim()) {
      // Línea vacía dentro de un mensaje multilínea
      if (actual) actual.texto += '\n';
      continue;
    }

    const m = linea.match(REGEX_CORCHETES) ?? linea.match(REGEX_GUION);

    if (m) {
      cerrarActual();
      const [, p1, p2, anio, horaTxt, autorRaw, textoRaw] = m;
      const fecha = construirFecha(p1, p2, anio, horaTxt, ordenDMY);

      if (Number.isNaN(fecha.getTime()) || fecha < minFecha || fecha > maxFecha) {
        continue; // timestamp sentinel/incoherente → ignorar
      }

      const autor = autorRaw.trim();
      const texto = textoRaw.trim();
      const esSistema = esMensajeSistema(texto);
      const esMedia = esMensajeMedia(texto);

      if (esSistema) continue;

      conteoAutores.set(autor, (conteoAutores.get(autor) ?? 0) + 1);

      actual = {
        fecha,
        timestamp: fecha.getTime(),
        autor,
        esEl: false,   // se asigna en asignarIdentidades()
        esElla: false,
        texto: esMedia ? '' : texto,
        esMedia,
        esSistema: false,
        longitud: 0,
        hora: fecha.getHours(),
        diaSemana: fecha.getDay(),
      };
    } else if (actual) {
      // Continuación multilínea del mensaje anterior
      actual.texto += (actual.texto ? '\n' : '') + linea;
    } else {
      // Línea con timestamp pero sin autor → mensaje de sistema → ignorar
      const s = linea.match(REGEX_SISTEMA_SIN_AUTOR);
      if (!s) errores.push(`Línea no reconocida: ${linea.slice(0, 60)}`);
    }
  }
  cerrarActual();

  // Longitudes finales
  for (const msg of mensajes) msg.longitud = msg.texto.length;

  const autores = [...conteoAutores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([nombre]) => nombre);

  const resultado = asignarIdentidades(mensajes, autores, nombreEl, nombreElla);
  return { mensajes: resultado.mensajes, autores: resultado.autores, errores };
}

/**
 * Asigna esEl/esElla a cada mensaje.
 * - Match por nombre normalizado (parcial en ambos sentidos)
 * - Números de teléfono → se asignan al participante restante
 * - Chats de grupo → solo se conservan mensajes de los 2 identificados
 */
function asignarIdentidades(mensajes, autores, nombreEl, nombreElla) {
  const nEl = normalizarTexto(nombreEl);
  const nElla = normalizarTexto(nombreElla);

  const coincide = (autor, objetivo) => {
    const a = normalizarTexto(autor).replace(/\p{Extended_Pictographic}/gu, '').trim();
    return a === objetivo || a.includes(objetivo) || objetivo.includes(a);
  };

  let autorEl = autores.find((a) => coincide(a, nEl)) ?? null;
  let autorElla = autores.find((a) => a !== autorEl && coincide(a, nElla)) ?? null;

  // Números de teléfono sin contacto guardado → asignar por descarte
  const sinAsignar = autores.filter((a) => a !== autorEl && a !== autorElla);
  if (!autorEl && sinAsignar.length) autorEl = sinAsignar.find(esNumeroTelefono) ?? null;
  if (!autorElla && sinAsignar.length) {
    autorElla = sinAsignar.find((a) => a !== autorEl && esNumeroTelefono(a)) ?? null;
  }

  // Último recurso: los 2 autores con más mensajes
  if (!autorEl && !autorElla && autores.length >= 2) {
    [autorEl, autorElla] = [autores[0], autores[1]];
  } else if (!autorEl) {
    autorEl = autores.find((a) => a !== autorElla) ?? null;
  } else if (!autorElla) {
    autorElla = autores.find((a) => a !== autorEl) ?? null;
  }

  const filtrados = [];
  for (const msg of mensajes) {
    if (msg.autor === autorEl) {
      msg.esEl = true;
      msg.autor = nombreEl;
      filtrados.push(msg);
    } else if (msg.autor === autorElla) {
      msg.esElla = true;
      msg.autor = nombreElla;
      filtrados.push(msg);
    }
    // Otros participantes (grupo) → se excluyen
  }

  return { mensajes: filtrados, autores: [autorEl, autorElla].filter(Boolean) };
}

/**
 * Validación rápida: ¿parece un export de WhatsApp?
 * @returns {{ valido: boolean, motivo?: string }}
 */
export function validarArchivoChat(contenido) {
  if (!contenido || contenido.length < 50) {
    return { valido: false, motivo: 'El archivo está vacío o es demasiado corto.' };
  }
  const lineas = contenido.split(/\r?\n/).slice(0, 100).map(limpiarLinea);
  const conFormato = lineas.filter(
    (l) => REGEX_CORCHETES.test(l) || REGEX_GUION.test(l),
  ).length;
  if (conFormato < 3) {
    return {
      valido: false,
      motivo: 'No parece un chat exportado de WhatsApp. Exporta el chat como .txt "Sin multimedia".',
    };
  }
  return { valido: true };
}
