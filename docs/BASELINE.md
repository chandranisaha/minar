# Baseline: what exists today

Factual snapshot of the repo before any shell work. Source of truth for "what is already built".
Repo: `megathon26-sushi-aur-ek`, working title "Money Mohalla". Latest commit read: `63d7be2`.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install dependencies |
| `npm run dev` | Vite dev server on http://localhost:5173 |
| `npm run build` | `tsc -b` type-check, then `vite build` into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | `oxlint` |
| `npm run art` | `python tools/import_art.py` (needs Python, numpy, Pillow) |
| `SHOT_DIR=./shots node tools/e2e.mjs` | Playwright smoke test. Needs the dev server running. Not wired to an npm script |

There is **no unit-test runner** (no Vitest/Jest) and no `npm test`.

## Stack

Vite 8, React 19, TypeScript 6, Tailwind v4, Framer Motion, React Router 7, Zustand 5 (persisted), react-i18next
(English, Hindi, Telugu), EasyStar.js (A* pathfinding), Fontsource fonts (self-hosted). Playwright is a devDependency.
No game engine, no PWA plugin, no backend, no audio.

## Routes

| Route | File | State |
| --- | --- | --- |
| `/` | `src/screens/Landing.tsx` | Overworld hub. Redirects to `/story` if the story has not been seen |
| `/story` | `src/screens/Story.tsx` | Cover plus 5 skippable beats. **Portrait only** |
| `/play/:pillar` | `src/screens/Play.tsx` | **Placeholder shell**: "Coming soon", dev "Mark as complete" button, sample recap card |
| `/dashboard` | `src/screens/Dashboard.tsx` | Stub: title and one line of text |
| `/kit` | `src/screens/Kit.tsx` | Art-kit review page (temporary) |

`src/App.tsx` wraps everything in `IrisProvider` and a fixed full-screen container, with `FilmOverlay` on top.
Routing is `BrowserRouter` in `src/main.tsx`. `public/_redirects` holds the Netlify SPA fallback.

## State (`src/store/game.ts`, Zustand, persisted under `money-mohalla-v1`)

`language`, `persona` (school | college | earner), `startAmount`, `goalAmount`, `savedAmount`, `completedPillars`,
`storySeen`, `celebrated`, `liteMode` (null = auto), `skills` (six keys, all zero, nothing updates them).

- Completing a pillar adds one quarter of (goal - start) to `savedAmount`. There is no quality, partial progress or brightness.
- Personas: school 1,500 to 12,000; college 4,000 to 30,000; earner 6,000 to 45,000 (illustrative).
- No Happy Index, no install ID, no class code, no avatar, no festival, no wallet, no event log, no state migration.
- `autoLite()` turns Lite mode on for reduced-motion or 4 or fewer CPU cores.

## Content (`src/content/data.ts`)

Pillar ids: `plan`, `save`, `invest`, `safe`, with colours and lamp index. Personas, six skill names
(planning, prioritising, saving, riskSense, patience, scamSense), language list and an `inr()` formatter.
Placeholder game names in the locale files: Weekly Budget, Two Bad Weeks, Risk & Time Lab, Spot the Scam.

## Overworld (`src/world`)

- World is 1000 x 1400 units, tall and portrait-shaped, tiled on a 25-unit walk grid (`layout.ts`).
- Doorways today: `plan` = bangle stall, `save` = Irani chai cafe, `invest` = pearl shop, `safe` = recharge/UPI kiosk with a fake
  "OFFER!" sign. Doorway positions are hard-coded in `SHOP_LAYOUT`.
- `Overworld.tsx` runs a `requestAnimationFrame` loop: keyboard (WASD or arrows), tap/drag to walk with A* pathfinding,
  joystick vector, camera follow (scale clamped 0.6 to 1.5, tuned for portrait: `min(w/520, h/760)`), intro establishing shot.
- Standing near a door shows an "Enter" button. **Keyboard Enter** enters it. Hover/focus/tap shows a signboard.
- `WorldScene.tsx` composes the painted art, the four lamps (on or off only), shopkeepers, pigeons and overhead layer.
- Entering a shop uses an iris wipe (`Iris.tsx`) to `/play/:pillar`.

