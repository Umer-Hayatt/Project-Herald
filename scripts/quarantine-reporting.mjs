/** SQL generator only. The caller selects the project and wraps this body in one transaction. */
export function buildQuarantineSql(manifest) {
  if (manifest.project_ref !== 'hnzwraiojsftuncridsp' || manifest.candidates?.length !== 58) throw new Error('Expected the reviewed 58-row production manifest');
  const rows = manifest.candidates.map(row => ({ id:row.id, external_id:row.external_id, url:row.url, fingerprint:row.row_fingerprint }));
  if (new Set(rows.map(row => row.id)).size !== 58 || rows.some(row => !/^[a-f0-9-]{36}$/.test(row.id) || !/^[a-f0-9]{32}$/.test(row.fingerprint))) throw new Error('Invalid exact manifest');
  const expected = JSON.stringify(rows).replaceAll("'", "''");
  return `set local timezone='UTC';
set local lock_timeout='5s';
lock table public.source_articles,public.editions,public.edition_stories in access exclusive mode;
do $herald_quarantine$
declare expected jsonb := '${expected}'::jsonb; affected integer;
begin
  if (select count(*) from jsonb_to_recordset(expected) e(id uuid,external_id text,url text,fingerprint text)
      join public.source_articles s on s.id=e.id where s.external_id=e.external_id and s.url=e.url and md5(to_jsonb(s)::text)=e.fingerprint
      and (s.raw_data is null or jsonb_typeof(s.raw_data)='object') and not coalesce(s.raw_data ? 'recovery_quarantine',false)) <> 58 then
    raise exception 'Quarantine manifest changed; no rows may be excluded';
  end if;
  update public.source_articles s set raw_data=coalesce(s.raw_data,'{}'::jsonb) ||
    jsonb_build_object('output_use','internal_testing','recovery_quarantine',jsonb_build_object('manifest','production-quarantine-candidates-2026-10-23','reason','reserved_example_source'))
  from jsonb_to_recordset(expected) e(id uuid,external_id text,url text,fingerprint text)
  where s.id=e.id and s.external_id=e.external_id and s.url=e.url and md5(to_jsonb(s)::text)=e.fingerprint;
  get diagnostics affected=row_count;
  if affected <> 58 then raise exception 'Unexpected quarantine count'; end if;
end;
$herald_quarantine$;`;
}
