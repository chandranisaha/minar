# Decisions

Made without asking, so the build kept moving. Change any of them freely.

## Direction changes from the original brief
- **Hub is an overworld map, not a static landing page.** Per the "Cuphead map" request: a walkable painted bazaar, a chibi character,
  four doorways, tap/hover reactions and an iris wipe. All four doorways are always open.
- **Hero is your supplied character**, cut from the sheet: chibi frames (down / up / left / right x 2) for walking, full-body for story,
  face expressions for persona cards and the HUD chip. The three personas share this one character; they differ by name, copy, starting
  money, goal and a small prop icon. (Separate persona art can be added later.)
- **Painted art from `graphics/` is used as-is** (Charminar, bangle stall, pearl stall); the animated rubber-hose shopkeepers are layered on top.
  Where art is missing (chai cafe, recharge kiosk) the procedural SVG fallback shows. Style note: the painted art and the flat rubber-hose
  characters are different looks; replacing the shopkeepers with art from the sheet's style is a good next step.

## Tech
- Starter template (`murafalizade/react-vite-ts-tlw-template`) is a stale CRA wrapper (redux, axios, sweetalert), so we used the prompt's
  fallback: `npm create vite` (React 19 + TS) + Tailwind v4 + the listed libraries.
- **EasyStar.js** (MIT) for A* walking; no game engine. Grain technique follows the "film grain" approach from the Cuphead-grain write-up
  (small noise canvas, stepped), done with pre-rendered tiles for mobile speed.
- Fonts are self-hosted with Fontsource so the game works offline and Hindi/Telugu glyphs never fall back to system fonts.
- Camera follows the hero with a short establishing shot of the Charminar on load. No tilt parallax yet (see next steps); the overhead layer
  (wires, lights) and the world move together, which gives depth by overlap.
- Persona selection sets `startAmount`, `goalAmount`, `savedAmount`. Each completed pillar adds one quarter of (goal - start).
- Story first-visit redirect lives in `Landing`; `?replay=1` is only a marker, the story always replays from the cover.

## Skills / plugins
- The Claude Design plugin's external connectors (Figma etc.) needed auth that is not available in this session, `frontend-design` and
  Impeccable are not installed here, so none were used. The design system is in `DESIGN.md` and was built by hand from the references.

## Numbers (illustrative, labelled on screen)
| Persona | Starts with | Goal |
| --- | --- | --- |
| School student | 1,500 | 12,000 |
| College student | 4,000 | 30,000 |
| First-generation earner | 6,000 | 45,000 |

## Not done yet
Audio (out of scope), virtual joystick (tap/drag steering is the touch control), device-tilt parallax, the four real mini-games,
rewind (stub button), skill tracker UI (state exists), personas as separate characters, native-speaker review of Hindi/Telugu.
