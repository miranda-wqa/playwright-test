// import { test, expect, TestInfo} from '@playwright/test';

// test.beforeEach(async ({ page }) => {
//     await page.goto('https://playwright.dev/');
//     console.log(`${test.info().title}\nBefore Each Hook`);
// });

// test.afterEach(async ({ page }) => {
//     await page.goto('http://localhost:8080/mdpWebApp/logout');
//     console.log(`After Each Hook\n`);
// });

// export { test, expect };


import { test as base, expect } from '@playwright/test';

export const test = base.extend<{ forEachTest: void }>({
  forEachTest: [async ({ page }, use) => {

    // This code runs before every test.  
    await page.goto('https://playwright.dev/');
    console.log(`${test.info().title}\nBefore Each Hook`);

    await use();

    // This code runs after every test.
    console.log(`After Each Hook\n`);
    await page.close();
  }, { auto: true }],  // automatically starts for every test.
});

export { expect}