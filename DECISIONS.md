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

## Deal Board (pillar 3) engine: deviations from the spec
Source: `Deal Board build spec.pdf`, Lite mode first. Engine lives in `src/games/dealboard/engine/`; all tunables are in `TUNING`
(`companies.ts`). Each change below was needed so the six story arcs (spec p.16-17) hold across seeds, and `npm test` checks them.
- **Company interest is 0.75% a quarter (3% a year), not 3% a quarter.** At 3% a quarter MedLink loses money at its first pitch,
  which contradicts its "20 years of profit" starting valuation. The player's own bank loan stays at 3% a quarter (₹600 on ₹20,000).
- **New borrowing is added to cash** (`cash += debt[t] - debt[t-1]`). Otherwise MedLink's 20%-a-quarter debt growth does nothing.
- **Hype companies raise money while their story sells.** Without outside cash, PayEasy runs dry in Q2. Its runway now glides down
  `TUNING.hypeRunway` (about 10 months at the pitch, under 3 by Q6). Each raise is logged as a `raised` event.
- **While the story is selling, hype and smoke prices ignore profit surprises.** With the literal formula PayEasy's price falls 30% a
  quarter from Q1, but the spec's tell is "runway shrinking while the price still rises".
- **QuickRide gets a Q4-Q5 rumour spike (+8%), and collapse companies take -12% a quarter of sentiment after the collapse**, so
  QuickRide finishes positive in under 25% of seeds (spec tuning rule).
- **Market beta per archetype** (leveraged 2.2x) so MedLink is "hit hardest" in the broad fall.
- **The Customers light reads a two-quarter average of net customers**, so one noisy quarter does not flip a sound company red
  (spec: "players read trends, not single numbers"). Customer noise sigma is 1.5%.
- **Valuation targets set the share count**: Daily Basket 15 years of profit, SolarGrid 12, MedLink 20, SteelWorks 6 (at ₹40),
  PayEasy 8x revenue, QuickRide 10x revenue.
- **The whole market is precomputed from the seed.** Dice positions are a seeded roll sequence and company paths never depend on the
  player, so dice, Chance draws, news, the emergency turn and all six company paths are fixed by the seed alone.
- Unspecified values chosen: margin noise 0.3 pt, user noise 2%, CEO buy chance 12% (sound) or 2-3% (traps), PayEasy down-round vs
  failure is a seeded coin flip, and the broad fall is Q8, Q9 or Q10 (spec: "the seed may shift it by one quarter").

## Deal Board: decisions, lessons and scoring (steps 3-5)
- **Colour sets are measured in money, not in company count.** The six companies each sit in their own sector, so "two in one colour"
  can never happen. A concentration warning shows above 40% of net worth in one company, and lesson 6 (too many eggs) fires when over
  half of the invested money is in one sector.
- **Lessons fire at the end of the quarter, never mid-decision**, at most one per quarter (the rest queue), at most twice per run, and
  each (lesson, company) pair only once. "Earned it" cards (sold before a fall, passed on a trap) appear at most once per year.
- **Replay this quarter**: one rewind per year (turns 1-4, 5-8, 9-12), same seed, same market, same luck. It restores the start of
  the quarter the lesson came from; lessons already seen stay seen.
- **Research** counts lights revealed before each purchase (founder questions plus Banker clues). **Skepticism** judges each trap
  met (PayEasy, QuickRide, MedLink, SteelWorks) against its "tell" quarter: the first quarter with two red flags (a deflecting founder
  counts as a red flag), else the first loss-making quarter. Passing never scores less than 1; buying on a rumour costs half a point.
- **Spread** is the average largest sector share while invested (35% or less = 20, 80% or more = 0), capped at 10 if the player held
  fewer than two companies in most of quarters 5-12. Never investing scores 0, so passing on everything cannot clear the stage.
- **Bank**: the clue reveals one real light of any company for free; the loan is ₹20,000 at ₹600 a quarter, repayable any time and
  cleared from cash at the end of quarter 12 (any remainder is subtracted from net worth).
- **Family emergency** ends the quarter it fires in: if cash is short the player must sell, and a sale at a loss or in a market dip
  teaches lesson 9. If nothing can be sold the shortfall becomes a loan.
- **Jail** (panic selling): 70% or more of invested money sold in a quarter with a broad market fall and no red-light company sold.
  The player cannot buy next quarter and lesson 7 fires.
- Lesson 16 text says "owning several of them" instead of "three companies in the same sector" because each sector here has one company.
- Hub link: a judgement score of 60 or more lights the lamp; the best score and the matching skills (risk sense, patience, saving) are
  kept in the hub store and are never lowered.
