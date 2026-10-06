import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import { chapters } from '../src/bookContent';
const key = 'emma-daniel:rsvp-demo:v1';

async function fits(page: Page) {
  // The flip engine paints newly selected pages on its next animation frame.
  await expect.poll(() => page.locator('.flipbook .book-page[aria-hidden="false"]').evaluateAll(pages => pages.length > 0 && pages.every(el => el.getBoundingClientRect().height > 0))).toBe(true);
  const result = await page.evaluate(() => {
    const stage = document.querySelector('.book-stage')!.getBoundingClientRect();
    const visible = [...document.querySelectorAll<HTMLElement>('.flipbook .book-page[aria-hidden="false"]')];
    return {
      documentFits: document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight,
      bookFits: stage.left >= -1 && stage.right <= innerWidth + 1 && stage.top >= -1 && stage.bottom <= innerHeight + 1,
      pagesVisible: visible.length > 0 && visible.every(el => el.getBoundingClientRect().height > 0),
      overflowing: visible.flatMap(el => [...el.querySelectorAll<HTMLElement>('.page-body, .rsvp-fields, .rsvp-form')].filter(body => body.scrollHeight > body.clientHeight + 2).map(body => ({ page: el.dataset.pageId, class: body.className, height: body.clientHeight, content: body.scrollHeight }))),
    };
  });
  expect(result.documentFits).toBe(true);
  expect(result.bookFits).toBe(true);
  expect(result.pagesVisible).toBe(true);
  expect(result.overflowing).toEqual([]);
}
async function rsvp(page: Page) {
  await page.getByRole('button', { name: 'RSVP', exact: true }).click();
  await expect(page.getByLabel('Full name *')).toBeVisible();
}
async function contact(page: Page) {
  await page.getByLabel('Full name *').fill('Alex Guest');
  if (!await page.getByLabel('Email address *').isVisible()) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Email address *').fill('alex@example.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Joyfully accept')).toBeVisible();
}
async function finishDetails(page: Page) {
  for (let i = 0; i < 5 && !await page.getByRole('button', { name: 'Save demo response', exact: true }).isVisible(); i++) {
    if (await page.getByLabel('Number of guests').isVisible()) await page.getByLabel('Number of guests').selectOption('2');
    if (await page.getByLabel('Dietary requirements').isVisible()) await page.getByLabel('Dietary requirements').fill('Vegetarian');
    if (await page.getByLabel('A note to the couple').isVisible()) await page.getByLabel('A note to the couple').fill('Looking forward to celebrating!');
    await fits(page);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Save demo response', exact: true })).toBeVisible();
}
test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
});

test('pale cover, real stickers, photo-only collages and all text preserved', async ({ page }) => {
  await expect(page).toHaveTitle('Míša & Petr — Our Wedding');
  await expect(page.getByRole('heading', { name: /Míša.*Petr/ })).toBeVisible();
  expect(await page.locator('.cover-page').evaluate(el => getComputedStyle(el).backgroundColor)).toBe('rgb(199, 233, 192)');
  await page.waitForFunction(() => [...document.images].every(image => image.complete && image.naturalWidth > 0));
  expect(await page.locator('.flipbook .photo-page').evaluateAll(pages => pages.every(el => el.querySelectorAll('.snapshot img').length === 2))).toBe(true);
  await expect(page.locator('.flipbook .page-body .snapshot')).toHaveCount(0);
  const prose = await page.locator('.flipbook .text-block').evaluateAll(blocks => {
    const result: Record<string, string[]> = {};
    for (const block of blocks) {
      const id = (block as HTMLElement).dataset.blockId!;
      const text = block.querySelector('.block-text, .directions-link')?.textContent || '';
      (result[id] ||= []).push(text);
    }
    return result;
  });
  const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();
  for (const chapter of chapters) for (const block of chapter.blocks) {
    if (block.kind !== 'link') expect(normalize(prose[block.id].join(' '))).toBe(normalize(block.text));
  }
  await fits(page);
});

