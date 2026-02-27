import { expect, test } from '@playwright/test'

test.describe('Parity regression checks', () => {
  test('tabs and core sections render', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('CASAN RTO Migration Shell')).toBeVisible()

    await page.getByRole('button', { name: /^users/i }).click()
    await expect(page.getByPlaceholder('Search name, phone, NIK...')).toBeVisible()

    await page.getByRole('button', { name: /^vehicles/i }).click()
    await expect(page.getByPlaceholder('Search id, plate, customer...')).toBeVisible()

    await page.getByRole('button', { name: /^finance/i }).click()
    await expect(page.locator('#programFilter')).toBeVisible()

    await page.getByRole('button', { name: /^gps/i }).click()
    await expect(page.getByPlaceholder('Search id/imei/plate/brand')).toBeVisible()

    await page.getByRole('button', { name: /^map/i }).click()
    await expect(page.getByText('Markers:')).toBeVisible()

    await page.getByRole('button', { name: /^rto/i }).click()
    await expect(page.getByRole('button', { name: 'applications' })).toBeVisible()
  })

  test('finance pagination boundaries work', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /^finance/i }).click()
    const pageInfo = page.getByText(/Page \d+ \/ \d+ \(\d+ rows\)/)
    await expect(pageInfo).toBeVisible()
    await page.getByRole('button', { name: 'Next' }).click()
    await expect(pageInfo).toBeVisible()
    await page.getByRole('button', { name: 'Prev' }).click()
    await expect(pageInfo).toBeVisible()
  })

  test('vehicles actions work under filters', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /^vehicles/i }).click()
    await page.getByRole('combobox').nth(1).selectOption('all')

    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()

    await firstRow.getByRole('button', { name: 'Lock' }).click()
    await expect(firstRow.locator('td').nth(3)).toContainText(/immobilized/i)

    await firstRow.getByRole('button', { name: 'Release' }).click()
    await expect(firstRow.locator('td').nth(3)).toContainText(/active/i)

    await firstRow.getByRole('button', { name: '+1 Day' }).click()
    await expect(firstRow).toBeVisible()
  })

  test('gps add and delete refreshes table', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /^gps/i }).click()

    const imei = `8999${Date.now()}`
    await page.getByPlaceholder('New IMEI').fill(imei)
    await page.getByRole('button', { name: 'Add' }).click()
    await expect(page.getByRole('cell', { name: imei })).toBeVisible()

    page.on('dialog', (dialog) => dialog.accept())
    const row = page.getByRole('row').filter({ hasText: imei })
    await row.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByRole('cell', { name: imei })).toHaveCount(0)
  })

  test('map focus controls and marker count render', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /^map/i }).click()
    await expect(page.getByText('Markers:')).toBeVisible()
    const focusButtons = page.locator('button').filter({ hasText: /^CSN-\d{3}$/ })
    await expect(focusButtons.first()).toBeVisible()
    await focusButtons.first().click()
    await expect(page.locator('.leaflet-container')).toHaveCount(1)
  })

  test('partner filter applies across tabs', async ({ page }) => {
    await page.goto('/')
    await page.locator('#partnerFilter').selectOption('maka')

    await page.getByRole('button', { name: /^programs/i }).click()
    const partnerCells = page.locator('tbody tr td:nth-child(2)')
    await expect(partnerCells.first()).toBeVisible()
    const partners = await partnerCells.allTextContents()
    expect(partners.length).toBeGreaterThan(0)
    for (const partner of partners) {
      expect(partner.trim().toLowerCase()).toBe('maka')
    }

    await page.getByRole('button', { name: /^finance/i }).click()
    await expect(page.getByText(/Page \d+ \/ \d+ \(\d+ rows\)/)).toBeVisible()
  })

  test('rto config persistence uses compatibility keys', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /^rto/i }).click()
    await page.getByRole('button', { name: 'score' }).click()

    const scoreArea = page.locator('textarea').first()
    const waArea = page.locator('textarea').nth(1)
    const scoreJson = '{"minScore":66}'
    const waJson = '{"approved":"ok"}'
    await scoreArea.fill(scoreJson)
    await waArea.fill(waJson)
    await page.getByRole('button', { name: 'Save Compatibility Config' }).click()

    const saved = await page.evaluate(() => ({
      score: localStorage.getItem('casan_rto_cfg'),
      wa: localStorage.getItem('csn_wa_cfg'),
    }))
    expect(saved.score).toContain('"minScore":66')
    expect(saved.wa).toContain('"approved":"ok"')
  })
})
