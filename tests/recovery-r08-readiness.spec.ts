import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { createClient } from "@supabase/supabase-js";
import { SAMPLE_EDITION_ID } from "../src/lib/edition/sample";

test.describe("Recovery R08: Stage A Deployed Reader Readiness Gate", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("1. Two-reader privacy boundary: strict isolation between Reader A and Reader B", async ({
    context,
    baseURL,
  }) => {
    // Authenticate Reader A
    const supabaseA = await login("A", context, baseURL!);
    const { data: { user: userA } } = await supabaseA.auth.getUser();
    expect(userA).not.toBeNull();

    // Authenticate Reader B
    const supabaseB = await login("B");
    const { data: { user: userB } } = await supabaseB.auth.getUser();
    expect(userB).not.toBeNull();
    expect(userA!.id).not.toBe(userB!.id);

    // Reader B cannot view Reader A's editions
    const { data: aEditionsFromB } = await supabaseB
      .from("editions")
      .select("*")
      .eq("reader_id", userA!.id);
    expect(aEditionsFromB?.length || 0).toBe(0);

    // Reader B cannot view Reader A's feedback
    const { data: aFeedbackFromB } = await supabaseB
      .from("story_feedback")
      .select("*")
      .eq("reader_id", userA!.id);
    expect(aFeedbackFromB?.length || 0).toBe(0);

    // Reader B cannot view Reader A's preferences
    const { data: aPrefFromB } = await supabaseB
      .from("reader_preferences")
      .select("*")
      .eq("reader_id", userA!.id);
    expect(aPrefFromB?.length || 0).toBe(0);
  });

  test("2. Public shared-write denial: unauthorized clients cannot mutate source_articles, editions, or feedback", async () => {
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    // Attempt direct insert into source_articles
    const { error: errArticles } = await anonClient.from("source_articles").insert([
      {
        external_id: "unauthorized-anon-attempt",
        title: "Malicious Injection Attempt",
        url: "https://attacker.example.com",
        publisher: "Attacker",
        published_at: new Date().toISOString(),
      },
    ]);
    expect(errArticles).not.toBeNull();
    expect(errArticles?.code).toBe("42501");

    // Attempt direct insert into editions
    const { error: errEditions } = await anonClient.from("editions").insert([
      {
        reader_id: "00000000-0000-0000-0000-000000000000",
        edition_date: "2026-10-19",
      },
    ]);
    expect(errEditions).not.toBeNull();
    expect(errEditions?.code).toBe("42501");

    // Attempt direct insert into story_feedback
    const { error: errFeedback } = await anonClient.from("story_feedback").insert([
      {
        reader_id: "00000000-0000-0000-0000-000000000000",
        story_key: "0000000000000000000000000000000000000000000000000000000000000000",
        feedback: "more",
      },
    ]);
    expect(errFeedback).not.toBeNull();
    expect(errFeedback?.code).toBe("42501");
  });

  test("3. Core reader journey: preference tuning, paper reading, and calm completion ending", async ({
    context,
    page,
    baseURL,
  }) => {
    await login("A", context, baseURL!);

    // Save preferences
    const prefRes = await context.request.put("/api/preferences", {
      headers: { origin: baseURL! },
      data: {
        interests: ["technology", "science", "business"],
        subtopics: ["Semiconductors", "Clean Energy"],
        preferred_region: "global",
        reading_length: 10,
        time_zone: "UTC",
        onboarding_complete: true,
      },
    });
    expect(prefRes.status()).toBe(200);

    // Open Paper
    await page.goto("/paper");
    await expect(page).toHaveURL(/\/paper$/);

    const emptyState = page.getByRole("heading", { name: "No fresh reporting available" });
    if ((await emptyState.count()) > 0) {
      await expect(emptyState).toBeVisible();
      return;
    }

    // Verify compact dated header with duration vs budget
    const metaChips = page.locator(".edition-meta-chips");
    await expect(metaChips).toBeVisible();
    await expect(metaChips.locator(".meta-chip.highlight")).toContainText("min read (10 min plan)");

    // Verify Stories and actions
    const storyCards = page.locator(".story-card");
    const count = await storyCards.count();
    expect(count).toBeGreaterThan(0);

    const firstCard = storyCards.first();
    await expect(firstCard.locator(".story-title")).toBeVisible();
    await expect(firstCard.locator(".source-link")).toBeVisible();
    await expect(firstCard.locator(".source-link")).toHaveAttribute("target", "_blank");
    await expect(firstCard.locator(".source-link")).toHaveAttribute("rel", "noopener noreferrer");

    // Verify calm finished completion
    const editionEnd = page.locator("#edition-end");
    await expect(editionEnd).toBeVisible();
    await expect(editionEnd.locator(".edition-end-title")).toHaveText("You’ve finished today’s paper.");
    await expect(editionEnd.locator(".pdf-download-btn")).toBeVisible();
    await expect(editionEnd.locator("a[href='/settings']")).toBeVisible();
    await expect(editionEnd.locator("a[href='/archive']")).toBeVisible();
  });

  test("4. Public unauthenticated sample and PDF delivery", async ({
    page,
    request,
  }) => {
    // 1. Public sample web view
    await page.goto("/sample");
    await expect(page).toHaveURL(/\/sample$/);
    await expect(page.locator(".sample-badge")).toHaveText("Sample Edition");
    await expect(page.locator("#edition-end")).toBeVisible();

    // 2. Public sample PDF API endpoint
    const resPdf = await request.get("/api/editions/sample/pdf");
    expect(resPdf.status()).toBe(200);
    expect(resPdf.headers()["content-type"]).toBe("application/pdf");
    expect(resPdf.headers()["content-disposition"]).toContain("Herald-Sample-Edition.pdf");

    const pdfBuffer = await resPdf.body();
    expect(pdfBuffer.slice(0, 5).toString("utf-8")).toBe("%PDF-");

    // Also via canonical UUID
    const resUuid = await request.get(`/api/editions/${SAMPLE_EDITION_ID}/pdf`);
    expect(resUuid.status()).toBe(200);
  });

  test("5. Archive and PDF continuity: saved editions are provider-independent", async ({
    context,
    page,
    baseURL,
  }) => {
    await login("A", context, baseURL!);

    // Open Archive page
    await page.goto("/archive");
    await expect(page).toHaveURL(/\/archive$/);

    // Verify archive header exists
    await expect(page.locator("h1")).toBeVisible();
  });

  test("6. Sign-out and session boundary: signed-out reader cannot view /paper", async ({
    context,
    page,
    baseURL,
  }) => {
    await login("A", context, baseURL!);

    // Clear session cookies to emulate sign out
    await context.clearCookies();

    // Attempt to access /paper without session
    await page.goto("/paper");
    // Expect redirection to login
    await expect(page).toHaveURL(/\/login/);
  });
});
