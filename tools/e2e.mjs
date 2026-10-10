// Smoke test of the core loop. Run with the dev server up: node tools/e2e.mjs
import { chromium } from 'playwright'
const OUT = process.env.SHOT_DIR
const browser = await chromium.launch()
const errors = []
const fail = (m) => { console.log('FAIL', m); process.exitCode = 1 }
const ok = (m) => console.log('ok  ', m)

for (const [w, h, tag] of [[390, 844, 'phone'], [1440, 900, 'desk']]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 600 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  // fresh visit redirects into the story
  await page.waitForTimeout(600)
  page.url().endsWith('/story') ? ok(`${tag}: first visit -> /story`) : fail(`${tag}: no story redirect (${page.url()})`)
  // skip
  await page.getByRole('button', { name: /^Skip/ }).click()
  await page.waitForTimeout(1800)
  page.url().endsWith('/') ? ok(`${tag}: skip -> landing`) : fail(`${tag}: skip did not reach landing`)
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('money-mohalla-v2')).state)
  st.storySeen && st.persona && st.goalAmount > 0 ? ok(`${tag}: persona+goal saved (${st.persona}, ${st.goalAmount})`) : fail(`${tag}: state not saved`)
  // keyboard walk + enter door via button click (activate hotspot)
  await page.waitForTimeout(2200)
  await page.evaluate(() => document.querySelector("button[aria-label^='Understand']").click())
  await page.waitForTimeout(6500)
  page.url().includes('/play/invest') ? ok(`${tag}: walked to pearl shop and entered via iris`) : fail(`${tag}: did not enter pillar 3 (${page.url()})`)
  // the pillar screen is now the game host: entry panel -> (placeholder) game -> result -> back
  await page.getByTestId('game-play').click()
  await page.getByTestId('placeholder-great').click()
  ;(await page.getByTestId('result-title').textContent()) === 'Cleared' ? ok(`${tag}: placeholder game played, result screen says Cleared`) : fail(`${tag}: result screen did not say Cleared`)
  await page.getByTestId('result-back').click()
  await page.waitForTimeout(2500)
  const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('money-mohalla-v2')).state)
  st2.pillars.invest.status === 'complete' && st2.pillars.invest.brightness === 'bright' ? ok(`${tag}: pillar completed and lit bright (${st2.pillars.invest.brightness})`) : fail(`${tag}: completion not recorded`)
  const bar = await page.evaluate(() => Number(document.querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')))
  bar > st2.startAmount ? ok(`${tag}: goal bar advanced (${bar})`) : fail(`${tag}: goal bar did not advance (${bar})`)
  // keyboard movement changes hero position
  const before = await page.evaluate(() => document.querySelector('img[src*="/art/chibi/"]').parentElement.parentElement.style.transform)
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(700); await page.keyboard.up('ArrowUp')
  const after = await page.evaluate(() => document.querySelector('img[src*="/art/chibi/"]').parentElement.parentElement.style.transform)
  before !== after ? ok(`${tag}: arrow keys move the hero`) : fail(`${tag}: hero did not move`)
  // language switch + lite toggle
  await page.getByRole('button', { name: 'తె' }).click()
  await page.waitForTimeout(300)
  ;(await page.evaluate(() => document.documentElement.lang)) === 'te' ? ok(`${tag}: language -> te`) : fail(`${tag}: lang switch`)
  await page.getByRole('button', { name: /Lite|లైట్/ }).click()
  await page.waitForTimeout(300)
  ;(await page.evaluate(() => document.documentElement.dataset.lite)) !== undefined ? ok(`${tag}: lite toggle (data-lite=${await page.evaluate(() => document.documentElement.dataset.lite)})`) : fail(`${tag}: lite`)
  await page.screenshot({ path: `${OUT}/e2e-${tag}.png` })
  await ctx.close()
}
await browser.close()
const real = errors.filter((e) => !/favicon|Failed to load resource.*(manifest|art)/i.test(e))
real.length ? (console.log('CONSOLE ERRORS:\n' + real.join('\n')), (process.exitCode = 1)) : ok('no console/page errors')
