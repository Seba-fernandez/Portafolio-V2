/* ════════════════════════════════════════════════
   I18N — diccionario ES/EN y aplicación de idioma.
   El español vive en el HTML (se captura al cargar);
   el inglés es este diccionario + las traducciones
   de proyectos que arma render-projects.js.
   ════════════════════════════════════════════════ */

window.JSFi18n = (() => {
  'use strict';

  const EN = {
    'skip': 'Skip to content',
    'theme.word': 'Mode',
    'theme.toDark': 'Switch to dark mode',
    'theme.toLight': 'Switch to light mode',
    'nav.projects': 'Projects',
    'nav.contact': 'Contact',
    'hero.badge': 'OPEN FOR PROJECTS ✳ CÓRDOBA · ARGENTINA ✳ ',
    'hero.strip': 'Web Developer ✳ Frontend ✳ Performance ✳ Web Developer ✳ Frontend ✳ Performance ✳ ',
    'hero.intro': '+2 years building production websites from <strong>Córdoba, Argentina</strong>: responsive, performant and accessible. No templates. No unnecessary frameworks.',
    'hero.years': 'years',
    'hero.live': 'live projects',
    'marquee': '<span><i class="c-hueso">Fast websites</i> ✳ <i class="c-amarillo">Accessible</i> ✳ <i class="c-rojo">Lighthouse 90+</i> ✳ <i class="c-celeste">HTML · CSS · JS</i> ✳ <i class="c-hueso">Made in Córdoba</i> ✳ </span><span><i class="c-hueso">Fast websites</i> ✳ <i class="c-amarillo">Accessible</i> ✳ <i class="c-rojo">Lighthouse 90+</i> ✳ <i class="c-celeste">HTML · CSS · JS</i> ✳ <i class="c-hueso">Made in Córdoba</i> ✳ </span>',
    'manifesto': 'I build websites that <mark class="mk mk--amarillo">load fast</mark>, read easy and work for <mark class="mk mk--azul">everyone</mark>. Performance, accessibility and semantics are not extras: they are <mark class="mk mk--rojo">the standard</mark>.',
    'projects.tag': '01 — Selected work',
    'btn.live': 'View live ↗',
    'btn.code': 'Code',
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
    'mail.title': 'Reach me however suits you',
    'mail.gmail': 'Open in Gmail ↗',
    'mail.outlook': 'Open in Outlook ↗',
    'mail.app': 'My mail app',
    'mail.copy': 'Copy address',
    'mail.close': 'Close',
    'footer.copy': 'Copy email',
    'footer.copied': 'Copied ✓',
    'footer.toast': 'Email copied: jsebasferna@gmail.com ✓',
    'mail.copyError': "Couldn't copy — email: jsebasferna@gmail.com",
    'footer.credit': 'Designed & developed by Juan Sebastián Fernandez · Córdoba, AR · 2026',
    'footer.type': 'Typeface: Archivo — Omnibus-Type, Argentina',
  };
  // Traducciones de proyectos: una sola fuente en js/data/projects.js.
  Object.assign(EN, (window.JSFdata && window.JSFdata.projectsEN) || {});

  // El español vive en el HTML: lo capturamos como diccionario base al cargar.
  const ES = {};
  let lang = window.JSFstore.get('jsf-lang') === 'en' ? 'en' : 'es';

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
  ES['mail.close'] = 'Cerrar';
  ES['footer.toast'] = 'Email copiado: jsebasferna@gmail.com ✓';
  ES['mail.copyError'] = 'No se pudo copiar. Email: jsebasferna@gmail.com';

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

    window.JSFstore.set('jsf-lang', lang);
    // Re-ajustar tipografía a los nuevos textos y refrescar triggers.
    if (window.JSFfit) { window.JSFfit.prepare(); window.JSFfit.refit(); }
    if (window.JSF && window.JSF.refreshSplits) window.JSF.refreshSplits();
  }

  document.getElementById('langToggle').addEventListener('click', () => {
    applyLang(lang === 'en' ? 'es' : 'en');
  });

  if (lang === 'en') applyLang('en');

  return { t, applyLang, get lang() { return lang; } };
})();
