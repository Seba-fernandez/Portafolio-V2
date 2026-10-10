// Panel privado de proyectos.
// Lee y escribe data/projects.json en GitHub con un token personal del dueño del repo,
// regenera index.html con el mismo módulo que usa scripts/build-projects.mjs y publica
// todo en un único commit. Vercel despliega ese commit solo.
import { renderProjects, validate, imagePaths, D_W, M_W } from '../js/render-projects.mjs';

const OWNER = 'Seba-fernandez';
const REPO = 'Portafolio-V2';
const API = 'https://api.github.com';
const DATA_PATH = 'data/projects.json';
const HTML_PATH = 'index.html';
const TOKEN_KEY = 'jsf-panel-token';
const BRANCH_KEY = 'jsf-panel-branch';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

const state = {
  token: '',
  branch: 'main',
  remote: null,        // { data, dataSha, ids:Set }
  draft: null,         // copia editable de data
  selected: null,      // _key del proyecto abierto
  uploads: new Map(),  // _key → { d?: shot, m?: shot }
  previews: new Map(), // id → { d?: url, m?: url } (capturas recién subidas, para mostrarlas)
  idTouched: new Set(),
  saving: false,
};
let keySeq = 0;
const newKey = () => `k${++keySeq}`;

/* ═════════ GitHub ═════════ */