test('every book page fits, navigation ends correctly, directions and chapters work', async ({ page }) => {
  let turns = 0;
  do {
    await fits(page);
    if (await page.getByRole('button', { name: 'Next page' }).isDisabled()) break;
    await page.getByRole('button', { name: 'Next page' }).click();
    turns++;
  } while (turns < 80);
  expect(turns).toBeLessThan(80);
  await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
  await page.getByRole('button', { name: 'Go to The invitation' }).click();
  await expect(page.locator('.page-indicator')).toContainText('The invitation');
  for (let i = 0; i < 6 && !await page.getByRole('link', { name: 'Get directions' }).isVisible(); i++) await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByRole('link', { name: 'Get directions' })).toHaveAttribute('href', /google.com\/maps/);
  await page.getByRole('button', { name: 'Return to invitation cover' }).click();
  await expect(page.getByRole('heading', { name: /Míša.*Petr/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
});

test('RSVP validates each step, keeps Back edits, and stores an accepting response', async ({ page }) => {
  await rsvp(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Please enter your full name.')).toBeVisible();
  await fits(page);
  await page.getByLabel('Full name *').fill('Alex Guest');
  if (!await page.getByLabel('Email address *').isVisible()) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Email address *').fill('invalid');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Please enter a valid email address.')).toBeVisible();
  await fits(page);
  await page.getByLabel('Email address *').fill('alex@example.com');
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Please let us know if you can join us.')).toBeVisible();
  await fits(page);
  await page.getByLabel('Joyfully accept').check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await finishDetails(page);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('A note to the couple')).toHaveValue('Looking forward to celebrating!');
  await page.getByLabel('A note to the couple').press('ArrowLeft');
  await expect(page.getByLabel('A note to the couple')).toBeVisible();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await fits(page);
  await page.getByRole('button', { name: 'Save demo response' }).click();
  await expect(page.getByRole('button', { name: 'Saving your response…' })).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'With love & thanks.' })).toBeVisible();
  await fits(page);
  await expect(page.getByText('Your response has not been delivered', { exact: false })).toBeVisible();
  const responses = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey) || '[]'), key);
  expect(responses).toHaveLength(1);
  expect(responses[0]).toMatchObject({ fullName: 'Alex Guest', email: 'alex@example.com', attendance: 'accept', guests: 2, dietary: 'Vegetarian', message: 'Looking forward to celebrating!' });
});

test('decline skips guest fields and clears previous dietary data; failures retry', async ({ page }) => {
  await rsvp(page); await contact(page);
  await page.getByLabel('Joyfully accept').check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  if (!await page.getByLabel('Dietary requirements').isVisible()) await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Dietary requirements').fill('Stale value');
  for (let i = 0; i < 3 && !await page.getByLabel('Regretfully decline').isVisible(); i++) await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByLabel('Regretfully decline').check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByLabel('Dietary requirements')).toHaveCount(0);
  await expect(page.getByLabel('Number of guests')).toHaveCount(0);
  await finishDetails(page);
  await page.evaluate(storageKey => localStorage.setItem(storageKey, '{}'), key);
  await page.getByRole('button', { name: 'Save demo response' }).click();
  await expect(page.getByText('We couldn’t save this demo response.', { exact: false })).toBeVisible();
  await fits(page);
  await page.evaluate(storageKey => localStorage.removeItem(storageKey), key);
  await page.getByRole('button', { name: 'Try again', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'With love & thanks.' })).toBeVisible();
  await fits(page);
  const response = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey) || '[]')[0], key);
  expect(response).toMatchObject({ attendance: 'decline', guests: 0, dietary: '' });
});

test('reduced-motion keyboard navigation and animated turns keep pages visible', async ({ page }) => {
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.page-indicator')).toContainText('Our story');
  await fits(page);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.page-indicator')).toContainText('The beginning');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Open our invitation' }).click();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  await expect(page.locator('.page-indicator')).toContainText('Our story');
  await fits(page);
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  await fits(page);
});

