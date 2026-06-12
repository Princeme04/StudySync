import { expect, request as apiRequest, test } from '@playwright/test';

let registeredCandidateEmail = '';

test.beforeAll(async () => {
  const request = await apiRequest.newContext({ baseURL: 'http://127.0.0.1:3100' });
  registeredCandidateEmail = `browser-candidate-${Date.now()}@example.edu`;
  const registration = await request.post('/api/auth/register', {
    data: {
      name: 'Registered Match Candidate',
      email: registeredCandidateEmail,
      password: 'browser-password'
    }
  });
  expect(registration.status()).toBe(201);
  const profile = await request.post('/api/profile', {
    data: {
      university: 'Browser University',
      major: 'CS301, Advanced Algorithms',
      studyGoal: 'Score 90%+',
      learningStyles: ['visual'],
      studyPreference: 'group',
      timeOfDay: ['Evening']
    }
  });
  expect(profile.status()).toBe(201);
  await request.dispose();
});

const register = async (page: import('@playwright/test').Page) => {
  const email = `browser-${Date.now()}-${Math.random().toString(16).slice(2)}@example.edu`;
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/auth/);
  await page.getByPlaceholder('Jane Doe').fill('Browser Student');
  await page.getByPlaceholder('jane@example.edu').fill(email);
  await page.getByPlaceholder('Password').fill('browser-password');
  await page.getByRole('button', { name: 'Create Account' }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: /Welcome back, Browser/ })).toBeVisible();
  return email;
};

const logout = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'Open profile menu' }).click();
  await page.getByRole('button', { name: 'Log out' }).click();
  await expect(page).toHaveURL(/\/$/);
};

const completeProfileAndFindMatches = async (page: import('@playwright/test').Page) => {
  await page.getByRole('button', { name: 'Complete Profile' }).click();
  await expect(page).toHaveURL(/\/profile/);
  await page.getByPlaceholder('e.g. Stanford University, CS101').fill('Browser University');
  await page.getByPlaceholder('e.g. Computer Science, Calculus').fill('CS301, Advanced Algorithms');
  const goalSection = page.getByText('What are you working towards?').locator('..');
  await goalSection.getByRole('button').first().click();
  await goalSection.getByRole('button', { name: /Score 90%/ }).last().click();
  await page.getByRole('button', { name: 'Visual' }).click();
  await page.getByRole('button', { name: 'Study Group' }).click();
  await page.getByRole('button', { name: 'Evening' }).click();
  await page.getByRole('button', { name: 'Continue to Matching' }).click();

  await expect(page).toHaveURL(/\/group-requirements/);
  await page.getByRole('button', { name: 'Find matching groups' }).click();
  await expect(page).toHaveURL(/\/matching/);
  await expect(page).toHaveURL(/\/matches/, { timeout: 15_000 });
};

test('protected route, registration, profile flow, and Smart Matches layout work', async ({ page }) => {
  await register(page);
  await completeProfileAndFindMatches(page);

  const header = page.locator('div.fixed.left-0.right-0.top-0').first();
  const setupButton = page.getByRole('button', { name: 'Set Up Study Group' });
  await expect(header).toHaveCSS('position', 'fixed');
  await expect(setupButton).toBeVisible();
  await expect(page.getByText('ACCEPTED THIS SEARCH')).toHaveCount(0);
  await expect(page.getByText('PASSED THIS SEARCH')).toHaveCount(0);
  expect((await setupButton.boundingBox())!.y).toBeGreaterThan((await header.boundingBox())!.height);
});

test('registration through completed study session works in the browser', async ({ page }) => {
  await register(page);
  await completeProfileAndFindMatches(page);

  await page.getByRole('button', { name: 'Accept' }).first().click();
  await expect(page).toHaveURL(/\/match-accepted/);
  await page.getByRole('button', { name: 'Start Group Chat' }).click();
  await expect(page).toHaveURL(/\/group-chat/);

  await page.getByPlaceholder('Message your new study group...').fill('Ready for the study session.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Ready for the study session.')).toBeVisible();

  await page.getByRole('button', { name: 'Accept Goal & View Session' }).click();
  await expect(page).toHaveURL(/\/session-confirmed/);
  await page.getByRole('button', { name: 'Open Waiting Session' }).click();
  await expect(page).toHaveURL(/\/session/);

  await page.getByRole('button', { name: 'Mark Attendance' }).click();
  await expect(page.getByRole('button', { name: 'Attendance Marked' })).toBeVisible();
  await page.getByRole('button', { name: 'View Post-Session Accountability' }).click();
  await expect(page).toHaveURL(/\/accountability/);
  await page.getByRole('button', { name: 'Proceed to Progress' }).click();
  await expect(page).toHaveURL(/\/progress/);
  await expect(page.getByText('Sessions completed').locator('..').locator('..').getByText('1', { exact: true })).toBeVisible();
});

