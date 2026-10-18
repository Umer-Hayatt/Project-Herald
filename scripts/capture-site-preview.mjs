import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

async function capture() {
  mkdirSync("docs/evidence/screenshots", { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000...");
  await page.goto("http://localhost:3000", { waitUntil: "networkidle", timeout: 15000 });

  const title = await page.title();
  const headline = await page.locator("h1, h2").first().textContent();
  console.log("Page Title:", title);
  console.log("Lead Headline:", headline?.trim());

  // Capture desktop screenshot
  const screenshotPath = "docs/evidence/screenshots/homepage-desktop.png";
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Saved screenshot to ${screenshotPath}`);

  // Test mobile view
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileScreenshotPath = "docs/evidence/screenshots/homepage-mobile.png";
  await page.screenshot({ path: mobileScreenshotPath, fullPage: false });
  console.log(`Saved mobile screenshot to ${mobileScreenshotPath}`);

  await browser.close();
}

capture().catch((err) => {
  console.error("Screenshot capture failed:", err);
  process.exit(1);
});
