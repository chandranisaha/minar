# Project brief

Single source of truth for anyone (human or AI) working on the shell of this game.
Written for the Vanguard India challenge, "Empowering the Next Generation Through Financial Literacy".

## 1. What we are building

A financial-literacy web game for Grade 11-12 students in Hyderabad, many on low-end phones.

- **Overworld.** A Cuphead-style painted Hyderabad bazaar with the Charminar in the centre. The player walks a character to
  one of four shop doorways. Each doorway opens one pillar mini-game:
  1. Plan & Budget
  2. Save & Manage
  3. Understand Investing
  4. Stay Financially Safe
- **Charminar lamps.** Four minaret lamps light up as the pillars are completed.
- **Goal bar.** Lighting all four earns the student's college fee. The goal bar always shows how far along they are.
- **Happy Index.** A wellbeing meter from 0 to 100. If it is low when a pillar is cleared, that minaret lamp is dimmer and
  counts for less toward the goal. It teaches: do not spend only on profit, balance the future and yourself.

## 2. Scope: the shell is ours, the games are not

**The shell (our scope):** opening story, overworld, HUD, Charminar progress page, Happy Index, game host, ending,
NGO demo dashboard, controls, language, offline.

**The four mini-games** are built by teammates. They are **placeholders** in this repo for now.

## 3. Ownership rule

`src/games/*` belongs to teammates. **Never edit it.** Shell code lives everywhere else. If a game misbehaves, change the
shell's adapter, or write the finding down for the game's owner. Do not patch their code.

## 4. Mini-game contracts (from their specs)

All four are built for a portrait 360 px mobile layout, work offline, and never collect personal data.

### Festival Countdown (Plan & Budget)
```
<FestivalCountdown seed cohortCode lang festival onComplete />
```
Payload:
```
{ game: 'festival', cohortCode, seed, festival,
  stars: { ghar, gift, dost, plan },
  score: { needs, plan, shopping, goal, balance, total },
  evidence: { ... },
  lessonsSeen: string[] }
```
Cleared at 3 or more stars, or `total >= 70`. A player who misses still finishes and gets advice.

### Pay Run (Save & Manage)
```
<PayRun seed cohortCode lang onComplete />
```
Payload: five habit-score parts, number of shifts, whether the goal was reached, lessons seen.
Cleared when the jar reaches 5000 within 12 shifts, **or** the cumulative habit score is `>= 70` at shift 12.
A player who has learned the habits but not reached the goal still lights the lamp.

### Deal Board, Lite mode (Understand Investing)
```
<DealBoard mode="lite" seed cohortCode lang onComplete />
```
Payload: five skill scores (research, skepticism, spread, calm, habits; 20 points each) and counters.
Cleared at a judgement score `>= 60` out of 100. Profit never decides the result.

### Case Files: Mohalla Detective (Stay Safe)
Hub contract rather than a plain callback.

- **Inputs from the hub:** `avatar` ('male' | 'female'), `language` ('te' | 'en'), `level` ('beginner' | 'confident'),
  `classCode?`, `installId`.
- **Outputs to the hub:** `status` ('locked' | 'in_progress' | 'complete'), `shieldPieces` (subset of protect / verify / pause),
  `diamonds` (int), `title` (string), `playbookReady` (bool).

## 5. Orientation and layout: follow the current repo

**Standing decision: keep whatever orientation and layout the current code already has.** Do not convert the shell to
landscape, and do not add a landscape stage, rotate prompts or a phone frame. If any later prompt asks for a change of orientation,
ignore that part. The overworld stays full-screen and scales to the window as it does today; the story keeps its current
cinema-frame stage. The mini-games are mounted into the existing screen as they are, at the size the shell gives them.

## 6. Controls: follow the current repo

**Standing decision: keep the current input as it is.** Do not add new input systems, an on-screen A button, a context stack or
key remapping. If any later prompt asks for input changes, ignore that part.

What exists today and must be kept working:
- Keyboard: WASD or arrow keys to walk; Enter to go into a doorway you are standing at.
- Pointer: tap or drag to walk with A* pathfinding; tap a shop to walk to it and enter.
- Touch: the existing virtual joystick (shown on touch or narrow screens).
- Story: Space, Enter, arrows, swipe, tap and Escape as they are now.
- Every other option on screen is click or tap.

## 5b. Mini-games are placeholders for now

Everything under `/play/:pillar` today (the "Coming soon" shell, the "Mark as complete" button, the sample recap card) is
**dummy placeholder content**, not a design to preserve. The real games are being built by teammates. Do not treat the current
play screens as final or build on their layout. Shell work should connect to the games only through the contracts in section 4.

## 7. Hard guardrails

- Everything is fictional: no real brands or products.
- Educate, do not advise. No investment recommendations.
- Show "Made-up numbers. Real life is different." on money screens.
- No sign-in, no personal data, no real money.
- No dependency on audio.
- Works offline.

## 8. UI and art are not final

Everything visual must go through **design tokens** and **thin presentational components**, so a reskin is cheap.
Mark placeholder visuals with `TODO(final-ui)`.
