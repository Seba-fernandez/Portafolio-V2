/* ════════════════════════════════════════════════
   DATA — proyectos del portafolio
   Único lugar para agregar, quitar o editar un proyecto:
   un objeto por proyecto, con su copy en ambos idiomas.
   El número visible y el id interno (p1, p2…) se calculan
   por posición en el array — no hay que renumerar a mano.
   ════════════════════════════════════════════════ */

window.JSFdata = {
  projects: [
    {
      color: 'amarillo', shadow: 'rojo', sticker: 'tinta', flip: false,
      img: 'img/greenset.webp',
      tags: ['HTML5', 'CSS3', 'JS ES6+', 'WhatsApp API', 'Vercel'],
      links: { live: 'https://greenset-landing.vercel.app', code: 'https://github.com/Seba-fernandez/Greenset-Landing' },
      es: {
        alt: 'Captura del sitio Greenset Court',
        name: 'Greenset Court',
        cap: 'Landing · Cliente real',
        sticker: 'Cliente real ✦',
        title: 'Greenset<br>Court',
        meta: 'Landing · Leads por WhatsApp · Live',
        desc: 'Empresa de canchas de pádel sin presencia digital que necesitaba capturar leads calificados antes de su lanzamiento. Formulario que califica por tipo de proyecto y envía directo a WhatsApp — sin backend. Contadores animados con Intersection Observer, WebP, mobile-first.',
        result: '<strong>Hoy:</strong> en producción con mantenimiento continuo.',
      },
      en: {
        alt: 'Screenshot of the Greenset Court website',
        name: 'Greenset Court',
        cap: 'Landing · Real client',
        sticker: 'Real client ✦',
        title: 'Greenset<br>Court',
        meta: 'Landing · WhatsApp leads · Live',
        desc: 'A padel court company with no digital presence that needed to capture qualified leads before launch. A form that qualifies by project type and sends straight to WhatsApp — no backend. Animated counters with Intersection Observer, WebP, mobile-first.',
        result: '<strong>Today:</strong> in production under ongoing maintenance.',
      },
    },
    {
      color: 'azul', shadow: 'amarillo', sticker: 'rojo', flip: true,
      img: 'img/oratoria.webp',
      tags: ['HTML5', 'CSS3', 'JS ES6+', 'LocalStorage', 'Vercel'],
      links: { live: 'https://checklist-para-oratoria.vercel.app', code: 'https://github.com/Seba-fernandez/ChecklistOratoria' },
      es: {
        alt: 'Captura de la app Checklist de Oratoria',
        name: 'Checklist de Oratoria',
        cap: 'App · JS puro',
        sticker: 'App propia ✦',
        title: 'Checklist<br>de Oratoria',
        meta: 'App JS · LocalStorage · Live',
        desc: 'Herramienta propia para registrar consistencia en ejercicios de hablar en público. Estado que persiste entre sesiones sin backend, checklist interactiva, responsiva y accesible — JavaScript puro, cero frameworks.',
      },
      en: {
        alt: 'Screenshot of the Public Speaking Checklist app',
        name: 'Public Speaking Checklist',
        cap: 'App · Vanilla JS',
        sticker: 'Own app ✦',
        title: 'Speaking<br>Checklist',
        meta: 'JS App · LocalStorage · Live',
        desc: 'A personal tool to track consistency in public-speaking practice. State persists between sessions with no backend, interactive checklist, responsive and accessible — pure JavaScript, zero frameworks.',
      },
    },
    {
      color: 'rojo', shadow: 'oscuro', sticker: 'amarillo', flip: false,
      img: 'img/cafe.webp',
      tags: ['HTML5', 'CSS3', 'JS ES6+', 'DOM API', 'Vercel'],
      links: { live: 'https://blog-cafe-beige.vercel.app', code: 'https://github.com/Seba-fernandez/BlogCafe' },
      es: {
        alt: 'Captura del Blog de Café',
        name: 'Blog de Café',
        cap: 'Multi-página · 5 vistas',
        sticker: '5 páginas ✦',
        title: 'Blog<br>de Café',
        meta: 'Multi-página · JS DOM · Live',
        desc: 'Blog educativo de 5 páginas con listado de cursos, entradas y validación de formulario en JS puro. Arquitectura multi-página y manipulación del DOM sin librerías externas.',
      },
      en: {
        alt: 'Screenshot of the Coffee Blog',
        name: 'Coffee Blog',
        cap: 'Multi-page · 5 views',
        sticker: '5 pages ✦',
        title: 'Coffee<br>Blog',
        meta: 'Multi-page · JS DOM · Live',
        desc: 'A 5-page educational blog with course listings, posts and form validation in pure JS. Multi-page architecture and DOM manipulation with no external libraries.',
      },
    },
    {
      color: 'tinta', shadow: 'rojo', sticker: 'azul', flip: true,
      img: 'img/festival.webp',
      tags: ['HTML5', 'SASS/SCSS', 'WebP', 'Lazy loading', 'Vercel'],
      links: { live: 'https://festivalde-musica.vercel.app/', code: 'https://github.com/Seba-fernandez/FestivaldeMusica' },
      es: {
        alt: 'Captura del sitio Festival de Música',
        name: 'Festival de Música',
        cap: 'Landing · Video BG',
        sticker: 'Video BG ✦',
        title: 'Festival<br>de Música',
        meta: 'Landing · SASS · Video · Live',
        desc: 'Landing de alto impacto para un festival EDM en Argentina: video background, grilla de lineup de 2 días y 2 escenarios, galería y tickets en cards. SASS en partials, WebP y lazy loading.',
      },
      en: {
        alt: 'Screenshot of the Music Festival website',
        name: 'Music Festival',
        cap: 'Landing · Video BG',
        sticker: 'Video BG ✦',
        title: 'Music<br>Festival',
        meta: 'Landing · SASS · Video · Live',
        desc: 'A high-impact landing for an EDM festival in Argentina: video background, 2-day lineup grid for 2 stages, gallery and ticket cards. SASS partials, WebP and lazy loading.',
      },
    },
  ],
};
