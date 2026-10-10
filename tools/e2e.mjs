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
  await page.waitForTimeout(600)
  page.url().endsWith('/story') ? ok(`${tag}: first visit -> /story`) : fail(`${tag}: no story redirect`)
  await page.getByRole('button', { name: /^Start/ }).click()
  await page.getByRole('button', { name: /^Next/ }).click()
  await page.getByText('College student').first().click()
  await page.getByRole('button', { name: /^Next/ }).click()
  await page.getByRole('button', { name: /^Next/ }).click()
  await page.getByRole('button', { name: /Let's go/ }).click()
  await page.waitForTimeout(1200)
  page.url().endsWith('/') ? ok(`${tag}: story end -> island`) : fail(`${tag}: story did not finish`)
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('money-mohalla-v1')).state)
  st.storySeen && st.persona === 'college' && st.goalAmount === 30000 ? ok(`${tag}: persona + goal saved`) : fail(`${tag}: state`)
  // tap a pillar: token walks, card appears, Enter goes in
  await page.evaluate(() => document.querySelector("button[aria-label^='Understand']").click())
  await page.waitForTimeout(2600)
  ;(await page.getByRole('dialog').count()) ? ok(`${tag}: token walked, card opened`) : fail(`${tag}: no card`)
  await page.getByRole('button', { name: /^Enter/ }).click()
  await page.waitForTimeout(800)
  page.url().includes('/play/invest') ? ok(`${tag}: Enter -> pillar screen`) : fail(`${tag}: enter failed`)
  await page.getByRole('button', { name: /Mark as complete/ }).click()
  await page.getByRole('button', { name: /Back to the island/ }).click()
  await page.waitForTimeout(1200)
  const st2 = await page.evaluate(() => JSON.parse(localStorage.getItem('money-mohalla-v1')).state)
  st2.completedPillars.includes('invest') && st2.savedAmount > st2.startAmount ? ok(`${tag}: pillar complete, goal pill advanced`) : fail(`${tag}: completion`)
  // locked gate message, then all four -> gate opens
  await page.evaluate(() => document.querySelector("button[aria-label='College gate']").click())
  await page.waitForTimeout(2600)
  ;(await page.getByText(/opens when all four/).count()) ? ok(`${tag}: gate locked until all four`) : fail(`${tag}: gate lock message`)
  // gear menu: language + lite
  await page.getByRole('button', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'తె' }).click()
  ;(await page.evaluate(() => document.documentElement.lang)) === 'te' ? ok(`${tag}: language -> te`) : fail(`${tag}: lang`)
  await page.getByRole('menuitemcheckbox').click()
  ;(await page.evaluate(() => document.documentElement.dataset.lite)) === 'true' ? ok(`${tag}: lite mode on`) : fail(`${tag}: lite`)
  await page.screenshot({ path: `${OUT}/e2e-${tag}.png` })
  await ctx.close()
}
await browser.close()
errors.length ? (console.log('CONSOLE ERRORS:\n' + errors.join('\n')), (process.exitCode = 1)) : ok('no console/page errors')
