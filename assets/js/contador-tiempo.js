/* ============================================
   NUESTRA HISTORIA — contador-tiempo.js
   Contador en vivo de días/horas/minutos/segundos juntos.
   ============================================ */

/**
 * Inicia un contador en vivo dentro del elemento dado.
 * Estructura esperada (se crea si no existe):
 *   .contador-vivo > .contador-unidad > .valor + .unidad
 *
 * @param {HTMLElement} elemento  Contenedor
 * @param {Date}        desde     Fecha de inicio de la relación
 * @returns {() => void} función para detener el contador
 */
export function iniciarContadorVivo(elemento, desde) {
  const unidades = [
    { clave: 'dias', etiqueta: 'días' },
    { clave: 'horas', etiqueta: 'horas' },
    { clave: 'minutos', etiqueta: 'min' },
    { clave: 'segundos', etiqueta: 'seg' },
  ];

  elemento.classList.add('contador-vivo');
  elemento.innerHTML = unidades.map((u) => `
    <div class="contador-unidad">
      <span class="valor" data-unidad="${u.clave}">0</span>
      <span class="unidad">${u.etiqueta}</span>
    </div>
  `).join('');

  const refs = Object.fromEntries(
    unidades.map((u) => [u.clave, elemento.querySelector(`[data-unidad="${u.clave}"]`)]),
  );

  const actualizar = () => {
    const diff = Math.max(Date.now() - desde.getTime(), 0);
    const seg = Math.floor(diff / 1000);
    refs.dias.textContent = Math.floor(seg / 86400).toLocaleString('es-PE');
    refs.horas.textContent = Math.floor((seg % 86400) / 3600);
    refs.minutos.textContent = Math.floor((seg % 3600) / 60);
    refs.segundos.textContent = seg % 60;
  };

  actualizar();
  const intervalo = setInterval(actualizar, 1000);
  return () => clearInterval(intervalo);
}

/** Días completos juntos (para textos estáticos) */
export function diasJuntos(desde) {
  return Math.floor((Date.now() - desde.getTime()) / 86400000);
}
