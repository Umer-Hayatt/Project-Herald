import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { buildReportingRollout, reportingPreflightSql } from './reporting-rollout.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
assert.ok(process.env.HERALD_ROLLOUT_INVENTORY, 'Provide the private SELECT-only catalog snapshot');
assert.ok(process.env.HERALD_ROLLOUT_LEDGER, 'Provide the private four-row ledger snapshot');
const observed = JSON.parse(fs.readFileSync(process.env.HERALD_ROLLOUT_INVENTORY, 'utf8'));
const ledger = JSON.parse(fs.readFileSync(process.env.HERALD_ROLLOUT_LEDGER, 'utf8'));
const inventorySql = fs.readFileSync(new URL('./inspect-reporting-schema.sql', import.meta.url), 'utf8');
const query = inventorySql.slice(inventorySql.indexOf('select jsonb_build_object('), inventorySql.indexOf(') as inventory;') + ') as inventory'.length);
const db = new PGlite();
const normalize = value => value.replace(/--[^\n]*/g, '').replace(/\s+/g, ' ').trim();
const stable = value => JSON.stringify(value);
const sort = rows => rows.map(stable).sort();
try {
  await db.exec(`create role anon; create role authenticated; create role service_role;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
    create function auth.role() returns text language sql as $$select current_setting('request.jwt.claim.role', true)$$;
    create function auth.jwt() returns jsonb language sql as $$select jsonb_build_object('role', auth.role())$$;
    grant usage on schema public, auth to anon, authenticated, service_role;`);
  const files = fs.readdirSync(root + '/supabase/migrations').sort();
  const corrective = files.pop();
  assert.equal(corrective, '20261019134923_server_only_reporting.sql');
  for (const file of files) await db.exec(fs.readFileSync(root + '/supabase/migrations/' + file, 'utf8'));
  const baseline = (await db.query(query)).rows[0].inventory;
  const columns = inv => inv.columns.map(c => [c.table_name,c.column_name,c.udt_name,c.is_nullable,c.column_default]);
  assert.deepEqual(sort(columns(baseline)), sort(columns(observed)), 'Historical column definitions differ');
  assert.deepEqual(sort(baseline.tables), sort(observed.tables), 'Historical RLS differs');
  // PG18 catalogs NOT NULL as constraints; column nullability is compared separately.
  const constraints = inv => inv.constraints.filter(c => !c.definition.startsWith('NOT NULL ')).map(c => [c.table,c.name,normalize(c.definition)]);
  assert.deepEqual(sort(constraints(baseline)), sort(constraints(observed)), 'Historical constraints differ');
  const indexes = inv => inv.indexes.map(i => [i.tablename,i.indexname,normalize(i.indexdef)]);
  assert.deepEqual(sort(indexes(baseline)), sort(indexes(observed)), 'Historical indexes differ');
  assert.deepEqual(baseline.triggers, observed.triggers, 'Historical triggers differ');
  const functions = inv => inv.functions.map(f => [f.name,f.arguments,normalize(f.definition)]);
  assert.deepEqual(sort(functions(baseline)),sort(functions(observed)), 'Historical function definitions differ');
  const changedFunctionGrants = observed.functions.filter(f => {
    const old = baseline.functions.find(b => b.name === f.name && b.arguments === f.arguments);
    return ['anon_execute','reader_execute','server_execute'].some(key => f[key] !== old[key]);
  }).map(f => ({ name:f.name, arguments:f.arguments, anon_execute:f.anon_execute,reader_execute:f.reader_execute,server_execute:f.server_execute }));
  // Reproduce observed policy names and grants, rather than assuming the clean-chain variants.
  const quote = text => '"' + text.replaceAll('"','""') + '"';
  for (const p of baseline.policies) await db.exec(`drop policy ${quote(p.policyname)} on public.${quote(p.tablename)}`);
  for (const p of observed.policies) await db.exec(`create policy ${quote(p.policyname)} on public.${quote(p.tablename)} as ${p.permissive} for ${p.cmd} to ${p.roles.map(r => r === 'public' ? 'public' : quote(r)).join(',')} ${p.qual ? `using (${p.qual})` : ''} ${p.with_check ? `with check (${p.with_check})` : ''}`);
  for (const t of observed.tables) await db.exec(`revoke all on public.${quote(t.name)} from public,anon,authenticated,service_role`);
  for (const g of observed.table_grants) await db.exec(`grant ${g.privilege_type} on public.${quote(g.table_name)} to ${g.grantee === 'PUBLIC' ? 'public' : quote(g.grantee)}`);
  for (const f of observed.functions) {
    const identity = f.name + '(' + f.arguments + ')';
    await db.exec(`revoke all on function public.${identity} from public,anon,authenticated,service_role`);
    for (const [role,key] of [['anon','anon_execute'],['authenticated','reader_execute'],['service_role','server_execute']]) if (f[key]) await db.exec(`grant execute on function public.${identity} to ${role}`);
  }
  await db.exec(`insert into auth.users values ('11111111-1111-4111-8111-111111111111');
    insert into source_articles(id,external_id,title,url,publisher,published_at,raw_data) values ('22222222-2222-4222-8222-222222222222','rehearsal-source','Preserved source','https://example.org/fixture','Fixture',now(),'{"output_use":"internal_testing"}');
    insert into editions(id,reader_id,edition_date,time_zone,reading_length,discovery_note) values ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111','2026-10-22','UTC',10,'Preserved discovery note');
    insert into edition_stories(edition_id,reader_id,position,title,excerpt,publisher,source_url,published_at,category,source_article_id,supporting_sources) values ('33333333-3333-4333-8333-333333333333','11111111-1111-4111-8111-111111111111',1,'Preserved Story','Preserved excerpt','Fixture','https://example.org/fixture',now(),'science','22222222-2222-4222-8222-222222222222','[{"url":"https://example.org/fixture","publisher_excerpt":"Preserved original evidence"}]');
    insert into story_processing_cache(cache_key,payload) values (repeat('a',64),'{}');`);
  const snapshots = async () => (await db.query(`select jsonb_build_object('sources',(select jsonb_agg(to_jsonb(s)) from source_articles s),'editions',(select jsonb_agg(to_jsonb(e)) from editions e),'stories',(select jsonb_agg(to_jsonb(s)) from edition_stories s)) as saved`)).rows[0].saved;
  const before = await snapshots();
  const sql = fs.readFileSync(root + '/supabase/migrations/' + corrective,'utf8');
  await db.exec('create schema supabase_migrations; create table supabase_migrations.schema_migrations(version text primary key,name text,statements text[])');
  for (const row of ledger) await db.query('insert into supabase_migrations.schema_migrations values ($1,$2,$3)', [row.version,row.name,row.statements]);
  const beforeLedger = (await db.query('select * from supabase_migrations.schema_migrations order by version')).rows;
  const preflight = { ...(await db.query(reportingPreflightSql)).rows[0], project_ref:'hnzwraiojsftuncridsp' };
  const wrongCatalog = buildReportingRollout({ ...preflight,catalog_md5:'0'.repeat(32) });
  await assert.rejects(db.transaction(tx => tx.exec(wrongCatalog)), /catalog changed/i, 'A stale catalog must refuse the correction');
  assert.deepEqual(await snapshots(),before);
  assert.deepEqual((await db.query('select * from supabase_migrations.schema_migrations order by version')).rows,beforeLedger);
  const rollout = buildReportingRollout(preflight);
  await db.query("update supabase_migrations.schema_migrations set statements=array['unexpected history change'] where version=$1",[ledger[0].version]);
  await assert.rejects(db.transaction(tx => tx.exec(rollout)),/ledger changed/i);
  await db.query('update supabase_migrations.schema_migrations set statements=$1 where version=$2',[ledger[0].statements,ledger[0].version]);
  assert.deepEqual((await db.query('select * from supabase_migrations.schema_migrations order by version')).rows,beforeLedger);
  // A migration runner must commit DDL and its new history row together; simulate a ledger-write failure.
  await assert.rejects(db.transaction(async tx => {
    await tx.exec(rollout);
    await tx.query('insert into supabase_migrations.schema_migrations values ($1,$2,$3)',[ledger[0].version,'injected_failure',[rollout]]);
  }),/duplicate key/);
  assert.equal((await db.query(reportingPreflightSql)).rows[0].catalog_md5,preflight.catalog_md5,'Failed ledger insert must roll back all DDL/grants');
  assert.deepEqual(await snapshots(),before);
  assert.deepEqual((await db.query('select * from supabase_migrations.schema_migrations order by version')).rows,beforeLedger);
  // This version is local test data, not an assigned production migration version.
  const localVersion = '20261023190000';
  await db.transaction(async tx => {
    await tx.exec(rollout);
    await tx.query('insert into supabase_migrations.schema_migrations values ($1,$2,$3)',[localVersion,'server_only_reporting_guarded',[rollout]]);
  });
  const afterLedger = (await db.query('select * from supabase_migrations.schema_migrations order by version')).rows;
  assert.deepEqual(afterLedger.filter(row => row.version !== localVersion),beforeLedger);
  assert.equal(afterLedger.length,5);
  await assert.rejects(db.transaction(tx => tx.exec(rollout)),/catalog changed/i,'A completed non-idempotent correction must not replay');
  assert.deepEqual(await snapshots(),before,'Saved data changed');
  assert.equal((await db.query('select trusted_server from story_processing_cache')).rows[0].trusted_server,false);
  assert.equal((await db.query("select to_regprocedure('public.claim_reporting_refresh(boolean)') as old")).rows[0].old,null);
  for (const role of ['anon','authenticated']) {
    await db.exec(`set role ${role}; select set_config('request.jwt.claim.role','${role}',false); select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',false);`);
    for (const sql of ["select public.claim_reporting_refresh(true,1)","select public.ingest_source_articles(null,'[]')","select public.finish_reporting_refresh(null,true)","select public.read_reporting_search('x')","select public.save_reporting_search('x',null,'[]')","select public.save_processed_stories('[]')","insert into source_articles(external_id,title,url,publisher,published_at) values ('attack','Attack','https://example.org/attack','Fixture',now())","insert into story_processing_cache(cache_key,payload) values ('attack','{}')"]) await assert.rejects(db.query(sql),/permission denied/);
    if (role === 'authenticated') assert.equal((await db.query('select * from story_processing_cache')).rows.length,0);
    await db.exec('reset role');
  }
  await db.exec("set role service_role; select set_config('request.jwt.claim.role','service_role',false)");
  const token = (await db.query('select claim_reporting_refresh(true,1) as token')).rows[0].token;
  assert.ok(token);
  const article = { external_id:'isolated-rollout-report',title:'Controlled library access report',url:'https://globalvoices.org/2026/10/23/controlled-rollout-report/',publisher:'Global Voices',published_at:new Date().toISOString(),raw_data:{provider:'globalvoices',output_use:'commercial',source_attribution:{authors:['Controlled Author'],license:'CC BY 3.0',license_url:'https://creativecommons.org/licenses/by/3.0/'}} };
  assert.equal((await db.query('select ingest_source_articles($1,$2::jsonb) as count',[token,JSON.stringify([article])])).rows[0].count,1);
  assert.equal((await db.query('select finish_reporting_refresh($1,true) as done',[token])).rows[0].done,true);
  await db.exec('reset role');
  assert.deepEqual((await db.query("select raw_data from source_articles where external_id='isolated-rollout-report'")).rows[0].raw_data,article.raw_data);
  await db.query("delete from source_articles where external_id='isolated-rollout-report'");
  assert.deepEqual(await snapshots(),before);
  const report = { production_observed_at:observed.observed_at, baseline_migrations:files, corrective_migration:corrective, corrective_sha256:createHash('sha256').update(sql).digest('hex'), columns_match:true, constraints_match:true,indexes_match:true,rls_match:true,function_definitions_match:true,changed_function_grants:changedFunctionGrants, historical_policy_count:baseline.policies.length,observed_policy_count:observed.policies.length, rehearsal:'passed',catalog_drift_refused:true,ledger_drift_refused:true,ledger_failure_rolls_back_ddl_and_data:true,four_original_ledger_rows_unchanged:true,one_new_ledger_row:true,completed_rollout_replay_refused:true,saved_sources_editions_stories_unchanged:true, legacy_cache_hidden:true, reader_rpcs_and_inserts_denied:true,server_nonempty_ingestion_and_credits:true,server_reservation_ingestion_finish:true, limitations:'Embedded PostgreSQL with observed policy/table-grant/effective-function-grant variants and a simulated atomic migration runner. No production data, managed Auth/PostgREST, actual hosted migration transport, production concurrency, restore or complete CLI-baseline reconciliation. Membership/default-ACL/column-ACL/ownership guards use the local catalogs; their production variants are fingerprinted read-only but not reproduced in this rehearsal.' };
  console.log(JSON.stringify(report,null,2));
} finally { await db.close(); }