class GhError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function gh(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${state.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  if (!res.ok) {
    let msg = '';
    try { msg = (await res.json()).message || ''; } catch { /* sin cuerpo */ }
    throw new GhError(res.status, msg);
  }
  return res.status === 204 ? null : res.json();
}

const repoPath = (p) => `/repos/${OWNER}/${REPO}${p}`;
const enc = (s) => encodeURIComponent(s);

function decodeB64(b64) {
  const bin = atob(b64.replace(/\s/g, ''));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

async function readFile(path, ref) {
  const r = await gh(repoPath(`/contents/${path}?ref=${enc(ref)}`));
  return { text: decodeB64(r.content), sha: r.sha };
}

function blobToB64(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result).split(',')[1]);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

function explain(err) {
  if (!(err instanceof GhError)) return err.message || String(err);
  if (err.status === 401) return 'El token no es válido o venció. Creá uno nuevo en GitHub.';
  if (err.status === 403) return 'El token no tiene permiso de escritura. En GitHub, dale “Contents: Read and write” sobre Portafolio-V2.';
  if (err.status === 404) return 'No encontré el repo o la rama con este token. Revisá que tenga acceso a Portafolio-V2 y que la rama exista.';
  if (err.status === 409 || err.status === 422) return 'La rama cambió mientras guardabas. Recargá el panel y volvé a intentar.';
  return `GitHub respondió ${err.status}${err.message ? `: ${err.message}` : ''}.`;
}

/* ═════════ Datos ═════════ */

const clone = (o) => JSON.parse(JSON.stringify(o));
const projects = () => state.draft.projects;
const byKey = (k) => projects().find((p) => p._key === k);

function withKeys(data) {
  const d = clone(data);
  d.projects.forEach((p) => { p._key = newKey(); });
  return d;
}

// Proyecto limpio para guardar: sin campos internos, sin traducciones vacías.
function cleanProject(p) {
  const pair = (o) => {
    if (!o || !o.es) return undefined;
    return o.en ? { es: o.es, en: o.en } : { es: o.es };
  };
  const list = (o) => {
    const es = (o?.es || []).filter(Boolean);
    const en = (o?.en || []).filter(Boolean);
    return en.length ? { es, en } : { es };
  };
  const out = {
    id: p.id,
    featured: !!p.featured,
    accent: p.accent || 'coral',
    placeholder: p.placeholder || '#112F2C',
    name: pair(p.name),
    type: p.type,
    origin: p.origin,
    focus: p.focus || [],
    badge: pair(p.badge),
    kicker: pair(p.kicker),
    context: pair(p.context),
    solved: list(p.solved),
    note: pair(p.note),
    stack: (p.stack || []).filter(Boolean),
    live: p.live || '',
    code: p.code || '',
    alt: pair(p.alt),
    casa: casaOf(p),
  };
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
}

// Cómo se ve en la casa 3D (casa-3d-sebas lee este mismo JSON).
const CASA_DEFAULT = { prop: 'box', color: '#F48067', status: 'live' };
function casaOf(p) {
  const c = { ...CASA_DEFAULT, ...(p.casa || {}) };
  return { prop: c.prop, color: c.color, status: c.status };
}

function cleanData() {
  const d = clone(state.draft);
  // Orden en la página: destacados primero, después el resto.
  const ps = state.draft.projects;
  d.projects = [...ps.filter((p) => p.featured), ...ps.filter((p) => !p.featured)].map(cleanProject);
  return d;
}

function isDirty() {
  if (!state.remote) return false;
  return state.uploads.size > 0 || JSON.stringify(cleanData()) !== JSON.stringify(state.remote.data);
}

/* ═════════ Login ═════════ */

const loginForm = $('#loginForm');
const loginErr = $('#loginError');

function showLoginError(msg) {
  loginErr.textContent = msg;
  loginErr.hidden = !msg;
}

async function connect(token, branch) {
  state.token = token;
  state.branch = branch;
  await gh(repoPath(''));
  let dataFile, htmlFile;
  try {
    [dataFile, htmlFile] = await Promise.all([readFile(DATA_PATH, branch), readFile(HTML_PATH, branch)]);
  } catch (e) {
    if (e instanceof GhError && e.status === 404) {
      throw new Error(`La rama “${branch}” no existe o no tiene ${DATA_PATH}. Normalmente la rama es “main”.`);
    }
    throw e;
  }
  if (!htmlFile.text.includes('<!-- build:featured:start -->')) {
    throw new Error(`El index.html de la rama “${branch}” no tiene los marcadores de proyectos. Probá con la rama “main”.`);
  }
  const data = JSON.parse(dataFile.text);
  state.remote = { data, dataSha: dataFile.sha, ids: new Set(data.projects.map((p) => p.id)) };
  state.draft = withKeys(data);
  state.uploads.clear();
  state.idTouched.clear();
  state.selected = null;
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const token = $('#tokenInput').value.trim();
  const branch = $('#branchInput').value.trim() || 'main';
  const btn = $('#loginBtn');
  showLoginError('');
  btn.disabled = true;
  btn.textContent = 'Conectando…';
  try {
    await connect(token, branch);
    const remember = $('#rememberInput').checked;
    try {
      (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, token);
      (remember ? sessionStorage : localStorage).removeItem(TOKEN_KEY);
      localStorage.setItem(BRANCH_KEY, branch);
    } catch { /* modo privado */ }
    startApp();
  } catch (err) {
    showLoginError(explain(err));
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

$('#logoutBtn').addEventListener('click', () => {
  if (isDirty() && !window.confirm('Tenés cambios sin guardar. ¿Salir igual?')) return;
  try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch { /* */ }
  location.reload();
});

/* ═════════ App ═════════ */

function startApp() {
  $('#login').hidden = true;
  $('#app').hidden = false;
  $('#repoCtx').textContent = `${OWNER}/${REPO} · rama ${state.branch}`;
  buildStaticControls();
  renderList();
  showEditor(null);
  updateBar();
}

function buildStaticControls() {
  const d = state.draft;
  const fill = (sel, dict) => {
    sel.textContent = '';
    Object.entries(dict).forEach(([k, v]) => {
      const o = document.createElement('option');
      o.value = k;
      o.textContent = v.es;
      sel.appendChild(o);
    });
  };
  fill($('[name="type"]'), d.types);
  fill($('[name="origin"]'), d.origins);
  const box = $('#focusChips');
  box.textContent = '';
  Object.entries(d.focus).forEach(([k, v]) => {
    const l = document.createElement('label');
    l.className = 'chip';
    const i = document.createElement('input');
    i.type = 'checkbox';
    i.name = 'focus';
    i.value = k;
    const s = document.createElement('span');
    s.textContent = v.es;
    l.append(i, s);
    box.appendChild(l);
  });
}

/* ---------- Lista ---------- */

function thumbFor(p) {
  const pv = state.previews.get(p.id);
  const up = state.uploads.get(p._key);
  return up?.d?.preview || pv?.d || (state.remote.ids.has(p.id) ? `/img/p/${p.id}-d-480.webp` : '');
}

function renderList() {
  const feat = projects().filter((p) => p.featured);
  const rest = projects().filter((p) => !p.featured);
  const draw = (ol, arr) => {
    ol.textContent = '';
    arr.forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'pitem' + (p._key === state.selected ? ' is-active' : '');

      const img = document.createElement('img');
      img.className = 'pitem__thumb';
      img.alt = '';
      const src = thumbFor(p);
      if (src) img.src = src;
      img.onerror = () => { img.removeAttribute('src'); };

      const main = document.createElement('button');
      main.type = 'button';
      main.className = 'pitem__main';
      main.setAttribute('aria-label', `Editar ${p.name?.es || 'proyecto nuevo'}`);
      const name = document.createElement('span');
      name.className = 'pitem__name';
      name.textContent = p.name?.es || 'Proyecto nuevo';
      const meta = document.createElement('span');
      meta.className = 'pitem__meta';
      const isNew = !state.remote.ids.has(p.id);
      meta.textContent = [state.draft.types[p.type]?.es, isNew ? 'nuevo' : ''].filter(Boolean).join(' · ');
      main.append(name, meta);
      main.addEventListener('click', () => {
        showEditor(p._key);
        // En pantallas chicas el editor queda debajo de la lista: bajar hasta él.
        if (window.matchMedia('(max-width: 960px)').matches) $('#editor').scrollIntoView({ behavior: 'smooth' });
      });

      const moves = document.createElement('div');
      moves.className = 'pitem__moves';
      const up = moveBtn('↑', `Subir ${p.name?.es || ''}`, i === 0, () => move(p, -1));
      const down = moveBtn('↓', `Bajar ${p.name?.es || ''}`, i === arr.length - 1, () => move(p, 1));
      moves.append(up, down);

      li.append(img, main, moves);
      ol.appendChild(li);
    });
  };
  draw($('#listFeat'), feat);
  draw($('#listRest'), rest);
  $('#countFeat').textContent = `· ${feat.length}`;
  $('#countRest').textContent = `· ${rest.length}`;
}

function moveBtn(label, aria, disabled, fn) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'move';
  b.textContent = label;
  b.setAttribute('aria-label', aria);
  b.disabled = disabled;
  b.addEventListener('click', fn);
  return b;
}

