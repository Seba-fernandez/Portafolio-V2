# JSF® — Portfolio

Personal portfolio of **Juan Sebastián Fernandez**, web developer based in Córdoba, Argentina.
Brutalist editorial design, kinetic typography and a palette taken from Sanzo Wada's
*A Dictionary of Color Combinations* (No. 166) — built with performance, accessibility and
clear user flows as implementation criteria.

**Live:** https://juansebastianfernandez-dev.vercel.app

---

## Stack

Vanilla **HTML5 · CSS3 · JavaScript ES6+**, with [GSAP](https://gsap.com) + ScrollTrigger
for motion over **native scrolling**. Animation libraries are vendored locally (`js/vendor/`);
Archivo is loaded from Google Fonts. No framework or build step is needed to deploy.

## Structure

```
├── index.html              # Semantic markup, one commented block per section
├── data/projects.json      # Single source of truth for every project (ES + EN), in page order
├── scripts/
│   └── build-projects.mjs  # Writes featured cases, archive rows and modal data into index.html
├── css/styles.css          # Tokens, base, components, sections
├── panel/                  # Private admin panel (see below)
├── js/
│   ├── vendor/             # gsap + ScrollTrigger (local, no CDN)
│   ├── fit.js              # Fit-text: display type always fills its container
│   ├── app.js              # Floating nav, theme, ES/EN i18n, contact panel
│   ├── projects.js         # Archive filters, list/grid view, project dialog
│   ├── render-projects.mjs # Shared renderer used by the build script and the panel
│   └── motion.js           # GSAP layer: kinetic type, parallax, reveals
├── img/p/                  # Project screenshots, desktop + mobile, responsive WebP
└── og.png                  # 1200×630 social preview
```

## Private panel (`/panel`)

A small admin page to add, edit, reorder, feature or delete projects and upload their
screenshots — no backend, no extra services.

- **Access:** a GitHub fine-grained token with *Contents: Read and write* on this repo only.
  Anyone else who finds `/panel` just sees a login. The page is never linked from the site and
  is served with `noindex` (meta tag + `X-Robots-Tag` header in `vercel.json`).
- **Screenshots:** upload a desktop capture (1440×900, ideally @2x) and a mobile one (390×844,
  ideally @3x). The browser crops them from the top and generates every WebP size.
- **Save & publish:** one commit with `data/projects.json`, the regenerated `index.html` and the
  new images (images of deleted projects are removed). Vercel deploys it automatically.
  It refuses to save if the projects changed on GitHub since the panel was opened.
- The panel and `scripts/build-projects.mjs` share the same renderer (`js/render-projects.mjs`),
  so editing the JSON by hand and running the script gives exactly the same result.

## Adding or editing a project by hand

1. Edit `data/projects.json`: name, type, origin, focus tags, context, what was solved
   (Spanish and English), stack, links, and `featured: true` to show it as a case study
   (otherwise it goes to "More projects"). The list order is the page order.
2. Add its screenshots to `img/p/` with these names and widths:
   - desktop (16:10, captured at 1440×900 @2x): `<id>-d-480.webp`, `-960`, `-1440`, `-2160`, `-2880`
   - mobile (captured at 390×844 @3x): `<id>-m-390.webp`, `-780`, `-1170`
3. Run `node scripts/build-projects.mjs` and commit. Filter chips and counters update by themselves:
   a type or focus only shows up once at least one project uses it.

## Features

- **Featured cases** — sticky screenshots on desktop (desktop capture + phone overlap), the
  project's real mobile design inside a phone frame on small screens, and a "what I solved" list.
- **More projects** — everything that isn't featured (featured ones never repeat here),
  filterable by website type and focus, in list or grid view. Numbering continues from the
  featured cases. Filtering animates with the View Transitions API where supported. Without JS
  each row is a plain link to the live site.
- **Project dialog** — native `<dialog>` (top layer, focus handling and Esc for free),
  desktop/mobile screenshot switch, previous/next, arrow keys and deep links (`#ver-<id>`).
  High-resolution screenshots are warmed on hover/focus, so the dialog opens sharp.
- **Sharp images without a loading screen** — every screenshot ships at up to 2880 px (desktop)
  and 1170 px (mobile) with `srcset` + `sizes`, explicit dimensions, lazy loading and a
  placeholder colour taken from the image.
- **Floating nav** — theme and language live inside the bar; it hides while scrolling down and
  comes back on scroll up or focus.
- **Dark / light mode** — the Wada combination simply inverts. No flash on load, preference persisted.
- **ES / EN** — UI strings live in `app.js`, project content in `data/projects.json`.
- **Motion with guardrails** — GSAP loads deferred; if it fails the page works fully static.
  `prefers-reduced-motion` disables everything kinetic. Split text keeps an `sr-only` copy.
- **Contact panel that never dead-ends** — Gmail, Outlook web, local mail app or copy address.

## Design notes

- Typeface: **Archivo** (variable, width + weight axes) by Omnibus-Type — an Argentine foundry.
- Colour: Wada No. 166 — Naples Yellow `#FBE6A0`, Grenadine Pink `#F48067`, Deep Slate Green
  `#112F2C`, plus two mixes of them: peach `#F8B384` and sage `#D1C58B`.
  Text contrast is ≥ 4.5:1 everywhere; grenadine is only used as a fill under slate text (5.5:1).

## Run locally

```bash
npx serve .
```

## Deploy

Static output — push to GitHub and import in [Vercel](https://vercel.com), or `vercel --prod`.

---

<details>
<summary>🇦🇷 Versión en español</summary>

Portfolio personal de Juan Sebastián Fernandez (Córdoba, AR). Diseño editorial brutalist con
tipografía cinética y la combinación Nº 166 del diccionario de color de Sanzo Wada, en
HTML/CSS/JS vanilla + GSAP, sin build step para publicar.

**Sumar un proyecto:** desde el panel privado en `/panel` (token de GitHub con permiso de
escritura solo sobre este repo), o a mano: editar `data/projects.json`, agregar las capturas en
`img/p/` y correr `node scripts/build-projects.mjs`.

</details>

---

Designed & developed by **Juan Sebastián Fernandez** · [LinkedIn](https://www.linkedin.com/in/juansebastian-fernandez/) · [GitHub](https://github.com/Seba-fernandez)
