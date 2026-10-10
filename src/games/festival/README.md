# Festival Countdown (Pillar 1: Plan & Budget)

Three days before the family festival, Ammi gives ₹2,000 and a list. You split the money into jars once, then play a short run of
**cards**, about five a day: shop for an item (three shops, one price each), say yes / swap / no to a friend, deal with a surprise.
After every choice you see **what happened and why**, in one or two plain lines. The family room at the top fills in as you go
(sweets on the plate, lights, the new outfit, the gift). On festival morning it is the first result you read, followed by 3 stars and
a bar per jar showing the plan against what happened.

Route: `/play/plan`. `?demo` starts Demo mode (seed `DEMO`, Diwali). `?cohort=CODE` tags the result for the NGO view.

## The idea

- **One decision per screen.** No timers, no menus, nothing to learn first.
- **Money you can see.** Four glass jars (Needs, Gift, Fun, Spare) drain as you spend, with a ▼ chip for every payment.
- **Short loop:** choose, see it happen, read one line on why, next. A money idea is named only after you've felt it.
- **Mistakes are cheap and replayable.** Same seed means the same prices, so you improve your choices, not your luck.
- **Design rule:** the score rewards the plan and the balance, never leftover money. Hoarding and refusing every friend loses a star too.

## How it's built

- `engine/`: all money logic as pure functions over an event log (`applyEvent`, `replay`). Same seed + same choices = same game.
  Screens never change money directly; they append events. `deck.ts` decides which card comes next, `explain.ts` writes the
  one-line "why" for each choice, `bots.ts` plays whole games for the balance tests and for Demo mode.
- `state/store.ts`: Zustand store holding the event log, the phase and the Borrow-sheet request. Saved to `localStorage`
  (try/catch), so a shared phone can resume.
- `ui/`: `Plan` (split the jars), `Play` (the card loop), `BorrowSheet`, `Ending` (festival morning and the report), `Room`
  (the family room), `kit` (jars, bunting, sheet, toast).
- `content/`: `items`, `shops`, `invites`, `deck` (which cards each day), `rules`, `festivals` as JSON, plus `en` / `hi` / `te`
  strings in the `festival` i18n namespace. An NGO edits these files, not the code.
- `FestivalCountdown.tsx`: the exported component. It reports a `GameResult` (`src/lib/gameResult.ts`) through `onComplete`;
  the shell saves it and lights the minaret when `minaretLit` is true (3+ stars or score 70+).

## Money ideas, and where each is felt

| Idea | Where |
| --- | --- |
| Needs before wants, a plan | Splitting the jars; going without something on the list |
| Comparing prices | Three shops per card; "best price on the street" |
| Fake discounts | Mega Sale's crossed-out "was" price |
| Cheap can cost more | The Sasta Corner outfit that tears; flimsy lights |
| Buy early | "Buy later" brings the card back day after day at a higher price |
| It's okay to ask | One-tap "Ask for less"; Aunty is a seeded gamble |
| Buffer | Mamu's family arrives (hinted on day 1); Spare covers it, or another jar pays |
| Saying no kindly | Swap on a friend's invite |
| Lending is a risk | Sunny's loan, repaid or not on festival morning (seeded) |
| The odds favour the stall | Ring toss with the odds shown after you play |

## Test

```bash
npm test          # engine, 1,000-seed balance bots, strings in all three languages
npm run dev       # then open http://localhost:5173/play/plan?demo
```

Demo script (90 s): the plan opens prefilled, buy the sweets from Chacha after *Ask for less* (₹410), take Mega Sale's "was ₹920"
outfit to see the trick, swap Arjun's invite, switch to తె and back, *Skip to festival morning*, then *Compare with an impulsive plan*.

## Assumptions

- **Festival choice** is on the intro screen (the shell's personas are school / college / earner). All five festivals are playable;
  Diwali and Eid are shown first.
- **Three shops per item**, chosen so each shows a different lesson (see `items.json`).
- **Mamu's family** costs ₹150 (or everything left) and can't be cancelled.
- **Calm mode** is the shell's Lite mode; animations are stepped and respect `prefers-reduced-motion`.
- **Plan star** means no more than ₹100 borrowed between jars; borrowing is allowed, and shown, never blocked.

## Not done

- **Sounds:** the shell has no audio by design; every outcome has text.
- **PWA / offline:** belongs to the shell. The game itself makes no network calls after it loads.
- **Hindi and Telugu** need a native-speaker proofread before the demo (see `TRANSLATION_REVIEW.md`).
- **Painted art:** characters and the room use the hub's drawn style as stand-ins. Painted stall fronts, friend portraits and a
  festival-morning room can replace them later.
