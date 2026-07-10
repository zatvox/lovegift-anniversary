/* ============================================
   NUESTRA HISTORIA — analizador.js
   Motor de análisis: 5 módulos de estadísticas.
   Recibe mensajes parseados, devuelve stats serializables
   (sin texto de mensajes salvo extractos puntuales).
   ============================================ */

import {
  claveDia, claveMes, diasEntre, normalizarTexto, extraerEmojis,
} from './utils.js';

/* ---------- Diccionarios ---------- */

// Frases multi-palabra: seguras para búsqueda por inclusión
export const EXPRESIONES_AMOR = [
  'te amo mucho', 'te quiero mucho', 'te quiero demasiado',
  'mi amor', 'mi vida', 'mi cielo', 'mi corazon', 'mi todo', 'mi sol',
  'eres mi amor', 'te adoro', 'amor mio', 'mi bebe', 'mi reina', 'mi rey',
  'mi princesa', 'mi principe',
  'eres lo mejor que me ha pasado', 'me haces muy feliz',
  'gracias por existir', 'no puedo sin ti', 'eres todo para mi',
];

// Palabras/abreviaturas cortas: requieren límite de palabra para evitar
// falsos positivos ("tam" dentro de "también", "tq" dentro de otra sigla).
// Flexible con letras repetidas: "te amooo", "tqmmm", "teamo".
const REGEX_AMOR_CORTAS = [
  { regex: /\bte\s*am[oa]+o*\b/, canonica: 'te amo' },      // te amo, teamo, te amooo
  { regex: /\bte\s*[qk]iero+\b/, canonica: 'te quiero' },   // te quiero, te kiero
  { regex: /\bt+[qk]+m+\b/, canonica: 'tqm' },              // tqm, tkm, tqmmm
  { regex: /\btam\b/, canonica: 'tam' },                    // tam (solo palabra completa)
  { regex: /\btq\b/, canonica: 'tq' },                      // tq (solo palabra completa)
  { regex: /\bhermos[ao]+\b/, canonica: 'hermosa/o' },
  { regex: /\bprecios[ao]+\b/, canonica: 'preciosa/o' },
];

export const PALABRAS_CONFLICTO = [
  'ya no puedo', 'estoy cansad', 'me enoj', 'basta ya',
  'no quiero hablar', 'dejame en paz', 'me duele', 'estoy mal contigo',
  'no me busques', 'me hiciste', 'me lastimas', 'ya me canse',
  'no tiene sentido', 'estas exagerando', 'no me entiendes',
];

// Stopwords para el top de palabras
const STOPWORDS = new Set(('de la que el en y a los se del las un por con no una su para es' +
  ' al lo como mas pero sus le ya o fue este ha si porque esta son entre cuando muy sin sobre' +
  ' ser tiene tambien me hasta hay donde han quien estan desde todo nos durante estados uno les' +
  ' ni contra otros fueron ese eso habia ante ellos e esto mi antes algunos que unos yo otro' +
  ' otras otra el tanto esa estos mucho quienes nada muchos cual sea poco ella estar haber' +
  ' estas estaba estamos algunas algo nosotros tu te ti tus ellas nosotras vosotros si jaja' +
  ' jajaja jajajaja xd ok ya aja mmm ahh eso esa asi q x k tb pq porq dnd toy tas pa').split(' '));

/* ---------- Helpers de conteo ---------- */

function agruparPorDia(mensajes) {
  const porDia = new Map();
  for (const m of mensajes) {
    const clave = claveDia(m.fecha);
    porDia.set(clave, (porDia.get(clave) ?? 0) + 1);
  }
  return porDia;
}

function contieneExpresionAmor(textoNorm) {
  return EXPRESIONES_AMOR.some((expr) => textoNorm.includes(expr))
    || REGEX_AMOR_CORTAS.some(({ regex }) => regex.test(textoNorm));
}

/** Devuelve las expresiones canónicas encontradas en un texto normalizado */
function expresionesEncontradas(textoNorm) {
  const encontradas = [];
  for (const expr of EXPRESIONES_AMOR) {
    if (textoNorm.includes(expr)) encontradas.push(expr);
  }
  for (const { regex, canonica } of REGEX_AMOR_CORTAS) {
    if (regex.test(textoNorm)) encontradas.push(canonica);
  }
  return encontradas;
}

