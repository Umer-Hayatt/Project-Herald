import { test, expect } from "@playwright/test";
import { generateEditionPdf } from "../src/lib/edition/pdf";
import { getPublicSampleEdition } from "../src/lib/edition/sample";
import type { Edition } from "../src/lib/edition/types";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";

const sampleEdition: Edition = {
  id: "11111111-1111-4111-a111-111111111111",
  reader_id: "reader-user-123",
  edition_date: "2026-10-17",
  time_zone: "Asia/Karachi",
  reading_length: 10,
  estimated_reading_minutes: 8,
  word_count: 1450,
  selection_version: "v1-deterministic",
  status: "completed",
  created_at: "2026-10-17T08:00:00Z",
  stories: [
    {
      id: "story-1",
      edition_id: "11111111-1111-4111-a111-111111111111",
      position: 1,
      title: "Global Clean Energy Initiative Reaches Milestone With Record Solar Installations",
      excerpt: "Nations around the world have surpassed previous clean energy deployment benchmarks following international climate agreements. Rapid infrastructure investment in solar power and battery storage drove unprecedented grid integration across five continents.",
      briefing: "The saved Briefing reports new solar installations across five continents.",
      why_it_matters: "Grid investment connects new solar installations to existing transmission lines.",
      publisher: "Global Climate News",
      source_url: "https://example.com/clean-energy-milestone",
      published_at: "2026-10-16T14:30:00Z",
      category: "science",
      locale: "global",
      word_count: 520,
      section: "main",
      supporting_sources: [
        {
          title: "Clean Energy Market Report",
          url: "https://example.com/clean-energy-report",
          publisher: "Renewable Energy Watch",
        },
      ],
    },
    {
      id: "story-2",
      edition_id: "11111111-1111-4111-a111-111111111111",
      position: 2,
      title: "Breakthrough in Autonomous Robotics Shows Self-Adapting Controllers",
      excerpt: "Researchers unveil neural controllers capable of real-time physical adaptation to unexpected obstacles.",
      publisher: "Tech Dispatch",
      source_url: "https://example.com/robotics-breakthrough",
      published_at: "2026-10-16T18:00:00Z",
      category: "technology",
      locale: "us",
      word_count: 380,
      section: "main",
    },
    {
      id: "story-3",
      edition_id: "11111111-1111-4111-a111-111111111111",
      position: 3,
      title: "Ancient Irrigation System Rediscovered in Highland Valleys",
      excerpt: "Archaeological teams have mapped an extensive 2,000-year-old terraced water distribution network that kept remote communities resilient during severe historical droughts.",
      why_it_matters: "The discovery provides engineering insights for modern arid-climate water conservation.",
      publisher: "Archaeological Review",
      source_url: "https://example.com/ancient-irrigation",
      published_at: "2026-10-15T22:15:00Z",
      category: "history",
      locale: "global",
      word_count: 550,
      section: "beyond_bubble",
    },
  ],
};

