// Render de la sección de proyectos a partir de data/projects.json.
// Módulo compartido: lo usan scripts/build-projects.mjs (Node) y /panel (navegador),
// así el HTML que genera el panel es idéntico al del script.

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (i) => String(i + 1).padStart(2, '0');

export const D_W = [480, 960, 1440, 2160, 2880];
export const M_W = [390, 780, 1170];
const D_SRCSET = [960, 1440, 2160, 2880];
const srcset = (id, kind, ws) => ws.map((w) => `img/p/${id}-${kind}-${w}.webp ${w}w`).join(', ');
const ACCENT = { coral: 'var(--coral)', sage: 'var(--sage)', peach: 'var(--peach)' };

/** Archivos de imagen que necesita un proyecto. */
export function imagePaths(id) {
  return [
    ...D_W.map((w) => `img/p/${id}-d-${w}.webp`),
    ...M_W.map((w) => `img/p/${id}-m-${w}.webp`),
  ];
}

/** Devuelve una lista de problemas; vacía = datos válidos. */
export function validate(data) {
  const errs = [];
  const ids = new Set();
  (data.projects || []).forEach((p, i) => {
    const who = p.name?.es || p.id || `#${i + 1}`;
    if (!p.id || !/^[a-z0-9][a-z0-9-]*$/.test(p.id)) errs.push(`${who}: el id tiene que ser minúsculas, números y guiones.`);
    if (ids.has(p.id)) errs.push(`${who}: el id "${p.id}" está repetido.`);
    ids.add(p.id);
    if (!p.name?.es) errs.push(`${who}: falta el nombre.`);
    if (!data.types?.[p.type]) errs.push(`${who}: elegí un tipo de web.`);
    if (!data.origins?.[p.origin]) errs.push(`${who}: elegí un origen.`);
    (p.focus || []).forEach((f) => { if (!data.focus?.[f]) errs.push(`${who}: el enfoque "${f}" no existe.`); });
    if (!p.live || !/^https?:\/\//.test(p.live)) errs.push(`${who}: falta el link en vivo (https://…).`);
    if (p.code && !/^https?:\/\//.test(p.code)) errs.push(`${who}: el link al código tiene que empezar con https://.`);
    if (!p.context?.es) errs.push(`${who}: falta el contexto.`);
    if (!(p.solved?.es || []).length) errs.push(`${who}: cargá al menos un punto en "Qué resolví".`);
  });
  return errs;
}

export function renderProjects(html, data) {
  const L = (o) => (o && o.es) || '';

  const tag = (cls, key, text) => `<li class="tag ${cls}" data-pt="${key}">${esc(text)}</li>`;
  const tagSpan = (cls, key, text) => `<span class="tag ${cls}" data-pt="${key}">${esc(text)}</span>`;

  function tagsFor(p, asSpan) {
    const make = asSpan ? tagSpan : tag;
    const out = [];
    out.push(make('tag--ink', `origin:${p.origin}`, data.origins[p.origin].es));
    out.push(asSpan
      ? '<span class="tag tag--coral"><span class="dot" aria-hidden="true"></span>Live</span>'
      : '<li class="tag tag--coral"><span class="dot" aria-hidden="true"></span>Live</li>');
    if (!asSpan) out.push(make('tag--peach', `type:${p.type}`, data.types[p.type].es));
    (p.focus || []).forEach((f) => out.push(make('tag--sage', `focus:${f}`, data.focus[f].es)));
    return out.join('');
  }

  function featured(p, i) {
    const alt = L(p.alt) || L(p.name);
    const solved = (p.solved.es || [])
      .map((t, j) => `<li><span class="case__n" aria-hidden="true">${num(j)}</span><span data-pf="${p.id}:solved:${j}">${esc(t)}</span></li>`)
      .join('\n              ');
    const badge = L(p.badge)
      ? `\n            <span class="tag tag--coral tag--lg"><span data-pf="${p.id}:badge">${esc(L(p.badge))}</span> ✦</span>`
      : '';
    const kicker = L(p.kicker)
      ? `\n          <p class="label case__kicker" data-pf="${p.id}:kicker">${esc(L(p.kicker))}</p>`
      : '';
    const note = L(p.note)
      ? `\n          <p class="case__note" data-pf="${p.id}:note">${esc(L(p.note))}</p>`
      : '';
    const code = p.code
      ? `\n            <a class="btn btn--ghost" href="${esc(p.code)}" target="_blank" rel="noopener" data-i18n="btn.code">Código</a>`
      : '';
    return `
      <article class="case" id="p-${p.id}" style="--accent: ${ACCENT[p.accent] || ACCENT.coral}" aria-labelledby="t-${p.id}">
        <div class="case__media">
          <figure class="shot-d" style="--ph: ${esc(p.placeholder || '#112F2C')}">
            <img src="img/p/${p.id}-d-1440.webp" srcset="${srcset(p.id, 'd', D_SRCSET)}"
                 sizes="(min-width: 1024px) min(56vw, 780px), 100vw" width="2880" height="1800"
                 loading="lazy" decoding="async" alt="Captura desktop de ${esc(alt)}" data-pa="${p.id}:d">
            <figcaption class="tag tag--ink shot-label" data-i18n="label.desktop">Desktop</figcaption>
          </figure>
          <figure class="shot-m">
            <figcaption class="tag tag--coral shot-label" data-i18n="label.mobile">Mobile</figcaption>
            <div class="phone" style="--ph: ${esc(p.placeholder || '#112F2C')}">
              <img src="img/p/${p.id}-m-780.webp" srcset="${srcset(p.id, 'm', M_W)}"
                   sizes="(max-width: 700px) 92vw, (min-width: 1024px) 210px, 220px" width="1170" height="2532"
                   loading="lazy" decoding="async" alt="Captura mobile de ${esc(alt)}" data-pa="${p.id}:m">
            </div>
          </figure>
        </div>
        <div class="case__info">
          <div class="case__head">
            <span class="case__num" aria-hidden="true">${num(i)}</span>${badge}
          </div>
          <ul class="tags" aria-label="Etiquetas" data-i18n-aria="aria.tags">${tagsFor(p, false)}</ul>${kicker}
          <h3 class="case__title" id="t-${p.id}" data-pf="${p.id}:name">${esc(L(p.name))}</h3>
          <p class="case__context" data-pf="${p.id}:context">${esc(L(p.context))}</p>
          <div class="case__solved">
            <p class="tag tag--ink"><span data-i18n="label.solved">Qué resolví</span>&nbsp;· ${p.solved.es.length}</p>
            <ol>
              ${solved}
            </ol>
          </div>${note}
          <div class="case__stack">
            <span class="label" aria-hidden="true">Stack</span>
            <ul class="stack" aria-label="Tecnologías" data-i18n-aria="aria.stack">${(p.stack || []).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
          </div>
          <div class="case__actions">
            <a class="btn" href="${esc(p.live)}" target="_blank" rel="noopener" data-i18n="btn.live">Ver en vivo ↗</a>${code}
            <button class="btn btn--ghost" type="button" data-open="${p.id}" data-i18n="btn.shots">Ver capturas</button>
          </div>
        </div>
      </article>`;
  }

  function row(p, i) {
    return `
          <li class="arc-item" data-type="${p.type}" data-focus="${(p.focus || []).join(' ')}">
            <a class="arc-row" href="${esc(p.live)}" target="_blank" rel="noopener" data-open="${p.id}">
              <span class="arc-row__num">${num(i)}</span>
              <span class="arc-row__main">
                <span class="arc-row__name" data-pf="${p.id}:name">${esc(L(p.name))}</span>
                <span class="arc-row__tags">${tagsFor(p, true)}</span>
              </span>
              <span class="arc-row__type">${tagSpan('tag--line', `type:${p.type}`, data.types[p.type].es)}</span>
              <span class="arc-row__thumbs" aria-hidden="true" style="--ph: ${esc(p.placeholder || '#112F2C')}">
                <img class="arc-row__d" src="img/p/${p.id}-d-480.webp" srcset="img/p/${p.id}-d-480.webp 480w, img/p/${p.id}-d-960.webp 960w" sizes="(min-width: 900px) 30vw, 60vw" width="480" height="300" loading="lazy" decoding="async" alt="">
                <img class="arc-row__m" src="img/p/${p.id}-m-390.webp" width="390" height="844" loading="lazy" decoding="async" alt="">
              </span>
              <span class="arc-row__go" aria-hidden="true">↗</span>
            </a>
          </li>`;
  }

  const errs = validate(data);
  if (errs.length) throw new Error(errs.join('\n'));

  // Destacados arriba; "Más proyectos" muestra solo el resto (nunca se repiten).
  // La numeración sigue de corrido y el modal recorre los proyectos en ese mismo orden.
  const feat = data.projects.filter((p) => p.featured);
  const rest = data.projects.filter((p) => !p.featured);
  const ordered = [...feat, ...rest];
  const parts = {
    featured: feat.map(featured).join('\n') + '\n      ',
    archive: rest.map((p, i) => row(p, feat.length + i)).join('\n') + '\n          ',
    data: `\n  <script type="application/json" id="projectsData">${JSON.stringify({
      types: data.types, origins: data.origins, focus: data.focus, projects: ordered,
    }).replace(/</g, '\\u003c')}</script>\n  `,
  };

  let out = html;
  for (const [key, content] of Object.entries(parts)) {
    const re = new RegExp(`(<!-- build:${key}:start -->)[\\s\\S]*?(<!-- build:${key}:end -->)`);
    if (!re.test(out)) throw new Error(`Falta el marcador build:${key} en index.html`);
    // Reemplazo con función: un "$" en los textos (precios, etc.) no rompe nada.
    out = out.replace(re, (_, a, b) => a + content + b);
  }

  // Contadores del hero y de la sección
  out = out.replace(/(data-count="live">)\d+/g, (_, a) => a + data.projects.length);
  out = out.replace(/(data-count="featured">)\d+/g, (_, a) => a + feat.length);

  return { html: out, featured: feat.length, rest: rest.length, total: data.projects.length };
}