// Mueve dentro de su grupo (destacados o resto).
function move(p, dir) {
  const ps = projects();
  const group = ps.filter((x) => !!x.featured === !!p.featured);
  const gi = group.indexOf(p);
  const other = group[gi + dir];
  if (!other) return;
  const a = ps.indexOf(p);
  const b = ps.indexOf(other);
  [ps[a], ps[b]] = [ps[b], ps[a]];
  renderList();
  updateBar();
  // Mantener el foco en la flecha del mismo proyecto
  const lists = [...$$('#listFeat .pitem'), ...$$('#listRest .pitem')];
  const idx = [...ps.filter((x) => x.featured), ...ps.filter((x) => !x.featured)].indexOf(p);
  lists[idx]?.querySelectorAll('.move')[dir < 0 ? 0 : 1]?.focus();
}

/* ---------- Editor ---------- */

const form = $('#form');

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, value) {
  const ks = path.split('.');
  let o = obj;
  ks.slice(0, -1).forEach((k) => { if (o[k] == null || typeof o[k] !== 'object') o[k] = {}; o = o[k]; });
  o[ks[ks.length - 1]] = value;
}

function showEditor(key) {
  state.selected = key;
  const p = key ? byKey(key) : null;
  $('#emptyState').hidden = !!p;
  form.hidden = !p;
  renderList();
  if (!p) return;

  $('#formTitle').textContent = p.name?.es || 'Proyecto nuevo';
  $$('input, select, textarea', form).forEach((el) => {
    el.classList.remove('is-invalid');
    const name = el.name;
    if (!name || el.type === 'file') return;
    if (name === 'featured') { el.checked = !!p.featured; return; }
    if (name === 'focus') { el.checked = (p.focus || []).includes(el.value); return; }
    if (name === 'accent') { el.checked = (p.accent || 'coral') === el.value; return; }
    if (name === 'stack') { el.value = (p.stack || []).join(', '); return; }
    if (name.startsWith('solved.')) { el.value = (getPath(p, name) || []).join('\n'); return; }
    if (name.startsWith('casa.')) { el.value = casaOf(p)[name.slice(5)]; return; }
    el.value = getPath(p, name) || '';
  });
  const exists = state.remote.ids.has(p.id);
  const idInput = $('[name="id"]', form);
  idInput.readOnly = exists;
  idInput.title = exists ? 'El ID de un proyecto publicado no se cambia: es el nombre de sus imágenes.' : '';
  $('#featBlock').hidden = !p.featured;
  resetDelete();
  renderShots(p);
}

