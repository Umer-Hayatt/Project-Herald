import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { getReportingSupply } from "../src/lib/edition/news-supply.ts";

const env = readFileSync(".env.local", "utf8");
const testEnv = readFileSync(".env.test.local", "utf8");

const getVar = (content, name) => content.match(new RegExp(`${name}=(.+)`))?.[1]?.trim();

const url = getVar(env, "NEXT_PUBLIC_SUPABASE_URL");
const key = getVar(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const email = getVar(testEnv, "TEST_READER_A_EMAIL");
const password = getVar(testEnv, "TEST_READER_A_PASSWORD");

if (!url || !key || !email || !password) {
  console.error("Missing credentials in .env.local or .env.test.local");
  process.exit(1);
}

const supabase = createClient(url, key);
const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
if (authError) {
  console.error("Auth failed:", authError);
  process.exit(1);
}

console.log("Logged in as Reader A. Refreshing live supply via trusted ingestion coordinator...");
const supply = await getReportingSupply(supabase, { forceRefresh: true });
console.log(`Refreshed live supply! Total eligible articles in shared pool: ${supply.length}`);
