import { test, expect } from "@playwright/test";
import { login, testReadersConfigured } from "./helpers";
import { getOrCreateDailyEdition } from "../src/lib/edition/service";
import type { SourceArticle } from "../src/lib/edition/types";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const mockSupply: SourceArticle[] = [
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    external_id: "test-supply-browser-pdf-1",
    title: "Global Clean Energy Initiative Reaches Milestone",
    description: "Nations agree on new solar investments.",
    snippet: "International summit establishes ambitious solar energy targets for 2030.",
    url: "https://example.com/clean-energy-summit",
    image_url: null,
    publisher: "Global Climate News",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["science", "general"],
    locale: "global",
  },
  {
    id: "f47ac10b-58cc-4372-a567-0e02b2c3d480",
    external_id: "test-supply-browser-pdf-2",
    title: "Breakthrough in Autonomous Robotics",
    description: "New models demonstrate adaptive learning.",
    snippet: "Robotics researchers unveil neural controllers capable of rapid adaptation.",
    url: "https://example.com/robotics-breakthrough",
    image_url: null,
    publisher: "Tech Dispatch",
    published_at: new Date().toISOString(),
    language: "en",
    categories: ["technology"],
    locale: "us",
  },
];

test.describe("Seam 3: Web UI Download Experience", () => {
  test.skip(!testReadersConfigured, "Test readers required in .env.test.local");

  test("downloads matching PDF on today's edition, past archive edition, and handles retryable errors", async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(60000);
    // 1. Authenticate reader
    const supabase = await login("A", context, baseURL!);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    expect(user).not.toBeNull();

    // 2. Ensure reader is onboarded
    await context.request.put("/api/preferences", {
      headers: { origin: baseURL! },
      data: {
        interests: ["general", "science", "technology"],
        preferred_region: "global",
        reading_length: 10,
        time_zone: "Asia/Karachi",
        onboarding_complete: true,
      },
    });

    // 3. Create a clean past archive edition for testing past download
    const pastDate = "2026-10-13";
    await supabase
      .from("editions")
      .delete()
      .eq("reader_id", user!.id)
      .eq("edition_date", pastDate);

    const pastResult = await getOrCreateDailyEdition(supabase, user!.id, {
      controlledDate: pastDate,
      controlledSupply: mockSupply,
    });
    expect(pastResult.success).toBe(true);
    if (!pastResult.success) return;
    const pastEdition = pastResult.edition;

    // 4. Navigate to /paper (Today's paper)
    await page.goto("/paper");
    await expect(page.locator("h1.edition-date-headline")).toBeVisible();

    // Verify Download PDF button is visible and accessible on /paper
    const downloadBtn = page.getByRole("button", {
      name: /Download newspaper PDF/i,
    });
    await expect(downloadBtn).toBeVisible();

    // Test actual file download on /paper
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      downloadBtn.click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^Herald-\d{4}-\d{2}-\d{2}\.pdf$/);

    // Save and verify PDF content
    const tmpDir = path.join(process.cwd(), "tmp", "browser-downloads");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const downloadPath = path.join(tmpDir, download.suggestedFilename());
    await download.saveAs(downloadPath);

    const pdfBytes = fs.readFileSync(downloadPath);
    expect(pdfBytes.subarray(0, 5).toString("ascii")).toBe("%PDF-");
    expect(pdfBytes.length).toBeGreaterThan(1000);

    // Verify content extraction with Python inspect script
    const scriptPath = path.join(process.cwd(), "scripts", "inspect-pdf.py");
    const output = execSync(`python "${scriptPath}" "${downloadPath}"`, {
      encoding: "utf-8",
    });
    const parsed = JSON.parse(output.trim());
    expect(parsed.full_text).toContain("HERALD");
    expect(parsed.links.length).toBeGreaterThan(0);

    // Clean up downloaded file
    try {
      fs.unlinkSync(downloadPath);
    } catch {
      // Safe cleanup
    }

    // 5. Navigate to /archive/[id] for past edition and test download
    await page.goto(`/archive/${pastEdition.id}`);
    await expect(page.locator("h1.edition-date-headline")).toBeVisible();

    const archiveDownloadBtn = page.getByRole("button", {
      name: /Download newspaper PDF/i,
    });
    await expect(archiveDownloadBtn).toBeVisible();

    const [archiveDownload] = await Promise.all([
      page.waitForEvent("download"),
      archiveDownloadBtn.click(),
    ]);
    expect(archiveDownload.suggestedFilename()).toBe(`Herald-${pastDate}.pdf`);

    // 6. Test Error Handling and Retry
    // Mock the PDF route to simulate server failure
    await page.route(`**/api/editions/${pastEdition.id}/pdf`, async (route) => {
      await route.fulfill({
        status: 500,
        body: "Internal error generating PDF",
      });
    });

    await archiveDownloadBtn.click();

    // Error alert should appear
    const errorAlert = page.locator(".pdf-download-error");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/Failed to generate newspaper PDF/i);

    // Unroute to restore normal operation and test Retry
    await page.unroute(`**/api/editions/${pastEdition.id}/pdf`);
    const retryBtn = page.locator(".retry-link");
    await expect(retryBtn).toBeVisible();

    const [retriedDownload] = await Promise.all([
      page.waitForEvent("download"),
      retryBtn.click(),
    ]);
    expect(retriedDownload.suggestedFilename()).toBe(`Herald-${pastDate}.pdf`);
  });
});