form.addEventListener('input', onField);
form.addEventListener('change', onField);

function onField(e) {
  const el = e.target;
  const p = byKey(state.selected);
  if (!p || !el.name || el.type === 'file') return;
  const name = el.name;
  el.classList.remove('is-invalid');

  if (name === 'featured') {
    p.featured = el.checked;
    // Al cambiar de grupo, va al final del grupo nuevo.
    const ps = projects();
    ps.splice(ps.indexOf(p), 1);
    ps.push(p);
    if (p.featured && !p.accent) p.accent = 'coral';
    $('#featBlock').hidden = !p.featured;
  } else if (name === 'focus') {
    p.focus = $$('input[name="focus"]:checked', form).map((x) => x.value);
  } else if (name === 'accent') {
    p.accent = el.value;
  } else if (name === 'stack') {
    p.stack = el.value.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (name.startsWith('solved.')) {
    setPath(p, name, el.value.split('\n').map((s) => s.trim()).filter(Boolean));
  } else if (name === 'id') {
    state.idTouched.add(p._key);
    p.id = el.value.trim();
  } else {
    setPath(p, name, el.value);
    if (name === 'name.es') {
      $('#formTitle').textContent = el.value || 'Proyecto nuevo';
      if (!state.remote.ids.has(p.id) && !state.idTouched.has(p._key)) {
        p.id = uniqueId(slugify(el.value) || 'proyecto', p);
        $('[name="id"]', form).value = p.id;
      }
    }
  }
  renderList();
  updateBar();
}

function slugify(s) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}
function uniqueId(base, self) {
  let id = base;
  let n = 2;
  while (projects().some((p) => p !== self && p.id === id)) id = `${base}-${n++}`;
  return id;
}

$('#newBtn').addEventListener('click', () => {
  const d = state.draft;
  const p = {
    _key: newKey(),
    id: uniqueId('proyecto-nuevo', null),
    featured: false,
    accent: 'coral',
    placeholder: '#112F2C',
    name: { es: '' },
    type: Object.keys(d.types)[0],
    origin: Object.keys(d.origins)[0],
    focus: [],
    context: { es: '' },
    solved: { es: [] },
    stack: [],
    live: '',
    code: '',
    casa: { ...CASA_DEFAULT },
  };
  projects().push(p);
  showEditor(p._key);
  updateBar();
  if (window.matchMedia('(max-width: 960px)').matches) $('#editor').scrollIntoView();
  $('[name="name.es"]', form).focus({ preventScroll: true });
});

/* ---------- Borrar (dos pasos, sin diálogos) ---------- */

const delBtn = $('#deleteBtn');
let delTimer;
function resetDelete() {
  clearTimeout(delTimer);
  delBtn.classList.remove('is-armed');
  delBtn.textContent = 'Borrar proyecto';
}
delBtn.addEventListener('click', () => {
  if (!delBtn.classList.contains('is-armed')) {
    delBtn.classList.add('is-armed');
    delBtn.textContent = 'Tocá de nuevo para borrar';
    delTimer = setTimeout(resetDelete, 4000);
    return;
  }
  const p = byKey(state.selected);
  const ps = projects();
  ps.splice(ps.indexOf(p), 1);
  state.uploads.delete(p._key);
  resetDelete();
  showEditor(null);
  updateBar();
});

/* ═════════ Capturas ═════════ */

const SHOT = {
  d: { ratio: 16 / 10, widths: D_W, previewW: 960, minW: 1440, label: 'desktop' },
  m: { ratio: 390 / 844, widths: M_W, previewW: 780, minW: 780, label: 'mobile' },
};

function renderShots(p) {
  ['d', 'm'].forEach((k) => {
    const up = state.uploads.get(p._key)?.[k];
    const pv = state.previews.get(p.id)?.[k];
    const src = up?.preview || pv || (state.remote.ids.has(p.id) ? `/img/p/${p.id}-${k}-${SHOT[k].previewW}.webp` : '');
    const img = $(k === 'd' ? '#prevD' : '#prevM');
    const none = $(k === 'd' ? '#noneD' : '#noneM');
    const info = $(k === 'd' ? '#infoD' : '#infoM');
    img.onerror = () => { img.hidden = true; none.hidden = false; };
    img.onload = () => { img.hidden = false; none.hidden = true; };
    if (src) { img.src = src; } else { img.removeAttribute('src'); img.hidden = true; none.hidden = false; }
    info.className = 'small';
    info.textContent = up ? `Lista para publicar · ${up.srcW}×${up.srcH} px de origen` : '';
    if (up?.small) {
      info.classList.add('warn');
      info.textContent += ` · Es chica: para verse nítida, subila de al menos ${SHOT[k].minW} px de ancho.`;
    }
  });
}

