# Minar

**Play it now: https://minar-tau.vercel.app/**

Minar is a financial-literacy game for Indian students (Grades 11 and 12, ages 16 to 22), built for the Vanguard India "Community Stewardship" brief.
Ammamma sends you out from the Charminar with a small cloth bundle and a goal. You walk a floating island, play four short games, and learn to
plan, save, invest and stay safe, while looking after your own happiness. It works in **English, Hindi and Telugu**, on phones and laptops, and every
amount in it is made up, for practice.

The full write-up is in [`deliverables/final_report.pdf`](deliverables/final_report.pdf).

## The four places

| Place | Lesson | Game |
| --- | --- | --- |
| **Bangle Bazaar** | Plan & Budget | **Festival Showdown**: be the treasurer of a colony festival and plan around what really arrives |
| **Café Meherban** | Save & Manage | **Pocket Panic**: one month, ₹600, bills you cannot skip, temptations, a friend in need and one big surprise |
| **The Pearl Exchange** | Understand Investing | **Deal Board**: back made-up companies, ask the right questions, and be scored on judgement, never profit |
| **Helpline Kiosk** | Stay Financially Safe | **Case Files**: spot the scam before it spots you |

Light all four lamps and the gate to **Chapter 2** opens.

## How money and happiness work

- **Money** is the goal bar. Each place adds a quarter of the gap between your start and your goal.
- **Happy** (10 to 100) decides how bright the place's lamp is when you finish: bright counts in full, dim three quarters, faint half. Playing tires you a little; a chai, a treat or rest brings it back.
- Every game speaks the same language: a painted coin for money, an emoji face for Happy (😄 🙂 😴) and one to three stars for how well you played.

Details and every tunable number are in [`docs/MINAR_ECONOMY.md`](docs/MINAR_ECONOMY.md).

## Run it yourself

Requirements: Node.js 20.19 or newer with npm, and a modern browser. Python 3 is only needed for the optional art import tool.
The students' game needs no backend, database or API key. Progress is saved on the device.

```bash
npm install
npm run dev        # prints a local address, usually http://localhost:5173
```

Open it and choose **Begin your story**.

```bash
npm run build      # content check, type-check and production build into dist/
npm run preview    # serve the production build locally
```

`dist/` is a static site. Any static host works (add a fallback to `/index.html` so deep links work); the live version above runs on Vercel.

### Optional: Minar Insights for teachers

The teacher and NGO dashboard (`/ngo`) works offline. To let facilitators sign in and receive class progress, create a Supabase project, run
[`supabase/schema.sql`](supabase/schema.sql), and set these two variables (for example in `.env.local` or the Vercel project settings):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Students never sign in and nothing personal leaves their phone. See [`docs/PRIVACY.md`](docs/PRIVACY.md).

## Useful URLs and switches

| Add this to the address | What it does |
| --- | --- |
| `?fast=3` (or `?fast=5`, up to 12) | Fast mode for recording demo videos: the whole app runs sped up. `?fast=0` turns it off. See [`docs/DEMO_MODE.md`](docs/DEMO_MODE.md) |
| `?dev=1` | Developer panel and placeholder games. `?dev=1&real=1` uses the real games |
| `/ngo` | The teacher and NGO desk |

Settings (the gear) has the language switch, a Light mode for older phones, the class code, a replay of Ammamma's story and **Start this game over**.
**Play again** on a result screen starts that game fresh; a game you left half-way resumes where you were.

## Test

```bash
npm test               # full unit and integration suite (Vitest)
npm run p4:validate    # content validator for the Stay Safe game
npm run lint           # lint
```

With the dev server running, `node tools/e2e.mjs` runs a browser smoke test of the core loop (needs Playwright's browsers: `npx playwright install`).

## Where things are

| Folder | What lives there |
| --- | --- |
| `src/games/` | The mini games (`showdown`, `cafe`, `dealboard`; Case Files is in `src/pillar4/`), each with its own engine, content and strings |
| `src/host/` | The shell around the games: adapters that turn each game's result into money, Happy, skills and stars |
| `src/progress/`, `src/happy/` | The point system (money share, lamps, Happy, stars) |
| `src/ui/kit/` | The shared look: top bar, panels, icons |
| `src/home/`, `src/screens/` | The welcome page, Ammamma's story and the island |
| `src/ngo/` | Minar Insights for teachers and NGOs |
| `docs/` | Design notes, the economy, privacy, integration contracts |

## Credits (third-party)

All libraries are used under their own open-source licenses.

- React, React Router, Vite, TypeScript, Tailwind CSS, Vitest
- Zustand (state), i18next and react-i18next (English, Hindi, Telugu), Framer Motion, EasyStar.js (path finding), Supabase (optional, teacher dashboard only)
- Fonts via Fontsource: Chango, Bowlby One, Rozha One, DM Serif Display, Noto Sans (with Devanagari and Telugu)
- Painted sprites and backgrounds are in `public/art/`; the prompts used to produce them are in `ART_PROMPTS.md`

## License

MIT. See `LICENSE`.
