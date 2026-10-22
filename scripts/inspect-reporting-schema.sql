-- SELECT-only schema/privilege inventory. Does not invoke reporting RPCs or read reader content.
-- Execute against the explicitly selected project; keep the output with its observation time.
select jsonb_build_object(
'observed_at', current_timestamp,
'database', current_database(),
'columns', (select jsonb_agg(to_jsonb(c) order by table_name,ordinal_position) from (select table_name,column_name,ordinal_position,data_type,udt_name,is_nullable,column_default from information_schema.columns where table_schema='public') c),
'tables', (select jsonb_agg(jsonb_build_object('name',c.relname,'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'),
'constraints', (select jsonb_agg(jsonb_build_object('table',c.conrelid::regclass::text,'name',c.conname,'definition',pg_get_constraintdef(c.oid)) order by c.conname) from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public'),
'indexes', (select jsonb_agg(to_jsonb(i) order by tablename,indexname) from (select tablename,indexname,indexdef from pg_indexes where schemaname='public') i),
'policies', (select jsonb_agg(to_jsonb(p) order by tablename,policyname) from (select tablename,policyname,permissive,roles,cmd,qual,with_check from pg_policies where schemaname='public') p),
'table_grants', (select jsonb_agg(to_jsonb(g) order by table_name,grantee,privilege_type) from (select table_name,grantee,privilege_type from information_schema.role_table_grants where table_schema='public' and grantee in ('PUBLIC','anon','authenticated','service_role')) g),
'functions', (select jsonb_agg(jsonb_build_object('name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid),'acl',p.proacl::text,'anon_execute',has_function_privilege('anon',p.oid,'EXECUTE'),'reader_execute',has_function_privilege('authenticated',p.oid,'EXECUTE'),'server_execute',has_function_privilege('service_role',p.oid,'EXECUTE')) order by p.proname,p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind='f'),
'triggers', (select jsonb_agg(jsonb_build_object('table',t.tgrelid::regclass::text,'name',t.tgname,'definition',pg_get_triggerdef(t.oid)) order by t.tgname) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and not t.tgisinternal)
) as inventory;

select jsonb_build_object(
'observed_at',current_timestamp,
'ledger',(select jsonb_agg(jsonb_build_object('version',version,'name',name) order by version) from supabase_migrations.schema_migrations),
'effective_reporting_privileges',(select jsonb_agg(jsonb_build_object('role',r,'table',t,'select',has_table_privilege(r,'public.'||t,'SELECT'),'insert',has_table_privilege(r,'public.'||t,'INSERT'),'update',has_table_privilege(r,'public.'||t,'UPDATE'),'delete',has_table_privilege(r,'public.'||t,'DELETE'),'truncate',has_table_privilege(r,'public.'||t,'TRUNCATE'),'column_insert',has_any_column_privilege(r,'public.'||t,'INSERT'),'column_update',has_any_column_privilege(r,'public.'||t,'UPDATE')) order by r,t) from unnest(array['anon','authenticated']) r cross join unnest(array['source_articles','reporting_cache_meta','story_processing_cache']) t)
) as privilege_inventory;