function drawStepped(src, sx, sy, sw, sh, w, h) {
  // Reducción en pasos de 1/2: evita el serruchado al achicar mucho.
  let cur = src, cx = sx, cy = sy, cw = sw, ch = sh;
  while (cw / 2 >= w * 1.05) {
    const nw = Math.round(cw / 2), nh = Math.round(ch / 2);
    const c = document.createElement('canvas');
    c.width = nw; c.height = nh;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, cx, cy, cw, ch, 0, 0, nw, nh);
    cur = c; cx = 0; cy = 0; cw = nw; ch = nh;
  }
  const out = document.createElement('canvas');
  out.width = w; out.height = h;
  const ctx = out.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(cur, cx, cy, cw, ch, 0, 0, w, h);
  return out;
}

const toBlob = (canvas, q) => new Promise((r) => canvas.toBlob(r, 'image/webp', q));

async function processShot(file, kind) {
  const cfg = SHOT[kind];
  const bmp = await createImageBitmap(file);
  // Recorte al formato desde arriba (así se ve el hero de cada sitio).
  let sw = bmp.width;
  let sh = Math.round(sw / cfg.ratio);
  if (sh > bmp.height) { sh = bmp.height; sw = Math.round(sh * cfg.ratio); }
  const sx = Math.round((bmp.width - sw) / 2);
  const sy = 0;

  const blobs = {};
  for (const w of cfg.widths) {
    const h = Math.round(w / cfg.ratio);
    const canvas = drawStepped(bmp, sx, sy, sw, sh, w, h);
    const blob = await toBlob(canvas, w >= 2160 ? 0.84 : 0.86);
    if (!blob || blob.type !== 'image/webp') {
      throw new Error('Este navegador no puede generar WebP. Usá Chrome, Edge o Firefox para subir capturas.');
    }
    blobs[w] = blob;
  }
  const one = drawStepped(bmp, sx, sy, sw, sh, 1, 1).getContext('2d').getImageData(0, 0, 1, 1).data;
  const placeholder = '#' + [one[0], one[1], one[2]].map((v) => v.toString(16).padStart(2, '0')).join('');
  bmp.close?.();
  return {
    blobs,
    placeholder,
    srcW: sw,
    srcH: sh,
    small: sw < cfg.minW,
    preview: URL.createObjectURL(blobs[cfg.previewW]),
  };
}

[['#fileD', 'd'], ['#fileM', 'm']].forEach(([sel, kind]) => {
  const input = $(sel);
  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    input.value = '';
    const p = byKey(state.selected);
    if (!file || !p) return;
    const info = $(kind === 'd' ? '#infoD' : '#infoM');
    info.className = 'small';
    info.textContent = 'Procesando…';
    try {
      const shot = await processShot(file, kind);
      const entry = state.uploads.get(p._key) || {};
      if (entry[kind]) URL.revokeObjectURL(entry[kind].preview);
      entry[kind] = shot;
      state.uploads.set(p._key, entry);
      if (kind === 'd') p.placeholder = shot.placeholder;
      renderShots(p);
      renderList();
      updateBar();
    } catch (err) {
      info.className = 'small warn';
      info.textContent = err.message || 'No pude leer esa imagen.';
    }
  });
});

/* ═════════ Barra / guardado ═════════ */

const statusEl = $('#status');
const saveBtn = $('#saveBtn');
const discardBtn = $('#discardBtn');

function setStatus(text, kind = '', link) {
  statusEl.className = 'bar__status' + (kind ? ` is-${kind}` : '');
  statusEl.textContent = text;
  if (link) {
    statusEl.append(' · ');
    const a = document.createElement('a');
    a.href = link.href;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = link.text;
    statusEl.append(a);
  }
}

