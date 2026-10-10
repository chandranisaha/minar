# How to check Festival Showdown after each step

Run these from the project folder (the one that contains `package.json`), not the folder above it:

```bash
cd /Users/shriyakansal/Desktop/IIIT/megathon/megathon_2k26/megathon26-sushi-aur-ek
```

Nothing here costs any credits.

## 1. The automatic checks (about 10 seconds)

```bash
npm test          # must say "Tests ... passed", no failures
npx tsc -b        # must print nothing
npm run build     # must end with "✓ built"
```

`npm test` includes a check that the TypeScript engine matches the Python prototype
(`reference_engine.py`) on 70 plan cases across all ten futures, plus every number in the spec's section 12.

## 2. Look at it yourself

```bash
npm run dev
```

Open the new game with `?showdown` (the old Countdown is still the default at `/play/plan` until the last step):

http://localhost:5173/play/plan?showdown

Use your browser's phone view (width 360 to 390) for the real test.

### Jump straight to any stage (no clicking through)

`preset` is the reference plan (`A` or `B`), `at` is the screen you want:

| Link | What you should see |
| --- | --- |
| `...?showdown&preset=B&at=market` | Market with goals ranked and Plan B signed. Cash lines: 6,930 / 26,930 / 21,930 / 10,450. Cushion 1,930. Actions left: 3 of 10 |
| `...?showdown&preset=B&at=locked` | Plan locked. Press Next date. W1 balance 6,930. W2 10,930. W3 5,930. Festival Day 9,034, 448 visitors |
| `...?showdown&preset=A&at=locked` | Plan A. At Week 3 the **Shortfall sheet** opens: due 10,500, in hand 6,870, short 3,630. Cancel Reliable sound. Ends at 10,434 |
| `...?showdown&preset=B&at=festival` | Festival Day scene with all layers, all three goals met, public notice |
| `...?showdown&preset=A&at=festival` | Scene with no sound. "Lights and sound: Goal missed. There was no sound." |
| `...?showdown&preset=B&at=futures` | Ten futures: holds in 9 of 10 (fails F5) |
| `...?showdown&preset=A&at=transfer` | Three transfer questions (stress test first), then the report: 45, Careful Planner, minaret not lit |
| `...?showdown&preset=B&at=report` | Report: 98, Master Treasurer, four stars, six "Got it", minaret lit |

(Use `http://localhost:5173/play/plan?showdown&preset=B&at=report` etc. Opening a preset replaces the saved game on that phone.)

### Things worth trying by hand

- Market: open Basic sound. The total stays hidden until you press "Read the fine print".
- Market: build a plan with too little cash and watch the cushion go red with the word "Short".
- Week 3: with low cash, "Give Sunny cash" is disabled ("Not enough cash").
- Give Sunny cash with a healthy plan: Festival notice shows **UNRECORDED** and you lose the Clean books star.
- Reload the page at any screen: it must come back to the same screen.
- Switch EN / हि / తె: Hindi and Telugu fall back to English until their files are written.

## 3. After the last step

The hub's Plan & Budget progress updates when the report is shown. Check it with:

```js
// in the browser console
JSON.parse(localStorage.getItem('money-mohalla-v1')).state.completedPillars   // contains "plan"
JSON.parse(localStorage.getItem('money-mohalla-results-v1'))                  // one entry per finished game
```

## 4. Starting over

Press "Start a new game" on the first screen, or in the console: `localStorage.removeItem('showdown-v1')`.
