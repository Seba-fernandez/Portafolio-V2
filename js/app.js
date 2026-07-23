/* ════════════════════════════════════════════════
   APP — tema, idioma y utilidades (sin dependencias)
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
  };

  /* ---------- Tema (el atributo inicial lo puso el snippet del <head>) ---------- */

  const themeBtn = document.getElementById('themeToggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.content = theme === 'dark' ? '#0F0E0C' : '#EFEDE6';
    themeBtn.querySelector('.ticket__icon').textContent = theme === 'dark' ? '☀' : '☾';
    themeBtn.setAttribute('aria-label', t(theme === 'dark' ? 'theme.toLight' : 'theme.toDark'));
    store.set('jsf-theme', theme);
  }

  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  /* ---------- Idioma ---------- */

  const EN = {
    'skip': 'Skip to content',
    'theme.word': 'Mode',
    'theme.toDark': 'Switch to dark mode',
    'theme.toLight': 'Switch to light mode',
    'nav.projects': 'Projects',
    'nav.contact': 'Contact',
    'hero.badge': 'OPEN FOR PROJECTS ✳ CÓRDOBA · ARGENTINA ✳ ',
    'hero.strip': 'Web Developer ✳ Frontend ✳ Performance ✳ Web Developer ✳ Frontend ✳ Performance ✳\u00A0',
    'hero.intro': '+2 years building production websites from <strong>Córdoba, Argentina</strong>: responsive, performant and accessible. No templates. No unnecessary frameworks.',
    'hero.years': 'years',
    'hero.live': 'live projects',
    'marquee': '<span><i class="c-hueso">Fast websites</i> ✳ <i class="c-amarillo">Accessible</i> ✳ <i class="c-rojo">Lighthouse 90+</i> ✳ <i class="c-celeste">HTML · CSS · JS</i> ✳ <i class="c-hueso">Made in Córdoba</i> ✳\u00A0</span><span><i class="c-hueso">Fast websites</i> ✳ <i class="c-amarillo">Accessible</i> ✳ <i class="c-rojo">Lighthouse 90+</i> ✳ <i class="c-celeste">HTML · CSS · JS</i> ✳ <i class="c-hueso">Made in Córdoba</i> ✳\u00A0</span>',
    'manifesto': 'I build websites that <mark class="mk mk--amarillo">load fast</mark>, read easy and work for <mark class="mk mk--azul">everyone</mark>. Performance, accessibility and semantics are not extras: they are <mark class="mk mk--rojo">the standard</mark>.',
    'projects.tag': '01 — Selected work',
    'btn.live': 'View live ↗',
    'btn.code': 'Code',
    'p1.alt': 'Screenshot of the Greenset Court website',
    'p1.cap': 'Landing · Real client',
    'p1.sticker': 'Real client ✦',
    'p1.meta': 'Landing · WhatsApp leads · Live',
    'p1.desc': 'A padel court company with no digital presence that needed to capture qualified leads before launch. A form that qualifies by project type and sends straight to WhatsApp — no backend. Animated counters with Intersection Observer, WebP, mobile-first.',
    'p1.result': '<strong>Today:</strong> in production under ongoing maintenance.',
    'p2.alt': 'Screenshot of the Public Speaking Checklist app',
    'p2.name': 'Public Speaking Checklist',
    'p2.cap': 'App · Vanilla JS',
    'p2.sticker': 'Own app ✦',
    'p2.title': 'Speaking<br>Checklist',
    'p2.meta': 'JS App · LocalStorage · Live',
    'p2.desc': 'A personal tool to track consistency in public-speaking practice. State persists between sessions with no backend, interactive checklist, responsive and accessible — pure JavaScript, zero frameworks.',
    'p3.alt': 'Screenshot of the Coffee Blog',
    'p3.name': 'Coffee Blog',
    'p3.cap': 'Multi-page · 5 views',
    'p3.sticker': '5 pages ✦',
    'p3.title': 'Coffee<br>Blog',
    'p3.meta': 'Multi-page · JS DOM · Live',
    'p3.desc': 'A 5-page educational blog with course listings, posts and form validation in pure JS. Multi-page architecture and DOM manipulation with no external libraries.',
    'p4.alt': 'Screenshot of the Music Festival website',
    'p4.name': 'Music Festival',
    'p4.cap': 'Landing · Video BG',
    'p4.title': 'Music<br>Festival',
    'p4.meta': 'Landing · SASS · Video · Live',
    'p4.desc': 'A high-impact landing for an EDM festival in Argentina: video background, 2-day lineup grid for 2 stages, gallery and ticket cards. SASS partials, WebP and lazy loading.',
    'skills.tag': '02 — What I work with',
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
    'xp.role': 'Independent Web Developer',
    'xp.1': 'Responsive websites, landings and e-commerce shipped to production.',
    'xp.2': 'WebP, lazy loading and Lighthouse audits on every project.',
    'xp.3': 'WCAG 2.1, ARIA, semantic HTML5 and cross-browser as the standard.',
    'xp.4': 'Git/GitHub with CI/CD on Vercel and Netlify; designs from Figma.',
    'footer.badge': 'FAST REPLIES ✳ FREELANCE · REMOTE · TEAMS ✳ ',
    'footer.tag': '03 — Contact · Open to freelance, remote and teams',
    'footer.cta': "Let's talk",
    'footer.cv': 'Download CV ↓',
    'footer.copy': 'Copy email',
    'footer.copied': 'Copied ✓',
    'footer.toast': 'Email copied: jsebasferna@gmail.com ✓',
    'footer.credit': 'Designed & developed by Juan Sebastián Fernandez · Córdoba, AR · 2026',
    'footer.type': 'Typeface: Archivo — Omnibus-Type, Argentina',
  };

  // El español vive en el HTML: lo capturamos como diccionario base al cargar.
  const ES = {};
  let lang = store.get('jsf-lang') === 'en' ? 'en' : 'es';

  const nodes = {
    text: document.querySelectorAll('[data-i18n]'),
    html: document.querySelectorAll('[data-i18n-html]'),
    alt:  document.querySelectorAll('[data-i18n-alt]'),
    aria: document.querySelectorAll('[data-i18n-aria]'),
  };

  nodes.text.forEach(el => { ES[el.dataset.i18n] = el.textContent; });
  nodes.html.forEach(el => { ES[el.dataset.i18nHtml] = el.innerHTML; });
  nodes.alt.forEach(el =>  { ES[el.dataset.i18nAlt] = el.alt; });
  ES['theme.toDark'] = 'Cambiar a modo oscuro';
  ES['theme.toLight'] = 'Cambiar a modo claro';
  ES['footer.copied'] = 'Copiado ✓';
  ES['footer.toast'] = 'Email copiado: jsebasferna@gmail.com ✓';

  function t(key) { return (lang === 'en' ? EN[key] : ES[key]) || ES[key] || key; }

  function applyLang(next) {
    lang = next;
    document.documentElement.lang = lang;
    nodes.text.forEach(el => { el.textContent = t(el.dataset.i18n); });
    nodes.html.forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
    nodes.alt.forEach(el =>  { el.alt = t(el.dataset.i18nAlt); });
    nodes.aria.forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });

    const langBtn = document.getElementById('langToggle');
    document.getElementById('langLabel').textContent = lang === 'en' ? 'ES' : 'EN';
    langBtn.setAttribute('aria-label', lang === 'en' ? 'Cambiar a español' : 'Switch to English');
    langBtn.setAttribute('lang', lang === 'en' ? 'es' : 'en');

    store.set('jsf-lang', lang);
    // Re-ajustar tipografía a los nuevos textos y refrescar triggers.
    if (window.JSFfit) { window.JSFfit.prepare(); window.JSFfit.refit(); }
    if (window.JSF && window.JSF.refreshSplits) window.JSF.refreshSplits();
  }

  document.getElementById('langToggle').addEventListener('click', () => {
    applyLang(lang === 'en' ? 'es' : 'en');
  });

  // Estado inicial (aplica preferencias guardadas)
  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
  if (lang === 'en') applyLang('en');

  /* ---------- Copiar email (Clipboard API + fallback) ---------- */

  const copyBtn = document.getElementById('copyMail');

  const EMAIL = 'jsebasferna@gmail.com';

  /* CTA "Hablemos": mailto puede no tener cliente configurado en desktop.
     El click deja que el mailto intente abrir Y copia el email con feedback. */
  const toast = document.getElementById('mailToast');
  let toastTimer;
  function showToast(msg) {
    if (!toast) return;
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

  document.querySelector('.footer__cta').addEventListener('click', async () => {
    if (await copyEmail()) showToast(t('footer.toast'));
  });

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