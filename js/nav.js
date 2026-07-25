/* ════════════════════════════════════════════════
   NAV — publica el alto real de la barra fija como
   --nav-h, para que los tickets queden clavados
   debajo de la nav en cualquier ancho, zoom o
   tamaño de fuente.
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const navBar = document.querySelector('.nav');
  if (!navBar) return;

  const setNavH = () => {
    document.documentElement.style.setProperty('--nav-h', navBar.offsetHeight + 'px');
  };

  setNavH();
  if ('ResizeObserver' in window) new ResizeObserver(setNavH).observe(navBar);
  else window.addEventListener('resize', setNavH);
  window.addEventListener('orientationchange', setNavH);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(setNavH);
})();