/**
 * Heurística contextual: ¿el texto es contenido técnico/laboral copiado
 * (prompts de IA, código, XML, listas de trabajo) y no un mensaje de la relación?
 * Se usa para excluirlo de "mensaje más largo" y similares.
 */
export function esContenidoTecnico(texto) {
  if (!texto) return false;
  const senales = [
    // Etiquetas XML/HTML (prompts de IA, código markup)
    (texto.match(/<\/?[a-zA-Z][\w-]*>/g) ?? []).length >= 2,
    // Densidad alta de símbolos de código
    (texto.match(/[{}[\]<>;`|=_]/g) ?? []).length >= 12,
    // Palabras clave de código/prompts/trabajo técnico
    /\b(function|const |var |import |export |SELECT |INSERT |CREATE TABLE|class |def |print\(|console\.|http[s]?:\/\/\S+\.(js|py|php|sql)|eres un (asistente|agente)|instrucciones del sistema|base de datos|endpoint|API key)\b/i.test(texto),
    // Múltiples URLs (contenido reenviado/publicidad)
    (texto.match(/https?:\/\//g) ?? []).length >= 3,
    // Estructura de lista técnica/numerada extensa
    (texto.match(/^\s*([-*•]|\d+[.)])\s/gm) ?? []).length >= 6,
  ];
  return senales.filter(Boolean).length >= 2
    // Una sola señal muy fuerte también descalifica
    || (texto.match(/<\/?[a-zA-Z][\w-]*>/g) ?? []).length >= 4;
}

// Señales de que un mensaje largo SÍ trata de la relación (para priorizarlo)
const REGEX_SENTIMENTAL =
  /\b(te amo|te quiero|amor|feliz|gracias|siento|perdon|extrano|juntos|contigo|corazon|besos?|abrazo|orgullos[ao]|prometo|siempre|nunca te|mi vida)\b/;

function contarPalabrasConflicto(textoNorm) {
  return PALABRAS_CONFLICTO.filter((p) => textoNorm.includes(p)).length;
}

/* ---------- MÓDULO 1: Generales ---------- */

function analizarGeneral(mensajes, fechaInicio) {
  const hoy = new Date();
  const porDia = agruparPorDia(mensajes);
  const diasDesdeInicio = Math.max(diasEntre(fechaInicio, hoy), 1);
  const diasHablaron = porDia.size;

  let diaTop = { fecha: null, cantidad: 0 };
  for (const [clave, cantidad] of porDia) {
    if (cantidad > diaTop.cantidad) diaTop = { fecha: clave, cantidad };
  }

  const deTexto = mensajes.filter((m) => !m.esMedia);
  const primero = mensajes[0] ?? null;
  const totalEl = mensajes.filter((m) => m.esEl).length;
  const totalElla = mensajes.filter((m) => m.esElla).length;
  const total = mensajes.length;

  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  return {
    totalMensajes: total,
    totalMensajesTexto: deTexto.length,
    diasDesdeInicio,
    diasHablaron,
    diasSinHablar: Math.max(diasDesdeInicio - diasHablaron, 0),
    promedioMensajesDiario: Math.round(total / diasDesdeInicio * 10) / 10,
    primerMensaje: primero && {
      fecha: primero.fecha.toISOString(),
      autor: primero.autor,
      esEl: primero.esEl,
      texto: primero.esMedia ? '(una foto 📷)' : primero.texto.slice(0, 300),
    },
    diaConMasMensajes: diaTop.fecha && {
      fecha: diaTop.fecha,
      cantidad: diaTop.cantidad,
    },
    porPersona: {
      el:   { total: totalEl,   porcentaje: pct(totalEl),   promedioDiario: Math.round(totalEl / diasDesdeInicio * 10) / 10 },
      ella: { total: totalElla, porcentaje: pct(totalElla), promedioDiario: Math.round(totalElla / diasDesdeInicio * 10) / 10 },
    },
  };
}

/* ---------- MÓDULO 2: Amor y afecto ---------- */

function analizarAmor(mensajes) {
  let totalEl = 0;
  let totalElla = 0;
  let primera = null;
  const porMes = new Map();
  const conteoFrases = new Map();
  const fechasAmor = [];

  for (const m of mensajes) {
    if (m.esMedia || !m.texto) continue;
    const norm = normalizarTexto(m.texto);
    if (!contieneExpresionAmor(norm)) continue;

    if (m.esEl) totalEl += 1; else totalElla += 1;
    if (!primera) {
      primera = {
        fecha: m.fecha.toISOString(),
        autor: m.autor,
        esEl: m.esEl,
        texto: m.texto.slice(0, 200),
      };
    }
    const mes = claveMes(m.fecha);
    porMes.set(mes, (porMes.get(mes) ?? 0) + 1);
    fechasAmor.push(m.timestamp);

    for (const expr of expresionesEncontradas(norm)) {
      conteoFrases.set(expr, (conteoFrases.get(expr) ?? 0) + 1);
    }
  }

  const total = totalEl + totalElla;
  let mesTop = null;
  let maxMes = 0;
  for (const [mes, c] of porMes) if (c > maxMes) { maxMes = c; mesTop = mes; }

  // Frecuencia promedio: días entre primera y última expresión / cantidad
  let frecuenciaDias = null;
  if (fechasAmor.length > 1) {
    const rangoDias = (fechasAmor.at(-1) - fechasAmor[0]) / (24 * 3600 * 1000);
    frecuenciaDias = Math.max(Math.round(rangoDias / (fechasAmor.length - 1) * 10) / 10, 0.1);
  }

  const top = [...conteoFrases.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([palabra, count]) => ({ palabra, count }));

  return {
    totalExpresionesAmor: total,
    porPersona: {
      el:   { total: totalEl,   porcentaje: total ? Math.round((totalEl / total) * 100) : 0 },
      ella: { total: totalElla, porcentaje: total ? Math.round((totalElla / total) * 100) : 0 },
    },
    primeraExpresion: primera,
    frecuenciaPromedioDias: frecuenciaDias,
    mesMasRomantico: mesTop,
    palabrasMasCarinosas: top,
  };
}

/* ---------- MÓDULO 3: Ritmo ---------- */

function analizarRitmo(mensajes) {
  const porDia = agruparPorDia(mensajes);
  const dias = [...porDia.keys()].sort();

  // Racha más larga de días consecutivos
  let racha = 0; let rachaMax = 0; let rachaInicio = null; let mejorInicio = null;
  let anterior = null;
  for (const d of dias) {
    const fecha = new Date(`${d}T12:00:00`);
    if (anterior && diasEntre(anterior, fecha) === 1) {
      racha += 1;
    } else {
      racha = 1;
      rachaInicio = d;
    }
    if (racha > rachaMax) { rachaMax = racha; mejorInicio = rachaInicio; }
    anterior = fecha;
  }

  // Mayor gap sin hablar
  let gapMax = 0;
  anterior = null;
  for (const d of dias) {
    const fecha = new Date(`${d}T12:00:00`);
    if (anterior) gapMax = Math.max(gapMax, diasEntre(anterior, fecha) - 1);
    anterior = fecha;
  }

  // Actividad por hora y día de semana
  const porHora = new Array(24).fill(0);
  const porDiaSemana = new Array(7).fill(0);
  for (const m of mensajes) {
    porHora[m.hora] += 1;
    porDiaSemana[m.diaSemana] += 1;
  }
  const horaPico = porHora.indexOf(Math.max(...porHora));
  const diaSemanaTop = porDiaSemana.indexOf(Math.max(...porDiaSemana));

  // Quién escribe primero cada día + velocidad de respuesta
  const primerosDelDia = new Map();
  for (const m of mensajes) {
    const clave = claveDia(m.fecha);
    if (!primerosDelDia.has(clave)) primerosDelDia.set(clave, m.esEl ? 'el' : 'ella');
  }
  let primeroEl = 0; let primeroElla = 0;
  for (const quien of primerosDelDia.values()) {
    if (quien === 'el') primeroEl += 1; else primeroElla += 1;
  }
  const totalDias = primeroEl + primeroElla;

  // Velocidad de respuesta (cambio de autor en < 12h)
  let sumaEl = 0; let nEl = 0; let sumaElla = 0; let nElla = 0;
  const LIMITE = 12 * 3600 * 1000;
  for (let i = 1; i < mensajes.length; i += 1) {
    const prev = mensajes[i - 1];
    const cur = mensajes[i];
    if (prev.esEl === cur.esEl) continue; // mismo autor, no es respuesta
    const delta = cur.timestamp - prev.timestamp;
    if (delta <= 0 || delta > LIMITE) continue;
    if (cur.esEl) { sumaEl += delta; nEl += 1; } else { sumaElla += delta; nElla += 1; }
  }
  const minutos = (suma, n) => (n ? Math.round(suma / n / 60000 * 10) / 10 : null);

  return {
    rachaMasLarga: rachaMax,
    rachaMasLargaInicio: mejorInicio,
    rachaSinHablar: gapMax,
    horaPico,
    actividadPorHora: porHora,
    diaSemanaTop,
    quienEscribePrimero: primeroEl === primeroElla ? 'empate' : (primeroEl > primeroElla ? 'el' : 'ella'),
    porcentajePrimeroEl: totalDias ? Math.round((primeroEl / totalDias) * 100) : 0,
    porcentajePrimeroElla: totalDias ? Math.round((primeroElla / totalDias) * 100) : 0,
    velocidadRespuestaEl: minutos(sumaEl, nEl),
    velocidadRespuestaElla: minutos(sumaElla, nElla),
  };
}

/* ---------- MÓDULO 4: Conflictos (heurística, tratados con ternura) ---------- */

function analizarConflictos(mensajes) {
  const conflictos = [];
  const porMes = new Map();
  const GAP_TENSION = 2 * 3600 * 1000;   // 2h de silencio tras tensión
  const VENTANA_RECONCILIACION = 4 * 3600 * 1000; // 4h para "hacer las paces"

  for (let i = 0; i < mensajes.length; i += 1) {
    const m = mensajes[i];
    if (m.esMedia || !m.texto) continue;
    const norm = normalizarTexto(m.texto);

    // Señal: 2+ palabras de conflicto en ventana corta + gap posterior
    let señales = contarPalabrasConflicto(norm);
    // Sumar señales de mensajes cercanos (± 3 mensajes, 30 min)
    for (let j = Math.max(0, i - 3); j <= Math.min(mensajes.length - 1, i + 3); j += 1) {
      if (j === i || mensajes[j].esMedia) continue;
      if (Math.abs(mensajes[j].timestamp - m.timestamp) > 30 * 60000) continue;
      señales += contarPalabrasConflicto(normalizarTexto(mensajes[j].texto));
    }
    if (señales < 2) continue;

    const siguiente = mensajes[i + 1];
    const gap = siguiente ? siguiente.timestamp - m.timestamp : Infinity;
    if (gap < GAP_TENSION) continue;

    // Buscar reconciliación: expresión de amor en las horas siguientes
    let resolucion = null;
    for (let j = i + 1; j < mensajes.length; j += 1) {
      const r = mensajes[j];
      if (r.timestamp - m.timestamp > 3 * 24 * 3600 * 1000) break; // máx 3 días
      if (!r.esMedia && r.texto && contieneExpresionAmor(normalizarTexto(r.texto))) {
        resolucion = r;
        break;
      }
    }

    const duracionMin = resolucion
      ? Math.round((resolucion.timestamp - m.timestamp) / 60000)
      : null;

    // Evitar duplicados: no registrar otro conflicto a < 6h del anterior
    const ultimo = conflictos.at(-1);
    if (ultimo && m.timestamp - ultimo.timestamp < 6 * 3600 * 1000) continue;

    conflictos.push({
      fecha: m.fecha.toISOString(),
      timestamp: m.timestamp,
      duracion: duracionMin,
      resolucion: resolucion?.fecha.toISOString() ?? null,
    });
    const mes = claveMes(m.fecha);
    porMes.set(mes, (porMes.get(mes) ?? 0) + 1);
  }

  // Meses con más/menos conflictos (considerando todos los meses activos)
  const mesesActivos = new Set(mensajes.map((m) => claveMes(m.fecha)));
  let mesMax = null; let cMax = -1; let mesMin = null; let cMin = Infinity;
  for (const mes of mesesActivos) {
    const c = porMes.get(mes) ?? 0;
    if (c > cMax) { cMax = c; mesMax = mes; }
    if (c < cMin) { cMin = c; mesMin = mes; }
  }

  const conDuracion = conflictos.filter((c) => c.duracion != null);
  const promedio = conDuracion.length
    ? Math.round(conDuracion.reduce((s, c) => s + c.duracion, 0) / conDuracion.length)
    : null;

  return {
    totalDetectados: conflictos.length,
    tiempoPromedioRecuperacion: promedio,
    mesConMenosConflictos: mesMin,
    mesConMasConflictos: cMax > 0 ? mesMax : null,
    conflictos: conflictos.map(({ timestamp, ...resto }) => resto).slice(0, 50),
  };
}

/* ---------- MÓDULO 5: Curiosidades ---------- */

function analizarCuriosidades(mensajes) {
  let madrugada = 0;
  let masCorto = null;
  const emojisEl = new Map();
  const emojisElla = new Map();
  const palabras = new Map();
  let totalEmojis = 0;
  const candidatosLargos = [];

  for (const m of mensajes) {
    if (m.hora >= 1 && m.hora < 5) madrugada += 1;
    if (m.esMedia || !m.texto) continue;

    if (m.longitud > 150) candidatosLargos.push(m);
    if (m.longitud >= 1 && (!masCorto || m.longitud < masCorto.longitud)) masCorto = m;

    const emojis = extraerEmojis(m.texto);
    totalEmojis += emojis.length;
    const destino = m.esEl ? emojisEl : emojisElla;
    for (const e of emojis) destino.set(e, (destino.get(e) ?? 0) + 1);

    // Top palabras (sin stopwords, > 3 letras)
    const tokens = normalizarTexto(m.texto).split(/[^a-zñ]+/);
    for (const t of tokens) {
      if (t.length < 4 || STOPWORDS.has(t)) continue;
      palabras.set(t, (palabras.get(t) ?? 0) + 1);
    }
  }

  // Mensaje más largo CON CONTEXTO:
  // 1. descartar contenido técnico/copiado (prompts, código, listas de trabajo)
  // 2. entre los 30 más largos restantes, priorizar el que tenga tono sentimental
  const noTecnicos = candidatosLargos
    .sort((a, b) => b.longitud - a.longitud)
    .filter((m) => !esContenidoTecnico(m.texto))
    .slice(0, 30);
  const sentimental = noTecnicos.find((m) => REGEX_SENTIMENTAL.test(normalizarTexto(m.texto)));
  const masLargo = sentimental ?? noTecnicos[0] ?? null;

  const topEmoji = (mapa) => {
    let mejor = null;
    for (const [emoji, count] of mapa) {
      if (!mejor || count > mejor.count) mejor = { emoji, count };
    }
    return mejor;
  };

  // Semana con más actividad (agrupando por lunes de cada semana)
  const porSemana = new Map();
  for (const m of mensajes) {
    const d = new Date(m.fecha);
    const offset = (d.getDay() + 6) % 7; // días desde el lunes
    d.setDate(d.getDate() - offset);
    const clave = claveDia(d);
    porSemana.set(clave, (porSemana.get(clave) ?? 0) + 1);
  }
  let semanaTop = null; let maxSemana = 0;
  for (const [inicio, c] of porSemana) {
    if (c > maxSemana) { maxSemana = c; semanaTop = inicio; }
  }

  const resumenMensaje = (m) => m && {
    autor: m.autor,
    esEl: m.esEl,
    texto: m.texto.slice(0, 400),
    longitud: m.longitud,
    fecha: m.fecha.toISOString(),
  };

  return {
    mensajesMadrugada: madrugada,
    mensajeMasLargo: resumenMensaje(masLargo),
    mensajeMasCorto: resumenMensaje(masCorto),
    emojiMasUsadoEl: topEmoji(emojisEl),
    emojiMasUsadoElla: topEmoji(emojisElla),
    palabrasMasUsadas: [...palabras.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([palabra, count]) => ({ palabra, count })),
    totalEmojis,
    semanaConMasActividad: semanaTop && { inicio: semanaTop, mensajes: maxSemana },
  };
}

/* ---------- API principal ---------- */

/**
 * Analiza los mensajes parseados y devuelve el objeto completo de estadísticas.
 * IMPORTANTE (privacidad): el resultado solo contiene números y extractos mínimos
 * (primer mensaje, primera expresión de amor, mensaje más largo) — nunca el chat completo.
 *
 * @param {Array} mensajes     Mensajes de parsearChat(), ordenados cronológicamente
 * @param {Date}  fechaInicio  Fecha de inicio de la relación
 */
export function analizarChat(mensajes, fechaInicio) {
  if (!Array.isArray(mensajes) || mensajes.length < 10) {
    throw new Error('El chat tiene muy pocos mensajes para crear una historia (mínimo 10).');
  }
  const ordenados = [...mensajes].sort((a, b) => a.timestamp - b.timestamp);

  return {
    version: 1,
    generadoEl: new Date().toISOString(),
    general: analizarGeneral(ordenados, fechaInicio),
    amor: analizarAmor(ordenados),
    ritmo: analizarRitmo(ordenados),
    conflictos: analizarConflictos(ordenados),
    curiosidades: analizarCuriosidades(ordenados),
  };
}
