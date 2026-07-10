/* ============================================
   NUESTRA HISTORIA — narrativa.js
   Convierte estadísticas frías en frases cálidas,
   adaptadas a los nombres reales y al tono elegido.
   ============================================ */

import {
  formatearFecha, formatearMes, formatearNumero, formatearHora,
  formatearMinutos, nombreDiaSemana,
} from './utils.js?v=2026070902';

/**
 * Convierte la frecuencia de expresiones de amor en una frase natural.
 * Evita datos fríos tipo "cada 0.1 días".
 */
function fraseFrecuenciaAmor(dias, jugueton = false) {
  if (dias == null || dias <= 0) return null;
  if (dias < 0.15) {
    return jugueton
      ? 'Se lo decían tantas veces al día que perdimos la cuenta. 😌'
      : 'Se lo decían muchas veces al día, todos los días.';
  }
  if (dias < 0.75) {
    const vecesDia = Math.round(1 / dias);
    return `Se lo decían unas ${vecesDia} veces al día, todos los días.`;
  }
  if (dias < 1.5) return 'Se lo decían prácticamente todos los días.';
  const redondeado = Math.round(dias);
  return `En promedio, uno de los dos lo decía cada ${redondeado} días.`;
}

/**
 * Genera todas las frases narrativas de la historia.
 * @param {object} stats   Objeto de analizarChat()
 * @param {string} el      Nombre de él
 * @param {string} ella    Nombre de ella
 * @param {string} tono    'romantico' | 'jugueton'
 * @param {object} extra   Datos opcionales del formulario (apodo, canción, etc.)
 */
