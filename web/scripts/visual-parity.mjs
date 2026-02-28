import fs from 'node:fs'
import path from 'node:path'
import { chromium } from 'playwright'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const OUT_DIR = path.resolve('artifacts', 'visual-parity')
const REACT_URL = 'http://localhost:5175/'
const LEGACY_URL = 'http://localhost:5502/'

const tabs = [
  { name: 'users', react: /^users/i, legacyDataTab: 'users' },
  { name: 'vehicles', react: /^vehicles/i, legacyDataTab: 'vehicles' },
  { name: 'finance', react: /^finance/i, legacyDataTab: 'finance' },
  { name: 'programs', react: /^programs/i, legacyDataTab: 'programs' },
  { name: 'gps', react: /^gps/i, legacyDataTab: 'gps' },
  { name: 'map', react: /^map/i, legacyDataTab: 'fleet' },
  { name: 'rto', react: /^rto/i, legacyDataTab: 'rto-applications' },
]

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

async function screenshotReact(page, tab) {
  await page.goto(REACT_URL, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: tab.react }).click()
  await page.waitForTimeout(500)
  const file = path.join(OUT_DIR, `${tab.name}.react.png`)
  await page.screenshot({ path: file, fullPage: true })
  return file
}

async function screenshotLegacy(page, tab) {
  await page.goto(LEGACY_URL, { waitUntil: 'networkidle' })
  await page.locator(`.nav-tab[data-tab="${tab.legacyDataTab}"]`).click()
  await page.waitForTimeout(700)
  const file = path.join(OUT_DIR, `${tab.name}.legacy.png`)
  await page.screenshot({ path: file, fullPage: true })
  return file
}

function compareImages(legacyPath, reactPath, outPath) {
  const imgA = PNG.sync.read(fs.readFileSync(legacyPath))
  const imgB = PNG.sync.read(fs.readFileSync(reactPath))
  const width = Math.min(imgA.width, imgB.width)
  const height = Math.min(imgA.height, imgB.height)
  const a = new PNG({ width, height })
  const b = new PNG({ width, height })
  PNG.bitblt(imgA, a, 0, 0, width, height, 0, 0)
  PNG.bitblt(imgB, b, 0, 0, width, height, 0, 0)
  const diff = new PNG({ width, height })
  const mismatch = pixelmatch(a.data, b.data, diff.data, width, height, {
    threshold: 0.15,
    includeAA: false,
  })
  fs.writeFileSync(outPath, PNG.sync.write(diff))
  const ratio = mismatch / (width * height)
  return { mismatch, ratio, width, height }
}

async function main() {
  ensureDir(OUT_DIR)
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const reactPage = await context.newPage()
  const legacyPage = await context.newPage()
  const summary = []

  for (const tab of tabs) {
    const legacyFile = await screenshotLegacy(legacyPage, tab)
    const reactFile = await screenshotReact(reactPage, tab)
    const diffFile = path.join(OUT_DIR, `${tab.name}.diff.png`)
    const result = compareImages(legacyFile, reactFile, diffFile)
    summary.push({ tab: tab.name, ...result })
    console.log(`${tab.name}: ${(result.ratio * 100).toFixed(2)}% different`)
  }

  await browser.close()
  const summaryPath = path.join(OUT_DIR, 'summary.json')
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2))
  console.log(`Saved summary: ${summaryPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
