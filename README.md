# JSF® — Portfolio

Personal portfolio of **Juan Sebastián Fernandez**, web developer based in Córdoba, Argentina.
Brutalist editorial design, kinetic typography and saturated color blocks — built to score **Lighthouse 90+**.

**Live:** https://juansebastian-dev.vercel.app

---

## Stack

Vanilla **HTML5 · CSS3 · JavaScript ES6+**, with [GSAP](https://gsap.com) + ScrollTrigger
for motion over **native scrolling** (no scroll hijacking — input latency is zero).
Libraries are **vendored locally** (`js/vendor/`) — zero CDN dependencies,
no frameworks, no build step: clone and deploy.

## Structure

```
├── index.html          # Semantic markup, one commented block per section
├── css/
│   ├── tokens.css      # Design tokens: palette, themes, type scale, spacing
│   ├── base.css        # Reset, utilities, accessibility helpers
│   ├── components.css  # Tickets, chips, buttons, frames, badges, marquees
│   └── sections.css    # Nav, hero, manifesto, projects, skills, footer
├── js/
│   ├── vendor/         # gsap + ScrollTrigger (local, no CDN)
│   ├── fit.js          # Fit-text: display type always fills its container
│   ├── app.js          # Theme toggle, ES/EN i18n, clipboard — zero deps
│   └── motion.js       # GSAP layer: kinetic type, parallax, velocity skew
├── img/                # Project screenshots (WebP, ~106 KB total)
└── og.png              # 1200×630 social preview (LinkedIn / Twitter cards)
```

## Features

- **Dark / light mode** — hanging "cinema ticket" toggle. Only neutrals rotate;
  brand colors stay intact so no block loses identity. No flash on load
  (theme is applied by an inline snippet before first paint) and the
  preference persists via `localStorage`, falling back to `prefers-color-scheme`.
- **ES / EN** — second ticket switches language. Spanish lives in the HTML;
  English is a flat dictionary in `app.js` applied through `data-i18n` attributes.
  Updates `<html lang>` and persists.
- **Native scroll** — no smooth-scroll library: wheel input maps 1:1 to movement.
  In-page anchors use CSS `scroll-behavior` + `scroll-margin-top` for the fixed nav.
- **Motion with guardrails** — GSAP loads deferred; if it fails, the page
  works fully static. `prefers-reduced-motion` disables everything kinetic.
  Split text keeps an `sr-only` copy so screen readers are unaffected.
- **Performance** — LCP is text; images are lazy WebP with explicit dimensions
  (zero CLS); only `transform`/`opacity` are animated.
- **Fit-text titles** — display type is measured and sized at runtime so every
  line fills its container exactly, at any viewport width and in both languages.
  No hardcoded sizes per breakpoint; recalculates on resize, font load and
  language switch. CSS `clamp()` remains as the no-JS fallback.
- **Responsive** — fluid `clamp()` scale plus breakpoints at 1100 / 900 / 768 / 700 / 560 / 480 / 400 px.
  On mobile, the theme/language tickets dock as side tabs below the nav.

## Design notes

- Typeface: **Archivo** (variable, width + weight axes) by Omnibus-Type — an Argentine foundry.
- Palette: ink `#131210` · bone `#EFEDE6` · electric blue `#1D35F5` · red-orange `#FF4017` · yellow `#FFD600`.
- Each project lives in a color block chosen from the real site's own aesthetic.

## Before publishing

- **Social preview**: `og:image` points to `https://juansebastian-dev.vercel.app/og.png` —
  update the absolute URLs in `<head>` if your domain differs.
- **CV**: drop your PDF at `cv/JuanSebastian-Fernandez-CV.pdf` and uncomment the
  "Descargar CV" link in the footer (`index.html`).

## Run locally

Any static server works:

```bash
npx serve .
```

## Deploy

Static output — push to GitHub and import in [Vercel](https://vercel.com), or `vercel --prod`.

---

<details>
<summary>🇦🇷 Versión en español</summary>

Portfolio personal de Juan Sebastián Fernandez (Córdoba, AR). Diseño editorial
brutalist con tipografía cinética y bloques de color saturados, construido en
HTML/CSS/JS vanilla + GSAP, sin build step. Incluye modo oscuro sin flash,
idioma ES/EN persistente, motion con `prefers-reduced-motion` respetado y
objetivo Lighthouse 90+. Para correrlo local: `npx serve .` — para publicar:
importar el repo en Vercel.

</details>

---

Designed & developed by **Juan Sebastián Fernandez** · [LinkedIn](https://www.linkedin.com/in/juansebastian-fernandez/) · [GitHub](https://github.com/Seba-fernandez)