export function generarNarrativa(stats, el, ella, tono = 'romantico', extra = {}) {
  const jugueton = tono === 'jugueton';
  const g = stats.general;
  const a = stats.amor;
  const r = stats.ritmo;
  const c = stats.conflictos;
  const q = stats.curiosidades;

  /* --- Portada --- */
  const portada = {
    titulo: `${el} & ${ella}`,
    subtitulo: `Desde el ${formatearFecha(new Date(stats.fechaInicio ?? g.primerMensaje?.fecha))}`,
    frase: jugueton
      ? `Hoy, ${formatearNumero(g.diasDesdeInicio)} días después de que empezara todo este lío hermoso...`
      : `Hoy, ${formatearNumero(g.diasDesdeInicio)} días después de que empezara todo...`,
  };

  /* --- El comienzo --- */
  const pm = g.primerMensaje;
  const comienzo = pm && {
    titulo: 'El comienzo',
    fecha: `Todo empezó el ${formatearFecha(new Date(pm.fecha))}`,
    primerTexto: pm.texto,
    autor: pm.autor,
    frase: jugueton
      ? `Ese día, ${pm.autor} mandó el primer mensaje. Spoiler: le salió bastante bien. 😏`
      : `Ese día, ${pm.autor} envió el primer mensaje. Nadie sabía lo que estaba empezando.`,
  };

  /* --- Sus números --- */
  const numeros = {
    titulo: 'Sus números',
    frase: `Entre ${el} y ${ella} se dijeron ${formatearNumero(g.totalMensajes)} cosas. ` +
      `Eso es ${g.promedioMensajesDiario} al día, todos los días. 💬`,
    diaTop: g.diaConMasMensajes && (jugueton
      ? `El ${formatearFecha(new Date(`${g.diaConMasMensajes.fecha}T12:00:00`))} se les fue la mano: ${formatearNumero(g.diaConMasMensajes.cantidad)} mensajes en un solo día. ¿Qué pasó ahí? 👀`
      : `Su día récord fue el ${formatearFecha(new Date(`${g.diaConMasMensajes.fecha}T12:00:00`))}, con ${formatearNumero(g.diaConMasMensajes.cantidad)} mensajes.`),
  };

  /* --- Cuánto se aman --- */
  const masRomantico = a.porPersona.el.total >= a.porPersona.ella.total ? el : ella;
  const amor = {
    titulo: 'Cuánto se aman',
    frase: a.totalExpresionesAmor > 0
      ? `Se dijeron cosas de amor ${formatearNumero(a.totalExpresionesAmor)} veces. ${masRomantico} fue quien más lo dijo 💛.`
      : 'Su amor se nota más en los hechos que en las palabras. Y eso también cuenta. 💛',
    detalle: a.porPersona.el.total || a.porPersona.ella.total
      ? `${el} lo escribió ${formatearNumero(a.porPersona.el.total)} veces. ${ella}, ${formatearNumero(a.porPersona.ella.total)}.`
      : null,
    primeraVez: a.primeraExpresion
      ? `La primera vez fue el ${formatearFecha(new Date(a.primeraExpresion.fecha))}, y lo dijo ${a.primeraExpresion.autor}.`
      : null,
    frecuencia: fraseFrecuenciaAmor(a.frecuenciaPromedioDias, jugueton),
    mesTop: a.mesMasRomantico
      ? `El mes más romántico fue ${formatearMes(a.mesMasRomantico)}.`
      : null,
  };

  /* --- Su ritmo --- */
  const quienPrimero = r.quienEscribePrimero === 'empate'
    ? 'Los dos empatan en quién escribe primero cada mañana. Perfecta sincronía.'
    : (r.quienEscribePrimero === 'el'
      ? `${el} suele ser quien escribe primero (${r.porcentajePrimeroEl}% de los días). ${jugueton ? 'Alguien está más enganchado... 😏' : 'Siempre buscándola.'}`
      : `${ella} suele ser quien escribe primero (${r.porcentajePrimeroElla}% de los días). ${jugueton ? '¡Ella lo extraña más rápido! 😏' : 'Siempre buscándolo.'}`);

  const ritmo = {
    titulo: 'Su ritmo',
    racha: `Hubo ${formatearNumero(r.rachaMasLarga)} días seguidos en que no se perdieron ni uno.`,
    horaPico: `Su hora favorita para escribirse: las ${formatearHora(r.horaPico)}.`,
    diaTop: `El día de la semana que más hablan: ${nombreDiaSemana(r.diaSemanaTop)}.`,
    quienPrimero,
    velocidad: (r.velocidadRespuestaEl != null && r.velocidadRespuestaElla != null)
      ? (r.velocidadRespuestaEl <= r.velocidadRespuestaElla
        ? `${el} responde más rápido: en promedio ${formatearMinutos(r.velocidadRespuestaEl)}.`
        : `${ella} responde más rápido: en promedio ${formatearMinutos(r.velocidadRespuestaElla)}.`)
      : null,
  };

  /* --- Las tormentas --- */
  const tormentas = {
    titulo: 'Y sí, también tuvimos tormentas... 🌧️',
    frase: c.totalDetectados === 0
      ? '¿Peleas? Casi ningunas. Eso es raro y bonito. 🌸'
      : `Tuvimos ${c.totalDetectados} momento${c.totalDetectados === 1 ? '' : 's'} difícil${c.totalDetectados === 1 ? '' : 'es'}. Pero lo más lindo: siempre volvimos el uno al otro.`,
    reconciliacion: c.tiempoPromedioRecuperacion
      ? `En promedio, tardamos ${formatearMinutos(c.tiempoPromedioRecuperacion)} en hacer las paces. Eso dice mucho de los dos.`
      : null,
    mesCalma: c.mesConMenosConflictos
      ? `El mes con más calma fue ${formatearMes(c.mesConMenosConflictos)}.`
      : null,
  };

  /* --- Momentos curiosos --- */
  const curiosos = {
    titulo: 'Momentos curiosos',
    horaPico: jugueton
      ? `¿A qué hora crees que más se escriben? A las ${formatearHora(r.horaPico)} 😏`
      : `La hora en que más conversan: las ${formatearHora(r.horaPico)}.`,
    madrugada: q.mensajesMadrugada > 0
      ? `${formatearNumero(q.mensajesMadrugada)} mensajes fueron de madrugada (entre 1 y 5 am). ${jugueton ? 'El sueño podía esperar. 🌙' : 'Cuando no podían dormir, se tenían el uno al otro.'}`
      : null,
    masLargo: q.mensajeMasLargo && q.mensajeMasLargo.longitud > 200
      ? `El mensaje más largo lo escribió ${q.mensajeMasLargo.autor}: ${formatearNumero(q.mensajeMasLargo.longitud)} caracteres de puro sentimiento.`
      : null,
    semanaTop: q.semanaConMasActividad
      ? `Su semana más intensa empezó el ${formatearFecha(new Date(`${q.semanaConMasActividad.inicio}T12:00:00`))}: ${formatearNumero(q.semanaConMasActividad.mensajes)} mensajes.`
      : null,
  };

  /* --- Extras del formulario --- */
  const detalles = [];
  if (extra.primeraCita) detalles.push(`Su primera cita: ${extra.primeraCita}`);
  if (extra.apodo) detalles.push(`${extra.apodo}`);
  if (extra.cancion) detalles.push(`Su canción: ${extra.cancion} 🎵`);
  if (extra.primerViaje) detalles.push(`Su primer viaje juntos: ${extra.primerViaje}`);

  /* --- Cierre --- */
  const cierre = {
    frase: `${formatearNumero(g.diasDesdeInicio)} días desde que todo comenzó. ` +
      'Y todavía están aquí, juntos, leyendo esto. Eso es lo más bonito de toda esta historia.',
  };

  return { portada, comienzo, numeros, amor, ritmo, tormentas, curiosos, detalles, cierre };
}