## Controls today

- Keyboard: WASD or arrows to move; Enter at a doorway. Handlers live inside `Overworld.tsx` and `Story.tsx` (separate listeners).
- Touch: `Joystick.tsx` (fixed bottom-left, writes a shared module-level `joy` object, **single pointer, no multi-touch tracking**),
  plus tap or drag to walk. Shown when `pointer: coarse` or width under 700.
- **No on-screen A button.** No input abstraction or context stack. Story also accepts Space, ArrowRight/Left, Escape, swipe and tap.

## Story (`Story.tsx`, `screens/story/Beats.tsx`)

Cover (language chooser, Start) then five beats: dawn at the Charminar, choose persona, Nani's flower stall (she hands over
savings), the fee receipt (goal amount, due in 12 months), the bazaar opens. Skippable. Shows a "turn your phone upright"
overlay on short landscape screens. It does **not** state the objective, the lamps, the Happy Index or the controls.

## HUD and components

`Hud.tsx` provides `GoalBar` (stepped fill), `PersonaChip`, `LangSwitch`, `LiteToggle`, `ReplayStory`, `LampMeter`
(four small minarets), `TopHud`, `BottomHud` (compact on touch). Also `TitleCard`, `Iris`, `Celebration` (fireworks plus Nani when
four lamps are lit), `CharminarArt`, `Coin`.

## Art and design system

- `DESIGN.md` defines the system: Cuphead-era rendering, inked outlines, flat cel colour, flat offset shadows, stepped ~10 fps motion,
  film grain (`FilmOverlay`), iris wipes, warm Indian-street palette.
- **Tokens:** Tailwind `@theme` variables in `src/index.css` and a JS mirror in `src/art/palette.ts`. **Many hex values are still
  hard-coded in components** (for example `#2B1A17`, `#FFF3D6` in `TitleCard`, `Iris`, `Hud`, `Overworld`), so the tokens are not yet
  the only source of colour.
- Procedural SVG art in `src/art/` (Toon rig, Shops, Scenery, Charminar). `ArtSlot` swaps in `/public/art/<name>.webp|png|svg` when
  present. Painted art present: Charminar, bangle stall, pearl stall, recharge kiosk, rangoli, skyline, street-wall buildings,
  hero walk frames, face expressions. Missing painted art: chai cafe (falls back to SVG).
- `tools/import_art.py` and `tools/crop_sprites.py` generate the WebP art and sprites from `graphics/` and `art-source/`.

## i18n

`src/locales/en.json`, `hi.json`, `te.json` (146 lines each). `src/i18n.ts` initialises i18next from the stored language and syncs
`document.documentElement.lang`. `TRANSLATION_REVIEW.md` lists lines that need a native speaker.

## Offline, PWA, performance

None. No manifest, no service worker. Everything loads from the dev server or static build. Lite mode reduces grain, scratches and
SVG filters.

## Not built yet (all of these are shell scope unless noted)

- `src/games/*` does not exist (the four mini-games are teammates' work)
- Game host, adapters, registry, placeholder games
- A button, input abstraction, multi-touch joystick
- Progress model beyond "completed or not", Happy Index, life moments, brightness states
- Charminar progress page, doorway cards, status badges, coach marks
- Objective-first opening story
- Ending summary, share card, NGO dashboard, event log
- PWA/offline, tests beyond one Playwright smoke script, `docs/INTEGRATION.md`

## Run results (checked on the baseline, no code changed)

| Step | Result |
| --- | --- |
| `npm install` | OK. 68 packages added, 0 vulnerabilities |
| `npm run build` | OK in about 4.4 s. Main JS bundle 582 kB (182 kB gzipped), CSS 42 kB (12 kB gzipped). Fonts are many separate files |
| `npm run dev` | OK. Vite 8.3.4 ready in about 1.4 s on http://localhost:5173. `/`, `/src/main.tsx` and `/art/manifest.json` return 200 |
| `npm run lint` | 0 errors, warnings only: `react/only-export-components` in several art files and `Iris.tsx`, and `no-unused-expressions` in `tools/e2e.mjs` |
| Browser check | Not run in a browser by this baseline. `tools/e2e.mjs` was not executed |
