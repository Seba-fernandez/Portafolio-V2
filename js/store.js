/* ════════════════════════════════════════════════
   STORE — wrapper de localStorage a prueba de
   modo privado (donde puede lanzar excepción).
   ════════════════════════════════════════════════ */

window.JSFstore = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* modo privado */ } },
};
