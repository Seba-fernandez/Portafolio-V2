/* ════════════════════════════════════════════════
   FIT — tipografía que llena su contenedor
   Mide el texto renderizado y ajusta el font-size
   para que cada línea ocupe exactamente su ancho,
   sin importar pantalla, idioma o fuente.
   Elementos: [data-fit]. Multilínea: separar con <br>.
   Opcional: data-fit-ratio="0.85" (porción del ancho).

   Perf:
   · Todos los disparadores (carga, fuentes, resize) pasan por UN solo
     scheduleFit() con rAF: como mucho una pasada por frame.
   · Las líneas se procesan por lotes (todas las escrituras, después todas
     las lecturas): unos pocos layouts en total, no cuatro por línea.
   · Si una línea ya entra dentro del 1 % de su caja no se toca.
   · La primera pasada solo mide lo visible; el resto espera a un
     IntersectionObserver.
   · jsf:layout-settled se avisa una sola vez por pasada, y solo si algo cambió.
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

  // Las líneas con --fit-k ya tienen su tamaño por CSS: hasta que llegue Archivo no se
  // tocan (medir con la fuente de respaldo las agrandaría y correría todo lo de abajo).
  const fontReady = () => !document.fonts || document.fonts.check('900 1em "Archivo"');

  // Ancho real del texto sin escribir estilos (rango sobre el contenido).
  const range = document.createRange();
  function textWidth(line) {
    range.selectNodeContents(line);
    return range.getBoundingClientRect().width;
  }

  /* Ajusta un lote de líneas. Devuelve true si algún tamaño cambió más de 0,5 px.
     Fases: (1) lecturas y descarte de las que ya entran, (2) escrituras → lecturas
     para cada pasada. Misma precisión que antes: dos pasadas + validación final. */
  function fitLines(lines) {
    // 1 · Lecturas (sin escribir nada: un solo layout)
    const items = [];
    for (const line of lines) {
      if (line.style.getPropertyValue('--fit-k') && !fontReady()) continue;
      const holder = line.closest(SEL) || line;
      const ratio = parseFloat(holder.dataset.fitRatio || '1');
      const cs = getComputedStyle(line);
      // Caja real: el propio .fit-line (display:block y width:100% por CSS), cuyo clientWidth
      // respeta max-width y el layout del contenedor — medir al padre desborda en ultrawide.
      const padSelf = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const avail = (line.clientWidth - padSelf) * ratio;
      if (!(avail > 0)) continue;
      const cur = parseFloat(cs.fontSize);
      const w = textWidth(line);
      // Ya entra (entre el 99 % y el 100 % de la caja): no se toca.
      if (w > 0 && w <= avail && w >= avail * 0.99) continue;
      items.push({ line, holder, avail, cur, size: 0, cap: 0, w: 0 });
    }
    if (!items.length) return false;

    // 2 · Volver a la base CSS y leer el tamaño base
    for (const it of items) it.line.style.fontSize = '';
    for (const it of items) {
      it.size = parseFloat(getComputedStyle(it.line).fontSize);
      it.cap = it.size * parseFloat(it.holder.dataset.fitMax || '1.45');
    }
    const live = items.filter(it => it.size);

    // 3 · Medición con la caja abrazando el contenido
    // (se libera max-width durante la medición para no truncarla).
    for (const it of live) { it.line.style.width = 'max-content'; it.line.style.maxWidth = 'none'; }
    for (const it of live) it.w = it.line.getBoundingClientRect().width;
    const measured = live.filter(it => it.w);
    for (const it of live) if (!it.w) { it.line.style.width = ''; it.line.style.maxWidth = ''; }

    // 4 · Dos pasadas para converger con precisión (con tope en ultrawide)
    for (let pass = 0; pass < 2; pass++) {
      for (const it of measured) {
        const raw = it.size * (it.avail / it.w) * 0.995;
        it.line.style.fontSize = Math.min(raw, it.cap).toFixed(2) + 'px';
        it.size = parseFloat(it.line.style.fontSize);
      }
      for (const it of measured) it.w = it.line.getBoundingClientRect().width;
    }

    // 5 · Validación final: si por cualquier motivo (fuente, idioma, navegador, zoom) el texto
    // sigue más ancho que su caja, se reduce hasta entrar.
    let over = measured.filter(it => it.w > it.avail);
    for (let guard = 14; over.length && guard--;) {
      for (const it of over) {
        it.size *= 0.97;
        it.line.style.fontSize = it.size.toFixed(2) + 'px';
        it.size = parseFloat(it.line.style.fontSize);
      }
      for (const it of over) it.w = it.line.getBoundingClientRect().width;
      over = over.filter(it => it.w > it.avail);
    }

    for (const it of measured) { it.line.style.width = ''; it.line.style.maxWidth = ''; }

    return items.some(it => Math.abs((it.size || it.cur) - it.cur) > 0.5);
  }

  const allLines = () => Array.from(document.querySelectorAll('.fit-line'));

  // "Arriba del fold" (fit inmediato para el LCP) vs el resto (diferido a viewport).
  function inViewport(el) {
    const r = el.getBoundingClientRect();
    return r.top < (innerHeight || 0) && r.bottom > 0;
  }

  const fitVisible = () => fitLines(allLines().filter(inViewport));
  const refit = () => fitLines(allLines());

  // Difiere los que están fuera del viewport hasta que scrollee cerca de ellos.
  let io = null;
  function observeOffscreen() {
    if (!('IntersectionObserver' in window)) return refit();
    io && io.disconnect();
    io = new IntersectionObserver(entries => {
      const hit = entries.filter(e => e.isIntersecting);
      if (!hit.length) return;
      hit.forEach(e => io.unobserve(e.target));
      if (fitLines(hit.map(e => e.target))) scheduleSettle();
    }, { rootMargin: '200px 0px' });
    allLines().forEach(l => { if (!inViewport(l)) io.observe(l); });
    return false;
  }

  /* ---------- Un solo agendador para todos los disparadores ---------- */

  let raf = 0, wantAll = false, wantSettle = false, ioReady = false, usedFallback = false;

  function settle() { window.dispatchEvent(new Event('jsf:layout-settled')); }
  let settleRaf = 0;
  function scheduleSettle() {
    if (settleRaf) return;
    settleRaf = requestAnimationFrame(() => { settleRaf = 0; settle(); });
  }

  // all: re-mide todas las líneas (resize, llegó la fuente). settleAnyway: el layout cambió
  // aunque ningún tamaño lo haga (la fuente nueva reacomoda los párrafos).
  function scheduleFit(all, settleAnyway) {
    wantAll = wantAll || !!all;
    wantSettle = wantSettle || !!settleAnyway;
    if (!raf) raf = requestAnimationFrame(flush);
  }

  function flush() {
    raf = 0;
    const all = wantAll, force = wantSettle;
    wantAll = wantSettle = false;
    if (!fontReady()) usedFallback = true;
    let changed;
    if (all) {
      changed = refit();
      if (io) io.disconnect();
      ioReady = true;
      usedFallback = !fontReady();
    } else {
      changed = fitVisible();
      if (!ioReady) { observeOffscreen(); ioReady = true; }
    }
    if (changed || force) settle();
  }

  // API para otros scripts (motion.js parte los títulos en letras y necesita re-medir).
  function fitNow(els) {
    const lines = [];
    els.forEach(el => {
      if (el.classList && el.classList.contains('fit-line')) lines.push(el);
      el.querySelectorAll && el.querySelectorAll('.fit-line').forEach(l => lines.push(l));
    });
    if (fitLines(lines)) scheduleSettle();
  }

  // Ejecutar de inmediato: los scripts defer corren con el DOM ya parseado,
  // y fit.js va ANTES que motion.js, así el split de letras respeta las líneas.
  prepare();

  // 1ª pasada: solo lo visible (LCP-crítico); el resto, diferido a viewport
  scheduleFit(false);

  // Cuando termina de cargar Archivo (más ancha que la fuente de respaldo) se reajusta TODO si
  // algo ya se había medido con la de respaldo. Sin esto los títulos quedaban más grandes que
  // su caja (se notaba con "reducir movimiento" activado).
  const onFont = settleAnyway => scheduleFit(usedFallback, settleAnyway);
  if (document.fonts && document.fonts.addEventListener) {
    document.fonts.addEventListener('loadingdone', () => scheduleFit(true, true));
  }
  if (document.fonts && document.fonts.load) {
    document.fonts.load('900 1em "Archivo"').then(() => onFont(false)).catch(() => {});
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => onFont(false));
  window.addEventListener('load', () => scheduleFit(false), { once: true });
  window.addEventListener('resize', () => scheduleFit(true), { passive: true });
  window.addEventListener('orientationchange', () => scheduleFit(true), { passive: true });

  window.JSFfit = {
    prepare,
    // sync=true: ajusta ya (cambio de idioma, para no mostrar un frame sin ajustar)
    refit(sync) {
      if (!sync) { scheduleFit(true); return; }
      if (fitLines(allLines())) scheduleSettle();
      if (io) io.disconnect();
      ioReady = true;
    },
    fit: fitNow,
  };
})();