function changeSummary() {
  const label = (p) => p.name?.es || 'Proyecto nuevo';
  const before = new Map(state.remote.data.projects.map((p) => [p.id, JSON.stringify(p)]));
  const now = cleanData().projects;
  const nowIds = new Set(now.map((p) => p.id));
  const added = now.filter((p) => !before.has(p.id)).map(label);
  const removed = state.remote.data.projects.filter((p) => !nowIds.has(p.id)).map(label);
  const edited = now.filter((p) => before.has(p.id) && before.get(p.id) !== JSON.stringify(p)).map(label);
  const keys = new Set(projects().filter((p) => state.uploads.has(p._key)).map((p) => p.id));
  now.forEach((p) => { if (keys.has(p.id) && before.has(p.id) && !edited.includes(label(p))) edited.push(label(p)); });
  const orderChanged = !added.length && !removed.length &&
    now.map((p) => p.id).join() !== state.remote.data.projects.map((p) => p.id).join();
  return { added, removed, edited, orderChanged };
}

function updateBar() {
  if (state.saving) return;
  const dirty = isDirty();
  saveBtn.disabled = !dirty;
  discardBtn.disabled = !dirty;
  if (!dirty) { if (!statusEl.classList.contains('is-ok')) setStatus('Sin cambios'); return; }
  const s = changeSummary();
  const parts = [];
  if (s.added.length) parts.push(`${s.added.length} nuevo${s.added.length > 1 ? 's' : ''}`);
  if (s.edited.length) parts.push(`${s.edited.length} editado${s.edited.length > 1 ? 's' : ''}`);
  if (s.removed.length) parts.push(`${s.removed.length} borrado${s.removed.length > 1 ? 's' : ''}`);
  if (s.orderChanged) parts.push('orden nuevo');
  setStatus(`Cambios sin guardar: ${parts.join(', ') || 'sí'}`);
}

discardBtn.addEventListener('click', () => {
  state.uploads.forEach((u) => Object.values(u).forEach((s) => URL.revokeObjectURL(s.preview)));
  state.uploads.clear();
  state.idTouched.clear();
  state.draft = withKeys(state.remote.data);
  showEditor(null);
  setStatus('Cambios descartados');
  updateBar();
});

function preflight(data) {
  const errs = validate(data);
  projects().forEach((p) => {
    if (state.remote.ids.has(p.id)) return;
    const up = state.uploads.get(p._key) || {};
    const who = p.name?.es || p.id;
    if (!up.d) errs.push(`${who}: falta la captura desktop.`);
    if (!up.m) errs.push(`${who}: falta la captura mobile.`);
  });
  return errs;
}

function markInvalid(errs) {
  // Abre el primer proyecto con problemas para corregirlo.
  const first = projects().find((p) => errs.some((e) => e.startsWith(`${p.name?.es || p.id}:`)));
  if (first && first._key !== state.selected) showEditor(first._key);
}

