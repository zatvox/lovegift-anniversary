/* ============================================
   NUESTRA HISTORIA — validador-stats.js
   Valida y normaliza el JSON de estadísticas generado
   por una IA externa (ver PROMPT_IA_ANALISIS.md).
   Rellena valores faltantes con defaults seguros para
   que el renderer nunca falle.
   ============================================ */

/** Intenta extraer un objeto JSON de un texto (tolera ```json ... ``` y texto alrededor) */
export function extraerJSON(texto) {
  if (!texto) return null;
  let t = texto.trim();
  // Quitar fences de markdown si la IA los incluyó
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  // Si hay texto alrededor, quedarse con el bloque { ... } más externo
  const inicio = t.indexOf('{');
  const fin = t.lastIndexOf('}');
  if (inicio === -1 || fin === -1 || fin <= inicio) return null;
  try {
    return JSON.parse(t.slice(inicio, fin + 1));
  } catch {
    return null;
  }
}

const num = (v, def = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : def);
const str = (v, def = null) => (typeof v === 'string' && v.length ? v : def);

function normalizarExtracto(obj) {
  if (!obj || typeof obj !== 'object' || !str(obj.texto)) return null;
  return {
    fecha: str(obj.fecha, new Date().toISOString()),
    autor: str(obj.autor, ''),
    esEl: Boolean(obj.esEl),
    texto: String(obj.texto).slice(0, 400),
    longitud: num(obj.longitud, String(obj.texto).length),
  };
}

/**
 * Valida el JSON de la IA contra el schema de stats_json.
 * @param {object} datos  Objeto ya parseado
 * @returns {{ valido: boolean, errores: string[], stats: object|null }}
 */
export function validarStatsImportadas(datos) {
  const errores = [];

  if (!datos || typeof datos !== 'object') {
    return { valido: false, errores: ['El contenido no es un objeto JSON válido.'], stats: null };
  }

  const g = datos.general;
  if (!g || typeof g !== 'object') errores.push('Falta la sección "general".');
  else {
    if (!num(g.totalMensajes)) errores.push('"general.totalMensajes" debe ser un número mayor a 0.');
    if (!g.porPersona?.el || !g.porPersona?.ella) errores.push('Falta "general.porPersona.el/ella".');
  }
  if (!datos.amor || typeof datos.amor !== 'object') errores.push('Falta la sección "amor".');
  if (!datos.ritmo || typeof datos.ritmo !== 'object') errores.push('Falta la sección "ritmo".');
  if (!datos.curiosidades || typeof datos.curiosidades !== 'object') errores.push('Falta la sección "curiosidades".');

  if (errores.length) return { valido: false, errores, stats: null };

  const a = datos.amor;
  const r = datos.ritmo;
  const c = datos.conflictos ?? {};
  const q = datos.curiosidades;

  // Normalización con defaults seguros
  const persona = (p, conPromedio = true) => ({
    total: num(p?.total),
    porcentaje: Math.min(Math.max(num(p?.porcentaje), 0), 100),
    ...(conPromedio ? { promedioDiario: num(p?.promedioDiario) } : {}),
  });

  let actividad = Array.isArray(r.actividadPorHora) ? r.actividadPorHora.map((v) => num(v)) : [];
  if (actividad.length !== 24) actividad = new Array(24).fill(0);

  const stats = {
    version: 1,
    fuente: 'ia',
    generadoEl: new Date().toISOString(),
    general: {
      totalMensajes: num(g.totalMensajes),
      diasDesdeInicio: Math.max(num(g.diasDesdeInicio), 1),
      diasHablaron: num(g.diasHablaron),
      diasSinHablar: num(g.diasSinHablar),
      promedioMensajesDiario: num(g.promedioMensajesDiario),
      primerMensaje: normalizarExtracto(g.primerMensaje),
      diaConMasMensajes: g.diaConMasMensajes?.fecha
        ? { fecha: str(g.diaConMasMensajes.fecha), cantidad: num(g.diaConMasMensajes.cantidad) }
        : null,
      porPersona: { el: persona(g.porPersona.el), ella: persona(g.porPersona.ella) },
    },
    amor: {
      totalExpresionesAmor: num(a.totalExpresionesAmor),
      porPersona: {
        el: persona(a.porPersona?.el, false),
        ella: persona(a.porPersona?.ella, false),
      },
      primeraExpresion: normalizarExtracto(a.primeraExpresion),
      frecuenciaPromedioDias: a.frecuenciaPromedioDias == null ? null : num(a.frecuenciaPromedioDias, null),
      mesMasRomantico: str(a.mesMasRomantico),
      palabrasMasCarinosas: (Array.isArray(a.palabrasMasCarinosas) ? a.palabrasMasCarinosas : [])
        .filter((p) => str(p?.palabra))
        .slice(0, 10)
        .map((p) => ({ palabra: p.palabra, count: num(p.count) })),
    },
    ritmo: {
      rachaMasLarga: num(r.rachaMasLarga),
      rachaMasLargaInicio: str(r.rachaMasLargaInicio),
      rachaSinHablar: num(r.rachaSinHablar),
      horaPico: Math.min(Math.max(num(r.horaPico), 0), 23),
      actividadPorHora: actividad,
      diaSemanaTop: Math.min(Math.max(num(r.diaSemanaTop), 0), 6),
      quienEscribePrimero: ['el', 'ella', 'empate'].includes(r.quienEscribePrimero)
        ? r.quienEscribePrimero : 'empate',
      porcentajePrimeroEl: num(r.porcentajePrimeroEl),
      porcentajePrimeroElla: num(r.porcentajePrimeroElla),
      velocidadRespuestaEl: r.velocidadRespuestaEl == null ? null : num(r.velocidadRespuestaEl, null),
      velocidadRespuestaElla: r.velocidadRespuestaElla == null ? null : num(r.velocidadRespuestaElla, null),
    },
    conflictos: {
      totalDetectados: num(c.totalDetectados),
      tiempoPromedioRecuperacion: c.tiempoPromedioRecuperacion == null
        ? null : num(c.tiempoPromedioRecuperacion, null),
      mesConMenosConflictos: str(c.mesConMenosConflictos),
      mesConMasConflictos: str(c.mesConMasConflictos),
      conflictos: Array.isArray(c.conflictos) ? c.conflictos.slice(0, 50) : [],
    },
    curiosidades: {
      mensajesMadrugada: num(q.mensajesMadrugada),
      mensajeMasLargo: normalizarExtracto(q.mensajeMasLargo),
      mensajeMasCorto: normalizarExtracto(q.mensajeMasCorto),
      emojiMasUsadoEl: q.emojiMasUsadoEl?.emoji
        ? { emoji: q.emojiMasUsadoEl.emoji, count: num(q.emojiMasUsadoEl.count) } : null,
      emojiMasUsadoElla: q.emojiMasUsadoElla?.emoji
        ? { emoji: q.emojiMasUsadoElla.emoji, count: num(q.emojiMasUsadoElla.count) } : null,
      palabrasMasUsadas: (Array.isArray(q.palabrasMasUsadas) ? q.palabrasMasUsadas : [])
        .filter((p) => str(p?.palabra))
        .slice(0, 20)
        .map((p) => ({ palabra: p.palabra, count: num(p.count) })),
      totalEmojis: num(q.totalEmojis),
      semanaConMasActividad: q.semanaConMasActividad?.inicio
        ? { inicio: str(q.semanaConMasActividad.inicio), mensajes: num(q.semanaConMasActividad.mensajes) }
        : null,
    },
    momentos: normalizarMomentos(datos.momentos),
  };

  return { valido: true, errores: [], stats };
}

