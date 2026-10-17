import { chromium } from "@playwright/test";
import { createServerClient } from "@supabase/ssr";
import { mkdirSync, writeFileSync } from "node:fs";
process.loadEnvFile(".env.local");
process.loadEnvFile(".env.test.local");
const base = process.env.CAPTURE_BASE_URL || "http://localhost:3001";
const directory = ".impeccable/review";
mkdirSync(directory, { recursive: true });
const results = [];
const browser = await chromium.launch();
try {
  for (const [name, viewport] of [
    ["desktop", { width: 1440, height: 1000 }],
    ["mobile", { width: 390, height: 844 }],
  ]) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    let pageErrors = 0;
    page.on("pageerror", () => pageErrors++);
    async function capture(route, suffix) {
      await page.goto(base + route);
      await page.locator("main h1").waitFor();
      await page.evaluate(async () => {
        await document.fonts.ready;
      });
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      await page.screenshot({
        path: directory + "/" + name + "-" + suffix + ".png",
        fullPage: true,
      });
      results.push({ viewport: name, surface: suffix, overflow, pageErrors });
    }
    await capture("/", "landing");
    await capture("/login", "login");
    await page.keyboard.press("Tab");
    if ((await page.locator(":focus").innerText()) !== "Skip to content")
      throw Error("Keyboard skip link unavailable");
    const values = new Map();
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: () => [],
          setAll: (items) =>
            items.forEach(({ name, value }) => values.set(name, value)),
        },
      },
    );
    const { data, error } = await client.auth.signInWithPassword({
      email: process.env.TEST_READER_A_EMAIL,
      password: process.env.TEST_READER_A_PASSWORD,
    });
    if (error) throw Error("Disposable reader sign-in failed");
    await context.addCookies(
      [...values].map(([name, value]) => ({
        name,
        value,
        url: base,
        sameSite: "Lax",
      })),
    );
    const preferences = {
      reader_id: data.user.id,
      interests: ["science", "technology"],
      preferred_region: "pk",
      reading_length: 10,
      time_zone: "Asia/Karachi",
      onboarding_complete: false,
    };
    const saved = await client.from("reader_preferences").upsert(preferences);
    if (saved.error) throw Error("Test preferences save failed");
    await capture("/onboarding", "onboarding");
    await client
      .from("reader_preferences")
      .upsert({ ...preferences, onboarding_complete: true });
    await capture("/paper", "paper");
    await context.close();
  }
} finally {
  await browser.close();
}
writeFileSync(
  directory + "/capture-results.json",
  JSON.stringify(results, null, 2) + "\n",
);
console.log(JSON.stringify(results, null, 2));
