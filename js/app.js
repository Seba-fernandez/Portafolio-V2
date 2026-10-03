/* ════════════════════════════════════════════════
   APP — nav, tema, idioma, contacto (sin dependencias)
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const root = document.documentElement;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
  };

  /* ---------- Nav flotante: --nav-h = borde inferior real ---------- */

  const nav = document.querySelector('.nav');
  const setNavH = () => {
    const r = nav.getBoundingClientRect();
    // Se mide sin el desplazamiento de "oculta" para que el valor sea estable.
    root.style.setProperty('--nav-h', Math.ceil(nav.offsetTop + r.height) + 'px');
  };
  setNavH();
  if ('ResizeObserver' in window) new ResizeObserver(setNavH).observe(nav);
  window.addEventListener('resize', setNavH, { passive: true });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setNavH);

  // Se esconde al bajar y vuelve al subir. Nunca se esconde con el foco adentro.
  let lastY = window.scrollY;
  let ticking = false;
  function onScroll() {
    const y = window.scrollY;
    const down = y > lastY + 6;
    const up = y < lastY - 6;
    const locked = root.classList.contains('is-locked') || nav.contains(document.activeElement);
    if (y < 140 || up || locked) nav.classList.remove('is-hidden');
    else if (down) nav.classList.add('is-hidden');
    if (down || up) lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  nav.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  /* ---------- Tema (el atributo inicial lo puso el snippet del <head>) ---------- */

  const themeBtn = document.getElementById('themeToggle');
  const themeMetas = document.querySelectorAll('meta[name="theme-color"]');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    themeMetas.forEach(m => { m.content = theme === 'dark' ? '#112F2C' : '#FBE6A0'; });
    themeBtn.querySelector('.tool__icon').textContent = theme === 'dark' ? '☀' : '☾';
    themeBtn.setAttribute('aria-label', t(theme === 'dark' ? 'theme.toLight' : 'theme.toDark'));
    store.set('jsf-theme', theme);
  }

  themeBtn.addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* ---------- Idioma ----------
     El español vive en el HTML. El contenido de cada proyecto se traduce
     en projects.js desde data/projects.json. */

  const EN = {
    'skip': 'Skip to content',
    'aria.nav': 'Main navigation',
    'aria.home': 'Home — JSF',
    'aria.sections': 'Sections',
    'nav.projects': 'Projects',
    'nav.contact': 'Contact',
    'theme.toDark': 'Switch to dark mode',
    'theme.toLight': 'Switch to light mode',
    'aria.hero': 'Introduction',
    'hero.avail': 'Open for projects',
    'hero.badge': 'OPEN FOR PROJECTS ✳ CÓRDOBA · ARGENTINA ✳ ',
    'hero.strip': 'Frontend Developer ✳ Product-minded ✳ UX · Performance · Accessibility ✳ ',
    'hero.intro': '<strong>Frontend Developer with a product mindset.</strong> I turn business needs into fast, clear and accessible web experiences — from user flow to deployment.',
    'aria.stats': 'Quick facts',
    'hero.years': 'years',
    'hero.ux': '& performance',
    'hero.live': 'live projects',
    'marquee': '<span><i class="c-naples">Fast websites</i> ✳ <i class="c-coral">Accessible</i> ✳ <i class="c-sage">Purposeful UX</i> ✳ <i class="c-peach">HTML · CSS · JS · React</i> ✳ <i class="c-naples">Made in Córdoba</i> ✳ </span><span><i class="c-naples">Fast websites</i> ✳ <i class="c-coral">Accessible</i> ✳ <i class="c-sage">Purposeful UX</i> ✳ <i class="c-peach">HTML · CSS · JS · React</i> ✳ <i class="c-naples">Made in Córdoba</i> ✳ </span>',
    'aria.manifesto': 'Manifesto',
    'manifesto': 'I build websites that <mark class="mk mk--coral">load fast</mark>, read easy and work for <mark class="mk mk--sage">everyone</mark>. Performance, accessibility and semantics are not extras: they are <mark class="mk mk--peach">the standard</mark>.',
    'projects.tag': '01 — Cases & selected work',
    'projects.featured': 'featured',
    'projects.title': 'Projects',
    'label.desktop': 'Desktop',
    'label.mobile': 'Mobile',
    'label.solved': 'What I solved',
    'label.featured': 'Featured ✦',
    'aria.tags': 'Tags',
    'aria.stack': 'Technologies',
    'aria.shot': 'View screenshot',
    'btn.live': 'View live ↗',
    'btn.code': 'Code',
    'btn.shots': 'View screens',
    'band': '<span><b class="tag tag--ink">✳ Stores</b><b class="tag tag--naples">Landings</b><b class="tag tag--peach">Websites</b><b class="tag tag--sage">✳ Apps</b><b class="tag tag--ink">Local SEO</b><b class="tag tag--naples">Performance</b><b class="tag tag--peach">✳ Accessibility</b><b class="tag tag--sage">GSAP</b><b class="tag tag--ink">Mobile first</b><b class="tag tag--naples">✳ Made in Córdoba</b></span><span><b class="tag tag--ink">✳ Stores</b><b class="tag tag--naples">Landings</b><b class="tag tag--peach">Websites</b><b class="tag tag--sage">✳ Apps</b><b class="tag tag--ink">Local SEO</b><b class="tag tag--naples">Performance</b><b class="tag tag--peach">✳ Accessibility</b><b class="tag tag--sage">GSAP</b><b class="tag tag--ink">Mobile first</b><b class="tag tag--naples">✳ Made in Córdoba</b></span>',
    'archive.tag': '02 — Full archive',
    'archive.title': 'More projects',
    'aria.view': 'View',
    'archive.list': 'List',
    'archive.grid': 'Grid',
    'archive.byType': 'Type',
    'archive.byFocus': 'Focus',
    'aria.byType': 'Filter by website type',
    'aria.byFocus': 'Filter by focus',
    'skills.tag': '03 — What I work with',
    'sk.lang': 'Languages',
    'sk.semantic': 'Semantic HTML5',
    'sk.forms': 'Form validation',
    'sk.webp': 'WebP & compression',
    'sk.a11y': 'Accessibility',
    'sk.aria': 'ARIA & semantics',
    'sk.kbd': 'Keyboard navigation',
    'sk.tools': 'Tools',
    'sk.learning': 'Learning',
    'sk.ai': 'AI-assisted dev',
    'xp.when': 'Dec. 2024 — Present · Freelance',
    'xp.role': 'Independent Frontend Developer',
    'xp.1': 'I turn business needs into websites and web experiences shipped to production.',
    'xp.2': 'I design user flows, prioritize low friction and optimize resources when it benefits the product.',
    'xp.3': 'Responsive design, semantic HTML, accessibility and cross-browser compatibility as implementation criteria.',
    'xp.4': 'Git/GitHub, Vercel and Netlify to iterate, version and deploy; I work from Figma when the project calls for it.',
    'footer.badge': 'FAST REPLIES ✳ FREELANCE · REMOTE · TEAMS ✳ ',
    'footer.tag': '04 — Contact · Available for freelance and junior frontend opportunities · remote or Córdoba',
    'footer.cta': "Let's talk",
    'footer.copy': 'Copy email',
    'footer.copied': 'Copied ✓',
    'footer.toast': 'Email copied: jsebasferna@gmail.com ✓',
    'footer.cvEs': 'Spanish CV ↓',
    'footer.cvEn': 'English CV ↓',
    'footer.credit': 'Designed & developed by Juan Sebastián Fernandez · Córdoba, AR · 2026',
    'footer.type': 'Typeface: Archivo — Omnibus-Type, Argentina · Color: Sanzo Wada, combination No. 166',
    'mail.title': 'Reach me however suits you',
    'mail.gmail': 'Open in Gmail ↗',
    'mail.outlook': 'Open in Outlook ↗',
    'mail.app': 'My mail app',
    'mail.copy': 'Copy address',
    'mail.close': 'Close',
  };

  const ES = {};
  let lang = store.get('jsf-lang') === 'en' ? 'en' : 'es';

  const nodes = {
    text: document.querySelectorAll('[data-i18n]'),
    html: document.querySelectorAll('[data-i18n-html]'),
    aria: document.querySelectorAll('[data-i18n-aria]'),
  };

  nodes.text.forEach(el => { ES[el.dataset.i18n] = el.textContent; });
  nodes.html.forEach(el => { ES[el.dataset.i18nHtml] = el.innerHTML; });
  nodes.aria.forEach(el => { ES[el.dataset.i18nAria] = el.getAttribute('aria-label'); });
  Object.assign(ES, {
    'theme.toDark': 'Cambiar a modo oscuro',
    'theme.toLight': 'Cambiar a modo claro',
    'footer.copied': 'Copiado ✓',
    'mail.close': 'Cerrar',
    'footer.toast': 'Email copiado: jsebasferna@gmail.com ✓',
  });

  function t(key) { return (lang === 'en' ? EN[key] : ES[key]) || ES[key] || key; }

  function applyLang(next) {
    lang = next;
    root.lang = lang;
    nodes.text.forEach(el => { el.textContent = t(el.dataset.i18n); });
    nodes.html.forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    nodes.aria.forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    themeBtn.setAttribute('aria-label', t(root.getAttribute('data-theme') === 'dark' ? 'theme.toLight' : 'theme.toDark'));

    const langBtn = document.getElementById('langToggle');
    document.getElementById('langLabel').textContent = lang === 'en' ? 'ES' : 'EN';
    langBtn.setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');
    langBtn.setAttribute('lang', lang === 'en' ? 'es' : 'en');

    store.set('jsf-lang', lang);
    window.dispatchEvent(new CustomEvent('jsf:lang', { detail: { lang } }));
    if (window.JSFfit) { window.JSFfit.prepare(); window.JSFfit.refit(); }
    if (window.JSF && window.JSF.refreshSplits) window.JSF.refreshSplits();
  }

  document.getElementById('langToggle').addEventListener('click', () => {
    applyLang(lang === 'en' ? 'es' : 'en');
  });

  applyTheme(root.getAttribute('data-theme') || 'light');
  if (lang === 'en') applyLang('en');

  window.JSFi18n = { t, get lang() { return lang; } };

  /* ---------- Copiar email ---------- */

  const EMAIL = 'jsebasferna@gmail.com';
  const toast = document.getElementById('mailToast');
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }

  async function copyEmail() {
    try { await navigator.clipboard.writeText(EMAIL); return true; }
    catch {
      const tmp = document.createElement('textarea');
      tmp.value = EMAIL;
      tmp.style.position = 'fixed'; tmp.style.opacity = '0';
      document.body.appendChild(tmp); tmp.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch { ok = false; }
      tmp.remove(); return ok;
    }
  }

  /* ---------- Panel de contacto ----------
     El CTA abre destinos reales (Gmail, Outlook, app local, copiar).
     Sin JS el enlace sigue siendo un mailto normal. */

  const sheet = document.getElementById('mailSheet');
  const cta = document.querySelector('.footer__cta');
  let lastFocus = null;

  function openSheet() {
    lastFocus = document.activeElement;
    sheet.hidden = false;
    root.classList.add('is-locked');
    sheet.querySelector('.mailsheet__actions a').focus();
    document.addEventListener('keydown', onSheetKey);
  }
  function closeSheet() {
    sheet.hidden = true;
    root.classList.remove('is-locked');
    document.removeEventListener('keydown', onSheetKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function onSheetKey(e) {
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key !== 'Tab') return;
    const f = sheet.querySelectorAll('a[href], button:not([disabled])');
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  cta.addEventListener('click', e => { e.preventDefault(); openSheet(); });
  sheet.querySelectorAll('[data-sheet-close]').forEach(el => el.addEventListener('click', closeSheet));
  sheet.querySelectorAll('.mailsheet__actions a').forEach(el =>
    el.addEventListener('click', () => setTimeout(closeSheet, 120)));

  document.getElementById('sheetCopy').addEventListener('click', async () => {
    if (await copyEmail()) { showToast(t('footer.toast')); closeSheet(); }
  });

  const copyBtn = document.getElementById('copyMail');
  copyBtn.addEventListener('click', async () => {
    if (await copyEmail()) {
      copyBtn.textContent = t('footer.copied');
      copyBtn.classList.add('is-copied');
      setTimeout(() => {
        copyBtn.textContent = t('footer.copy');
        copyBtn.classList.remove('is-copied');
      }, 1800);
    }
  });
})();
