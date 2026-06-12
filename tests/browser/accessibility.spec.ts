import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const expectAccessible = async (page: Page, label: string) => {
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const details = results.violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    description: violation.description,
    targets: violation.nodes.flatMap((node) => node.target)
  }));
  expect(results.violations, `${label} accessibility violations:\n${JSON.stringify(details, null, 2)}`).toEqual([]);
};

const register = async (page: Page) => {
  await page.goto('/auth');
  await page.getByPlaceholder('Jane Doe').fill('Accessibility Student');
  await page.getByPlaceholder('jane@example.edu').fill(`a11y-${Date.now()}-${Math.random().toString(16).slice(2)}@example.edu`);
  await page.getByPlaceholder('Password').fill('accessibility-password');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
};

test('public landing and authentication pages meet WCAG A/AA checks', async ({ page }) => {
  await page.goto('/');
  await expectAccessible(page, 'Landing page');

  await page.goto('/auth');
  await expectAccessible(page, 'Authentication page');
});

test('authenticated dashboard and profile pages meet WCAG A/AA checks', async ({ page }) => {
  await register(page);
  await expectAccessible(page, 'Dashboard');

  await page.getByRole('button', { name: 'Complete Profile' }).click();
  await expect(page).toHaveURL(/\/profile/);
  await expectAccessible(page, 'Profile');

  await page.getByPlaceholder('e.g. Stanford University, CS101').fill('Accessibility University');
  await page.getByPlaceholder('e.g. Computer Science, Calculus').fill('CS301, Advanced Algorithms');
  const goalSection = page.getByText('What are you working towards?').locator('..');
  await goalSection.getByRole('button').first().click();
  await goalSection.getByRole('button', { name: /Score 90%/ }).last().click();
  await page.getByRole('button', { name: 'Visual' }).click();
  await page.getByRole('button', { name: 'Study Group' }).click();
  await page.getByRole('button', { name: 'Evening' }).click();
  await page.getByRole('button', { name: 'Continue to Matching' }).click();
  await expect(page).toHaveURL(/\/group-requirements/);
  await expectAccessible(page, 'Group requirements');

  await page.getByRole('button', { name: 'Find matching groups' }).click();
  await expect(page).toHaveURL(/\/matches/, { timeout: 15_000 });
  await expectAccessible(page, 'Matches');

  for (const [path, label] of [
    ['/session', 'Session'],
    ['/progress', 'Progress'],
    ['/guidance', 'Guidance'],
    ['/pro', 'Subscription information']
  ] as const) {
    await page.goto(path);
    await expectAccessible(page, label);
  }
});
