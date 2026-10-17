import { defineConfig, devices } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());
try { process.loadEnvFile(".env.test.local"); } catch { /* Live tests skip without disposable accounts. */ }
export default defineConfig({ testDir: "./tests", fullyParallel: false, workers: 1, retries: 0, reporter: "list", use: { baseURL: process.env.TEST_BASE_URL || "http://localhost:3000", trace: "off", screenshot: "off" }, projects: [{ name: "desktop", use: { ...devices["Desktop Chrome"] } }, { name: "phone", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } }], webServer: process.env.TEST_BASE_URL ? undefined : { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: !process.env.CI, timeout: 120000 } });


