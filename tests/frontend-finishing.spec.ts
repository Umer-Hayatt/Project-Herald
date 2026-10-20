import { expect, test } from "@playwright/test";

test("a reader can identify the preview and reach sign-in with reduced motion and keyboard", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const preview = page.getByRole("complementary", { name: "Illustrative paper preview" });
  await expect(preview.getByText(/Illustrative preview/)).toBeVisible();
  await expect(preview.getByRole("link", { name: "Inspect public sample edition" })).toHaveAttribute("href", "/sample");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await page.getByRole("link", { name: "Create my paper" }).first().click();
  await expect(page).toHaveTitle("Sign in | Herald");
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});
