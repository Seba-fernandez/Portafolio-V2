/* ════════════════════════════════════════════════
   MOTION — GSAP + ScrollTrigger
   Mejora progresiva: sin JS o con reduced-motion,
   todo queda visible y usable.
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || reduceMotion) {
    document.documentElement.classList.remove('js');
    document.documentElement.classList.add('js-lite');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // fit.js avisa cuando el layout es definitivo (fuente cargada): se re-miden los triggers.
  window.addEventListener('jsf:layout-settled', () => {
    requestAnimationFrame(() => ScrollTrigger.refresh());
  });

  /* ---------- Split accesible: copia sr-only + chars aria-hidden ---------- */

  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = text;
    el.appendChild(sr);
    for (const ch of text) {
      const span = document.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(span);
    }
    return el.querySelectorAll('.char');
  }

  function splitWords(el) {
    const nodes = Array.from(el.childNodes);
    const sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.textContent = el.textContent.trim();
    el.textContent = '';
    el.appendChild(sr);
    const push = (text, wrapper) => {
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { el.appendChild(document.createTextNode(' ')); return; }
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
        el.appendChild(w);
      });
    };
    nodes.forEach(n => {
      if (n.nodeType === Node.TEXT_NODE) push(n.textContent, null);
      else if (n.nodeType === Node.ELEMENT_NODE) push(n.textContent, n);
    });
    return el.querySelectorAll('.word');
  }

  /* ---------- Hero: entrada con golpe ---------- */

  const intro = gsap.timeline({ defaults: { ease: 'back.out(1.4)' } });

  document.querySelectorAll('.hero__line').forEach((line, i) => {
    line.style.overflow = 'hidden';
    intro.to(splitChars(line), {
      y: 0, rotate: 0, duration: 0.9,
      stagger: { each: 0.028, from: i === 0 ? 'start' : 'end' },
    }, i * 0.15);
  });

  intro
    .from('.hero__strip', { scaleX: 0, transformOrigin: 'left center', duration: 0.75, ease: 'power4.inOut' }, 0.35)
    .from('.hero__bottom > *, .hero__stats .stat', { opacity: 0, y: 30, duration: 0.7, stagger: 0.08, ease: 'power3.out' }, 0.7)
    .from('.hero__badge', { scale: 0, rotation: -120, duration: 0.9, ease: 'back.out(1.7)' }, 0.9)
    .from('.hero__top > *', { opacity: 0, y: -14, duration: 0.6, stagger: 0.1, ease: 'power3.out' }, 0.95)
    // La nav solo con opacidad: un transform inline le ganaría al translate del CSS (auto-ocultar).
    .from('.nav', { opacity: 0, duration: 0.6, ease: 'power3.out', clearProps: 'opacity' }, 1);

  /* ---------- Títulos gigantes: reveal por letra ---------- */

  document.querySelectorAll('.giant-title[data-split], .footer__cta-text[data-split]').forEach(el => {
    const lines = el.querySelectorAll(':scope > .fit-line');
    const targets = lines.length ? Array.from(lines) : [el];
    if (!lines.length) el.style.overflow = 'hidden';
    const chars = targets.flatMap(l => Array.from(splitChars(l)));
    gsap.to(chars, {
      y: 0, rotate: 0, duration: 0.8, ease: 'back.out(1.5)', stagger: 0.03,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  /* ---------- Manifiesto: se entinta con el scroll ---------- */

  const manifesto = document.querySelector('[data-words]');
  if (manifesto) {
    gsap.to(splitWords(manifesto), {
      opacity: 1, stagger: 0.05, ease: 'none',
      scrollTrigger: { trigger: manifesto, start: 'top 82%', end: 'bottom 50%', scrub: 0.5 },
    });
  }

  /* ---------- Encabezados de sección ---------- */

  gsap.utils.toArray('.section-head').forEach(head => {
    gsap.from(head.querySelectorAll('.section-head__tag, .tag'), {
      opacity: 0, y: 16, scale: 0.9, duration: 0.55, stagger: 0.06, ease: 'back.out(1.6)',
      scrollTrigger: { trigger: head, start: 'top 90%', once: true },
    });
  });

  /* ---------- Casos destacados ---------- */

  const mm = gsap.matchMedia();

  gsap.utils.toArray('.case').forEach(c => {
    const info = c.querySelector('.case__info');
    gsap.from(info.querySelectorAll(':scope > *'), {
      opacity: 0, y: 32, duration: 0.75, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: c, start: 'top 75%', once: true },
    });
    gsap.from(info.querySelectorAll('.tags .tag, .stack li'), {
      opacity: 0, scale: 0.6, duration: 0.5, ease: 'back.out(2)', stagger: 0.035,
      scrollTrigger: { trigger: info, start: 'top 70%', once: true },
    });
    gsap.from(c.querySelectorAll('.shot-label'), {
      opacity: 0, y: 10, rotate: -6, duration: 0.6, ease: 'back.out(2)', stagger: 0.15,
      scrollTrigger: { trigger: c, start: 'top 70%', once: true },
    });
  });

  // Parallax de capturas: solo donde la composición desktop + teléfono está visible.
  mm.add('(min-width: 701px)', () => {
    gsap.utils.toArray('.case').forEach(c => {
      const st = { trigger: c, start: 'top bottom', end: 'bottom top', scrub: 0.8 };
      const d = c.querySelector('.shot-d');
      const m = c.querySelector('.shot-m');
      if (d) gsap.fromTo(d, { y: 36 }, { y: -36, ease: 'none', scrollTrigger: st });
      if (m) gsap.fromTo(m, { y: 90, rotate: 3 }, { y: -50, rotate: -2, ease: 'none', scrollTrigger: st });
    });
  });
  mm.add('(max-width: 700px)', () => {
    gsap.utils.toArray('.case .shot-m').forEach(m => {
      gsap.from(m, {
        y: 80, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: m, start: 'top 95%', once: true },
      });
    });
  });

  /* ---------- Archivo ---------- */

  const archive = document.querySelector('.archive');
  if (archive) {
    gsap.from(archive.querySelectorAll('.archive__eyebrow, .archive__title, .view-switch, .filters__row, .filters__count'), {
      opacity: 0, y: 26, duration: 0.7, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: archive, start: 'top 75%', once: true },
    });
    gsap.from('.arc-item', {
      opacity: 0, y: 30, duration: 0.6, ease: 'power3.out', stagger: 0.07,
      scrollTrigger: { trigger: '.arc-list', start: 'top 85%', once: true },
    });
  }

  /* ---------- Skills: pop de columnas + onda que se dibuja ---------- */

  document.querySelectorAll('.skills-col').forEach((col, i) => {
    gsap.from(col, {
      opacity: 0, y: 40, rotation: i % 2 ? 2 : -2,
      duration: 0.7, ease: 'back.out(1.4)',
      scrollTrigger: { trigger: col, start: 'top 90%', once: true },
    });
  });

  const wave = document.querySelector('.wave__path');
  if (wave) {
    const len = wave.getTotalLength();
    gsap.fromTo(wave,
      { strokeDasharray: len, strokeDashoffset: len },
      { strokeDashoffset: 0, ease: 'none',
        scrollTrigger: { trigger: '.wave', start: 'top 95%', end: 'top 45%', scrub: 0.5 } });
  }

  gsap.from('.xp', {
    opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.xp', start: 'top 88%', once: true },
  });

  gsap.from('.footer__contact, .footer__links a', {
    opacity: 0, y: 20, duration: 0.6, ease: 'power3.out', stagger: 0.06,
    scrollTrigger: { trigger: '.footer__contact', start: 'top 95%', once: true },
  });

  /* ---------- Marquees: skew según la velocidad del scroll ---------- */

  const skewed = document.querySelectorAll('.marquee, .hero__strip, .band');
  if (skewed.length) {
    const setters = Array.from(skewed).map(m => gsap.quickSetter(m, 'skewX', 'deg'));
    const clamp = gsap.utils.clamp(-10, 10);
    let target = 0, current = 0;
    ScrollTrigger.create({ onUpdate(self) { target = clamp(self.getVelocity() / -250); } });
    gsap.ticker.add(() => {
      target *= 0.88;
      current += (target - current) * 0.18;
      if (Math.abs(current) < 0.02 && Math.abs(target) < 0.02) {
        if (current !== 0) { current = 0; setters.forEach(s => s(0)); }
        return;
      }
      setters.forEach(s => s(current));
    });
  }

  /* ---------- Cursor (solo puntero fino) ---------- */

  if (window.matchMedia('(pointer: fine)').matches) {
    const cursor = document.querySelector('.cursor');
    if (cursor) {
      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
      const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
      window.addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });
      const hot = 'a, button, [data-open]';
      document.addEventListener('pointerover', e => {
        if (e.target.closest(hot)) gsap.to(cursor, { scale: 3, duration: 0.25 });
      }, { passive: true });
      document.addEventListener('pointerout', e => {
        if (e.target.closest(hot) && !e.relatedTarget?.closest?.(hot)) gsap.to(cursor, { scale: 1, duration: 0.25 });
      }, { passive: true });
    }
  }

  /* ---------- API mínima para app.js (cambio de idioma) ---------- */

  window.JSF = {
    refreshSplits() { ScrollTrigger.refresh(); },
  };
})();
