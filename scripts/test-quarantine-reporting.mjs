import { PGlite } from '@electric-sql/pglite';
import assert from 'node:assert/strict';
import { buildQuarantineSql } from './quarantine-reporting.mjs';
const db=new PGlite();
try {
  await db.exec(`create table source_articles(id uuid primary key,external_id text,url text,raw_data jsonb);
    create table editions(id integer primary key,payload jsonb);
    create table edition_stories(id integer primary key,source_article_id uuid references source_articles,payload jsonb);
    insert into editions values (1,'{"preserved":"Edition"}');`);
  for(let i=1;i<=59;i++) await db.query('insert into source_articles values ($1,$2,$3,$4)',[
    '11111111-1111-4111-8111-'+String(i).padStart(12,'0'),'controlled-'+i,'https://example.org/controlled-'+i,JSON.stringify({preserve:i,output_use:'commercial'})]);
  await db.exec(`insert into edition_stories values (1,'11111111-1111-4111-8111-000000000001','{"preserved":"Story and supporting sources"}')`);
  const state=async()=> (await db.query(`select jsonb_build_object('sources',(select jsonb_agg(to_jsonb(s) order by id) from source_articles s),'editions',(select jsonb_agg(to_jsonb(e)) from editions e),'stories',(select jsonb_agg(to_jsonb(s)) from edition_stories s)) as snapshot`)).rows[0].snapshot;
  const before=await state();
  const candidates=(await db.query('select id,external_id,url,md5(to_jsonb(s)::text) as row_fingerprint from source_articles s order by id limit 58')).rows;
  const manifest={project_ref:'hnzwraiojsftuncridsp',candidates};
  const wrong=structuredClone(manifest);wrong.candidates[0].row_fingerprint='0'.repeat(32);
  await assert.rejects(db.transaction(tx=>tx.exec(buildQuarantineSql(wrong))),/manifest changed/);
  assert.deepEqual(await state(),before);
  await db.transaction(tx=>tx.exec(buildQuarantineSql(manifest)));
  const after=await state();
  assert.deepEqual(after.editions,before.editions);assert.deepEqual(after.stories,before.stories);
  for(let i=0;i<58;i++) { assert.equal(after.sources[i].raw_data.output_use,'internal_testing');assert.equal(after.sources[i].raw_data.preserve,i+1);assert.deepEqual({...after.sources[i],raw_data:before.sources[i].raw_data},before.sources[i]); }
  assert.deepEqual(after.sources[58],before.sources[58]);
  await assert.rejects(db.transaction(tx=>tx.exec(buildQuarantineSql(manifest))),/manifest changed/);
  assert.deepEqual(await state(),after);
  console.log('PASS: changed manifest aborts atomically; exactly58 rows excluded; unrelated metadata/row and saved Editions/Stories/FK preserved; replay refused. Embedded database only.');
} finally { await db.close(); }
