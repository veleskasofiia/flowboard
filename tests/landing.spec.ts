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

//Test_3_button_""Get_started_free"_is_visible

test('Get started free button is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', {name: 'Get Started Free' })).toBeVisible();

}); 

//Test_4_LogIn

test('LogIn to app', async ({ page }) => {
    await page.goto('/');
    await page.getByRole ('link', {name:'Sign In'}).first().click();
    await expect(page).toHaveURL('/auth/login'); 

});