test('resize preserves the reading anchor and RSVP values and active step', async ({ page }, info) => {
  await page.getByRole('button', { name: 'Go to Guest information' }).click();
  await expect(page.getByRole('heading', { name: 'Come as our guest.' })).toBeVisible();
  const before = await page.locator('.flipbook .book-page[aria-hidden="false"] .text-block').first().getAttribute('data-block-id');
  const target = info.project.name === 'mobile' ? { width: 844, height: 390 } : { width: 390, height: 844 };
  await page.setViewportSize(target);
  await expect.poll(() => page.locator('.book-stage').evaluate(el => el.clientWidth)).toBe(target.width === 390 ? 342 : 420);
  await expect(page.locator(`.flipbook .book-page[aria-hidden="false"] [data-block-id="${before}"]`)).toBeVisible();
  await fits(page);
  await rsvp(page); await contact(page);
  await page.getByLabel('Joyfully accept').check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await page.getByLabel('Number of guests').selectOption('3');
  await page.setViewportSize({ width: 1366, height: 768 });
  await expect.poll(() => page.locator('.book-stage').evaluate(el => el.clientWidth)).toBe(920);
  await expect(page.getByLabel('Number of guests')).toHaveValue('3');
  await fits(page);
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByLabel('Joyfully accept')).toBeChecked();
});

test('larger text adds continuation pages without clipping or losing prose', async ({ page }, info) => {
  test.skip(info.project.name === 'landscape', 'Landscape fit is checked separately at normal text size.');
  const count = await page.locator('.flipbook .book-page').count();
  await page.getByRole('button', { name: 'Go to Our story' }).click();
  await page.evaluate(() => { document.documentElement.style.fontSize = '32px'; window.dispatchEvent(new Event('resize')); });
  await expect.poll(() => page.locator('.flipbook .book-page').count()).toBeGreaterThan(count);
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'It was always you.' })).toBeVisible();
  const fragments = await page.locator('.flipbook .text-block').evaluateAll(blocks => {
    const result: Record<string, string[]> = {};
    for (const block of blocks) (result[(block as HTMLElement).dataset.blockId!] ||= []).push(block.querySelector('.block-text')?.textContent || '');
    return result;
  });
  for (const chapter of chapters) for (const block of chapter.blocks) if (block.kind !== 'link') expect(fragments[block.id].join(' ').replace(/\s+/g, ' ').trim()).toBe(block.text.replace(/\s+/g, ' ').trim());
  await fits(page);
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Next page' }).click();
    await fits(page);
  }
  await rsvp(page);
  await fits(page);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.getByText('Please enter your full name.')).toBeVisible();
  await fits(page);
});

test('resizing during a turn settles on the same chapter with visible pages', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.getByRole('button', { name: 'Open our invitation' }).click();
  await page.setViewportSize({ width: 320, height: 568 });
  await expect.poll(() => page.locator('.book-stage').evaluate(el => el.clientWidth)).toBe(272);
  await expect(page.getByRole('button', { name: 'Next page' })).toBeEnabled();
  await expect(page.locator('.page-indicator')).toContainText('Our story');
  await fits(page);
  await rsvp(page); await contact(page);
  await page.getByLabel('Joyfully accept').check();
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await finishDetails(page);
  await fits(page);
});

test('touch swipes turn photo pages and ignore form inputs', async ({ page }, info) => {
  test.skip(!['mobile', 'landscape'].includes(info.project.name), 'Touch surfaces only.');
  async function swipe(selector: string) {
    await page.locator(selector).evaluate(el => {
      const rect = el.getBoundingClientRect();
      const start = new Touch({ identifier: 1, target: el, clientX: rect.left + 200, clientY: rect.top + 40 });
      const end = new Touch({ identifier: 1, target: el, clientX: rect.left + 80, clientY: rect.top + 40 });
      el.dispatchEvent(new TouchEvent('touchstart', { bubbles: true, touches: [start], changedTouches: [start] }));
      el.dispatchEvent(new TouchEvent('touchend', { bubbles: true, touches: [], changedTouches: [end] }));
    });
  }
  await page.getByRole('button', { name: 'Open our invitation' }).click();
  await swipe('.flipbook .book-page[aria-hidden="false"] .photo-layout');
  await expect(page.getByRole('heading', { name: 'It was always you.' })).toBeVisible();
  await fits(page);
  await rsvp(page);
  await swipe('#fullName');
  await expect(page.getByLabel('Full name *')).toBeVisible();
  await fits(page);
});
