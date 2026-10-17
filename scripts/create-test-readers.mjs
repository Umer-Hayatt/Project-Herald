import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
for (const label of ["A", "B"]) {
 const email = "herald-test-" + randomBytes(8).toString("hex") + "@example.com";
 const password = randomBytes(24).toString("base64url");
 const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
 const { data, error } = await client.auth.signUp({ email, password });
 if (error) { console.error("Test account creation failed:", error.code); process.exit(1); }
 appendFileSync(".env.test.local", "TEST_READER_" + label + "_EMAIL=" + email + "\nTEST_READER_" + label + "_PASSWORD=" + password + "\n");
 console.log("Created test reader " + label + ": " + data.user.id);
}
