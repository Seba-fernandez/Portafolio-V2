/* ════════════════════════════════════════════════
   MOTION — GSAP + ScrollTrigger
   Progressive enhancement: sin JS o con
   reduced-motion, todo queda visible y usable.
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (typeof gsap === 'undefined' || reduceMotion) {
    document.documentElement.classList.remove('js');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

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
      span.textContent = ch === ' ' ? '\u00A0' : ch;
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
    .from('.hero__strip', { scaleX: 0, transformOrigin: 'left center', duration: 0.7, ease: 'power4.inOut' }, 0.35)
    .from('.hero__bottom > *', { opacity: 0, y: 30, duration: 0.7, stagger: 0.12, ease: 'power3.out' }, 0.7)
    .from('.hero__badge', { scale: 0, rotation: -120, duration: 0.9, ease: 'back.out(1.7)' }, 0.9)
    .from('.hero__coords, .tickets', { opacity: 0, y: -16, duration: 0.6, ease: 'power3.out', stagger: 0.1 }, 1);

  /* ---------- Títulos: reveal al entrar en viewport ---------- */

  document.querySelectorAll('.project__title[data-split], .giant-title[data-split], .footer__cta-text[data-split]').forEach(el => {
    // Si fit.js dividió en .fit-line, se splitea línea por línea
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

  /* ---------- Proyectos: parallax de marcos y números ---------- */

  document.querySelectorAll('.project').forEach(section => {
    const frame = section.querySelector('[data-parallax]');
    const num = section.querySelector('.project__num');
    const st = { trigger: section, start: 'top bottom', end: 'bottom top' };

    if (frame) gsap.fromTo(frame, { y: 60 }, { y: -60, ease: 'none', scrollTrigger: { ...st, scrub: 0.6 } });
    if (num) gsap.fromTo(num, { y: 90 }, { y: -40, ease: 'none', scrollTrigger: { ...st, scrub: 1 } });

    gsap.from(section.querySelectorAll('.project__meta, .project__desc, .project__result, .tags, .project__links'), {
      opacity: 0, y: 28, duration: 0.7, ease: 'power3.out', stagger: 0.08,
      scrollTrigger: { trigger: section, start: 'top 70%', once: true },
    });
  });

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
        scrollTrigger: { trigger: '.wave', start: 'top 95%', end: 'top 45%', scrub: 0.5 } }
    );
  }

  gsap.from('.xp', {
    opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.xp', start: 'top 88%', once: true },
  });

  /* ---------- Marquees: skew según velocidad de scroll ----------
     Va al contenedor: el track ya anima transform en CSS. */

  const marquees = document.querySelectorAll('.marquee, .hero__strip');
  if (marquees.length) {
    const setters = Array.from(marquees).map(m => gsap.quickSetter(m, 'skewX', 'deg'));
    const clamp = gsap.utils.clamp(-10, 10);
    let target = 0, current = 0;

    // Sin asignar tweens durante el scroll: un solo lerp en el ticker.
    ScrollTrigger.create({
      onUpdate(self) { target = clamp(self.getVelocity() / -250); },
    });
    gsap.ticker.add(() => {
      target *= 0.88;                                  // decae hacia 0
      current += (target - current) * 0.18;            // sigue con suavidad
      if (Math.abs(current) < 0.02 && Math.abs(target) < 0.02) {
        if (current !== 0) { current = 0; setters.forEach(s => s(0)); }
        return;
      }
      setters.forEach(s => s(current));
    });
  }

  /* ---------- Cursor follower (solo puntero fino) ---------- */

  if (window.matchMedia('(pointer: fine)').matches) {
    const cursor = document.querySelector('.cursor');
    if (cursor) {
      const xTo = gsap.quickTo(cursor, 'x', { duration: 0.35, ease: 'power3' });
      const yTo = gsap.quickTo(cursor, 'y', { duration: 0.35, ease: 'power3' });
      window.addEventListener('pointermove', e => { xTo(e.clientX); yTo(e.clientY); }, { passive: true });

      document.querySelectorAll('a, button, [data-hover]').forEach(el => {
        el.addEventListener('pointerenter', () => gsap.to(cursor, { scale: 3, duration: 0.25 }));
        el.addEventListener('pointerleave', () => gsap.to(cursor, { scale: 1, duration: 0.25 }));
      });
    }
  }

  /* ---------- API mínima para app.js (cambio de idioma) ---------- */

  window.JSF = {
    // Tras cambiar textos o tamaños, recalcula posiciones de los triggers.
    refreshSplits() { ScrollTrigger.refresh(); },
  };
})();