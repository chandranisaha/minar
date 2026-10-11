# Integration guide for the four game teams

How your game plugs into the app. Written for someone who has not seen the planning discussions.
Read this, build to it, and your game appears in the app with **no change outside your own folder**.

## The 60-second version

1. Create `src/games/<your folder>/index.tsx` with a **default export**: a React component that takes the props below.
2. When the player finishes (or quits), call `props.onComplete(payload)` **once**, with your game's payload (shapes below).
3. That's it. The app picks your folder up automatically, passes you a seed and settings, turns your payload into progress, and
   shows the result screen. Until your folder exists, a placeholder game stands in for you.

| Pillar | Game | Folder name |
| --- | --- | --- |
| Plan & Budget | Festival Showdown | `src/games/showdown/` |
| Save & Manage | Pay Run | `src/games/payrun/` |
| Understand Investing | Deal Board (lite mode) | `src/games/dealboard/` |
| Stay Financially Safe | Case Files: Mohalla Detective | `src/games/casefiles/` |

Do not edit anything outside your folder. If something in the app blocks you, tell the shell owner.

## The props you receive

```ts
interface GameProps {
  seed: string                 // stable per install and pillar; the same on every replay (see "Seeds")
  cohortCode: string | null    // the NGO class code, or null
  lang: 'en' | 'hi' | 'te'     // re-render when it changes
  festival?: 'diwali' | 'eid' | 'bonalu' | 'sankranti' | 'christmas'   // Festival Countdown
  avatar?: 'male' | 'female'   // Case Files
  level?: 'beginner' | 'confident'                                      // Case Files
  classCode?: string | null    // same as cohortCode
  installId?: string           // random per install, never linked to a person (Case Files)
  onComplete: (payload: unknown) => void
}
```

Use what you need and ignore the rest. The type lives in `src/host/types.ts`.

## What to pass to `onComplete`

Call it **exactly once** per play: when the player reaches your final report, or quits. The app ignores a second call for the
same play, and does nothing if it is called outside a play. Pass your own payload; the app adapts it
(`src/host/adapters/*`). Adapters never crash on bad data: unknown or missing fields get safe defaults and a console warning.

Any game may also pass `progress` (a number from 0 to 1) when the player **quits** before the end, so the app can show how far they got.

### Festival Countdown (`plan`)

```ts
{ game: 'festival', cohortCode, seed, festival,
  stars: { ghar: boolean, gift: boolean, dost: boolean, plan: boolean },
  score: { needs, plan, shopping, goal, balance, total },     // maxima 25, 25, 20, 15, 15, 100
  evidence: { swaps, ringTossPlays, walkedHome, ... },         // the rest is optional
  lessonsSeen: string[] }
```
- **Cleared** when 3 or more stars are `true`, or `score.total >= 70`.
- Quality = `total / 100`.
- Happy: friendship comes from `evidence.friendship` (0..100) if you send it, otherwise from `score.balance` (15, 8, 0 mean a good,
  middling or poor friendship), otherwise from `stars.dost`. `evidence.ringTossPlays` counts as treats bought, and `evidence.swaps`
  as balanced choices.
- Skills: `needs` to prioritising, `plan` to planning, `shopping` to patience, `goal` to saving.

### Pay Run (`save`)

The spec says onComplete receives "the five habit-score parts, the number of shifts, whether the goal was reached, and the lessons
seen". The exact field names are not in the spec, so the app assumes:
```ts
{ game: 'payrun', cohortCode, seed, shifts, goalReached: boolean,
  parts: { saving, buffer, spending, planning, lending },     // raw points, maxima 25, 20, 25, 15, 15
  jar?: number, goal?: number,                                 // for partial progress (goal defaults to 5000)
  counters?: { purchasesBought, purchasesSkipped, friendsLent },
  lessonsSeen: string[] }
```
Also accepted: the container named `habitScore`, `habit` or `scoreParts`; `savingHabit` for `saving`; `spendingControl` for `spending`;
`habitTotal` instead of parts.
- **Cleared** when `goalReached` is true, or the five parts add up to 70 or more (a finish with good habits still lights the pillar).
- Quality = habit score / 100. Partial = `jar / goal` (or `shifts / 12`).
- Happy: send `counters` if you can. Without them the app infers "all work, no joy" from a high Spending-control part.
- Skills: `saving` and `buffer` to saving, `spending` to prioritising, `planning` to planning, `lending` to risk sense.

### Deal Board, lite mode (`invest`)

The spec says onComplete receives "the skill scores and counters". The app assumes:
```ts
{ game: 'dealboard', mode: 'lite', cohortCode, seed,
  judgement: number,                                           // 0..100, the headline score
  skills: { research, skepticism, spread, calm, habits },      // each 0..20
  counters?: { tabsOpened, trapsAvoided, prematureSells, fees, concentrationPeak },
  quartersPlayed?: number, lessonsSeen: string[] }
```
- **Cleared** when `judgement >= 60` (if missing, the five skills are summed).
- **The app never reads net worth, profit or any play-money amount.** Even if you include them, they do not reach the goal meter, the
  Happy Index or the result screen. Profit is never a score here.
- Skills: `research` to planning, `skepticism` to scam sense, `spread` to risk sense, `calm` to patience, `habits` to saving.

### Case Files: Mohalla Detective (`safe`)

