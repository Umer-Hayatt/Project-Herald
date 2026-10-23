import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const correctivePath = new URL('../supabase/migrations/20261019134923_server_only_reporting.sql', import.meta.url);

const inventory = fs.readFileSync(new URL('./inspect-reporting-schema.sql', import.meta.url), 'utf8');
const inventoryQuery = inventory.slice(inventory.indexOf('select jsonb_build_object('), inventory.indexOf(') as inventory;') + ') as inventory'.length);
export const reportingPreflightSql = `select current_timestamp as observed_at,
  md5(((inventory - 'observed_at' - 'database') || jsonb_build_object(
    'role_memberships',(select jsonb_agg(jsonb_build_object('role',r.rolname,'member',m.rolname,'admin',a.admin_option,'inherit',a.inherit_option,'set',a.set_option) order by r.rolname,m.rolname) from pg_auth_members a join pg_roles r on r.oid=a.roleid join pg_roles m on m.oid=a.member),
    'reader_roles',(select jsonb_agg(jsonb_build_object('role',rolname,'super',rolsuper,'inherit',rolinherit,'bypassrls',rolbypassrls) order by rolname) from pg_roles where rolname in ('anon','authenticated','service_role')),
    'default_acls',(select jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(defaclrole),'schema',defaclnamespace::regnamespace::text,'kind',defaclobjtype,'acl',defaclacl::text) order by defaclrole,defaclnamespace,defaclobjtype) from pg_default_acl),
    'column_acls',(select jsonb_agg(jsonb_build_object('table',c.relname,'column',a.attname,'acl',a.attacl::text) order by c.relname,a.attname) from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and a.attnum>0 and not a.attisdropped and a.attacl is not null),
    'owners',(select jsonb_agg(jsonb_build_object('object',c.relname,'kind',c.relkind,'owner',pg_get_userbyid(c.relowner)) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'),
    'function_owners',(select jsonb_agg(jsonb_build_object('function',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'owner',pg_get_userbyid(p.proowner)) order by p.proname,p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public')
  ))::text) as catalog_md5,
  (select jsonb_agg(jsonb_build_object('version',version,'name',name,'sql_md5',md5(to_jsonb(statements)::text)) order by version)
   from supabase_migrations.schema_migrations) as ledger
from (${inventoryQuery}) catalog`;

const historicalEntries = [
  ['20261017081231', 'reader_preferences'], ['20261017092259', 'editions_and_stories'],
  ['20261017134113', 'story_feedback'], ['20261017134158', 'resilient_provider_limits'],
];

/** Generates SQL only. This module has no database client, connection or deployment operation. */
export function buildReportingRollout(preflight) {
  if (preflight?.project_ref !== 'hnzwraiojsftuncridsp' || !/^[a-f0-9]{32}$/.test(preflight.catalog_md5)) throw new Error('Expected reviewed production preflight');
  if (!Array.isArray(preflight.ledger) || preflight.ledger.length !== historicalEntries.length ||
    !preflight.ledger.every((row, index) => row.version === historicalEntries[index][0] && row.name === historicalEntries[index][1] && /^[a-f0-9]{32}$/.test(row.sql_md5))) throw new Error('Expected the four preserved historical entries');
  const sql = fs.readFileSync(correctivePath, 'utf8').replaceAll('\r\n', '\n');
  const blob = createHash('sha1').update(`blob ${Buffer.byteLength(sql)}\0`).update(sql).digest('hex');
  if (blob !== 'a91f22c8ace2b1ba4b5094a027f38a10c767abe1') throw new Error('Reviewed corrective migration changed');
  const expectedLedger = JSON.stringify(preflight.ledger).replaceAll("'", "''");
  return `-- Prepared target: hnzwraiojsftuncridsp. Generation is not permission to execute.
-- Execute only inside the migration runner's single transaction after readiness review.
-- This body never repairs, deletes or inserts migration-ledger rows; the runner records its own new migration.
set local lock_timeout = '5s';
set local statement_timeout = '30s';
lock table public.reader_preferences, public.source_articles, public.reporting_cache_meta,
  public.editions, public.edition_stories, public.story_feedback, public.story_processing_cache in access exclusive mode;
lock table supabase_migrations.schema_migrations in share row exclusive mode;
do $herald_preflight$
declare actual record;
begin
  select * into actual from (${reportingPreflightSql}) checked;
  if actual.catalog_md5 is distinct from '${preflight.catalog_md5}' then
    raise exception 'Reviewed reporting catalog changed; stop and re-inspect';
  end if;
  if actual.ledger is distinct from '${expectedLedger}'::jsonb then
    raise exception 'Reviewed migration ledger changed; preserve history and re-inspect';
  end if;
end;
$herald_preflight$;
${sql}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--preflight-sql' && process.argv.length === 3) console.log(reportingPreflightSql + ';');
  else if (process.argv[2] === '--prepare' && process.argv.length === 5) {
    const sql = buildReportingRollout(JSON.parse(fs.readFileSync(process.argv[3], 'utf8')));
    fs.writeFileSync(process.argv[4], sql, { flag: 'wx' });
    console.log(JSON.stringify({ prepared:true, bytes:Buffer.byteLength(sql), sha256:createHash('sha256').update(sql).digest('hex'), executed:false }));
  } else throw new Error('Use --preflight-sql or --prepare <reviewed-private-preflight.json> <new-private-output.sql>');
}
