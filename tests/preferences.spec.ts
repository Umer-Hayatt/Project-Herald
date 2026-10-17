import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { draft, login, testReadersConfigured } from "./helpers";
test("anonymous readers cannot open or change private preferences", async ({page,request,baseURL})=>{
 await page.goto("/paper"); await expect(page).toHaveURL(/\/login$/);
 await page.goto("/onboarding"); await expect(page).toHaveURL(/\/login$/);
 expect((await request.get("/api/preferences")).status()).toBe(401);
 expect((await request.put("/api/preferences",{headers:{origin:baseURL!},data:draft})).status()).toBe(401);
 const anon=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
 expect((await anon.from("reader_preferences").select("*")).error).not.toBeNull();
});
test.describe("persisted account journey",()=>{
 test.skip(!testReadersConfigured,"Disposable readers required in .env.test.local; authentication is never mocked.");
 test("saved progress survives reload, completion opens paper entry, sign-out protects it",async({context,page,baseURL})=>{
  await login("A",context,baseURL!);
  expect((await context.request.put("/api/preferences",{headers:{origin:baseURL!},data:draft})).ok()).toBeTruthy();
  await page.goto("/paper"); await expect(page).toHaveURL(/\/onboarding$/);
  await expect(page.getByLabel("Reading length",{exact:true})).toHaveValue("10");
  await page.getByLabel("Science",{exact:true}).check();
  await page.getByLabel("Preferred region",{exact:true}).selectOption("pk");
  await page.getByLabel("Reading length",{exact:true}).selectOption("5");
  await page.getByLabel("Your time zone",{exact:true}).fill("America/New_York");
  await page.getByRole("button",{name:"Save progress",exact:true}).click();
  await expect(page.getByRole("status")).toContainText("Progress saved");
  await page.reload(); await expect(page.getByLabel("Science",{exact:true})).toBeChecked();
  await expect(page.getByLabel("Preferred region",{exact:true})).toHaveValue("pk");
  await expect(page.getByLabel("Your time zone",{exact:true})).toHaveValue("America/New_York");
  await page.getByRole("button",{name:"Save and continue"}).click();
  await expect(page).toHaveURL(/\/paper$/); await page.reload();
  await expect(page.getByText("Pakistan",{exact:true})).toBeVisible();
  await expect(page.getByText("5 minutes",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Sign out",exact:true}).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto("/paper"); await expect(page).toHaveURL(/\/login$/);
 });
 test("invalid and forged input is rejected by the authenticated operation",async({context,baseURL})=>{
  await login("A",context,baseURL!);
  for(const invalid of [{...draft,onboarding_complete:true},{...draft,preferred_region:"unsupported"},{...draft,reading_length:7},{...draft,time_zone:"Not/AZone"},{...draft,interests:["invented"]},{...draft,reader_id:"forged"}]){
   expect((await context.request.put("/api/preferences",{headers:{origin:baseURL!},data:invalid})).status()).toBe(400);
  }
  expect((await context.request.put("/api/preferences",{headers:{origin:"https://unrelated.example"},data:draft})).status()).toBe(403);
 });
 test("another reader cannot read, overwrite, insert, or take ownership of private preferences",async({context,baseURL})=>{
  const alice=await login("A"),bob=await login("B");
  const aliceId=(await alice.auth.getUser()).data.user!.id,bobId=(await bob.auth.getUser()).data.user!.id;
  expect((await alice.from("reader_preferences").upsert({...draft,reader_id:aliceId,interests:["science"]})).error).toBeNull();
  expect((await bob.from("reader_preferences").upsert({...draft,reader_id:bobId,interests:["sports"]})).error).toBeNull();
  const read=await bob.from("reader_preferences").select("*").eq("reader_id",aliceId);
  expect(read.error).toBeNull(); expect(read.data).toEqual([]);
  const update=await bob.from("reader_preferences").update({reading_length:15}).eq("reader_id",aliceId).select();
  expect(update.error).toBeNull(); expect(update.data).toEqual([]);
  expect((await bob.from("reader_preferences").insert({...draft,reader_id:aliceId})).error).not.toBeNull();
  expect((await bob.from("reader_preferences").update({reader_id:aliceId}).eq("reader_id",bobId)).error).not.toBeNull();
  await login("B",context,baseURL!);
  expect((await (await context.request.get("/api/preferences?reader_id="+aliceId)).json()).preferences.interests).toEqual(["sports"]);
  expect((await alice.from("reader_preferences").select("reading_length").eq("reader_id",aliceId).single()).data?.reading_length).toBe(10);
 });
});

