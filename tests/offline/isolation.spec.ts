import { test, expect } from "@playwright/test";
import { assertIsolatedTestEnvironment } from "../isolation";

test("mutation tests reject a hosted production database before authentication", () => {
  expect(() => assertIsolatedTestEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "https://hnzwraiojsftuncridsp.supabase.co",
  })).toThrow(/isolated local/);
});

test("mutation tests require a local application and a local database", () => {
  expect(() => assertIsolatedTestEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
    TEST_BASE_URL: "https://project-herald-pink.vercel.app",
  })).toThrow(/local application/);
  expect(() => assertIsolatedTestEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321", TEST_BASE_URL: "http://localhost:3000",
  })).toThrow(/local application/);
  expect(() => assertIsolatedTestEnvironment({
    NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
  })).not.toThrow();
});
