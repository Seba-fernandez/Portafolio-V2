/* ════════════════════════════════════════════════
   THEME — toggle claro/oscuro.
   El atributo inicial lo puso el snippet del <head>
   (sin flash); acá solo se maneja el toggle.
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const themeBtn = document.getElementById('themeToggle');
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  const { t } = window.JSFi18n;

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeMeta) themeMeta.content = theme === 'dark' ? '#0F0E0C' : '#EFEDE6';
    themeBtn.querySelector('.ticket__icon').textContent = theme === 'dark' ? '☀' : '☾';
    // dataset.i18nAria queda en sync: si el idioma cambia después del toggle,
    // el walker genérico de i18n.js re-traduce la clave correcta y no la
    // pisa con el "cambiar a oscuro" original del HTML.
    const ariaKey = theme === 'dark' ? 'theme.toLight' : 'theme.toDark';
    themeBtn.dataset.i18nAria = ariaKey;
    themeBtn.setAttribute('aria-label', t(ariaKey));
    window.JSFstore.set('jsf-theme', theme);
  }

  themeBtn.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });

  applyTheme(document.documentElement.getAttribute('data-theme') || 'light');
})();
