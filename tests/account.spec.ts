import { expect, test } from "@playwright/test";
test("a reader can find the Google sign-in action and recover from cancellation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "The world, edited for you." })).toBeVisible();
  await page.getByRole("link", { name: "Create my paper" }).first().click();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
  await page.goto("/auth/callback?error=access_denied");
  await expect(page.getByRole("alert")).toContainText("cancelled");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
});

