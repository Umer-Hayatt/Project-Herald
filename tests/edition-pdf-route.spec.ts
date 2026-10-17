import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import type { SourceArticle } from "../src/lib/edition/types";

const mockSupply: SourceArticle[] = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d491",
    external_id: "test-supply-pdf-1",
    title: "Global Clean Energy Initiative Reaches Milestone",
    description: "Nations agree on new solar investments.",
    snippet: "International summit establishes ambitious solar targets for 2030.",
    url: "https://example.com/clean-energy-pdf",
    image_url: null,
    publisher: "Global Climate News",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["science", "general"],
    locale: "global",
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d492",
    external_id: "test-supply-pdf-2",
    title: "Autonomous Robotics Breakthrough",
    description: "New controllers demonstrate adaptive learning.",
    snippet: "Robotics researchers unveil neural controllers capable of rapid adaptation.",
    url: "https://example.com/robotics-pdf",
    image_url: null,
    publisher: "Tech Dispatch",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["technology"],
    locale: "us",
  },
];

test.describe("Seam 2: Authenticated PDF Download Route", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("enforces authentication, owner isolation, proper headers, and downloads snapshot PDF", async ({
    browser,
    baseURL,
  }) => {
    const contextA = await browser.newContext();
    const supabaseA = await login("A", contextA, baseURL);

    const contextB = await browser.newContext();
    await login("B", contextB, baseURL);

    const {
      data: { user: userA },
    } = await supabaseA.auth.getUser();

    expect(userA).not.toBeNull();

    // 1. Ensure Reader A has an onboarding preference
    await supabaseA.from("reader_preferences").upsert({
      reader_id: userA!.id,
      interests: ["science", "technology"],
      preferred_region: "global",
      reading_length: 10,
      time_zone: "Asia/Karachi",
      onboarding_complete: true,
    });

    // 2. Ensure Reader A has a completed Edition
    const resultA = await getOrCreateDailyEdition(supabaseA, userA!.id, {
      controlledSupply: mockSupply,
    });
    expect(resultA.success).toBe(true);
    if (!resultA.success) return;
    const editionA = resultA.edition;

    // 3. Anonymous request should be rejected (401)
    const anonContext = await browser.newContext();
    const anonRes = await anonContext.request.get(`/api/editions/${editionA.id}/pdf`);
    expect(anonRes.status()).toBe(401);
    await anonContext.close();

    // 4. Reader B accessing Reader A's edition should return 404 (not found / isolated)
    const crossReaderRes = await contextB.request.get(`/api/editions/${editionA.id}/pdf`);
    expect(crossReaderRes.status()).toBe(404);

    // 5. Reader A accessing their own edition should succeed (200)
    const ownerRes = await contextA.request.get(`/api/editions/${editionA.id}/pdf`);
    expect(ownerRes.status()).toBe(200);

    // Verify headers
    const contentType = ownerRes.headers()["content-type"];
    expect(contentType).toContain("application/pdf");

    const contentDisposition = ownerRes.headers()["content-disposition"];
    expect(contentDisposition).toContain("attachment");
    expect(contentDisposition).toContain(`filename="Herald-${editionA.edition_date}.pdf"`);

    const cacheControl = ownerRes.headers()["cache-control"];
    expect(cacheControl).toContain("private");
    expect(cacheControl).toContain("no-store");

    // Verify body is a valid PDF
    const bodyBuffer = await ownerRes.body();
    expect(bodyBuffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(bodyBuffer.length).toBeGreaterThan(1000);

    await contextA.close();
    await contextB.close();
  });
});
