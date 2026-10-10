import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p.addInitScript(() => localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'college', startAmount: 4000, goalAmount: 30000, savedAmount: 4000, completedPillars: [], storySeen: true, celebrated: false, liteMode: null }, version: 0 })))
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(1500)
const pos = () => p.evaluate(() => { const t = document.querySelector('img[src*="/art/chibi/"]').parentElement.parentElement.style.transform; const m = t.match(/translate3d\(([-\d.]+)px, ([-\d.]+)px/); return [Math.round(+m[1] + 70), Math.round(+m[2] + 175)] })
const pct = ([x, y]) => `${(x / 24).toFixed(1)}%, ${(y / 20.4).toFixed(1)}%`
console.log('start', pct(await pos()))
for (const [k, ms] of [['ArrowRight', 1200], ['ArrowUp', 2500], ['ArrowUp', 2500], ['ArrowRight', 2000], ['ArrowUp', 3000], ['ArrowLeft', 2500], ['ArrowUp', 3000]]) {
  await p.keyboard.down(k); await p.waitForTimeout(ms); await p.keyboard.up(k)
  console.log(k, ms, '->', pct(await pos()), p.url().slice(-6), (await p.getByRole('dialog').count()) ? '[card]' : '')
}
await b.close()
