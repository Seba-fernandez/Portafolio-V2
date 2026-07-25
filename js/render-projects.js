/* ════════════════════════════════════════════════
   RENDER-PROJECTS — arma el HTML de cada proyecto
   a partir de js/data/projects.js y arma el
   diccionario de inglés que usa i18n.js.
   Corre ANTES que fit.js/i18n.js/motion.js: el resto
   del sitio depende de que este HTML ya exista.
   ════════════════════════════════════════════════ */

(() => {
  'use strict';

  function projectHTML(p, index) {
    const id = 'p' + (index + 1);
    const num = String(index + 1).padStart(2, '0');
    const gridFlip = p.flip ? ' project__grid--flip' : '';
    const frameFlip = p.flip ? ' frame--flip' : '';
    const result = p.es.result
      ? `<p class="project__result" data-i18n-html="${id}.result">${p.es.result}</p>`
      : '';
    const tags = p.tags.map(tag => `<li>${tag}</li>`).join('');

    return `
    <section class="project blk blk--${p.color}" aria-labelledby="${id}-title">
      <span class="project__num" aria-hidden="true">${num}</span>
      <div class="project__grid${gridFlip}">
        <div class="project__media">
          <figure class="frame${frameFlip} frame--sh-${p.shadow}" data-parallax>
            <img src="${p.img}" width="960" height="600" loading="lazy" decoding="async"
                 alt="${p.es.alt}" data-i18n-alt="${id}.alt">
            <figcaption class="frame__cap"><span data-i18n="${id}.name">${p.es.name}</span><span data-i18n="${id}.cap">${p.es.cap}</span></figcaption>
          </figure>
          <span class="sticker sticker--${p.sticker}" aria-hidden="true" data-i18n="${id}.sticker">${p.es.sticker}</span>
        </div>
        <div class="project__body">
          <h2 class="project__title display" id="${id}-title" data-split data-fit data-i18n-html="${id}.title">${p.es.title}</h2>
          <p class="label project__meta" data-i18n="${id}.meta">${p.es.meta}</p>
          <p class="project__desc" data-i18n="${id}.desc">${p.es.desc}</p>
          ${result}
          <ul class="tags" aria-label="Tecnologías">${tags}</ul>
          <div class="project__links">
            <a class="link-btn" href="${p.links.live}" target="_blank" rel="noopener" data-hover data-i18n="btn.live">Ver en vivo ↗</a>
            <a class="link-btn link-btn--ghost" href="${p.links.code}" target="_blank" rel="noopener" data-hover data-i18n="btn.code">Código</a>
          </div>
        </div>
      </div>
    </section>`;
  }

  // Deriva 'p1.desc', 'p2.title', etc. directamente de projects.js —
  // así i18n.js no necesita traducciones de proyectos hardcodeadas.
  function buildEnDict(projects) {
    const dict = {};
    projects.forEach((p, i) => {
      const id = 'p' + (i + 1);
      Object.keys(p.en).forEach(field => { dict[`${id}.${field}`] = p.en[field]; });
    });
    return dict;
  }

  const projects = (window.JSFdata && window.JSFdata.projects) || [];
  const list = document.getElementById('projects-list');
  if (list) list.innerHTML = projects.map(projectHTML).join('');

  window.JSFdata = window.JSFdata || {};
  window.JSFdata.projectsEN = buildEnDict(projects);
})();
