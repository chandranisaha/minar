# Money Mohalla (working title)

A financial-literacy game for Indian students (16-22). This repo holds the **landing hub, the opening story and the shared game shell**.
The four mini-games plug in later as `/play/:pillar`.

The hub is a **Cuphead-style overworld**: a painted Hyderabad bazaar with the Charminar at the centre. You walk a chibi character
around (tap-to-walk with A* pathfinding, drag to steer, arrow keys / WASD), step up to one of four shop doorways and an iris wipe takes
you in. Four minaret lamps light as the pillars are completed.

| Pillar | Doorway |
| --- | --- |
| 1. Plan & Budget | Bangle stall |
| 2. Save & Manage | Irani-chai cafe |
| 3. Understand Investing | Pearl shop |
| 4. Stay Financially Safe | Recharge / UPI kiosk (with the fake "OFFER!" sign) |

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview
```

Routes: `/` hub, `/story` opening story (auto on first visit, replay from the HUD), `/play/plan` Festival Countdown (Pillar 1, see
`src/games/festival/README.md`; `?demo` starts Demo mode), `/play/:pillar` placeholder shell for the other pillars
(has a "Mark as complete" dev button), `/dashboard` stub, `/kit` art-kit review page.

**Controls:** desktop = arrow keys / WASD or click-to-walk; phone/tablet = on-screen analog joystick (Among Us style) or tap-to-walk.

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
