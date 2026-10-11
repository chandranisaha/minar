# How Minar adds up: money and happiness

Minar has two numbers on screen at all times.

- **Money** (the goal bar): how close you are to the fee, course or goal you picked. It starts at your **start amount** and grows toward your **goal**.
- **Happy** (the happy index, 10 to 100): how well you are looking after yourself while you work toward the goal. It starts at **70**.

The two are linked on purpose, because that is the lesson: *money you earn by burning yourself out is worth less.*

## The one-paragraph rule

Each of the four places (a "minar") is worth **25% of the gap** between your start and your goal. Finishing a place lights its lamp. How bright
the lamp is depends on your **Happy** at that moment: bright counts 100%, dim 75%, flickering 50%. Light all four bright and your money
reaches the goal exactly. Replaying a place can only make its lamp brighter, never dimmer.

| Lamp | Happy when you finish | Counts for |
| --- | --- | --- |
| Bright | 60 or more | 100% of that place's share |
| Dim | 35 to 59 | 75% |
| Flicker | below 35 | 50% |

**Worked example** (college student, start ₹4,000, goal ₹30,000): the gap is ₹26,000, so each place is worth up to ₹6,500.
A bright lamp adds ₹6,500, dim ₹4,875, flicker ₹3,250. Four bright lamps: ₹4,000 + 4 x ₹6,500 = ₹30,000.

## What moves money

| Event | Effect on money |
| --- | --- |
| Finish a place (game cleared) | Adds its share, scaled by the lamp (above) |
| Replay and finish with a brighter lamp | Adds the difference only |
| Failing or quitting a game | Nothing is lost; partial progress fills the place's tower but adds no money |
| A life moment (chai, festival treat) | **Costs** money: ₹100 or ₹150 comes off the bar. Rest at home is free |

Money can never go below ₹0 or above the goal. The amount shown is always recomputed from what you have done, never stored by hand.

## What moves happiness

| Event | Effect on Happy |
| --- | --- |
| Start of a new game | 70 |
| Finishing any game session | **-5** (effort is tiring). Taking three games in a row with no break shows a "time for a break" note |
| A life moment | Chai +8, festival treat +10, rest at home +5. Repeating the same one pays half as much each time (8, 4, 2, 1) |
| What you *did* inside a game | See below. One game can move Happy by at most 12 either way |

### What each game reports

Games send a few small signals. The shell turns them into Happy using the numbers in `src/happy/config.ts`.

| Signal | Effect |
| --- | --- |
| Friendship (Festival game, 0 to 100, 60 is neutral) | +/-0.1 per point away from 60 |
| Treats enjoyed | +2 each, up to +6 |
| Skipped treats | Skipping a couple is fine. Skipping many while enjoying none costs -1.5 each, down to -6 ("all work, no joy") |
| Kindness (lent or gave to a friend) | +1 each, up to +2 |
| Scam fallen for | -5 each, down to -10 |
| Balanced or restful choices | +4 each, up to +8 |

| Game | Money | Happy signals |
| --- | --- | --- |
| Plan & Budget (Festival Showdown) | Clears the place when the plan holds | Surviving the surprises with a buffer (the resilient star) counts as a balanced choice (+4). The older Festival Countdown also sent friendship, treats, lending and swaps |
| Save & Manage (Pocket Panic) | Clears when the goal is reached or the nine habits show up | Treats enjoyed and refused, helping Teja, **balance stars**: 2 stars is +4, 3 stars is +8 |
| Understand Investing (Deal Board) | Clears at judgement 60 or more | Balanced habits only: a calm hand (calm skill 12/20+) and a spread-out portfolio (spread 12/20+) are +1 each. **Play money, profit and net worth never reach Happy** |
| Stay Safe (Case Files) | Clears when the master board is done | None. It has no treats or friends to choose. Diamonds and shield pieces are kept as rewards |

### The three Pocket Panic stars

Pocket Panic is where the link between money and happiness is most visible, so it has its own readout:

1. **Wants star**: the Wants bottle never popped.
2. **Friends star**: the Friends bottle never popped.
3. **Mood star**: your mood ended good.

Three stars and the goal make a **Perfect Month**. Stars never change money inside the game; they change how happy you leave the table, which
changes how bright your lamp is, which changes how much money the place adds.

## One language for points

| Thing | How it looks everywhere (bar, panels, result screen, games) |
| --- | --- |
| Money | The painted coin and the rupee amount, with a `+₹` or `−₹` tag when it changes |
| Happy | An emoji face that follows the band: 😄 glowing (60+), 🙂 ok (35 to 59), 😴 tired (below 35), with the number |
| Stars | 1 to 3 gold stars for how well you played, the same for every game: 3 stars at 85% or more, 2 at 60%, 1 for a clear, none if not cleared |
| Lamps | Bright, dim, faint, drawn with the same flag and glow on the island, in the money panel, in the profile and on the result screen |

Code: `src/progress/points.ts` (icons and star rule), `src/ui/kit/Icons.tsx` (`HappyIcon`, `MoneyIcon`, `Stars`). The money share per place is the same for all four games, and `host.test.ts` checks that four bright clears reach the goal exactly.

## Why this loop teaches the lesson

1. Save hard and say no to everything: bottles pop, mood drops, **Happy falls**, the lamp comes out dim or flickering, and the place adds **less money**.
2. Spend on everything: the goal stays out of reach and bills are hard to pay.
3. The best result is *balance*: pay yourself first, keep a cushion, enjoy a few things on purpose, help a friend. That keeps Happy high, the lamps bright, and the money full.

## Where the numbers live

Everything here is tunable in two files and covered by tests. Nothing else holds a money or happiness number.

- `src/progress/config.ts`: share per place, lamp multipliers
- `src/happy/config.ts`: start, burnout, thresholds, signal weights
- `src/happy/moments.json`: life-moment costs and joy
