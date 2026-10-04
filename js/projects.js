/* ════════════════════════════════════════════════
   PROYECTOS — archivo filtrable, vistas y modal
   Datos: <script id="projectsData"> (generado desde data/projects.json).
   Sin JS, cada fila del archivo es un link al sitio en vivo.
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const dataEl = document.getElementById('projectsData');
  if (!dataEl) return;

  const root = document.documentElement;
  const DATA = JSON.parse(dataEl.textContent);
  const byId = Object.fromEntries(DATA.projects.map(p => [p.id, p]));
  const ORDER = DATA.projects.map(p => p.id);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D_W = [960, 1440, 2160, 2880];
  const M_W = [390, 780, 1170];

  const UI = {
    es: {
      all: 'Todos',
      count: n => (n === 1 ? '1 proyecto' : `${n} proyectos`),
      none: 'Ningún proyecto combina esos dos filtros.',
      reset: 'Ver todos',
      desk: 'Captura desktop de ',
      mob: 'Captura mobile de ',
    },
    en: {
      all: 'All',
      count: n => (n === 1 ? '1 project' : `${n} projects`),
      none: 'No project matches both filters.',
      reset: 'Show all',
      desk: 'Desktop screenshot of ',
      mob: 'Mobile screenshot of ',
    },
  };

  let lang = root.lang === 'en' ? 'en' : 'es';
  const L = o => (o ? (o[lang] !== undefined ? o[lang] : o.es) : '');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const srcset = (id, kind, ws) => ws.map(w => `img/p/${id}-${kind}-${w}.webp ${w}w`).join(', ');
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
  };

  /* ---------- Traducción del contenido de los proyectos ---------- */

  function translateStatic() {
    document.querySelectorAll('[data-pf]').forEach(el => {
      const [id, field, idx] = el.dataset.pf.split(':');
      const p = byId[id];
      if (!p || !p[field]) return;
      el.textContent = idx !== undefined ? (p[field][lang] || p[field].es)[+idx] : L(p[field]);
    });
    document.querySelectorAll('[data-pt]').forEach(el => {
      const [kind, key] = el.dataset.pt.split(':');
      const dict = kind === 'type' ? DATA.types : kind === 'origin' ? DATA.origins : DATA.focus;
      if (dict[key]) el.textContent = L(dict[key]);
    });
    document.querySelectorAll('[data-pa]').forEach(el => {
      const [id, kind] = el.dataset.pa.split(':');
      if (byId[id]) el.alt = (kind === 'd' ? UI[lang].desk : UI[lang].mob) + L(byId[id].alt);
    });
  }

  /* ---------- Archivo: filtros por tipo y enfoque ---------- */

  const list = document.getElementById('arcList');
  const items = Array.from(list.querySelectorAll('.arc-item'));
  const fType = document.getElementById('fType');
  const fFocus = document.getElementById('fFocus');
  const fCount = document.getElementById('fCount');
  const state = { type: 'all', focus: null };

  // Sin proyectos fuera de los destacados, la sección y su franja no se muestran.
  if (!items.length) {
    document.getElementById('archive').hidden = true;
    const band = document.querySelector('.band');
    if (band) band.hidden = true;
  }

  items.forEach((li, i) => {
    const a = li.querySelector('[data-open]');
    li.style.viewTransitionName = `arc-${a ? a.dataset.open : i}`;
  });

  const matches = (li, type, focus) =>
    (type === 'all' || li.dataset.type === type) &&
    (!focus || li.dataset.focus.split(' ').includes(focus));

  function renderChips() {
    const typeKeys = Object.keys(DATA.types).filter(k => items.some(li => li.dataset.type === k));
    const focusKeys = Object.keys(DATA.focus).filter(k => items.some(li => li.dataset.focus.split(' ').includes(k)));

    const chip = (cls, attr, label, n, on) =>
      `<button class="pill-btn fchip ${cls}${on ? ' is-on' : ''}" type="button" ${attr} aria-pressed="${on}">` +
      `${esc(label)} <span class="fchip__c">${n}</span></button>`;

    fType.innerHTML =
      chip('', 'data-type="all"', UI[lang].all, items.length, state.type === 'all') +
      typeKeys.map(k => chip('', `data-type="${k}"`, L(DATA.types[k]),
        items.filter(li => li.dataset.type === k).length, state.type === k)).join('');

    fFocus.innerHTML = focusKeys.map(k => chip('fchip--focus', `data-focus="${k}"`, '✳ ' + L(DATA.focus[k]),
      items.filter(li => li.dataset.focus.split(' ').includes(k)).length, state.focus === k)).join('');
  }

  function renderCount(n) {
    if (n) { fCount.textContent = UI[lang].count(n); return; }
    fCount.innerHTML = `${esc(UI[lang].none)} <button class="pill-btn" type="button" data-reset>${esc(UI[lang].reset)}</button>`;
  }

  function applyFilters() {
    const run = () => {
      let shown = 0;
      items.forEach(li => {
        const ok = matches(li, state.type, state.focus);
        li.hidden = !ok;
        if (ok) shown++;
      });
      renderChips();
      renderCount(shown);
    };
    if (document.startViewTransition && !reduceMotion) document.startViewTransition(run);
    else run();
    if (window.ScrollTrigger) requestAnimationFrame(() => window.ScrollTrigger.refresh());
  }

  fType.addEventListener('click', e => {
    const b = e.target.closest('[data-type]');
    if (!b) return;
    state.type = b.dataset.type;
    applyFilters();
    fType.querySelector(`[data-type="${state.type}"]`)?.focus();
  });
  fFocus.addEventListener('click', e => {
    const b = e.target.closest('[data-focus]');
    if (!b) return;
    state.focus = state.focus === b.dataset.focus ? null : b.dataset.focus;
    applyFilters();
    fFocus.querySelector(`[data-focus="${b.dataset.focus}"]`)?.focus();
  });
  fCount.addEventListener('click', e => {
    if (!e.target.closest('[data-reset]')) return;
    state.type = 'all'; state.focus = null;
    applyFilters();
    fType.querySelector('[data-type="all"]')?.focus();
  });

  /* ---------- Vista lista / grilla ---------- */

  const viewBtns = document.querySelectorAll('[data-view]');
  function setView(view, animate) {
    const run = () => {
      list.classList.toggle('is-grid', view === 'grid');
      viewBtns.forEach(b => {
        const on = b.dataset.view === view;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', on);
      });
    };
    if (animate && document.startViewTransition && !reduceMotion) document.startViewTransition(run);
    else run();
    store.set('jsf-view', view);
    if (window.ScrollTrigger) requestAnimationFrame(() => window.ScrollTrigger.refresh());
  }
  viewBtns.forEach(b => b.addEventListener('click', () => setView(b.dataset.view, true)));
  setView(store.get('jsf-view') === 'grid' ? 'grid' : 'list', false);

  /* ---------- Modal de proyecto (<dialog>: capa superior nativa) ---------- */

  const dlg = document.getElementById('projectDialog');
  const $ = s => dlg.querySelector(s);
  const dImg = $('.pd__d');
  const mWrap = $('.pd__m');
  const mImg = mWrap.querySelector('img');
  const shotBtns = dlg.querySelectorAll('[data-shot]');
  let current = null;
  let shot = 'd';
  let lastFocus = null;

  function setShot(s) {
    shot = s;
    dImg.hidden = s !== 'd';
    mWrap.hidden = s !== 'm';
    shotBtns.forEach(b => {
      const on = b.dataset.shot === s;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on);
    });
  }

  function fill(id) {
    const p = byId[id];
    current = id;
    const tags = [
      `<li class="tag tag--ink">${esc(L(DATA.origins[p.origin]))}</li>`,
      '<li class="tag tag--coral"><span class="dot" aria-hidden="true"></span>Live</li>',
      `<li class="tag tag--peach">${esc(L(DATA.types[p.type]))}</li>`,
      ...p.focus.map(f => `<li class="tag tag--sage">${esc(L(DATA.focus[f]))}</li>`),
    ];
    $('.pd__tags').innerHTML = tags.join('');
    $('.pd__kicker').textContent = L(p.kicker);
    $('.pd__title').textContent = L(p.name);
    $('.pd__context').textContent = L(p.context);
    const solved = p.solved[lang] || p.solved.es;
    $('.pd__count').textContent = solved.length;
    $('.pd__solved').innerHTML = solved.map((t, i) =>
      `<li><span class="case__n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span>${esc(t)}</span></li>`).join('');
    const note = $('.pd__note');
    note.hidden = !p.note;
    note.textContent = p.note ? L(p.note) : '';
    $('.pd__stack').innerHTML = p.stack.map(s => `<li>${esc(s)}</li>`).join('');
    $('.pd__live').href = p.live;
    const code = $('.pd__code');
    code.hidden = !p.code;
    if (p.code) code.href = p.code;

    $('.pd__stage').style.setProperty('--ph', p.placeholder);
    mWrap.style.setProperty('--ph', p.placeholder);
    dImg.sizes = '(min-width: 901px) 58vw, 100vw';
    dImg.srcset = srcset(id, 'd', D_W);
    dImg.src = `img/p/${id}-d-1440.webp`;
    dImg.alt = UI[lang].desk + L(p.alt);
    mImg.sizes = '(min-width: 901px) 18rem, 60vw';
    mImg.srcset = srcset(id, 'm', M_W);
    mImg.src = `img/p/${id}-m-780.webp`;
    mImg.alt = UI[lang].mob + L(p.alt);

    const i = ORDER.indexOf(id);
    const prev = byId[ORDER[(i - 1 + ORDER.length) % ORDER.length]];
    const next = byId[ORDER[(i + 1) % ORDER.length]];
    $('[data-step="-1"] .pd__step-name').textContent = L(prev.name);
    $('[data-step="1"] .pd__step-name').textContent = L(next.name);
    $('.pd__info').scrollTop = 0;
    $('.pd__inner').scrollTop = 0;
  }

  function open(id) {
    if (!byId[id]) return;
    if (!dlg.open) lastFocus = document.activeElement;
    fill(id);
    setShot(window.matchMedia('(max-width: 700px)').matches ? 'm' : 'd');
    if (!dlg.open) {
      dlg.showModal();
      root.classList.add('is-locked');
    }
    history.replaceState(null, '', `#ver-${id}`);
  }

  function step(dir) {
    const i = ORDER.indexOf(current);
    const keep = shot;
    fill(ORDER[(i + dir + ORDER.length) % ORDER.length]);
    setShot(keep);
    history.replaceState(null, '', `#ver-${current}`);
  }

  dlg.addEventListener('close', () => {
    root.classList.remove('is-locked');
    history.replaceState(null, '', location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  $('.pd__close').addEventListener('click', () => dlg.close());
  dlg.querySelectorAll('[data-step]').forEach(b => b.addEventListener('click', () => step(+b.dataset.step)));
  shotBtns.forEach(b => b.addEventListener('click', () => setShot(b.dataset.shot)));
  dlg.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') step(1);
    if (e.key === 'ArrowLeft') step(-1);
  });

  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-open]');
    if (!trigger) return;
    // Ctrl/Cmd/Shift + click en una fila: se respeta abrir el sitio en otra pestaña.
    if (trigger.tagName === 'A' && (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)) return;
    e.preventDefault();
    open(trigger.dataset.open);
  });

  // Precarga de las capturas en alta al pasar el puntero o enfocar: el modal abre nítido.
  const warmed = new Set();
  function warm(id) {
    if (!id || warmed.has(id)) return;
    warmed.add(id);
    const d = new Image();
    d.sizes = '(min-width: 901px) 58vw, 100vw';
    d.srcset = srcset(id, 'd', D_W);
    const m = new Image();
    m.sizes = '(min-width: 901px) 18rem, 60vw';
    m.srcset = srcset(id, 'm', M_W);
  }
  document.addEventListener('pointerover', e => warm(e.target.closest?.('[data-open]')?.dataset.open), { passive: true });
  document.addEventListener('focusin', e => warm(e.target.closest?.('[data-open]')?.dataset.open));

  /* ---------- Idioma ---------- */

  window.addEventListener('jsf:lang', e => {
    lang = e.detail.lang === 'en' ? 'en' : 'es';
    translateStatic();
    renderChips();
    renderCount(items.filter(li => !li.hidden).length);
    if (dlg.open && current) { const keep = shot; fill(current); setShot(keep); }
  });

  /* ---------- Inicio ---------- */

  if (lang === 'en') translateStatic();
  renderChips();
  renderCount(items.length);

  const deep = location.hash.match(/^#ver-([\w-]+)$/);
  if (deep && byId[deep[1]]) open(deep[1]);
})();
