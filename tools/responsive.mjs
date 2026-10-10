// Responsive sweep + joystick test. node tools/responsive.mjs  (dev server must be up; SHOT_DIR for output)
import { chromium } from 'playwright'
const OUT = process.env.SHOT_DIR
const state = { state: { language: 'en', persona: 'college', startAmount: 4000, goalAmount: 30000, savedAmount: 4000, completedPillars: [], storySeen: true, celebrated: false, liteMode: null }, version: 0 }
const sizes = [[360, 640, 'small', true], [390, 844, 'phone', true], [768, 1024, 'tablet', true], [844, 390, 'landscape', true], [1920, 1080, 'hd', false]]
const browser = await chromium.launch()
for (const [w, h, tag, mobile] of sizes) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => console.log('PAGEERROR', tag, e.message))
  await page.addInitScript((s) => localStorage.setItem('money-mohalla-v1', JSON.stringify(s)), state)
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(2600)
  const joystick = await page.locator('[aria-label="Joystick"]').count()
  console.log(tag, `${w}x${h}`, 'joystick:', joystick, 'overflowX:', await page.evaluate(() => document.documentElement.scrollWidth > innerWidth))
  if (joystick) {
    const box = await page.locator('[aria-label="Joystick"]').boundingBox()
    const cx = box.x + box.width / 2, cy = box.y + box.height / 2
    const get = () => page.evaluate(() => document.querySelector('img[src*="/art/chibi/"]').parentElement.parentElement.style.transform)
    const before = await get()
    await page.mouse.move(cx, cy); await page.mouse.down(); await page.mouse.move(cx + 44, cy, { steps: 4 })
    await page.waitForTimeout(700)
    const mid = await page.evaluate(() => document.querySelector('img[src*="/art/chibi/"]').src)
    await page.screenshot({ path: `${OUT}/resp-${tag}-drag.png` })
    await page.mouse.up()
    const after = await get()
    console.log('   joystick drag moved hero:', before !== after, '| facing sprite:', mid.split('/').pop())
  }
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/resp-${tag}.png` })
  await ctx.close()
}
await browser.close()
