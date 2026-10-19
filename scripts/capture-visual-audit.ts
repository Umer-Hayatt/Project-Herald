import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
try {
  process.loadEnvFile(".env.test.local");
} catch {}

import { chromium } from "@playwright/test";
import path from "path";
import { login } from "../tests/helpers";

const ARTIFACTS_DIR = "C:/Users/HP/.gemini/antigravity-ide/brain/2484eac2-8813-406c-b968-753c26e62f23";

async function captureAudit() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const page = await context.newPage();

  console.log("1. Capturing Homepage (http://localhost:3000)...");
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "live_homepage.png"),
    fullPage: true,
  });

  console.log("2. Capturing Public Sample Page (http://localhost:3000/sample)...");
  await page.goto("http://localhost:3000/sample", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "live_sample_page.png"),
    fullPage: true,
  });

  console.log("3. Capturing Login Page (http://localhost:3000/login)...");
  await page.goto("http://localhost:3000/login", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(ARTIFACTS_DIR, "live_login_page.png"),
    fullPage: true,
  });

  console.log("4. Authenticating Reader A and Capturing Paper (http://localhost:3000/paper)...");
  try {
    await login("A", context, "http://localhost:3000");
    await page.goto("http://localhost:3000/paper", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000);
    await page.screenshot({
      path: path.join(ARTIFACTS_DIR, "live_paper_page.png"),
      fullPage: true,
    });
    console.log("Paper page captured successfully.");
  } catch (err) {
    console.log("Could not capture authenticated paper page:", err);
  }

  await browser.close();
  console.log("Visual audit capture completed!");
}

captureAudit().catch((err) => {
  console.error("Visual audit failed:", err);
  process.exit(1);
});
