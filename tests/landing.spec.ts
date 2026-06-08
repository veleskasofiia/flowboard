//Test_1_open_landing_page

import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/FlowBoard/);
});

//Test_2_page_loads_and_has_title_FlowBoard

test('Page loads and has the title FlowBoard', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/FlowBoard/);

});