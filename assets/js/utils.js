/* ============================================
   NUESTRA HISTORIA — utils.js
   Helpers: fechas, texto, emojis, tokens
   ============================================ */

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const DIAS_SEMANA = [
  'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado',
];

/** Formatea Date → "14 de febrero de 2024" */
export function formatearFecha(fecha) {
  const d = fecha instanceof Date ? fecha : new Date(fecha);
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Nombre del mes con año: "febrero de 2024" */
export function formatearMes(claveMes) {
  // claveMes formato "YYYY-MM"
  const [anio, mes] = claveMes.split('-').map(Number);
  return `${MESES[mes - 1]} de ${anio}`;
}

/** Nombre de día de semana a partir de índice 0-6 (0=domingo) */
export function nombreDiaSemana(indice) {
  return DIAS_SEMANA[indice] ?? '';
}

/** Formatea hora 0-23 → "9 pm" */
export function formatearHora(hora) {
  if (hora === 0) return '12 de la noche';
  if (hora === 12) return '12 del mediodía';
  const h12 = hora % 12;
  return hora < 12 ? `${h12} am` : `${h12} pm`;
}

/** Días completos entre dos fechas */
export function diasEntre(desde, hasta) {
  const MS_DIA = 24 * 60 * 60 * 1000;
  return Math.floor((hasta.getTime() - desde.getTime()) / MS_DIA);
}

/** Clave de día local "YYYY-MM-DD" para agrupar */
export function claveDia(fecha) {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Clave de mes local "YYYY-MM" */
export function claveMes(fecha) {
  return claveDia(fecha).slice(0, 7);
}

/** Quita tildes y pasa a minúsculas (para búsquedas) */
export function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Formatea número con separador de miles: 12345 → "12,345" */
export function formatearNumero(n) {
  return Number(n ?? 0).toLocaleString('es-PE');
}

/** Formatea minutos → texto humano: 95 → "1 hora y 35 minutos" */
export function formatearMinutos(minutos) {
  const m = Math.round(minutos);
  if (m < 1) return 'menos de un minuto';
  if (m < 60) return `${m} minuto${m === 1 ? '' : 's'}`;
  const h = Math.floor(m / 60);
  const resto = m % 60;
  const horasTxt = `${h} hora${h === 1 ? '' : 's'}`;
  return resto ? `${horasTxt} y ${resto} minutos` : horasTxt;
}

/** Recorta texto largo con "..." */
export function recortarTexto(texto, max = 220) {
  if (!texto || texto.length <= max) return texto ?? '';
  return `${texto.slice(0, max).trimEnd()}...`;
}

/** Escapa HTML para prevenir XSS al renderizar contenido de usuario */
export function escaparHTML(texto) {
  return String(texto ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/** Extrae todos los emojis de un texto */
export function extraerEmojis(texto) {
  // Extended_Pictographic cubre emojis modernos; excluye dígitos/símbolos ASCII
  const regex = /\p{Extended_Pictographic}/gu;
  return texto.match(regex) ?? [];
}

/** Detecta si un nombre es un número de teléfono */
export function esNumeroTelefono(nombre) {
  return /^\+?[\d\s\-().]{7,}$/.test(nombre.trim());
}

/**
 * Genera token legible y memorable: "luis-ana-0214-a3f2"
 * @param {string} nombreEl
 * @param {string} nombreElla
 * @param {string} fechaInicio  formato "YYYY-MM-DD"
 */
export function generarToken(nombreEl, nombreElla, fechaInicio) {
  const limpiar = (n) => normalizarTexto(n).replace(/[^a-z0-9]/g, '').slice(0, 4) || 'amor';
  const slug = `${limpiar(nombreEl)}-${limpiar(nombreElla)}`;
  const fecha = fechaInicio.replace(/-/g, '').slice(4); // MMDD
  const random = Math.random().toString(36).slice(2, 6);
  return `${slug}-${fecha}-${random}`;
}

/** Lee parámetro de la URL */
export function parametroURL(nombre) {
  return new URLSearchParams(globalThis.location?.search ?? '').get(nombre);
}

/** Copia texto al portapapeles (con fallback) */
export async function copiarAlPortapapeles(texto) {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    const input = document.createElement('textarea');
    input.value = texto;
    document.body.appendChild(input);
    input.select();
    const ok = document.execCommand('copy');
    input.remove();
    return ok;
  }
}

/** Toast de notificación */
export function mostrarToast(mensaje, tipo = 'info', duracionMs = 3500) {
  let contenedor = document.querySelector('.contenedor-toasts');
  if (!contenedor) {
    contenedor = document.createElement('div');
    contenedor.className = 'contenedor-toasts';
    contenedor.setAttribute('role', 'status');
    contenedor.setAttribute('aria-live', 'polite');
    document.body.appendChild(contenedor);
  }
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.textContent = mensaje;
  contenedor.appendChild(toast);
  setTimeout(() => toast.remove(), duracionMs);
}

/** Animación de número que "cuenta" hacia arriba */
export function animarContador(elemento, valorFinal, duracionMs = 1800) {
  const inicio = performance.now();
  const desde = 0;
  const paso = (ahora) => {
    const progreso = Math.min((ahora - inicio) / duracionMs, 1);
    // Ease-out cúbico
    const eased = 1 - Math.pow(1 - progreso, 3);
    const valor = Math.round(desde + (valorFinal - desde) * eased);
    elemento.textContent = formatearNumero(valor);
    if (progreso < 1) requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}

/**
 * Observer para animaciones on-scroll (fade + slide-up).
 * IMPORTANTE: threshold 0 (no un porcentaje) porque las secciones muy altas
 * (más altas que el viewport del celular) nunca alcanzan un % de visibilidad
 * mayor a viewport/sección — con threshold 0.18 quedaban invisibles en mobile.
 * El rootMargin negativo da el pequeño retraso estético al entrar.
 */
export function activarAnimacionesScroll(selector = '.anim-scroll', alVerse) {
  const elementos = [...document.querySelectorAll(selector)];
  const mostrar = (el) => {
    el.classList.add('visible');
    if (alVerse) alVerse(el);
  };

  // Fallback: navegadores sin IntersectionObserver → mostrar todo de inmediato
  if (typeof IntersectionObserver === 'undefined') {
    elementos.forEach(mostrar);
    return null;
  }

  const observer = new IntersectionObserver((entradas) => {
    for (const entrada of entradas) {
      if (entrada.isIntersecting) {
        mostrar(entrada.target);
        observer.unobserve(entrada.target);
      }
    }
  }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });

  elementos.forEach((el) => observer.observe(el));

  // Red de seguridad: cada 3s revela cualquier elemento que ya entró al
  // viewport pero que por algún motivo el observer no marcó como visible.
  // Nunca dejar contenido invisible; las secciones aún no alcanzadas
  // conservan su animación de entrada.
  const vigilante = setInterval(() => {
    let pendientes = 0;
    for (const el of elementos) {
      if (el.classList.contains('visible')) continue;
      pendientes += 1;
      if (el.getBoundingClientRect().top < window.innerHeight) mostrar(el);
    }
    if (!pendientes) clearInterval(vigilante);
  }, 3000);

  return observer;
}