test.describe("Seam 1: Edition PDF Generation Service", () => {
  test("generates newspaper-inspired PDF preserving all content, metadata, sections, and clickable links", async ({}, testInfo) => {
    const pdfBuffer = await generateEditionPdf(sampleEdition);
    await testInfo.attach("short-edition", { body: pdfBuffer, contentType: "application/pdf" });

    expect(Buffer.isBuffer(pdfBuffer)).toBe(true);
    expect(pdfBuffer.length).toBeGreaterThan(1000);

    // Verify PDF header magic bytes
    const pdfHeader = pdfBuffer.subarray(0, 5).toString("ascii");
    expect(pdfHeader).toBe("%PDF-");

    // Write temp file to inspect with Python pypdf / pdfplumber
    const tmpDir = path.join(process.cwd(), "tmp", "test-pdfs");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const tmpPdfPath = path.join(tmpDir, `test-herald-${Date.now()}.pdf`);
    fs.writeFileSync(tmpPdfPath, pdfBuffer);

    try {
      const scriptPath = path.join(process.cwd(), "scripts", "inspect-pdf.py");
      const output = execFileSync(process.env.HERALD_TEST_PYTHON || "python", [scriptPath, tmpPdfPath], {
        encoding: "utf-8",
      });
      const parsed = JSON.parse(output.trim());

      // 1. Verify Masthead and Date
      expect(parsed.full_text).toContain("HERALD");
      expect(parsed.full_text).toContain("Saturday, October 17, 2026");
      expect(parsed.full_text).toContain("8 min read");
      expect(parsed.full_text).toContain("1,450 words");

      // 2. Verify Sections
      expect(parsed.full_text).toContain("TODAY'S STORIES");
      expect(parsed.full_text).toContain("BEYOND YOUR BUBBLE");

      // 3. Verify Story Headlines & Excerpts
      expect(parsed.full_text).toContain("Global Clean Energy Initiative Reaches Milestone");
      expect(parsed.full_text).toContain("Breakthrough in Autonomous Robotics");
      expect(parsed.full_text).toContain("Ancient Irrigation System Rediscovered");
      expect(parsed.full_text).toContain("Archaeological teams have mapped an extensive 2,000-year-old");
      expect(parsed.full_text).toContain(sampleEdition.stories[0].briefing);
      expect(parsed.full_text).not.toContain("Nations around the world have surpassed");
      expect(parsed.full_text).toContain(sampleEdition.stories[0].why_it_matters);
      expect(parsed.full_text).toContain(sampleEdition.stories[2].why_it_matters);

      // 4. Verify Publishers
      expect(parsed.full_text).toContain("Global Climate News");
      expect(parsed.full_text).toContain("Tech Dispatch");
      expect(parsed.full_text).toContain("Archaeological Review");

      // 5. Verify Clickable Links
      expect(parsed.links).toContain("https://example.com/clean-energy-milestone");
      expect(parsed.links).toContain("https://example.com/clean-energy-report");
      expect(parsed.links).toContain("https://example.com/robotics-breakthrough");
      expect(parsed.links).toContain("https://example.com/ancient-irrigation");

      // 6. Verify Page numbering
      expect(parsed.full_text).toContain("Page 1 of");
    } finally {
      try {
        if (fs.existsSync(tmpPdfPath)) {
          fs.unlinkSync(tmpPdfPath);
        }
      } catch {
        // Safe cleanup on Windows
      }
    }
  });

  test("historical sample and multipage Edition retain every saved Story and source", async ({}, testInfo) => {
    const longEdition: Edition = {
      ...sampleEdition,
      stories: Array.from({ length: 8 }, (_, index) => ({
        ...sampleEdition.stories[index % 3], id: `long-${index}`, position: index + 1,
        section: index < 6 ? "main" as const : "beyond_bubble" as const,
        briefing: `${"This controlled saved report describes grid investment, public infrastructure, and the development discussed by its attributed sources. ".repeat(18)} End of saved Story ${index + 1}.`,
      })),
    };
    for (const [name, edition] of [["historical-sample", getPublicSampleEdition()], ["long-edition", longEdition]] as const) {
      const pdf = await generateEditionPdf(edition);
      const pdfPath = testInfo.outputPath(`${name}.pdf`);
      fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
      fs.writeFileSync(pdfPath, pdf);
      const parsed = JSON.parse(execFileSync(process.env.HERALD_TEST_PYTHON || "python", [
        path.join(process.cwd(), "scripts", "inspect-pdf.py"), pdfPath,
      ], { encoding: "utf8" }));
      const normalizedText = parsed.body_text.replace(/\s+/g, " ");
      if (edition.discovery_note) expect(normalizedText).toContain(edition.discovery_note);
      for (const story of edition.stories) {
        expect(normalizedText).toContain(story.title);
        expect(normalizedText).toContain((story.briefing || story.excerpt).replace(/\s+/g, " "));
        if (story.why_it_matters) expect(normalizedText).toContain(story.why_it_matters);
        expect(parsed.links).toContain(story.source_url);
      }
      if (name === "long-edition") expect(parsed.num_pages).toBeGreaterThan(1);
    }
  });
});
