import { chromium } from "playwright";
import { mkdirSync, readFileSync } from "node:fs";
import { createServerClient } from "@supabase/ssr";

// Load environment variables from .env.local and .env.test.local
for (const envFile of [".env.local", ".env.test.local"]) {
  try {
    const lines = readFileSync(envFile, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  } catch {}
}

async function captureReaderPaper() {
  mkdirSync("docs/evidence/screenshots", { recursive: true });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const email = process.env.TEST_READER_A_EMAIL;
  const password = process.env.TEST_READER_A_PASSWORD;

  if (!email || !password) {
    console.error("Test reader credentials not configured in .env.test.local");
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });

  const cookieMap = new Map();
  const ssrClient = createServerClient(url, key, {
    cookies: {
      getAll: () => [],
      setAll: (cookies) => {
        cookies.forEach(({ name, value }) => cookieMap.set(name, value));
      },
    },
  });

  console.log(`Authenticating reader: ${email}...`);
  const { data: authData, error: authError } = await ssrClient.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    console.error("Authentication failed:", authError);
    await browser.close();
    process.exit(1);
  }
  console.log("Authentication successful, user ID:", authData.user.id);

  const cookiesToAdd = [...cookieMap].map(([name, value]) => ({
    name,
    value,
    url: "http://localhost:3000",
    sameSite: "Lax",
  }));
  await context.addCookies(cookiesToAdd);

  const page = await context.newPage();

  console.log("Navigating to http://localhost:3000/paper...");
  await page.goto("http://localhost:3000/paper", { waitUntil: "networkidle", timeout: 25000 });

  const title = await page.title();
  console.log("Paper Page Title:", title);

  const contentHeading = await page.locator("h1, h2").first().textContent();
  console.log("Main Heading:", contentHeading?.trim());

  // Check if onboarding or paper
  const urlNow = page.url();
  console.log("Current URL after navigation:", urlNow);

  const desktopPath = "docs/evidence/screenshots/paper-desktop.png";
  await page.screenshot({ path: desktopPath, fullPage: true });
  console.log(`Saved screenshot to ${desktopPath}`);

  // Test mobile view
  await page.setViewportSize({ width: 390, height: 844 });
  const mobilePath = "docs/evidence/screenshots/paper-mobile.png";
  await page.screenshot({ path: mobilePath, fullPage: true });
  console.log(`Saved mobile screenshot to ${mobilePath}`);

  await browser.close();
}

captureReaderPaper().catch((err) => {
  console.error("Failed to capture paper:", err);
  process.exit(1);
});
