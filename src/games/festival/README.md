# Festival Countdown (Pillar 1: Plan & Budget)

Three days before the family festival, Ammi gives ₹2,000 and a list. Each day: **morning planner** (pockets), **afternoon bazaar**
(five stalls, bargaining, price notebook), **evening mela** (friends' invites, ring toss, bus home), **day diary** (one lesson card).
Then **festival morning** (a room built from your choices) and the **Plan vs Reality** report.

Route: `/play/plan`. `?demo` starts Demo mode (seed `DEMO`, Diwali). `?cohort=CODE` tags the result for the NGO view.

## How it's built

- `engine/`: all money logic as pure functions over an event log (`applyEvent`, `replay`). Same seed + same events = same result.
  Screens never change money directly; they append events.
- `state/store.ts`: Zustand store holding the event log, the phase (intro → morning → bazaar → mela → diary → … → festival → report)
  and the Raid-sheet request. Saved to `localStorage` (wrapped in try/catch), so a shared phone can resume.
- `ui/`: one file per screen, plus `kit.tsx` (wallet strip, pocket icons, sheet, lesson card, guardrail footer).
- `content/`: prices, stalls, invites, festivals, rules, the frozen `demo.json`, and the strings `en.json` / `hi.json` / `te.json`
  (i18n namespace `festival`). An NGO edits these files, not the code.
- `FestivalCountdown.tsx`: the exported component. It reports a `GameResult` (`src/lib/gameResult.ts`) through `onComplete`; the shell
  saves it and lights the minaret when `minaretLit` is true (3+ stars or score 70+).

## Test

```bash
npm test          # engine, bots (1,000 seeds), demo replay, strings in all three languages
npm run dev       # then open http://localhost:5173/play/plan?demo
```

Demo script (90 s): planner opens prefilled → Aunty's stall, shirt: Low ₹310 gets a ₹420 counter, Fair ₹390 is accepted →
Mega Sale gift "was ₹690", notebook shows Daam Fix ₹300, walk away → mela, Arjun's pani puri: *Everyone pays their own ₹30*
(the spec's demo names the biryani invite, but its own invite table puts biryani on day 2) → switch to తె and back →
*Skip to festival morning* (replays `demo.json`: ₹275 left, score 100, 4 stars) → *Show the other plan*.

## Assumptions (spec left these open)

- **Festival choice** is on the intro screen (the shell's personas are school / college / earner, not festivals). All five festivals
  are playable; Diwali and Eid are the MVP pair shown first.
- **Mela order** on day 2: invites → Ayesha's bus fare → ring toss → Mamu's family → bus.
- **Mamu's family** costs ₹150, or everything left if the wallet holds less; it can't be cancelled.
- **Pay sticker** buys directly (no offer logged), like the bots.
- **Start day** needs ₹20 in Bus fare on day 1 only, as the spec says.
- **Calm mode** is the shell's existing Lite mode (it already respects `prefers-reduced-motion`).
- **Drag**: coin chips (₹10 / ₹50 / ₹100) drag onto pockets; − / + steppers do the same job (hold to repeat).
- **The Mega Sale "was" price** doubles the unrounded sticker (base ×1.15 ×2), which matches the spec's day-1 table (gift "was ₹690").

## Not done / cut

- **Sounds**: the shell decided on no audio, so the coin / crowd / bell sounds are left out. Every outcome already has a text caption.
- **PWA / offline**: belongs to the shell (no service worker yet). The game itself makes no network calls after loading.
- **Learn more** cards carry a short paragraph, not the full six-part script.
- **Bargain-hunter bot** scores 94 under the spec's own rules, against the spec's 55–75 target. Changing prices would break the
  locked demo numbers, so the test checks what the rules produce (it loses the Ghar star and closes a stall).
- **Hindi and Telugu** need a native-speaker proofread before the demo (see `TRANSLATION_REVIEW.md`).
