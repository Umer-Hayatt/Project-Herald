import { expect, test } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";

test("a signed-in reader remains authenticated on preferences and navigation", async ({ context, page, baseURL }) => {
  test.skip(!testReadersConfigured, "Disposable readers required.");
  await login("A", context, baseURL!);
  const response = await context.request.get("/api/preferences");
  expect(response.status()).toBe(200);
  await page.goto("/archive");
  await expect(page.getByRole("link", { name: "Archive", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page).toHaveTitle("Your archive | Herald");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});