async function save() {
  const data = cleanData();
  const errs = preflight(data);
  if (errs.length) {
    setStatus(`No se puede publicar todavía:\n• ${errs.join('\n• ')}`, 'error');
    markInvalid(errs);
    return;
  }
  state.saving = true;
  saveBtn.disabled = true;
  discardBtn.disabled = true;
  try {
    setStatus('Leyendo la rama…');
    const ref = await gh(repoPath(`/git/ref/heads/${enc(state.branch)}`));
    const head = ref.object.sha;
    const commit = await gh(repoPath(`/git/commits/${head}`));

    const current = await readFile(DATA_PATH, head);
    if (current.sha !== state.remote.dataSha) {
      throw new Error('Los proyectos cambiaron en GitHub desde que abriste el panel (otra pestaña o un commit). Recargá para no pisar esos cambios.');
    }
    const html = (await readFile(HTML_PATH, head)).text;
    const rendered = renderProjects(html, data).html;

    // Archivos del commit
    const files = [
      { path: DATA_PATH, content: JSON.stringify(data, null, 2) + '\n' },
      { path: HTML_PATH, content: rendered },
    ];
    projects().forEach((p) => {
      const up = state.uploads.get(p._key);
      if (!up) return;
      ['d', 'm'].forEach((k) => {
        if (!up[k]) return;
        Object.entries(up[k].blobs).forEach(([w, blob]) => files.push({ path: `img/p/${p.id}-${k}-${w}.webp`, blob }));
      });
    });

    // Imágenes de proyectos borrados
    const keep = new Set(data.projects.map((p) => p.id));
    const gone = [...state.remote.ids].filter((id) => !keep.has(id));
    let deletions = [];
    if (gone.length) {
      const tree = await gh(repoPath(`/git/trees/${commit.tree.sha}?recursive=1`));
      const existing = new Set(tree.tree.map((t) => t.path));
      deletions = gone.flatMap(imagePaths).filter((p) => existing.has(p));
    }

    let done = 0;
    const total = files.length;
    setStatus(`Subiendo archivos… 0/${total}`);
    const entries = [];
    const queue = [...files];
    const worker = async () => {
      while (queue.length) {
        const f = queue.shift();
        const body = f.blob
          ? { content: await blobToB64(f.blob), encoding: 'base64' }
          : { content: f.content, encoding: 'utf-8' };
        const b = await gh(repoPath('/git/blobs'), { method: 'POST', body });
        entries.push({ path: f.path, mode: '100644', type: 'blob', sha: b.sha });
        setStatus(`Subiendo archivos… ${++done}/${total}`);
      }
    };
    await Promise.all([worker(), worker(), worker(), worker()]);
    deletions.forEach((path) => entries.push({ path, mode: '100644', type: 'blob', sha: null }));

    setStatus('Creando el commit…');
    const tree = await gh(repoPath('/git/trees'), { method: 'POST', body: { base_tree: commit.tree.sha, tree: entries } });
    const s = changeSummary();
    const msgParts = [];
    if (s.added.length) msgParts.push(`agrega ${s.added.join(', ')}`);
    if (s.edited.length) msgParts.push(`actualiza ${s.edited.join(', ')}`);
    if (s.removed.length) msgParts.push(`borra ${s.removed.join(', ')}`);
    if (s.orderChanged) msgParts.push('reordena');
    const message = `Panel: ${msgParts.join(' · ') || 'actualiza proyectos'}`;
    const newCommit = await gh(repoPath('/git/commits'), { method: 'POST', body: { message, tree: tree.sha, parents: [head] } });
    await gh(repoPath(`/git/refs/heads/${enc(state.branch)}`), { method: 'PATCH', body: { sha: newCommit.sha, force: false } });

    // El estado publicado pasa a ser el nuevo punto de partida
    const dataEntry = entries.find((e) => e.path === DATA_PATH);
    projects().forEach((p) => {
      const up = state.uploads.get(p._key);
      if (!up) return;
      const pv = state.previews.get(p.id) || {};
      if (up.d) pv.d = up.d.preview;
      if (up.m) pv.m = up.m.preview;
      state.previews.set(p.id, pv);
    });
    state.uploads.clear();
    state.idTouched.clear();
    state.remote = { data, dataSha: dataEntry.sha, ids: new Set(data.projects.map((p) => p.id)) };
    const sel = byKey(state.selected)?.id;
    state.draft = withKeys(data);
    state.selected = projects().find((p) => p.id === sel)?._key || null;
    state.saving = false;
    showEditor(state.selected);
    setStatus('Publicado ✓ Vercel lo pone online en alrededor de un minuto', 'ok', {
      href: `https://github.com/${OWNER}/${REPO}/commit/${newCommit.sha}`, text: 'Ver commit ↗',
    });
    updateBar();
  } catch (err) {
    // El error queda a la vista hasta el próximo cambio (no lo tapa "Cambios sin guardar").
    state.saving = false;
    setStatus(explain(err), 'error');
    saveBtn.disabled = !isDirty();
    discardBtn.disabled = !isDirty();
  }
}

saveBtn.addEventListener('click', save);

window.addEventListener('beforeunload', (e) => {
  if (state.remote && isDirty()) { e.preventDefault(); e.returnValue = ''; }
});

/* ═════════ Inicio: sesión guardada ═════════ */

(async () => {
  let token = '';
  let branch = 'main';
  try {
    token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || '';
    branch = localStorage.getItem(BRANCH_KEY) || 'main';
    // Recordar viene marcado: solo queda sin marcar si la última vez elegiste no recordar.
    $('#rememberInput').checked = !sessionStorage.getItem(TOKEN_KEY);
  } catch { /* modo privado */ }
  $('#branchInput').value = branch;
  if (!token) { $('#tokenInput').focus(); return; }
  const btn = $('#loginBtn');
  btn.disabled = true;
  btn.textContent = 'Conectando…';
  try {
    await connect(token, branch);
    startApp();
  } catch (err) {
    showLoginError(explain(err));
    try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); } catch { /* */ }
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
})();
