import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
(async () => {
 const db = new PGlite();
 try {
 await db.exec(`create role anon; create role authenticated; create role service_role;
 create schema auth; create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
 create function auth.role() returns text language sql as $$select current_setting('request.jwt.claim.role', true)$$;
 create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('role', auth.role())$$;
 grant usage on schema public, auth to anon, authenticated, service_role;`);
 for (const name of ['20261017142000_editions_and_stories.sql','20261017162000_grounded_grouped_stories.sql','20261017180000_resilient_provider_limits.sql','20261018113500_trusted_ingestion.sql','20261019134923_server_only_reporting.sql']) {
   if (name === '20261019134923_server_only_reporting.sql') {
     // Reproduce the old permission hole with a genuinely signed-in reader.
     await db.exec("set role authenticated; select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false)");
     await db.query("insert into public.story_processing_cache(cache_key,payload) values ($1,'{}')", ['a'.repeat(64)]);
     await db.exec('reset role');
   }
   await db.exec(fs.readFileSync(new URL('../supabase/migrations/'+name, import.meta.url),'utf8'));
 }
 for (const role of ['anon','authenticated']) {
  await db.exec(`set role ${role}; select set_config('request.jwt.claim.role','${role}',false); select set_config('request.jwt.claim.sub','${role === 'authenticated' ? '11111111-1111-4111-8111-111111111111' : ''}',false);`);
  for (const query of ["select public.claim_reporting_refresh(true, 0)","select public.ingest_source_articles(null, '[]'::jsonb)","select public.finish_reporting_refresh(null, true)","insert into public.source_articles(external_id,title,url,publisher,published_at) values ('attack','Attack','https://news.test/attack','Attacker',now())"]) {
   await assert.rejects(db.query(query), /permission denied/);
  }
  await db.exec('reset role');
 }
 for (const role of ['anon', 'authenticated']) {
   await db.exec(`set role ${role}`);
   for (const query of ["select public.read_reporting_search('key')", "select public.save_reporting_search('key',null,'[]')", "select public.save_processed_stories('[]')", "insert into public.story_processing_cache(cache_key,payload,trusted_server) values ('attacker','{}',true)", "delete from public.story_processing_cache"]) {
     await assert.rejects(db.query(query), /permission denied/);
   }
   await db.exec('reset role');
 }
 await db.exec("select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false); set role authenticated; select set_config('request.jwt.claim.role','authenticated',false)");
 await assert.rejects(db.query("insert into public.story_processing_cache(cache_key,payload) values ('attacker','{}')"), /permission denied/);
 await assert.rejects(db.query("update public.story_processing_cache set trusted_server = true"), /permission denied/);
 await assert.rejects(db.query("select public.save_processed_stories('[]')"), /permission denied/);
 assert.equal((await db.query('select * from public.story_processing_cache')).rows.length, 0);
 await db.exec('reset role');
 await db.exec("set role service_role; select set_config('request.jwt.claim.role','service_role',false)");
 const processed = { briefing: 'Researchers tested a solar powered computer chip.', why_it_matters: 'The chip reduced energy use in laboratory tests.', topics: ['technology'], source: 'gemini' };
 await db.query('select public.save_processed_stories($1::jsonb)', [JSON.stringify([{cache_key: 'a'.repeat(64), payload: processed}])]);
 for (const payload of [null, '{}', 'null', '[{"cache_key":"bad","payload":{}}]']) {
   await assert.rejects(db.query('select public.save_processed_stories($1::jsonb)', [payload]), /Invalid processed stor/);
 }
 await db.query('select public.save_processed_stories($1::jsonb)', [JSON.stringify([{cache_key: 'a'.repeat(64), payload: {...processed, briefing: 'Do not replace a trusted entry.'}}])]);
 await db.exec("reset role; set role authenticated; select set_config('request.jwt.claim.role','authenticated',false)");
 assert.deepEqual((await db.query('select payload, trusted_server from public.story_processing_cache')).rows, [{payload: processed, trusted_server: true}]);
 await db.exec("reset role; set role service_role; select set_config('request.jwt.claim.role','service_role',false)");
 assert.equal((await db.query('select public.claim_reporting_refresh(true, 0) as token')).rows[0].token,null);
 const token = (await db.query('select public.claim_reporting_refresh(true, 5) as token')).rows[0].token;
 assert.ok(token);
 const searchKey = 'b'.repeat(64);
 await assert.rejects(db.query("select public.save_reporting_search($1,null,'[]')", [searchKey]), /Active reporting reservation required/);
 for (const [key, payload] of [[null, '[]'], [searchKey, null], [searchKey, '{}'], [searchKey, 'null'], ['bad-key', '[]']]) {
   await assert.rejects(db.query('select public.save_reporting_search($1,$2,$3::jsonb)', [key, token, payload]), /Invalid search cache payload/);
 }
 await db.query("select public.save_reporting_search($1,$2,'[]')", [searchKey, token]);
 assert.deepEqual((await db.query('select public.read_reporting_search($1) as articles', [searchKey])).rows[0].articles, []);
 const contenders = await Promise.all([db.query('select public.claim_reporting_refresh(true,1) as token'), db.query('select public.claim_reporting_refresh(true,1) as token')]);
 assert.ok(contenders.every(result => result.rows[0].token === null));
 const article={external_id:'isolated-report',title:'Isolated report',url:'https://news.test/report',publisher:'Test',published_at:new Date().toISOString()};
 assert.equal((await db.query('select public.ingest_source_articles($1, $2::jsonb) as count',[token,JSON.stringify([article])])).rows[0].count,1);
 assert.equal((await db.query('select public.finish_reporting_refresh($1,true) as done',[token])).rows[0].done,true);
 await assert.rejects(db.query('select public.ingest_source_articles($1,$2::jsonb)',[token,JSON.stringify([article])]),/Invalid or expired/);
 await assert.rejects(db.query("select public.save_reporting_search($1,$2,'[]')", [searchKey, token]), /Active reporting reservation required/);
 await db.exec('reset role');
 assert.equal((await db.query("select daily_request_count from public.reporting_cache_meta where id='news_supply'")).rows[0].daily_request_count, 5);
 await db.exec("update public.reporting_search_cache set expires_at=statement_timestamp() - interval '1 second'");
 await db.exec("set role service_role; select set_config('request.jwt.claim.role','service_role',false)");
 assert.equal((await db.query('select public.read_reporting_search($1) as articles', [searchKey])).rows[0].articles, null);
 const expiredToken = (await db.query('select public.claim_reporting_refresh(true,1) as token')).rows[0].token;
 await db.exec("reset role; update public.reporting_cache_meta set locked_at=statement_timestamp() - interval '61 seconds'; set role service_role");
 await assert.rejects(db.query("select public.save_reporting_search($1,$2,'[]')", [searchKey, expiredToken]), /Active reporting reservation required/);
 await db.exec('reset role');
 assert.equal((await db.query("select count(*)::int as count from public.source_articles")).rows[0].count,1);
 console.log('PASS: legacy reader cache exploit reproduced before repair; reader writes/RPCs denied after repair; trusted server cache persistence/read/immutability; invalid payload denial; search reuse/expiry/reservations; server ingestion; failed/competing reservations do not spend calls. Isolated embedded PostgreSQL only.');
 } finally { await db.close(); }
})().catch(e=>{console.error(e);process.exitCode=1});
