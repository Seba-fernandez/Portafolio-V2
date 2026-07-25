/* ════════════════════════════════════════════════
   FIT — tipografía que llena su contenedor
   Mide el texto renderizado y ajusta el font-size
   para que cada línea ocupe exactamente su ancho,
   sin importar pantalla, idioma o fuente.
   Elementos: [data-fit]. Multilínea: separar con <br>.
   Opcional: data-fit-ratio="0.85" (porción del ancho).
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const SEL = '[data-fit]';

  // Envuelve cada línea (separada por <br>) en un .fit-line.
  // Idempotente: se puede re-llamar tras cambiar innerHTML (i18n).
  function prepare() {
    document.querySelectorAll(SEL).forEach(el => {
      if (el.classList.contains('fit-line') || el.querySelector(':scope > .fit-line')) return;
      if (/<br\s*\/?>/i.test(el.innerHTML)) {
        const parts = el.innerHTML.split(/<br\s*\/?>/i);
        el.innerHTML = parts
          .map(p => `<span class="fit-line">${p.trim()}</span>`)
          .join('');
      } else {
        el.classList.add('fit-line');
      }
    });
  }

  function fitLine(line) {
    const holder = line.closest(SEL) || line;
    const ratio = parseFloat(holder.dataset.fitRatio || '1');

    // Caja real: el propio .fit-line (display:block y width:100% por CSS),
    // cuyo clientWidth respeta max-width y el layout del contenedor en
    // cualquier ancho de pantalla — medir al padre desborda en ultrawide.
    line.style.fontSize = '';                       // volver a la base CSS primero
    const cs = getComputedStyle(line);
    const padSelf = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    const avail = (line.clientWidth - padSelf) * ratio;
    if (avail <= 0) return;

    const base = parseFloat(cs.fontSize);
    const cap = base * parseFloat(holder.dataset.fitMax || '1.45');
    if (!base) return;

    // Medición del texto con la caja abrazando el contenido
    // (se libera max-width durante la medición para no truncarla).
    line.style.width = 'max-content';
    line.style.maxWidth = 'none';
    let w = line.getBoundingClientRect().width;
    if (!w) { line.style.width = ''; line.style.maxWidth = ''; return; }

    // Dos pasadas para converger con precisión (con tope en ultrawide)
    for (let i = 0; i < 2; i++) {
      const raw = parseFloat(getComputedStyle(line).fontSize) * (avail / w) * 0.995;
      line.style.fontSize = Math.min(raw, cap).toFixed(2) + 'px';
      w = line.getBoundingClientRect().width;
    }

    // Validación final: si por cualquier motivo (fuente, idioma, navegador,
    // zoom) el texto sigue más ancho que su caja, se reduce hasta entrar.
    let guard = 14;
    while (w > avail && guard--) {
      line.style.fontSize = (parseFloat(getComputedStyle(line).fontSize) * 0.97).toFixed(2) + 'px';
      w = line.getBoundingClientRect().width;
    }

    line.style.width = '';
    line.style.maxWidth = '';
  }

  function refit() {
    document.querySelectorAll('.fit-line').forEach(fitLine);
  }

  let raf;
  function onResize() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(refit);
  }

  // Ejecutar de inmediato: los scripts defer corren con el DOM ya parseado,
  // y fit.js va ANTES que motion.js, así el split de letras respeta las líneas.
  prepare();
  refit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
  window.addEventListener('load', refit);
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  window.JSFfit = { prepare, refit };
})();
