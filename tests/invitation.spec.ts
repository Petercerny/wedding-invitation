import { test, expect } from '@playwright/test';
const key = 'emma-daniel:rsvp-demo:v1';
test.beforeEach(async ({ page }) => { await page.goto('/'); await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled(); });

test('cover, complete navigation, local images and directions', async ({ page }, info) => {
  const mobile = info.project.name === 'mobile';
  await expect(page.getByRole('heading', { name: 'Emma & Daniel' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  await page.getByRole('button', { name: 'Open our invitation' }).click();
  await expect(page.locator('.page-indicator')).toContainText('Our story');
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  if (mobile) { await page.getByRole('button', { name: 'Next page' }).click(); }
  await expect(page.getByRole('heading', { name: 'It was always you.' })).toBeVisible();
  await page.getByRole('button', { name: 'Go to The invitation' }).click();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  if (mobile) await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByRole('link', { name: 'Get directions' })).toHaveAttribute('href', /google.com\/maps/);
  await page.getByRole('button', { name: 'Go to The day', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  if (mobile) await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByRole('heading', { name: 'From this moment on.' })).toBeVisible();
  await page.getByRole('button', { name: 'Go to Guest information' }).click();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  if (mobile) await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByRole('heading', { name: 'Come as our guest.' })).toBeVisible();
  expect(await page.locator('img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('RSVP validation, conditional fields, and successful demo storage', async ({ page }) => {
  await page.getByRole('button', { name: 'RSVP', exact: true }).click();
  await expect(page.getByLabel('Full name *')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
  await page.getByRole('button', { name: 'Save demo response' }).click();
  await expect(page.getByText('Please enter your full name.')).toBeVisible();
  await expect(page.getByLabel('Number of guests')).toHaveCount(0);
  await page.getByLabel('Full name *').fill('Alex Guest');
  await page.getByLabel('Email address *').fill('invalid');
  await page.getByLabel('Joyfully accept').check();
  await page.getByRole('button', { name: 'Save demo response' }).click();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await page.getByLabel('Email address *').fill('alex@example.com');
  await page.getByLabel('Number of guests').selectOption('2');
  await page.getByLabel('Dietary requirements').fill('Vegetarian');
  await page.getByLabel('A note to the couple').fill('Looking forward to celebrating!');
  await page.getByLabel('A note to the couple').press('ArrowLeft');
  await expect(page.getByLabel('Full name *')).toBeVisible();
  await page.getByRole('button', { name: 'Save demo response' }).click();
  await expect(page.getByRole('button', { name: 'Saving your response…' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'With love & thanks.' })).toBeVisible();
  await expect(page.getByText('Your response has not been delivered', { exact: false })).toBeVisible();
  const responses = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey) || '[]'), key);
  expect(responses).toHaveLength(1);
  expect(responses[0]).toMatchObject({ fullName: 'Alex Guest', email: 'alex@example.com', attendance: 'accept', guests: 2, dietary: 'Vegetarian' });
});

test('declining hides attendance details and storage failure can be retried', async ({ page }) => {
  await page.getByRole('button', { name: 'RSVP', exact: true }).click();
  await page.getByLabel('Full name *').fill('Sam Guest');
  await page.getByLabel('Email address *').fill('sam@example.com');
  await page.getByLabel('Joyfully accept').check();
  await page.getByLabel('Dietary requirements').fill('Stale value');
  await page.getByLabel('Regretfully decline').check();
  await expect(page.getByLabel('Dietary requirements')).toHaveCount(0);
  await expect(page.getByLabel('Number of guests')).toHaveCount(0);
  await page.evaluate(storageKey => localStorage.setItem(storageKey, '{}'), key);
  await page.getByRole('button', { name: 'Save demo response' }).click();
  await expect(page.getByText('We couldn’t save this demo response.', { exact: false })).toBeVisible();
  await page.evaluate(storageKey => localStorage.removeItem(storageKey), key);
  await page.getByRole('button', { name: 'Save demo response' }).click();
  await expect(page.getByRole('heading', { name: 'With love & thanks.' })).toBeVisible();
  const response = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey) || '[]')[0], key);
  expect(response).toMatchObject({ attendance: 'decline', guests: 0, dietary: '' });
});

test('reduced motion gives immediate transitions and keyboard navigation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.page-indicator')).toContainText('Our story');
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.page-indicator')).toContainText('The beginning');
});

test('text enlargement expands book and keeps the form usable', async ({ page }) => {
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; window.dispatchEvent(new Event('resize')); });
  await page.getByRole('button', { name: 'RSVP', exact: true }).click();
  await expect(page.getByLabel('Full name *')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save demo response' })).toBeVisible();
  const bounds = await page.locator('.book-page:not([aria-hidden="true"]) .page-layout').last().evaluate(el => ({ scrollHeight: el.scrollHeight, height: el.clientHeight }));
  expect(bounds.scrollHeight).toBeLessThanOrEqual(bounds.height + 2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
