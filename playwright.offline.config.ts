import { defineConfig } from "@playwright/test";

// No application environment, server or database credentials are loaded here.
export default defineConfig({
  testDir: "./tests",
  testMatch: ["offline/**/*.spec.ts", "story-processing.spec.ts", "recovery-r05.spec.ts", "recovery-r06.spec.ts"],
  workers: 1,
  reporter: "list",
});
