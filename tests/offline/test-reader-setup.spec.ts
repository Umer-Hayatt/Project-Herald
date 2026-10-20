import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

test("test-reader setup refuses a production target before making an authentication request", () => {
  const script = pathToFileURL(resolve("scripts/create-test-readers.mjs")).href;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", `
    globalThis.fetch = async () => {
      console.error("NETWORK_ATTEMPT_FORBIDDEN");
      throw new Error("NETWORK_ATTEMPT_FORBIDDEN");
    };
    await import(${JSON.stringify(script)});
  `], {
    encoding: "utf8",
    env: {
      ...process.env,
      NEXT_PUBLIC_SUPABASE_URL: "https://hnzwraiojsftuncridsp.supabase.co",
      SUPABASE_TEST_ADMIN_KEY: "test-only-not-a-credential",
    },
    timeout: 10000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Mutation tests require an isolated local Supabase database");
  expect(result.stderr).not.toContain("NETWORK_ATTEMPT_FORBIDDEN");
});

test("account capture refuses production before launching a browser", () => {
  const script = pathToFileURL(resolve("scripts/capture-account.mjs")).href;
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", `
    process.loadEnvFile = () => {};
    const { chromium } = await import("@playwright/test");
    chromium.launch = async () => { throw new Error("BROWSER_LAUNCH_FORBIDDEN"); };
    await import(${JSON.stringify(script)});
  `], {
    encoding: "utf8",
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: "https://hnzwraiojsftuncridsp.supabase.co" },
    timeout: 10000,
  });
  expect(result.status).toBe(1);
  expect(result.stderr).toContain("Mutation tests require an isolated local Supabase database");
  expect(result.stderr).not.toContain("BROWSER_LAUNCH_FORBIDDEN");
});
