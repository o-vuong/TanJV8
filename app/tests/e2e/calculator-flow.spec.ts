import { test, expect } from '@playwright/test'
import { setupA11yTesting, testA11y } from '../helpers/a11y-utils'

test.describe('Calculator Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calculator')
    await setupA11yTesting(page)
  })

  test('should display location resolver on load', async ({ page }) => {
    await expect(page.getByText('Step 1: Locate the property')).toBeVisible()
    await expect(page.getByLabel('ZIP code')).toBeVisible()
    await testA11y(page)
  })

  test('should validate ZIP code format', async ({ page }) => {
    const zipInput = page.getByLabel('ZIP code')
    await zipInput.fill('123')
    await zipInput.blur()
    
    await expect(page.getByText(/ZIP code must be 5 digits/i)).toBeVisible()
  })

  test('should resolve location and show climate data', async ({ page }) => {
    // This assumes there's test data seeded in the database
    const zipInput = page.getByLabel('ZIP code')
    await zipInput.fill('30301')
    
    const resolveButton = page.getByRole('button', { name: /Resolve location/i })
    await resolveButton.click()
    
    // Wait for climate data to load
    await expect(page.getByText(/Summer design/i)).toBeVisible()
    await expect(page.getByText(/Winter design/i)).toBeVisible()
  })

  test('should navigate to input wizard after resolving location', async ({ page }) => {
    const zipInput = page.getByLabel('ZIP code')
    await zipInput.fill('30301')
    
    const continueButton = page.getByRole('button')
    await continueButton.click()
    
    await expect(page.getByText('Step 2: Building Information')).toBeVisible()
    await testA11y(page)
  })

  test('should fill out building inputs and calculate', async ({ page }) => {
    // Step 1: Resolve location
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    // Step 2: Fill building inputs
    await expect(page.getByText('Step 2: Building Information')).toBeVisible()
    
    // Fill in form fields
    await page.getByLabel('Total floor area (sq ft)').fill('2000')
    await page.getByLabel('Building volume (cu ft)').fill('16000')
    await page.getByLabel('Wall area (sq ft)').fill('1500')
    await page.getByLabel('Wall R-value').fill('13')
    await page.getByLabel('Roof area (sq ft)').fill('2000')
    await page.getByLabel('Roof R-value').fill('38')
    await page.getByLabel('Window area (sq ft)').fill('300')
    
    // Submit calculation
    const calculateButton = page.getByRole('button', { name: /Calculate/i })
    await calculateButton.click()
    
    // Wait for results
    await expect(page.getByText('Summary')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText(/Total load/i)).toBeVisible()
    await expect(page.getByText(/System size/i)).toBeVisible()
    await testA11y(page)
  })

  test('should display load breakdown in results', async ({ page }) => {
    // Navigate through flow quickly
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    await page.getByLabel('Total floor area (sq ft)').fill('2000')
    await page.getByRole('button', { name: /Calculate/i }).click()
    
    // Check results page
    await expect(page.getByText('Load breakdown')).toBeVisible({ timeout: 10000 })
    await expect(page.getByText('Walls')).toBeVisible()
    await expect(page.getByText('Roof')).toBeVisible()
    await expect(page.getByText('Windows')).toBeVisible()
    await expect(page.getByText('Solar gain')).toBeVisible()
    await expect(page.getByText('Infiltration')).toBeVisible()
    await expect(page.getByText('Internal gains')).toBeVisible()
    await expect(page.getByText('Duct losses')).toBeVisible()
  })

  test('should allow navigation back from results', async ({ page }) => {
    // Navigate through flow
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    await page.getByLabel('Total floor area (sq ft)').fill('2000')
    await page.getByRole('button', { name: /Calculate/i }).click()
    
    // Wait for results
    await expect(page.getByText('Summary')).toBeVisible({ timeout: 10000 })
    
    // Click back button
    const backButton = page.getByRole('button', { name: /Back/i })
    await backButton.click()
    
    // Should be back at inputs
    await expect(page.getByText('Step 2: Building Information')).toBeVisible()
  })

  test('should allow starting new calculation', async ({ page }) => {
    // Navigate through flow
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    await page.getByLabel('Total floor area (sq ft)').fill('2000')
    await page.getByRole('button', { name: /Calculate/i }).click()
    
    // Wait for results
    await expect(page.getByText('Summary')).toBeVisible({ timeout: 10000 })
    
    // Start new calculation
    const newCalcButton = page.getByRole('button', { name: /Start new calculation/i })
    await newCalcButton.click()
    
    // Should be back at step 1
    await expect(page.getByText('Step 1: Locate the property')).toBeVisible()
  })

  test('should show step indicator progress', async ({ page }) => {
    // Initial state
    await expect(page.getByText('Location')).toBeVisible()
    await expect(page.getByText('Building Inputs')).toBeVisible()
    await expect(page.getByText('Results')).toBeVisible()
    
    // Move to step 2
    await page.getByLabel('ZIP code').fill('30301')
    await page.getByRole('button').click()
    await page.waitForTimeout(1000)
    
    // Check step indicator updated
    await expect(page.getByText('Step 2: Building Information')).toBeVisible()
    
    // Move to step 3
    await page.getByLabel('Total floor area (sq ft)').fill('2000')
    await page.getByRole('button', { name: /Calculate/i }).click()
    
    // Check results visible
    await expect(page.getByText('Summary')).toBeVisible({ timeout: 10000 })
  })

  test('should be keyboard navigable', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab')
    await page.keyboard.type('30301')
    await page.keyboard.press('Enter')
    
    await page.waitForTimeout(1000)
    
    // Should have moved to next step
    await expect(page.getByText('Step 2: Building Information')).toBeVisible()
  })
})