This game uses the hub contract (its spec, section 4.4). Pass its outputs:
```ts
{ status: 'locked' | 'in_progress' | 'complete',
  shieldPieces: ('protect' | 'verify' | 'pause')[],
  diamonds: number, title: string, playbookReady: boolean,
  // optional extras the app understands:
  stage?: 'tutorial' | 'case1' | 'case2' | 'case3' | 'mystery' | 'master',
  firstTryAccuracy?: number /* 0..1 */, lessonsSeen?: string[] }
```
- **Cleared** when `status === 'complete'`.
- Quality = `firstTryAccuracy`, otherwise shield pieces out of 3. Partial follows `stage`.
- `diamonds` are the amount earned in **this** play; the app adds them to its total. `shieldPieces` and `title` are kept.
- Your own save belongs to you: use your own key prefix (the spec uses `p4.*`) and never touch the app's keys
  (`money-mohalla-*`, `mm-*`). Tell the shell owner your key prefix so the app's Reset can clear your save too (not wired yet).
- The app currently passes `lang` as it is (`'hi'` is possible). Your game supports English and Telugu only, so fall back to English
  for anything else.

## What the app does with your result

1. **Progress.** A cleared pillar lights up and adds a quarter of the way to the goal. How much of that quarter counts depends on how
   happy the player was when they cleared it (bright 100%, dim 75%, faint 50%). A replay can only improve a pillar, never worsen it.
2. **Happy Index.** Your optional signals nudge it up or down (friendship, treats bought or skipped, lending, scams, balanced
   choices). After every session it drops a little, once ("burnout"), so players are nudged to take breaks.
3. **Result screen.** Shows cleared or not, quality, skills, lessons, and the goal meter and Happy before and after.

The numbers behind this are in `docs/PROGRESS_MODEL.md`.

## Seeds and replays

`seed` is the same string every time for a given player and pillar. Use it for **all** randomness (prices, shifts, cases, market) so a
replay faces exactly the same game and the player improves their choices, not their luck. Never call `Math.random()` for anything
that affects play without seeding it.

## How your game is mounted

- On a small screen you fill the whole width. On a wide screen you get a centred, portrait-shaped column
  (`min(width, height x 0.62)`). **There is no fixed pixel size.** Build mobile-first with **360px as the minimum width**, and fill
  whatever space you are given, in any orientation.
- A slim bar sits **above** you (Exit, the pillar name) and a one-line banner ("Made-up numbers. Real life is different.") **below**
  you while you play. Do not put controls under them.
- Respect `env(safe-area-inset-*)` on notched phones.
- The app keeps the repo's current input. You handle your own taps, clicks and drag, and should also work with a mouse and with
  keyboard focus. Drag should never be the only way to do something (offer a stepper or tap alternative).
- If your game throws while rendering or while loading, the app shows an error panel with a Back link instead of a blank page. Your
  game cannot take the app down, but a crash is still a bug.

## Offline and privacy (hard rules)

- Works offline after the first load. No network calls required to play.
- No sign-in, no personal data, no real money, no ads, no real brands. Everything is fictional, with the line
  "Made-up numbers. Real life is different." on money screens.
- No audio is required; anything with sound needs a caption.

## Trying your game

- Open the app. Walk to your pillar, or go straight to `/play/<plan | save | invest | safe>`.
- By default the app uses **your** game if your folder exists, and the placeholder otherwise.
- Developer controls (open any page with `?dev=1`):
  - `?dev=1` forces the **placeholder** games (so you can test the app's side with controlled results).
  - `?dev=1&real=1` uses **real** games while dev tools are on. `?real=0` turns that back off.
  - `?dev=0` turns dev tools off.
  - The DEV panel (top-left) can set Happy, force-clear a pillar, and reset progress.
- The placeholder games send each game's real payload shape (`src/host/placeholders/payloads.ts`). That file is a good reference for
  what the app expects.

## Ready to plug in: checklist

- [ ] `src/games/<folder>/index.tsx` has a **default export** component that takes `GameProps`.
- [ ] `npm run build` passes with your folder in place.
- [ ] `onComplete` is called once, with the payload above (and also when the player quits).
- [ ] All randomness comes from `seed`; a replay is identical.
- [ ] Re-renders correctly when `lang` changes mid-game.
- [ ] Works from 360px wide, fills the space given, no fixed pixel size, nothing needed under the top bar or the bottom banner.
- [ ] Works with touch, mouse and keyboard; drag always has a tap alternative.
- [ ] Works offline; stores nothing personal; your save keys use your own prefix.
- [ ] Has a way to finish early (a quit or finish button) and a demo mode.
- [ ] Shows "Made-up numbers. Real life is different." (the app adds it too, but your own money screens should carry it).
- [ ] Tested with `?dev=1&real=1`: your game starts, ends, and the result screen shows the right numbers.

## Assumptions the shell owner made (tell us if any are wrong)

1. Pay Run and Deal Board field names are guessed from their specs (see above); aliases are accepted and unknown keys are ignored.
2. A game that quits may send a payload with no score. That counts as "not cleared" with the optional `progress` for partial progress.
3. Festival Countdown's friendship meter is not in its payload, so it is derived from `score.balance` unless `evidence.friendship` is sent.
4. Case Files' `diamonds` is per play, not a running total.
5. `level` is `'beginner'` until onboarding lets the player choose.
