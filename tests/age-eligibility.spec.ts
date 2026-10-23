import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test("Herald requires an adult declaration before Google sign-in", async ({ page }, testInfo) => {
  await page.goto("/login");
  const declaration = page.getByRole("checkbox", { name: "I am 18 or older" });
  await expect(declaration).toBeVisible();
  await expect(declaration).toHaveAttribute("required", "");
  await expect(declaration).not.toBeChecked();
  await page.screenshot({ path: testInfo.outputPath("adult-signin.png"), fullPage: true });
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(declaration).toBeFocused();
  await declaration.evaluate(input => { (input.closest("form") as HTMLFormElement).noValidate = true; });
  await page.getByRole("button", { name: "Continue with Google" }).click();
  await expect(page).toHaveURL(/\/login\?error=age$/);
  expect((await page.context().cookies()).some(cookie => cookie.name === "herald_adult_confirmation")).toBe(false);
});

test("existing readers must declare adult eligibility before private pages or API access", async ({ context, page, baseURL }, testInfo) => {
  await login("A", context, baseURL!);
  await context.clearCookies({ name: "herald_adult_confirmation" });
  for (const path of ["/paper", "/settings", "/archive", "/onboarding"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/age-check$/);
    await expect(page.getByRole("checkbox", { name: "I am 18 or older" })).not.toBeChecked();
  }
  const denied = await context.request.get("/api/preferences");
  await page.screenshot({ path: testInfo.outputPath("adult-existing-reader.png"), fullPage: true });
  expect(denied.status()).toBe(403);
  expect(await denied.json()).toMatchObject({ code: "AGE_CONFIRMATION_REQUIRED" });
  await page.getByRole("checkbox", { name: "I am 18 or older" }).evaluate(input => { (input.closest("form") as HTMLFormElement).noValidate = true; });
  await page.getByRole("button", { name: "Continue to Herald" }).click();
  await expect(page).toHaveURL(/\/age-check\?error=age$/);
  expect((await context.cookies()).some(cookie => cookie.name === "herald_adult_confirmation")).toBe(false);
  await page.getByRole("checkbox", { name: "I am 18 or older" }).check();
  await page.getByRole("button", { name: "Continue to Herald" }).click();
  await expect(page).toHaveURL(/\/(paper|onboarding)$/);
  const cookie = (await context.cookies()).find(cookie => cookie.name === "herald_adult_confirmation");
  expect(cookie).toMatchObject({ value: "18-plus-v1", httpOnly: true, sameSite: "Lax" });
  expect((await context.request.get("/api/preferences")).status()).toBe(200);
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  expect((await context.cookies()).some(cookie => cookie.name === "herald_adult_confirmation")).toBe(false);
  await expect(page.getByRole("checkbox", { name: "I am 18 or older" })).not.toBeChecked();
});
