import { test, expect } from '../hook-2';

test('File 3: Test 1', async ({ page }) => {
  await expect(page).toHaveTitle(/Playwright/);
  console.log(`${test.info().status?.toUpperCase()}`);
});

test('File 3: Test 2', async ({ page }) => {
  await expect(page).toHaveTitle(/Playwright/);
  console.log(`${test.info().status?.toUpperCase()}`);
});

test('File 3: Test 3', async ({ page }) => {
  await expect(page).toHaveTitle(/Playwright/);
  console.log(`${test.info().status?.toUpperCase()}`);
});

test('File 3: Test 4', async ({ page }) => {
  await expect(page).toHaveTitle(/Playwright/);
  console.log(`${test.info().status?.toUpperCase()}`);
});

test('File 3: Test 5', async ({ page }) => {
  await expect(page).toHaveTitle(/Playwright/);
  console.log(`${test.info().status?.toUpperCase()}`);
});
