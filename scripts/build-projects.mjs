// Genera los destacados, el archivo y los datos del modal a partir de
// data/projects.json y los escribe dentro de index.html, entre marcadores.
// Uso: node scripts/build-projects.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(readFileSync(join(root, 'data/projects.json'), 'utf8'));
const htmlPath = join(root, 'index.html');
let html = readFileSync(htmlPath, 'utf8');

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const num = (i) => String(i + 1).padStart(2, '0');
const D_W = [960, 1440, 2160, 2880];
const M_W = [390, 780, 1170];
const srcset = (id, kind, ws) => ws.map((w) => `img/p/${id}-${kind}-${w}.webp ${w}w`).join(', ');
const accentVar = { coral: 'var(--coral)', sage: 'var(--sage)', peach: 'var(--peach)' };

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
  p.focus.forEach((f) => out.push(make('tag--sage', `focus:${f}`, data.focus[f].es)));
  return out.join('');
}

function featured(p, i) {
  const solved = p.solved.es
    .map((t, j) => `<li><span class="case__n" aria-hidden="true">${num(j)}</span><span data-pf="${p.id}:solved:${j}">${esc(t)}</span></li>`)
    .join('\n              ');
  const note = p.note
    ? `\n          <p class="case__note" data-pf="${p.id}:note">${esc(p.note.es)}</p>`
    : '';
  const code = p.code
    ? `\n            <a class="btn btn--ghost" href="${esc(p.code)}" target="_blank" rel="noopener" data-i18n="btn.code">Código</a>`
    : '';
  return `
      <article class="case" id="p-${p.id}" style="--accent: ${accentVar[p.accent]}" aria-labelledby="t-${p.id}">
        <div class="case__media">
          <figure class="shot-d" style="--ph: ${p.placeholder}">
            <img src="img/p/${p.id}-d-1440.webp" srcset="${srcset(p.id, 'd', D_W)}"
                 sizes="(min-width: 1024px) min(56vw, 780px), 100vw" width="2880" height="1800"
                 loading="lazy" decoding="async" alt="Captura desktop de ${esc(p.alt.es)}" data-pa="${p.id}:d">
            <figcaption class="tag tag--ink shot-label" data-i18n="label.desktop">Desktop</figcaption>
          </figure>
          <figure class="shot-m">
            <figcaption class="tag tag--coral shot-label" data-i18n="label.mobile">Mobile</figcaption>
            <div class="phone" style="--ph: ${p.placeholder}">
              <img src="img/p/${p.id}-m-780.webp" srcset="${srcset(p.id, 'm', M_W)}"
                   sizes="(max-width: 700px) 92vw, (min-width: 1024px) 210px, 220px" width="1170" height="2532"
                   loading="lazy" decoding="async" alt="Captura mobile de ${esc(p.alt.es)}" data-pa="${p.id}:m">
            </div>
          </figure>
        </div>
        <div class="case__info">
          <div class="case__head">
            <span class="case__num" aria-hidden="true">${num(i)}</span>
            <span class="tag tag--coral tag--lg"><span data-pf="${p.id}:badge">${esc(p.badge.es)}</span> ✦</span>
          </div>
          <ul class="tags" aria-label="Etiquetas" data-i18n-aria="aria.tags">${tagsFor(p, false)}</ul>
          <p class="label case__kicker" data-pf="${p.id}:kicker">${esc(p.kicker.es)}</p>
          <h3 class="case__title" id="t-${p.id}" data-pf="${p.id}:name">${esc(p.name.es)}</h3>
          <p class="case__context" data-pf="${p.id}:context">${esc(p.context.es)}</p>
          <div class="case__solved">
            <p class="tag tag--ink"><span data-i18n="label.solved">Qué resolví</span>&nbsp;· ${p.solved.es.length}</p>
            <ol>
              ${solved}
            </ol>
          </div>${note}
          <div class="case__stack">
            <span class="label" aria-hidden="true">Stack</span>
            <ul class="stack" aria-label="Tecnologías" data-i18n-aria="aria.stack">${p.stack.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
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
          <li class="arc-item" data-type="${p.type}" data-focus="${p.focus.join(' ')}">
            <a class="arc-row" href="${esc(p.live)}" target="_blank" rel="noopener" data-open="${p.id}">
              <span class="arc-row__num">${num(i)}</span>
              <span class="arc-row__main">
                <span class="arc-row__name" data-pf="${p.id}:name">${esc(p.name.es)}</span>
                <span class="arc-row__tags">${tagsFor(p, true)}</span>
              </span>
              <span class="arc-row__type">${tagSpan('tag--line', `type:${p.type}`, data.types[p.type].es)}</span>
              <span class="arc-row__thumbs" aria-hidden="true" style="--ph: ${p.placeholder}">
                <img class="arc-row__d" src="img/p/${p.id}-d-480.webp" srcset="img/p/${p.id}-d-480.webp 480w, img/p/${p.id}-d-960.webp 960w" sizes="(min-width: 900px) 30vw, 60vw" width="480" height="300" loading="lazy" decoding="async" alt="">
                <img class="arc-row__m" src="img/p/${p.id}-m-390.webp" width="390" height="844" loading="lazy" decoding="async" alt="">
              </span>
              <span class="arc-row__go" aria-hidden="true">↗</span>
            </a>
          </li>`;
}

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

for (const [key, content] of Object.entries(parts)) {
  const re = new RegExp(`(<!-- build:${key}:start -->)[\\s\\S]*?(<!-- build:${key}:end -->)`);
  if (!re.test(html)) throw new Error(`Falta el marcador build:${key} en index.html`);
  html = html.replace(re, `$1${content}$2`);
}

// Contadores del hero y de la sección
html = html.replace(/(data-count="live">)\d+/g, `$1${data.projects.length}`);
html = html.replace(/(data-count="featured">)\d+/g, `$1${feat.length}`);

writeFileSync(htmlPath, html);
console.log(`OK · ${feat.length} destacados · ${rest.length} en "Más proyectos" · ${data.projects.length} en total`);
