-- Narduche v6 - verificações rápidas para ambiente de apresentação.
-- Execute no SQL Editor do Supabase após aplicar as migrations.

-- 1) Tabelas principais
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'companies','profiles','printers','issue_categories','triage_steps',
    'triage_sessions','triage_answers','tickets','ticket_events',
    'ticket_attachments','remote_resolutions','audit_log'
  )
order by table_name;

-- 2) RLS deve estar ativo nas tabelas operacionais
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
  and c.relkind='r'
  and c.relname in (
    'companies','profiles','printers','issue_categories','triage_steps',
    'triage_sessions','triage_answers','tickets','ticket_events',
    'ticket_attachments','remote_resolutions','audit_log'
  )
order by c.relname;

-- 3) Políticas RLS
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname in ('public','storage')
order by schemaname, tablename, policyname;

-- 4) Chaves estrangeiras
select tc.table_name, tc.constraint_name, kcu.column_name,
       ccu.table_name as referenced_table, ccu.column_name as referenced_column
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu
  on tc.constraint_name=kcu.constraint_name and tc.constraint_schema=kcu.constraint_schema
join information_schema.constraint_column_usage ccu
  on ccu.constraint_name=tc.constraint_name and ccu.constraint_schema=tc.constraint_schema
where tc.constraint_schema='public' and tc.constraint_type='FOREIGN KEY'
order by tc.table_name, tc.constraint_name;

-- 5) Índices criados para o domínio
select tablename, indexname, indexdef
from pg_indexes
where schemaname='public'
order by tablename, indexname;

-- 6) RPCs críticas e configuração de segurança
select n.nspname as schema_name, p.proname,
       p.prosecdef as security_definer,
       p.proconfig as function_config
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='public' and p.proname in (
  'start_triage','record_remote_resolution','create_ticket_from_triage',
  'assign_ticket_to_me','update_ticket_status'
))
or (n.nspname='private' and p.proname in (
  'current_user_role','current_company_id','is_admin','is_staff'
))
order by n.nspname, p.proname;

-- 7) Bucket de evidências deve ser privado
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id='ticket-evidence';
