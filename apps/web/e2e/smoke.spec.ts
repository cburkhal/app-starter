import { expect, test } from "@playwright/test";

test("sign up, create a note, see it in list and chart", async ({ page }) => {
  const email = `smoke-${Date.now()}@example.com`;
  await page.goto("/");
  await expect(page).toHaveURL(/\/login$/);

  await page.getByRole("button", { name: "No account? Sign up" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("correct-horse-battery");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page.getByText(email)).toBeVisible();
  await page.getByLabel("New note").fill("First note");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("First note")).toBeVisible();
  await expect(page.locator(".recharts-bar-rectangle")).toHaveCount(1);

  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login$/);
});
