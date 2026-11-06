/* ════════════════════════════════════════════════
   MOTION
   Un solo lenguaje: recorridos cortos, arranque firme, asentado breve.
   · Apariciones: IntersectionObserver + transiciones CSS (compositor, sin
     ScrollTriggers por elemento ni lecturas de layout en cada frame).
   · GSAP solo para lo que va atado al scroll: manifiesto, parallax de
     capturas, onda, inclinación de las cintas y cursor.
   Mejora progresiva: sin JS o con "reducir movimiento" todo queda visible.
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    root.classList.remove('js');
    root.classList.add('js-lite');
    return;
  }
  let hasGsap = false;
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Split accesible: copia sr-only + piezas aria-hidden ---------- */

  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    const frag = document.createDocumentFragment();
    frag.appendChild(sr);
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch === ' ' ? ' ' : ch;
      frag.appendChild(span);
    }
    el.appendChild(frag);
    return Array.from(el.querySelectorAll('.char'));
  }

  // Sin lecturas de layout: arma todo en un fragmento y lo inserta de una vez.
  function splitWords(el) {
    const nodes = Array.from(el.childNodes);
    const text = el.textContent.trim();
    const frag = document.createDocumentFragment();
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    frag.appendChild(sr);
    const push = (txt, wrapper) => {
      txt.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const w = document.createElement('span');
        w.className = 'word';
        w.setAttribute('aria-hidden', 'true');
        if (wrapper) {
          const clone = wrapper.cloneNode(false);
          clone.textContent = part;
          w.appendChild(clone);
        } else {
          w.textContent = part;
        }
        frag.appendChild(w);
      });
    };
    nodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) push(n.textContent, null);
      else if (n.nodeType === Node.ELEMENT_NODE) push(n.textContent, n);
    });
    el.textContent = '';
    el.appendChild(frag);
    return el.querySelectorAll('.word');
  }

  /* ---------- Motor de apariciones ---------- */

  // Duración de cada tipo (ms), para limpiar las clases al terminar.
  const DUR = { base: 560, down: 560, media: 700, stamp: 300, char: 620 };
  // Paso entre elementos que entran juntos en pantalla.
  const STEP = { base: 55, down: 55, media: 90, stamp: 32 };
  const MAX_DELAY = 420;

  const pending = new Map(); // elemento → { kind, show }

  function finish(el, kind, after) {
    setTimeout(() => {
      el.classList.remove('rv', 'rv--' + kind, 'is-in', 'rv-now');
      el.style.removeProperty('--d');
    }, after);
  }

  // Muestra un elemento simple (con su retardo) y lo deja limpio al terminar.
  function play(el, kind, delay, instant) {
    if (instant) el.classList.add('rv-now');
    else el.style.setProperty('--d', delay + 'ms');
    el.classList.add('is-in');
    finish(el, kind, instant ? 50 : delay + DUR[kind] + 60);
  }

  function reveal(el, delay, instant) {
    const it = pending.get(el);
    if (!it) return;
    pending.delete(el);
    io.unobserve(el);
    if (it.show) it.show(delay, instant);
    else play(el, it.kind, delay, instant);
  }

  // Lo que entra junto en pantalla se escalona en orden de lectura;
  // lo que ya quedó arriba (recarga a mitad de página) aparece sin animar.
  const io = new IntersectionObserver(entries => {
    const batch = [];
    for (const e of entries) {
      if (!pending.has(e.target)) continue;
      if (e.isIntersecting) batch.push(e);
      else if (e.boundingClientRect.bottom <= 0) reveal(e.target, 0, true);
    }
    batch.sort((a, b) => (a.boundingClientRect.top - b.boundingClientRect.top) ||
                         (a.boundingClientRect.left - b.boundingClientRect.left));
    let t = 0;
    for (const e of batch) {
      // Un mismo elemento puede llegar dos veces en la misma tanda: la segunda ya no está pendiente.
      const it = pending.get(e.target);
      if (!it) continue;
      const kind = it.kind;
      reveal(e.target, Math.min(t, MAX_DELAY), false);
      t += STEP[kind] || STEP.base;
    }
  }, { rootMargin: '0px 0px -6% 0px' });

  // Un scroll muy rápido (o un salto a un ancla) puede pasar por encima de un elemento sin que el
  // observador lo vea entrar: al terminar el scroll, lo que quedó arriba se muestra sin animar.
  const sweep = () => {
    for (const el of [...pending.keys()]) {
      if (el.getBoundingClientRect().bottom <= 0) reveal(el, 0, true);
    }
  };
  if ('onscrollend' in window) window.addEventListener('scrollend', sweep, { passive: true });
  else {
    let sweepT;
    window.addEventListener('scroll', () => { clearTimeout(sweepT); sweepT = setTimeout(sweep, 150); }, { passive: true });
  }

  // Observa un elemento y corre `show` cuando entra (sin tocar sus clases).
  function watch(el, kind, show) {
    pending.set(el, { kind, show });
    io.observe(el);
  }
  // Registra un elemento: queda oculto (estado inicial en CSS) hasta que entra.
  function rv(el, kind = 'base') {
    if (!el || pending.has(el)) return;
    el.classList.add('rv');
    if (kind !== 'base') el.classList.add('rv--' + kind);
    watch(el, kind);
  }
  const rvAll = (sel, kind, ctx) => $$(sel, ctx).forEach(el => rv(el, kind));

  // Letras: cada una con su retardo; `reverse` las escalona de derecha a izquierda.
  function playChars(chars, delay, instant, step = 16, reverse = false) {
    const n = chars.length;
    chars.forEach((c, i) => play(c, 'char', delay + (reverse ? n - 1 - i : i) * step, instant));
  }

  /* ---------- Hero ----------
     Chips, cinta, intro, stats y nav entran con @keyframes en CSS (primer pintado, sin JS).
     Aquí solo el nombre: se parte en letras y entra sin esperar al scroll. */

  const heroLines = $$('.hero__line');
  heroLines.forEach((line, i) => {
    line.style.overflow = 'hidden';
    const chars = splitChars(line);
    chars.forEach(c => c.classList.add('rv', 'rv--char'));
    line._chars = chars;
    line._delay = i * 90;
    line._reverse = i === 1;
  });

  // Letras armadas: se libera el resguardo del CSS y arrancan en el próximo frame.
  root.classList.add('rv-ready');
  requestAnimationFrame(() => requestAnimationFrame(() => {
    heroLines.forEach(l => playChars(l._chars, l._delay, false, 16, l._reverse));
  }));

  /* ---------- Títulos gigantes: letras desde la línea base ----------
     Se parten en letras recién cuando se acercan al viewport (~800 px): los que están
     lejos no cuestan nada al cargar. Los que quedaron por encima (recarga a mitad de
     página) los deja visibles el propio observador de apariciones. */

  function setupTitle(el) {
    if (el.querySelector('.char')) return;
    const lines = $$(':scope > .fit-line', el);
    const targets = lines.length ? lines : [el];
    if (!lines.length) el.style.overflow = 'hidden';
    const chars = targets.flatMap(l => splitChars(l));
    chars.forEach(c => c.classList.add('rv', 'rv--char'));
    watch(el, 'char', (d, instant) => playChars(chars, d, instant, 22));
    // Cada letra es un inline-block (sin kerning entre ellas): se vuelve a medir el renglón.
    if (window.JSFfit && window.JSFfit.fit) window.JSFfit.fit([el]);
  }
  const titles = $$('.giant-title[data-split], .footer__cta-text[data-split]');
  const splitIO = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      splitIO.unobserve(e.target);
      setupTitle(e.target);
    }
  }, { rootMargin: '800px 0px' });
  titles.forEach(el => splitIO.observe(el));

  /* ---------- Bloques ---------- */

  // Encabezados de sección
  $$('.section-head').forEach(head => {
    rvAll('.section-head__tag', 'base', head);
    rvAll('.section-head__tags .tag', 'stamp', head);
  });

  // Casos destacados: texto en cascada, chips como sellos
  const narrow = window.matchMedia('(max-width: 700px)').matches;
  $$('.case').forEach(c => {
    const info = c.querySelector('.case__info');
    if (info) {
      $$(':scope > *', info).forEach(el => {
        if (el.classList.contains('tags')) rvAll(':scope > .tag', 'stamp', el);
        else if (el.classList.contains('case__stack')) {
          rvAll(':scope > .label', 'base', el);
          rvAll('.stack li', 'stamp', el);
        } else rv(el);
      });
    }
    const media = c.querySelector('.case__media');
    if (!media) return;
    if (narrow) { rv(media, 'media'); return; }
    // Desktop: primero el papel de color, después las capturas y al final sus etiquetas
    const parts = [
      [c.querySelector('.shot-d'), 'media', 60],
      [c.querySelector('.shot-m'), 'media', 150],
      ...$$('.shot-label', media).map((el, i) => [el, 'stamp', 380 + i * 70]),
    ].filter(([el]) => el);
    parts.forEach(([el, kind]) => el.classList.add('rv', 'rv--' + kind));
    media.classList.add('rv-paper');
    watch(media, 'media', (d, instant) => {
      if (instant) media.classList.add('rv-now');
      media.classList.add('is-in');
      setTimeout(() => media.classList.remove('rv', 'rv-paper', 'is-in', 'rv-now'), instant ? 50 : d + 700);
      parts.forEach(([el, kind, pd]) => play(el, kind, d + pd, instant));
    });
  });

  // Archivo
  const archive = document.querySelector('.archive');
  if (archive) {
    rvAll('.archive__eyebrow, .archive__title, .view-switch, .filters__row, .filters__count', 'base', archive);
    const arcItems = $$('.arc-item', archive);
    arcItems.forEach(el => rv(el));
    // Al filtrar o cambiar de vista, lo que quedaba por aparecer se muestra ya
    // (la transición del filtro es la que anima).
    archive.addEventListener('click', e => {
      if (!e.target.closest('.filters, .view-switch')) return;
      arcItems.forEach(el => reveal(el, 0, true));
    }, true);
  }

  // Skills + experiencia
  $$('.skills-col').forEach(col => {
    rvAll(':scope > .tag', 'stamp', col);
    rvAll(':scope > ul', 'base', col);
  });
  rvAll('.xp__when', 'stamp');
  rvAll('.xp__role, .xp__list li');

  // Footer
  rvAll('.footer__badge', 'stamp');
  rvAll('.footer__eyebrow, .footer__contact');
  rvAll('.footer__links a', 'stamp');

  /* ---------- Atado al scroll (GSAP) ---------- */

  // El manifiesto se parte ya (queda en tinta tenue por CSS, sin destello); GSAP lo entinta con el scroll.
  const manifesto = document.querySelector('[data-words]');
  if (manifesto) splitWords(manifesto);

  let manifestoTween = null;
  function setupManifesto() {
    const el = manifesto;
    if (!el || !hasGsap) return;
    if (manifestoTween) { manifestoTween.scrollTrigger?.kill(); manifestoTween.kill(); }
    const words = el.querySelector('.word') ? el.querySelectorAll('.word') : splitWords(el);
    // Frente de tinta angosto: cada palabra se entinta rápido y la siguiente la sigue de cerca.
    // --ink (0 → 1) mezcla en CSS color y resaltador: sigue el tema y no baja el contraste.
    manifestoTween = gsap.fromTo(words, { '--ink': 0 }, {
      '--ink': 1, duration: 0.24, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: true },
    });
  }

  // GSAP llega después de la carga, en un momento libre: la entrada del hero no lo espera.
  function loadScript(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement('script');
      s.src = src; s.async = false;
      s.onload = ok; s.onerror = fail;
      document.head.appendChild(s);
    });
  }
  // GSAP solo hace falta para lo que responde al scroll o al puntero (manifiesto, cintas, cursor):
  // se descarga en un momento libre sin ejecutarse, y se ejecuta recién con la primera interacción.
  // Así la carga inicial no paga su arranque.
  const VENDOR = ['js/vendor/gsap.min.js', 'js/vendor/ScrollTrigger.min.js'];
  function whenIdle(fn) {
    const go = () => ('requestIdleCallback' in window ? requestIdleCallback(fn, { timeout: 1500 }) : setTimeout(fn, 300));
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
  }
  // La descarga anticipada espera unos segundos: así no compite con lo que se ve primero.
  const prefetch = (fn) => whenIdle(() => setTimeout(fn, 3000));
  prefetch(() => VENDOR.forEach((href) => {
    const l = document.createElement('link');
    l.rel = 'prefetch'; l.as = 'script'; l.href = href;
    document.head.appendChild(l);
  }));
  let started = false;
  const EVENTS = ['scroll', 'wheel', 'touchstart', 'pointermove', 'keydown'];
  const y0 = window.scrollY;
  function start(e) {
    // Un "scroll" sin movimiento real (lo dispara el navegador al acomodar la página) no cuenta.
    // Tampoco un movimiento de puntero sin desplazamiento (algunos navegadores lo emiten al cargar).
    if (started || (e && e.type === 'scroll' && window.scrollY === y0)) return;
    if (e && e.type === 'pointermove' && !(e.movementX || e.movementY)) return;
    started = true;
    EVENTS.forEach((ev) => window.removeEventListener(ev, start, { passive: true }));
    Promise.all(VENDOR.map(loadScript))
      .then(setupScroll)
      .catch(() => root.classList.add('no-gsap')); // sin GSAP: el manifiesto queda entintado
  }
  EVENTS.forEach((ev) => window.addEventListener(ev, start, { passive: true }));
  // Si la página abre ya scrolleada (recarga a mitad o un link con #), arranca enseguida.
  if (window.scrollY > 0 || location.hash) whenIdle(start);

  // Varios avisos en el mismo frame (fuente, ajuste, idioma) = un solo refresh.
  let refreshQueued = false;
  function queueRefresh() {
    if (refreshQueued || !hasGsap) return;
    refreshQueued = true;
    requestAnimationFrame(() => { refreshQueued = false; ScrollTrigger.refresh(); });
  }

  function setupScroll() {
    hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
    if (!hasGsap) { root.classList.add('no-gsap'); return; }
    gsap.registerPlugin(ScrollTrigger);
    // fit.js avisa cuando el layout es definitivo (fuente cargada): se re-miden los triggers.
    window.addEventListener('jsf:layout-settled', queueRefresh);

    setupManifesto();

    // Parallax y onda: si el navegador anima con el scroll en CSS (animation-timeline), lo hace él en
    // el compositor; GSAP queda solo como respaldo para los que no lo soportan.
    const cssScroll = CSS.supports('animation-timeline: view()');

    // Parallax de capturas: recorrido corto, pegado al scroll (sin arrastre).
    const mm = gsap.matchMedia();
    if (!cssScroll) mm.add('(min-width: 701px)', () => {
      $$('.case').forEach(c => {
        const st = { trigger: c, start: 'top bottom', end: 'bottom top', scrub: true };
        const d = c.querySelector('.shot-d');
        const m = c.querySelector('.shot-m');
        if (d) gsap.fromTo(d, { '--py': '14px' }, { '--py': '-14px', ease: 'none', scrollTrigger: st });
        if (m) gsap.fromTo(m, { '--py': '44px' }, { '--py': '-28px', ease: 'none', scrollTrigger: st });
      });
    });

    // Onda: se dibuja como un trazo, al ritmo del scroll
    const wave = document.querySelector('.wave__path');
    if (wave && !cssScroll) {
      const len = 1; // pathLength="1"
      gsap.fromTo(wave,
        { strokeDasharray: len, strokeDashoffset: len },
        { strokeDashoffset: 0, ease: 'none',
          scrollTrigger: { trigger: '.wave', start: 'top 95%', end: 'top 50%', scrub: true } });
    }

    // Cintas: se inclinan apenas con la velocidad del scroll y vuelven firmes enseguida.
    // Solo se tocan las que están en pantalla; las de afuera además pausan su animación.
    const skewed = $$('.marquee, .hero__strip, .band');
    if (skewed.length) {
      const setters = new Map(skewed.map(m => [m, gsap.quickSetter(m, 'skewX', 'deg')]));
      const onScreen = new Set();
      const vis = new IntersectionObserver(entries => entries.forEach(e => {
        e.target.classList.toggle('is-off', !e.isIntersecting);
        if (e.isIntersecting) onScreen.add(e.target);
        else { onScreen.delete(e.target); setters.get(e.target)(0); }
      }));
      skewed.forEach(m => vis.observe(m));
      const clamp = gsap.utils.clamp(-3, 3);
      let target = 0, current = 0;
      ScrollTrigger.create({ onUpdate(self) { target = clamp(self.getVelocity() / -500); } });
      gsap.ticker.add(() => {
        target *= 0.7;
        current += (target - current) * 0.5;
        if (Math.abs(current) < 0.02 && Math.abs(target) < 0.02) {
          if (current !== 0) { current = 0; onScreen.forEach(m => setters.get(m)(0)); }
          return;
        }
        onScreen.forEach(m => setters.get(m)(current));
      });
    }

    // Cursor (solo puntero fino): sigue de cerca, sin estela larga
    if (window.matchMedia('(pointer: fine)').matches) {
      const cursor = document.querySelector('.cursor');
      if (cursor) {
        const xTo = gsap.quickTo(cursor, 'x', { duration: 0.16, ease: 'power3' });
        const yTo = gsap.quickTo(cursor, 'y', { duration: 0.16, ease: 'power3' });
        window.addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
        const hot = 'a, button, [data-open]';
        document.addEventListener('pointerover', e => {
          if (e.target.closest(hot)) gsap.to(cursor, { scale: 2.6, duration: 0.2, ease: 'power3.out' });
        }, { passive: true });
        document.addEventListener('pointerout', e => {
          if (e.target.closest(hot) && !e.relatedTarget?.closest?.(hot)) gsap.to(cursor, { scale: 1, duration: 0.2, ease: 'power3.out' });
        }, { passive: true });
      }
    }
  }

  /* ---------- API mínima para app.js (cambio de idioma) ---------- */
  // Al cambiar de idioma el texto se reemplaza: se vuelve a partir lo que aún no apareció.

  window.JSF = {
    refreshSplits() {
      // Los títulos que ya estaban partidos y aún no aparecieron se vuelven a partir;
      // los que todavía no se partieron los toma el observador al acercarse.
      titles.forEach(el => { if (pending.has(el)) setupTitle(el); });
      const m = document.querySelector('[data-words]');
      if (m && !m.querySelector('.word')) { if (hasGsap) setupManifesto(); else splitWords(m); }
      queueRefresh();
    },
  };
})();
