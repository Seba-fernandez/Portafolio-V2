# JSF® — Portfolio

Personal portfolio of **Juan Sebastián Fernandez**, web developer based in Córdoba, Argentina.
Brutalist editorial design, kinetic typography and saturated color blocks — built with performance,
accessibility and clear user flows as implementation criteria.

**Live:** https://juansebastianfernandez-dev.vercel.app

---

## Stack

Vanilla **HTML5 · CSS3 · JavaScript ES6+**, with [GSAP](https://gsap.com) + ScrollTrigger
for motion over **native scrolling** (no scroll hijacking — input latency is zero).
Animation libraries are **vendored locally** (`js/vendor/`); Archivo is loaded from Google Fonts.
No framework or build step is required: clone and deploy.

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
├── img/                # Project screenshots (WebP, ~267 KB total)
└── og.png              # 1200×630 social preview (LinkedIn / Twitter cards)

Five live projects are featured, opening with Grupo CESPAD: a returning-client project
that evolved an initial padel landing into a broader digital presence, with sport-based
information architecture, conversion paths and technical SEO.
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
- **Performance** — LCP is text; images have explicit dimensions and load lazily;
  motion is limited to composited properties where possible.
- **Fit-text titles** — display type is measured and sized at runtime so every
  line fills its container exactly, at any viewport width and in both languages.
  No hardcoded sizes per breakpoint; recalculates on resize, font load and
  language switch, with a final guard pass that guarantees text never overflows
  its box. CSS `clamp()` remains as the no-JS fallback.
- **Contact panel that never dead-ends** — `mailto:` silently fails on systems
  with no mail client configured, so the CTA opens a small panel offering real
  destinations (Gmail, Outlook web, local mail app, copy address) as plain
  anchors — no popup blocker or OS can refuse them. Keyboard accessible: focus
  trap, Esc to close, focus restored on exit. Without JS the CTA stays a
  standard `mailto:` link.
- **Locked header controls** — the nav's real height is published as `--nav-h`
  via `ResizeObserver`, so the theme/language tickets dock exactly beneath the
  bar at every width, zoom level and font size. Below 900px the bar turns solid
  for legibility over saturated blocks; above it, the blend-mode nav returns and
  the tickets hang centered from the top edge. `viewport-fit=cover` plus
  `env(safe-area-inset-right)` keeps them clear of notches on iOS.
- **Responsive** — fluid `clamp()` scale plus breakpoints at 1100 / 900 / 768 / 700 / 560 / 480 / 400 px.
  On mobile, the theme/language tickets dock as side tabs below the nav.

## Design notes

- Typeface: **Archivo** (variable, width + weight axes) by Omnibus-Type — an Argentine foundry.
- Palette: ink `#131210` · bone `#EFEDE6` · electric blue `#1D35F5` · red-orange `#FF4017` · yellow `#FFD600`.
- Each project lives in a color block chosen from the real site's own aesthetic.

## Before publishing

- **Social preview**: `og:image` points to `https://juansebastianfernandez-dev.vercel.app/og.png` —
  update the absolute URLs in `<head>` if your domain differs.
- **CV**: Spanish and English PDFs live in `/cv` and are linked from the footer.

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
idioma ES/EN persistente y motion con `prefers-reduced-motion` respetado.
Para correrlo local: `npx serve .` — para publicar:
importar el repo en Vercel.

</details>

---

Designed & developed by **Juan Sebastián Fernandez** · [LinkedIn](https://www.linkedin.com/in/juansebastian-fernandez/) · [GitHub](https://github.com/Seba-fernandez)
