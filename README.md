# Minar

Setup and run instructions. The solution is described in `deliverables/final_report.pdf`.

## Requirements

- Node.js 20.19 or newer, with npm
- A modern browser (Chrome, Edge, Firefox or Safari)
- Python 3 is only needed for the optional art import tool (`npm run art`)

No backend, database, API key, dataset or model weights are needed. Nothing is hosted externally.

## Setup

```bash
npm install
```

## Run

```bash
npm run dev        # development server, prints a local address (usually http://localhost:5173)
```

Open the printed address, choose **New game**, and play.

## Build and preview

```bash
npm run build      # content check, type-check and production build into dist/
npm run preview    # serve the production build locally
```

`dist/` is a static site and can be served by any static host (add a fallback to `/index.html` so deep links work).

## Test

```bash
npm test               # full unit and integration suite (Vitest)
npm run p4:validate    # content validator for the Stay Safe game
npm run lint           # lint
```

With the dev server running, `node tools/e2e.mjs` runs a browser smoke test of the core loop (needs Playwright's browsers: `npx playwright install`).

## Credits (third-party)

All libraries are used under their own open-source licenses.

- React, React Router, Vite, TypeScript, Tailwind CSS, Vitest
- Zustand (state), i18next and react-i18next (English, Hindi, Telugu), Framer Motion, EasyStar.js (path finding)
- Fonts via Fontsource: Chango, Bowlby One, Rozha One, DM Serif Display, Noto Sans (with Devanagari and Telugu)
- Painted sprites and backgrounds are in `public/art/`; the prompts used to produce them are in `ART_PROMPTS.md`
- AI coding assistants were used while building this project, as permitted by the event rules

## License

MIT. See `LICENSE`.
