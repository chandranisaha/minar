import { chromium } from 'playwright'
const b = await chromium.launch()
const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
await p.addInitScript(() => !sessionStorage.getItem('seeded') && (sessionStorage.setItem('seeded', '1'), localStorage.setItem('money-mohalla-v1', JSON.stringify({ state: { language: 'en', persona: 'college', startAmount: 4000, goalAmount: 30000, savedAmount: 4000, completedPillars: [], storySeen: true, celebrated: false, liteMode: null }, version: 0 }))))
await p.goto('http://localhost:5173/play/plan', { waitUntil: 'networkidle' })
// complete all four through the real UI, then go back to the island
for (const id of ['plan', 'save', 'invest', 'safe']) {
  await p.goto(`http://localhost:5173/play/${id}`, { waitUntil: 'networkidle' })
  await p.getByRole('button', { name: /Mark as complete/ }).click()
}
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
await p.waitForTimeout(2500)
console.log('gate-open opacity', await p.evaluate(() => [...document.querySelectorAll('img[src*="gate-open"]')].map((i) => getComputedStyle(i).opacity)))
await p.evaluate(() => document.querySelector("button[aria-label='College gate']").click())
await p.waitForTimeout(9000)
await p.getByRole('button', { name: /Step through/ }).click()
await p.waitForTimeout(1500)
console.log('after gate ->', p.url(), await p.getByText('Goal reached').count() ? 'goal screen' : 'MISSING')
await p.screenshot({ path: process.env.SHOT_DIR + '/goal.png' })
await b.close()