/** Normaliza la sección opcional "momentos" (historias curadas por la IA) */
function normalizarMomentos(m) {
  if (!m || typeof m !== 'object') return null;

  const TIPOS = ['romantico', 'gracioso', 'complice'];
  const anecdotas = (Array.isArray(m.anecdotas) ? m.anecdotas : [])
    .filter((a) => str(a?.titulo) && str(a?.descripcion))
    .slice(0, 15)
    .map((a) => ({
      fecha: str(a.fecha),
      titulo: String(a.titulo).slice(0, 90),
      descripcion: String(a.descripcion).slice(0, 500),
      tipo: TIPOS.includes(a.tipo) ? a.tipo : 'gracioso',
    }));

  const salidas = (Array.isArray(m.salidas) ? m.salidas : [])
    .filter((s) => str(s?.titulo))
    .slice(0, 8)
    .map((s) => ({
      fecha: str(s.fecha),
      titulo: String(s.titulo).slice(0, 90),
      descripcion: str(s.descripcion) ? String(s.descripcion).slice(0, 400) : '',
    }));

  const apodos = (Array.isArray(m.apodos) ? m.apodos : [])
    .filter((a) => str(a?.apodo))
    .slice(0, 10)
    .map((a) => ({
      apodo: String(a.apodo).slice(0, 50),
      quien: ['el', 'ella', 'ambos'].includes(a.quien) ? a.quien : 'ambos',
      count: num(a.count),
    }));

  const momentos = {
    anecdotas,
    salidas,
    apodos,
    cancion: m.cancion && (str(m.cancion.titulo) || str(m.cancion.evidencia))
      ? { titulo: str(m.cancion.titulo), evidencia: str(m.cancion.evidencia, '') }
      : null,
    primeraCita: m.primeraCita && str(m.primeraCita.descripcion)
      ? {
        fecha: str(m.primeraCita.fecha),
        descripcion: String(m.primeraCita.descripcion).slice(0, 400),
        confianza: ['alta', 'media', 'baja'].includes(m.primeraCita.confianza)
          ? m.primeraCita.confianza : 'media',
      }
      : null,
    fraseQueLosDefine: str(m.fraseQueLosDefine)
      ? String(m.fraseQueLosDefine).slice(0, 200) : null,
  };

  const vacio = !anecdotas.length && !salidas.length && !apodos.length
    && !momentos.cancion && !momentos.primeraCita && !momentos.fraseQueLosDefine;
  return vacio ? null : momentos;
}
