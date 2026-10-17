import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";

test.describe("future Editions feedback and settings", () => {
  test.skip(!testReadersConfigured, "Disposable readers required in .env.test.local.");

  test("settings persist while today's saved Edition stays unchanged", async ({ context, page, baseURL }) => {
    await login("A", context, baseURL!);
    const initialPreferences = {
      interests: ["science", "technology"],
      preferred_region: "global",
      reading_length: 10,
      time_zone: "Asia/Karachi",
      onboarding_complete: true,
    };
    expect((await context.request.put("/api/preferences", {
      headers: { origin: baseURL! },
      data: initialPreferences,
    })).ok()).toBeTruthy();

    await page.goto("/paper");
    const savedDate = await page.locator(".edition-date-headline").textContent().catch(() => null);
    const savedTitles = await page.locator(".story-title").allTextContents();

    await page.goto("/settings");
    await page.getByLabel("Sports", { exact: true }).check();
    await page.getByLabel("Preferred region", { exact: true }).selectOption("pk");
    await page.getByLabel("Reading length", { exact: true }).selectOption("5");
    await page.getByRole("button", { name: "Save settings" }).click();
    await expect(page.getByRole("status")).toContainText("Saved for your next Edition");
    await page.reload();
    await expect(page.getByLabel("Sports", { exact: true })).toBeChecked();
    await expect(page.getByLabel("Preferred region", { exact: true })).toHaveValue("pk");
    await expect(page.getByLabel("Reading length", { exact: true })).toHaveValue("5");

    await page.goto("/paper");
    if (savedDate) {
      await expect(page.locator(".edition-date-headline")).toHaveText(savedDate);
      expect(await page.locator(".story-title").allTextContents()).toEqual(savedTitles);
    } else {
      await expect(page.getByRole("heading", { name: "No fresh reporting available" })).toBeVisible();
    }
    expect((await (await context.request.get("/api/preferences")).json()).preferences).toMatchObject({
      interests: expect.arrayContaining(["science", "sports"]),
      preferred_region: "pk",
      reading_length: 5,
    });
  });

  test("More/Less feedback saves, recovers from failure, stays private, and Skip is neutral", async ({ context, page, baseURL }) => {
    const alice = await login("A", context, baseURL!);
    await page.goto("/paper");
    const firstStory = page.locator(".story-card").first();
    test.skip((await firstStory.count()) === 0, "A saved Edition with at least one Story is required.");

    const feedbackRequests: string[] = [];
    const submittedStoryIds: string[] = [];
    page.on("request", (request) => {
      if (request.url().endsWith("/api/feedback") && request.method() === "POST") {
        feedbackRequests.push(request.method());
        submittedStoryIds.push(request.postDataJSON().story_id);
      }
    });
    const more = firstStory.getByRole("button", { name: "More like this" });
    const failFirstSave = async (route: import("@playwright/test").Route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ error: "Temporary save failure." }) });
      } else await route.continue();
    };
    await page.route("**/api/feedback", failFirstSave);
    await more.click();
    await expect(firstStory.getByRole("alert")).toContainText("Temporary save failure");
    await page.unroute("**/api/feedback", failFirstSave);
    await more.click();
    await expect(firstStory.getByRole("status")).toContainText("Saved for a future Edition");
    await expect(more).toHaveAttribute("aria-pressed", "true");
    await more.click();
    await expect(firstStory.getByRole("status")).toContainText("Saved for a future Edition");
    expect(feedbackRequests).toHaveLength(3);

    await firstStory.getByRole("link", { name: /Skip to story|Finish reading/ }).click();
    expect(feedbackRequests).toHaveLength(3);
    await firstStory.getByRole("button", { name: "Less like this" }).click();
    await expect(firstStory.getByRole("status")).toContainText("Saved for a future Edition");
    expect(feedbackRequests).toHaveLength(4);
    await expect(firstStory.getByRole("button", { name: "Less like this" })).toHaveAttribute("aria-pressed", "true");
    const firstStoryTitle = await firstStory.locator(".story-title").textContent();
    await page.reload();
    const reloadedStory = page.locator(".story-card").filter({ hasText: firstStoryTitle || "" }).first();
    await expect(reloadedStory.getByRole("button", { name: "Less like this" })).toHaveAttribute("aria-pressed", "true");
    await expect(reloadedStory.getByRole("button", { name: "More like this" })).toHaveAttribute("aria-pressed", "false");

    const aliceId = (await alice.auth.getUser()).data.user!.id;
    const bob = await login("B");
    const bobCannotRead = await bob.from("story_feedback").select("reader_id,feedback").eq("reader_id", aliceId);
    expect(bobCannotRead.error).toBeNull();
    expect(bobCannotRead.data).toEqual([]);
    const bobCannotOverwrite = await bob.from("story_feedback").update({ feedback: "less" }).eq("reader_id", aliceId).select();
    expect(bobCannotOverwrite.error).toBeNull();
    expect(bobCannotOverwrite.data).toEqual([]);
    expect(submittedStoryIds.length).toBe(4);
    expect(new Set(submittedStoryIds).size).toBe(1);
  });
});