test('a group created by one account can be discovered and joined by another account', async ({ page }) => {
  const groupName = `Discoverable Browser Group ${Date.now()}`;
  const request = await apiRequest.newContext({ baseURL: 'http://127.0.0.1:3100' });
  const login = await request.post('/api/auth/login', {
    data: { email: registeredCandidateEmail, password: 'browser-password' }
  });
  expect(login.status()).toBe(200);
  const created = await request.post('/api/groups', {
    data: {
      groupName,
      purpose: 'Browser group discovery',
      meetingStyle: 'Online',
      studyTarget: 'Verify cross-account discovery'
    }
  });
  expect(created.status()).toBe(201);
  await request.dispose();

  await register(page);
  await completeProfileAndFindMatches(page);
  const groupCard = page.getByRole('heading', { name: groupName }).locator('xpath=ancestor::div[contains(@class,"rounded-3xl")][1]');
  await expect(groupCard.getByText('Open group')).toBeVisible();
  await groupCard.getByRole('button', { name: 'Join Group' }).click();
  await expect(page).toHaveURL(/view=joined-group/);
  await expect(page.getByRole('heading', { name: groupName })).toBeVisible();
  await page.getByRole('button', { name: 'Chat' }).click();
  await expect(page).toHaveURL(/\/group-chat/);
  await page.getByPlaceholder('Message your new study group...').fill('Joined through group discovery.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByText('Joined through group discovery.')).toBeVisible();
});

test('library files remain private when switching accounts in the same browser', async ({ page }) => {
  const firstEmail = await register(page);
  await page.getByRole('button', { name: 'Library' }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'first-account-notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Private notes for the first account.')
  });
  await expect(page.getByText('first-account-notes.txt')).toBeVisible();
  await logout(page);

  await register(page);
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page.getByText('Library is empty')).toBeVisible();
  await expect(page.getByText('first-account-notes.txt')).toHaveCount(0);
  await logout(page);

  await page.goto('/auth?mode=login');
  await page.getByPlaceholder('jane@example.edu').fill(firstEmail);
  await page.getByPlaceholder('Password').fill('browser-password');
  await page.getByRole('button', { name: 'Log In' }).click();
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page.getByText('first-account-notes.txt')).toBeVisible();
});

test('current and joined group leave options remove membership', async ({ page }) => {
  await register(page);
  await page.goto('/group-setup');
  await page.getByPlaceholder('Name').fill('Leave Option Group');
  await page.getByPlaceholder('Goal').fill('Verify leaving groups');
  await page.getByRole('button', { name: 'Set Group Plan' }).click();
  await expect(page).toHaveURL(/view=joined-group/);

  await expect(page.getByRole('button', { name: 'Leave Group' })).toBeVisible();
  await page.getByRole('button', { name: 'Home' }).click();
  await expect(page.getByRole('button', { name: 'Leave current group' })).toBeVisible();
  await page.getByRole('button', { name: 'Leave current group' }).click();
  await expect(page.getByRole('heading', { name: /Leave Leave Option Group/ })).toBeVisible();
  await page.getByRole('button', { name: 'Leave Group' }).click();
  await expect(page.getByText('None yet')).toBeVisible();
});

test('Back navigation resets the previous page to the top', async ({ page }) => {
  await register(page);
  await page.goto('/product-overview');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);

  await page.getByRole('button', { name: /Premium|Pro/ }).click();
  await expect(page).toHaveURL(/\/pro/);
  await page.getByRole('button', { name: 'Go back' }).click();
  await expect(page).toHaveURL(/\/product-overview/);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
