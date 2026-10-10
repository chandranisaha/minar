# Money Mohalla (working title)

A financial-literacy game for Indian students (16-22). This repo holds the **island hub, the opening story and the shared game shell**;
the four mini-games plug in later as `/play/:pillar`.

The hub is a calm, hand-painted **isometric island** (Charminar plaza in the centre). Tap a place and a small character walks the path to it;
a paper card offers "Enter". Four flags turn gold as pillars complete, and the college gate opens when all four are done.

| Pillar | Place |
| --- | --- |
| 1. Plan & Budget | bangle market |
| 2. Save & Manage | Irani chai cafe |
| 3. Understand Investing | pearl shop |
| 4. Stay Financially Safe | recharge / UPI kiosk |
| Goal | college gate (opens after all four) |

Art prompts for the island, landmarks and characters: `ART_PROMPTS.md`. Layout data: `src/content/island.json`.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview
```

Routes: `/` hub, `/story` opening story (auto on first visit, replay from the HUD), `/play/:pillar` placeholder shell
(has a "Mark as complete" dev button), `/dashboard` stub, `/kit` art-kit review page.

**Controls:** tap/click a place to walk there; drag to pan, pinch / wheel / +- to zoom. Keyboard: Tab to a place, Enter to walk.

## Deploy

Static site, no backend. `npm run build`, then upload `dist/` to Vercel / Netlify / GitHub Pages.
Add an SPA fallback so deep links work (Netlify: `/* /index.html 200` in `public/_redirects`; Vercel: `rewrites` to `/index.html`).

## Art pipeline (drop in painted art, no code changes)

Put source PNGs in `graphics/` (committed in the repo; or pass another folder) and run:

```bash
npm run art        # python tools/import_art.py
```

The tool matches by **filename keyword**, trims transparent borders, converts to WebP and writes `public/art/<slot>.webp` plus
`public/art/manifest.json`:

| Keyword in filename | Slot | Used for |
| --- | --- | --- |
| `charminar` | `charminar` | hub monument + story (lamps are overlaid by code) |
| `bangle` | `shop-plan` | pillar 1 stall |
| `chai` / `irani` / `cafe` | `shop-save` | pillar 2 stall |
| `pearl` | `shop-invest` | pillar 3 stall |
| `recharge` / `kiosk` / `upi` | `shop-safe` | pillar 4 kiosk |
| `rangoli` | `deco-rangoli` | plaza floor medallion |
| `cityscape` / `skyline` | `bg-skyline` | watercolour skyline behind the buildings |
| `alleyway` frames (`mediterranean`, `old-town`) | `bld-a-*`, `bld-b-*` | street-wall building clusters (split into left/right automatically) |

Anything missing falls back to the procedural SVG in `src/art/` (`<ArtSlot/>` pattern), so the game always runs.
Shopkeepers are separate animated SVG characters layered on the counters, so they can squash-and-stretch on hover.

The character sprites (hero walker, full-body, expressions) are cut from `art-source/character-sheet.png` by `tools/crop_sprites.py`.

## Stack

Vite + React 19 + TypeScript + Tailwind v4, Framer Motion, React Router, Zustand (persisted), react-i18next (EN / हिन्दी / తెలుగు),
EasyStar.js (A* on the walk grid). Fonts are self-hosted via Fontsource (Chango, Bowlby One, Rozha One, Noto Sans + Devanagari + Telugu).

## Project map

```
src/art/         procedural SVG art, rubber-hose Toon rig, FilmOverlay, ArtSlot
src/world/       overworld: layout + collision grid, scene, input/camera/hero loop
src/screens/     Landing, Story (+ story/Beats), Play (game shell), Dashboard, Kit
src/components/  HUD (goal bar, lamps, language, lite), TitleCard, Iris wipe, Celebration
src/store/       Zustand game state (language, persona, goal, saved, completed pillars, lite mode)
src/locales/     en.json hi.json te.json  (all copy; no text in images)
tools/           import_art.py, crop_sprites.py, shot.mjs (screenshots), e2e.mjs (smoke test)
```

## Test

With the dev server running: `SHOT_DIR=./shots node tools/e2e.mjs` runs the core loop on phone and desktop sizes
(story skip, walk to a shop, iris, complete, lamp, keyboard, language, lite mode).

## Guardrails

No real brands or products, all amounts are labelled illustrative, nothing is collected (state lives in `localStorage`), no audio.
