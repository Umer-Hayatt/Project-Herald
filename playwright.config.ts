import { defineConfig, devices } from "@playwright/test";
import { assertIsolatedTestEnvironment } from "./tests/isolation";
try {
  process.loadEnvFile(".env.test.local");
} catch {
  /* The isolation guard below refuses to run without local configuration. */
}
assertIsolatedTestEnvironment(process.env);
// Controlled tests must not spend live provider quotas inherited from the shell.
for (const name of ["THENEWSAPI_TOKEN", "GNEWS_API_KEY", "NEWSDATA_API_KEY", "GEMINI_API_KEY"]) {
  process.env[name] = "";
}
process.env.GEMINI_PUBLIC_BRIEFINGS_ENABLED = "false";
process.env.GEMINI_AI_EDITOR_ENABLED = "false";
// Keyless providers must also be disabled; integration cases intercept the feed explicitly.
process.env.GLOBALVOICES_ENABLED = "false";
process.env.NASA_EARTH_ENABLED = "false";
process.env.NASA_EARTH_PUBLIC_REPORTING_ENABLED = "true";
process.env.GLOBALVOICES_PUBLIC_REPORTING_ENABLED = "true";
// Controlled reporting fixtures represent approved sources; live keys above are cleared.
process.env.THENEWSAPI_COMMERCIAL_APPROVED = "true";
process.env.GNEWS_COMMERCIAL_APPROVED = "true";
process.env.NEWSDATA_COMMERCIAL_APPROVED = "true";
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "off",
    screenshot: "off",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    {
      name: "phone",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
  ],
  webServer: {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: false,
        timeout: 120000,
      },
});
