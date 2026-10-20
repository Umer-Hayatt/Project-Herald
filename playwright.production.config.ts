import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

// Inherit the database guard and controlled-provider environment before building.
export default defineConfig({
  ...config,
  webServer: {
    command: "npm run build && npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 180000,
  },
});
