import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { appendFileSync } from "node:fs";
// Operator-only setup. Never add this admin key to the application deployment.
const adminKey = process.env.SUPABASE_TEST_ADMIN_KEY;
if (!adminKey) {
  console.error(
    "Set SUPABASE_TEST_ADMIN_KEY locally for the dedicated test allocation. This key must never be deployed or committed.",
  );
  process.exit(1);
}
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, adminKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
for (const label of ["A", "B"]) {
  const email =
    "herald-test-" + randomBytes(8).toString("hex") + "@example.com";
  const password = randomBytes(24).toString("base64url");
  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("Test account creation failed:", error.code);
    process.exit(1);
  }
  appendFileSync(
    ".env.test.local",
    "TEST_READER_" +
      label +
      "_EMAIL=" +
      email +
      "\nTEST_READER_" +
      label +
      "_PASSWORD=" +
      password +
      "\n",
  );
  console.log("Created disposable reader " + label + ": " + data.user.id);
}
