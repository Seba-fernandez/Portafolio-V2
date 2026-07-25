/* ════════════════════════════════════════════════
   CONTACT — panel de contacto, copiar email y
   feedback (éxito y error) para ambos botones de
   copia. mailto: no puede depender de que el
   sistema tenga cliente configurado, así que el CTA
   abre un panel con destinos reales (Gmail, Outlook,
   app local, copiar). Sin JS sigue siendo un mailto.
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  const { t } = window.JSFi18n;
  const EMAIL = 'jsebasferna@gmail.com';

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

  // Núcleo compartido por los dos botones de copiar: cada uno define su
  // propio feedback de éxito, pero el error (antes silencioso) siempre
  // se avisa igual.
  async function copyEmailWithFeedback(onSuccess) {
    if (await copyEmail()) { onSuccess(); return true; }
    showToast(t('mail.copyError'));
    return false;
  }

  /* ---------- Panel de contacto ---------- */

  const sheet = document.getElementById('mailSheet');
  const cta = document.querySelector('.footer__cta');
  let lastFocus = null;

  function openSheet() {
    lastFocus = document.activeElement;
    sheet.hidden = false;
    document.documentElement.classList.add('is-locked');
    sheet.querySelector('.mailsheet__actions a, .mailsheet__actions button').focus();
    document.addEventListener('keydown', onSheetKey);
  }

  function closeSheet() {
    sheet.hidden = true;
    document.documentElement.classList.remove('is-locked');
    document.removeEventListener('keydown', onSheetKey);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onSheetKey(e) {
    if (e.key === 'Escape') { closeSheet(); return; }
    if (e.key !== 'Tab') return;
    // Foco contenido dentro del panel
    const f = sheet.querySelectorAll('a[href], button:not([disabled])');
    if (!f.length) return;
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  cta.addEventListener('click', e => { e.preventDefault(); openSheet(); });
  sheet.querySelectorAll('[data-sheet-close]').forEach(el => el.addEventListener('click', closeSheet));
  // Al elegir un destino, el panel se cierra solo
  sheet.querySelectorAll('.mailsheet__actions a').forEach(el =>
    el.addEventListener('click', () => setTimeout(closeSheet, 120)));

  document.getElementById('sheetCopy').addEventListener('click', () => {
    copyEmailWithFeedback(() => { showToast(t('footer.toast')); closeSheet(); });
  });

  const copyBtn = document.getElementById('copyMail');
  copyBtn.addEventListener('click', () => {
    copyEmailWithFeedback(() => {
      copyBtn.textContent = t('footer.copied');
      copyBtn.classList.add('is-copied');
      setTimeout(() => {
        copyBtn.textContent = t('footer.copy');
        copyBtn.classList.remove('is-copied');
      }, 1800);
    });
  });
})();
