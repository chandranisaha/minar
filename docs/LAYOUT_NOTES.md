# Layout notes (read-only audit)

How screens size themselves **today**, at phone width (390x844) and desktop (1440x900). Nothing here was changed by the
token work; this is a description of current behaviour so later work (including mounting the real games) follows it.

Standing decision: keep the repo's current orientation, layout and input (see `PROJECT_BRIEF.md` sections 5 and 6).

## Overworld (`src/world/Overworld.tsx`, route `/`)

- The overworld fills its container (`absolute inset-0`, which is the whole window). The world is a fixed **1000 x 1400 unit**
  scene (tall, portrait-shaped) drawn inside a transformed layer.
- Scale: `s = clamp(min(width / 520, height / 760), 0.6, 1.5)`.
- The camera follows the hero. Horizontally it clamps to the world when the window is narrower than the world, and centres the
  world when the window is wider. Vertically it always follows the hero (the world is taller than any window).

| | Phone 390 x 844 | Desktop 1440 x 900 |
| --- | --- | --- |
| Scale `s` | `min(0.75, 1.11)` = **0.75** | `min(2.77, 1.18)` = **1.18** |
| Visible world | 520 x 1125 units (half the world's width) | 1216 x 760 units (wider than the world, so it is centred and the margins show backdrop art) |
| Camera | follows the hero both ways | follows the hero vertically only |
| Touch UI | on (`pointer: coarse` or width under 700): joystick bottom-left, compact HUD | off: full HUD row, keyboard hint |

- HUD is absolute-positioned over the scene: `TopHud` (goal bar, lamp meter, persona chip), `BottomHud` (language, Lite, replay),
  `Joystick` (touch only). Heights are about 52 px for the top row plus safe-area padding.
- The doorway "Enter" button sits `188 px` (touch) or `96 px` (desktop) above the bottom edge.

## Story (`src/screens/Story.tsx`, route `/story`)

- Uses the **Stage** pattern (`src/screens/story/Stage.tsx`): a portrait cinema frame of width `min(window width, window height x 0.62)`
  and full window height, centred, with striped side bars when the window is wider.

| | Phone 390 x 844 | Desktop 1440 x 900 |
| --- | --- | --- |
| Stage size | **390 x 844** (full-bleed) | **558 x 900** (centred column with side bars) |

- Scene art is an SVG with `viewBox 0 0 400 760` and `preserveAspectRatio="xMidYMid slice"`, so it crops to fit any aspect.
- Top row (language, Skip) and bottom row (back, progress coins, next) are absolute overlays inside the Stage.
- On a short landscape window (height under 480 and wider than tall) a "turn your phone upright" overlay covers the story.

## Pillar screen (`src/screens/Play.tsx`, route `/play/:pillar`)

- **Dummy placeholder** (marked `TODO(final-ui)`). Full-window scroll container; content is one centred column,
  `max-w-xl` (576 px) with `px-4`, `pt-24` (clears the top HUD) and `pb-44` (clears the bottom HUD).
- Phone: column is 390 px wide minus padding. Desktop: 576 px column centred on a sky-gradient background.

## Other screens

- `/dashboard`: centred card, `max-w-md`, on a full-window peach background (stub).
- `/kit`: scrollable art-review grid (temporary).
- Global: `FilmOverlay` (grain, scratches, vignette) is a fixed full-window layer above everything; the iris wipe is a fixed layer above that.
  Stacking uses the `--z-*` tokens (scene 30, hud 40, overlay 50, modal 60, film 90, transition 100).

## How a real game component will be sized when mounted

The shell has no fixed frame size. A game mounted into the existing screen should behave like the story does:

| | Phone 390 x 844 | Desktop 1440 x 900 |
| --- | --- | --- |
| Space given to the game | the full window (390 x 844) | a centred portrait column of `min(width, height x 0.62)` = 558 x 900 |

Guidance for game authors, consistent with the specs ("mobile-first, 360 px minimum"):

- Build for a **360 px minimum width** and fill whatever width and height the shell gives. Do not assume a fixed pixel size.
- Leave room for a slim shell bar (Exit, language, banner) at the top or bottom; do not place primary controls under the HUD safe areas.
- Honour `env(safe-area-inset-*)` on notched phones, as the HUD does.
- Input: the shell keeps the repo's current input. Games handle their own taps, clicks and drag, and should also work with a mouse and keyboard focus.

## Design tokens added in this pass

- Colours: `C` in `src/art/palette.ts` mirrors `--color-*` in the `@theme` block of `src/index.css`. 60 colours, kept in sync by `npm run check:tokens`.
- Semantic aliases: `S` in palette.ts (`surface`, `surfaceInk`, `accent`, `success`, `warning`, `danger`, `joyBright`, `joyDim`,
  `joyFlicker`) and matching CSS variables in `:root`.
- Helpers: `alpha(hex, a)`, `inkBorder(w)`, `flat(x, y)`; stacking scale `Z`; shared timings `MOTION`; CSS variables for the
  hand-cut corner radii and the stepped animation durations.
- Not tokenised (deliberately): per-scene story choreography delays in `Beats.tsx`, and the painted and procedural art in `src/art/`
  (`Charminar`, `Scenery`, `Shops`, `Toon`) which keep their own colour values.
