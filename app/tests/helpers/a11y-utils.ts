import { expect, type Page } from '@playwright/test'
import { injectAxe, checkA11y, configureAxe } from '@axe-core/playwright'

export const axeConfig = {
  rules: {
    'target-size': { enabled: true },
    'focus-not-obscured': { enabled: true },
    'dragging-movements': { enabled: true },
  },
  tags: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'],
}

export async function setupA11yTesting(page: Page) {
  await injectAxe(page)
  await configureAxe(page, axeConfig)
}

export async function testA11y(
  page: Page,
  selector?: string,
  options?: { disabledRules?: string[] },
) {
  const config = { ...axeConfig }
  if (options?.disabledRules) {
    options.disabledRules.forEach((rule) => {
      config.rules[rule] = { enabled: false }
    })
  }
  await checkA11y(page, selector, config)
}

export async function testKeyboardNavigation(page: Page, selectors: string[]) {
  for (const selector of selectors) {
    await page.focus(selector)
    const focused = await page.locator(':focus')
    expect(await focused.count()).toBe(1)
    await page.keyboard.press('Tab')
  }
  await page.keyboard.press('Escape')
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowUp')
  await page.keyboard.press('Enter')
  await page.keyboard.press(' ')
}
