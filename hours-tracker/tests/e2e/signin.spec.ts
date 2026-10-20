import { expect, test } from "@playwright/test";

test("signed-out visitors are sent to the sign-in page", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/signin/);
  await expect(page.getByRole("button", { name: "Sign in with Microsoft" })).toBeVisible();
});

test("a rejected account sees a clear message", async ({ page }) => {
  await page.goto("/signin?error=AccessDenied");
  await expect(page.getByText("Sign in with your @esquireinteractive.com account")).toBeVisible();
});

test("the sign-in page fits a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await page.goto("/signin");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(375);
});
