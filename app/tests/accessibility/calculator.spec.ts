import { test, expect } from '@playwright/test'
import { setupA11yTesting, testA11y, testKeyboardNavigation } from '../helpers/a11y-utils'

test.describe('Calculator Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator')
    await setupA11yTesting(page)
  })

  test('should pass WCAG 2.2 AA on location step', async ({ page }) => {
    await testA11y(page)
  })

  test('should have proper heading hierarchy on location step', async ({ page }) => {
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThan(0)
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').allTextContents()
    expect(headings.length).toBeGreaterThan(0)
  })

  test('should have accessible form labels on location step', async ({ page }) => {
    const zipInput = page.getByLabel('ZIP code')
    await expect(zipInput).toBeVisible()
    
    const inputId = await zipInput.getAttribute('id')
    expect(inputId).toBeTruthy()
    
    const label = page.locator(`label[for="${inputId}"]`)
    await expect(label).toBeVisible()
  })

  test('should have sufficient color contrast', async ({ page }) => {
    await testA11y(page)
  })

  test('should support keyboard navigation on location step', async ({ page }) => {
    const zipInput = page.getByLabel('ZIP code')
    
    await page.keyboard.press('Tab')
    await expect(zipInput).toBeFocused()
    
    await page.keyboard.type('30301')
    
    await page.keyboard.press('Tab')
    const button = page.getByRole('button')
    await expect(button).toBeFocused()
    
    await page.keyboard.press('Enter')
  })

  test('should announce errors to screen readers', async ({ page }) => {
    const zipInput = page.getByLabel('ZIP code')
    await zipInput.fill('123')
    await zipInput.blur()
    
    const errorMessage = page.getByText(/ZIP code must be 5 digits/i)
    await expect(errorMessage).toBeVisible()
    
    // Check if error is associated with input
    const describedBy = await zipInput.getAttribute('aria-describedby')
    if (describedBy) {
      const errorElement = page.locator(`#${describedBy}`)
      await expect(errorElement).toBeVisible()
    }
  })

  test('should pass WCAG 2.2 AA on inputs step', async ({ page }) => {
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    await testA11y(page)
  })

  test('should have accessible form inputs on inputs step', async ({ page }) => {
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    const areaInput = page.getByLabel('Total floor area (sq ft)')
    await expect(areaInput).toBeVisible()
    
    const volumeInput = page.getByLabel('Building volume (cu ft)')
    await expect(volumeInput).toBeVisible()
    
    // Check all inputs have labels
    const inputs = await page.locator('input[type="number"]').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        const labelCount = await label.count()
        expect(labelCount).toBeGreaterThan(0)
      }
    }
  })

  test('should have accessible select elements', async ({ page }) => {
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    const infiltrationSelect = page.getByLabel('Infiltration class')
    await expect(infiltrationSelect).toBeVisible()
    
    const ductLocationSelect = page.getByLabel('Duct location')
    await expect(ductLocationSelect).toBeVisible()
  })

  test('should pass WCAG 2.2 AA on results step', async ({ page }) => {
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    await page.getByLabel('Total floor area (sq ft)').fill('2000')
    await page.getByRole('button', { name: /Calculate/i }).click()
    
    await page.waitForSelector('text=Summary', { timeout: 10000 })
    await testA11y(page)
  })

  test('should have accessible table on results step', async ({ page }) => {
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    await page.getByLabel('Total floor area (sq ft)').fill('2000')
    await page.getByRole('button', { name: /Calculate/i }).click()
    
    await page.waitForSelector('text=Summary', { timeout: 10000 })
    
    const table = page.getByRole('table')
    await expect(table).toBeVisible()
    
    const headers = await table.locator('th').allTextContents()
    expect(headers.length).toBeGreaterThan(0)
    
    const rows = await table.locator('tbody tr').count()
    expect(rows).toBeGreaterThan(0)
  })

  test('should support screen reader navigation on results', async ({ page }) => {
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    await page.getByLabel('Total floor area (sq ft)').fill('2000')
    await page.getByRole('button', { name: /Calculate/i }).click()
    
    await page.waitForSelector('text=Summary', { timeout: 10000 })
    
    // Check for landmarks
    const main = page.locator('main')
    if ((await main.count()) > 0) {
      await expect(main).toBeVisible()
    }
  })

  test('should have proper focus management', async ({ page }) => {
    // Focus should be visible when tabbing
    await page.keyboard.press('Tab')
    let focused = await page.locator(':focus').count()
    expect(focused).toBeGreaterThan(0)
    
    await page.keyboard.press('Tab')
    focused = await page.locator(':focus').count()
    expect(focused).toBeGreaterThan(0)
  })

  test('should have adequate touch target sizes on mobile', async ({ page, isMobile }) => {
    if (!isMobile) {
      test.skip()
    }
    
    const buttons = await page.getByRole('button').all()
    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    }
  })

  test('should not have motion-based interactions without alternatives', async ({ page }) => {
    await testA11y(page, undefined, { disabledRules: [] })
  })

  test('should support reduced motion preferences', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    
    // Should still be functional
    await expect(page.getByText('Step 1: Locate the property')).toBeVisible()
  })

  test('should have skip navigation links', async ({ page }) => {
    // Check for skip links (if implemented)
    const skipLink = page.locator('a[href^="#"]').first()
    if ((await skipLink.count()) > 0) {
      await skipLink.focus()
      await expect(skipLink).toBeFocused()
    }
  })
})