/**
 * Filtra los momentos según el tono elegido por el creador.
 *   - 'romantico': anécdotas románticas (+ salidas, que siempre suman)
 *   - 'jugueton':  anécdotas graciosas y cómplices (+ salidas)
 *   - 'completo':  todo
 * Si al filtrar quedan menos de 3 anécdotas, se completan con las demás
 * (mejor mostrar algo más que dejar el capítulo vacío).
 *
 * @param {object|null} momentos  Sección momentos del stats_json
 * @param {string} tono           'romantico' | 'jugueton' | 'completo'
 * @returns {object|null} momentos filtrados (misma estructura)
 */
export function filtrarMomentos(momentos, tono = 'completo') {
  if (!momentos) return null;

  const TIPOS_POR_TONO = {
    romantico: ['romantico'],
    jugueton: ['gracioso', 'complice'],
    completo: ['romantico', 'gracioso', 'complice'],
  };
  const tiposPermitidos = TIPOS_POR_TONO[tono] ?? TIPOS_POR_TONO.completo;

  const todas = momentos.anecdotas ?? [];
  let anecdotas = todas.filter((a) => tiposPermitidos.includes(a.tipo));

  // Completar con las restantes si el tono dejó muy pocas
  if (anecdotas.length < 3 && todas.length > anecdotas.length) {
    const faltantes = todas.filter((a) => !anecdotas.includes(a));
    anecdotas = [...anecdotas, ...faltantes].slice(0, Math.max(3, anecdotas.length));
  }

  // Orden cronológico (las sin fecha van al final)
  const ordenar = (lista) => [...lista].sort((a, b) => {
    if (!a.fecha) return 1;
    if (!b.fecha) return -1;
    return a.fecha.localeCompare(b.fecha);
  });

  return {
    ...momentos,
    anecdotas: ordenar(anecdotas),
    salidas: ordenar(momentos.salidas ?? []),
  };
}

/** Emoji decorativo por tipo de anécdota */
export function emojiTipoMomento(tipo) {
  return { romantico: '💗', gracioso: '😂', complice: '😏' }[tipo] ?? '✨';
}

/** Mensajes cálidos para la barra de progreso del análisis */
export const MENSAJES_PROGRESO = [
  'Leyendo su historia desde el principio... 📖',
  'Contando cuántas veces se dijeron "te amo"... 💛',
  'Buscando la racha más larga que tuvieron... 🔥',
  'Descubriendo a qué hora se escribían más... 🌙',
  'Encontrando los momentos más divertidos... 😄',
  'Armando los capítulos de su historia... ✍️',
  'Casi listo... preparando la sorpresa... 🎁',
];
