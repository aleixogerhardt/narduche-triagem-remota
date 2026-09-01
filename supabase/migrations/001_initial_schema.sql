-- Narduche v6
-- PostgreSQL/Supabase schema, constraints, RLS, audit and transactional RPCs.

begin;

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema private revoke execute on functions from public;

-- ---------- Domain enums ----------
do $$ begin
  create type public.user_role as enum ('client', 'technician', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum ('open', 'in_progress', 'waiting_customer', 'resolved', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.triage_status as enum ('started', 'resolved_remote', 'escalated', 'abandoned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.triage_response as enum ('resolved', 'not_resolved', 'skipped');
exception when duplicate_object then null; end $$;

-- ---------- Core tables ----------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 2 and 160),
  document text null,
  contact_email text null,
  contact_phone text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists companies_name_ci_uq on public.companies (lower(btrim(name)));
create unique index if not exists companies_document_uq on public.companies (document) where document is not null and btrim(document) <> '';

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid null constraint profiles_company_id_fkey references public.companies(id) on delete restrict,
  full_name text not null default 'Usuário' check (char_length(btrim(full_name)) between 2 and 160),
  email text not null,
  role public.user_role not null default 'client',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_requires_company check (role <> 'client' or company_id is not null or active = false)
);

create unique index if not exists profiles_email_ci_uq on public.profiles (lower(email));
create index if not exists profiles_company_idx on public.profiles(company_id) where company_id is not null;
create index if not exists profiles_role_idx on public.profiles(role);

create table if not exists public.printers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null constraint printers_company_id_fkey references public.companies(id) on delete restrict,
  name text not null check (char_length(btrim(name)) between 2 and 120),
  manufacturer text null,
  model text not null check (char_length(btrim(model)) between 2 and 160),
  serial_number text not null check (char_length(btrim(serial_number)) between 3 and 120),
  asset_tag text null,
  location text null,
  notes text null check (notes is null or char_length(notes) <= 1000),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists printers_serial_ci_uq on public.printers (lower(btrim(serial_number)));
create unique index if not exists printers_company_asset_tag_uq on public.printers(company_id, lower(btrim(asset_tag))) where asset_tag is not null and btrim(asset_tag) <> '';
create index if not exists printers_company_idx on public.printers(company_id);
create index if not exists printers_active_idx on public.printers(company_id, active);

create table if not exists public.issue_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  description text not null default '',
  icon text not null default 'other',
  active boolean not null default true,
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.triage_steps (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null constraint triage_steps_category_id_fkey references public.issue_categories(id) on delete cascade,
  sort_order integer not null check (sort_order > 0),
  title text not null check (char_length(btrim(title)) between 2 and 180),
  instruction text not null check (char_length(btrim(instruction)) between 5 and 3000),
  safety_note text null check (safety_note is null or char_length(safety_note) <= 1200),
  media_url text null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(category_id, sort_order)
);

create index if not exists triage_steps_category_idx on public.triage_steps(category_id, sort_order);

create table if not exists public.triage_sessions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null constraint triage_sessions_company_id_fkey references public.companies(id) on delete restrict,
  requester_id uuid not null constraint triage_sessions_requester_id_fkey references public.profiles(id) on delete restrict,
  printer_id uuid not null constraint triage_sessions_printer_id_fkey references public.printers(id) on delete restrict,
  category_id uuid not null constraint triage_sessions_category_id_fkey references public.issue_categories(id) on delete restrict,
  status public.triage_status not null default 'started',
  started_at timestamptz not null default now(),
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists triage_sessions_requester_idx on public.triage_sessions(requester_id, started_at desc);
create index if not exists triage_sessions_company_idx on public.triage_sessions(company_id, started_at desc);
create index if not exists triage_sessions_status_idx on public.triage_sessions(status, started_at desc);

create table if not exists public.triage_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null constraint triage_answers_session_id_fkey references public.triage_sessions(id) on delete cascade,
  step_id uuid not null constraint triage_answers_step_id_fkey references public.triage_steps(id) on delete restrict,
  response public.triage_response not null,
  notes text null check (notes is null or char_length(notes) <= 1200),
  answered_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id, step_id)
);

create index if not exists triage_answers_session_idx on public.triage_answers(session_id, answered_at);

create sequence if not exists public.ticket_number_seq start with 1 increment by 1;

create or replace function public.next_ticket_number()
returns text
language sql
volatile
set search_path = public
as $$
  select 'NAR-' || to_char(current_date, 'YYMMDD') || '-' || lpad(nextval('public.ticket_number_seq')::text, 6, '0');
$$;

revoke execute on function public.next_ticket_number() from public, anon, authenticated;

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique default public.next_ticket_number(),
  company_id uuid not null constraint tickets_company_id_fkey references public.companies(id) on delete restrict,
  requester_id uuid not null constraint tickets_requester_id_fkey references public.profiles(id) on delete restrict,
  assigned_to uuid null constraint tickets_assigned_to_fkey references public.profiles(id) on delete restrict,
  printer_id uuid not null constraint tickets_printer_id_fkey references public.printers(id) on delete restrict,
  category_id uuid not null constraint tickets_category_id_fkey references public.issue_categories(id) on delete restrict,
  triage_session_id uuid null unique constraint tickets_triage_session_id_fkey references public.triage_sessions(id) on delete restrict,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'normal',
  description text not null check (char_length(btrim(description)) between 10 and 2000),
  resolution_note text null check (resolution_note is null or char_length(resolution_note) <= 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz null
);

create index if not exists tickets_company_created_idx on public.tickets(company_id, created_at desc);
create index if not exists tickets_requester_created_idx on public.tickets(requester_id, created_at desc);
create index if not exists tickets_status_created_idx on public.tickets(status, created_at desc);
create index if not exists tickets_assigned_status_idx on public.tickets(assigned_to, status) where assigned_to is not null;
create index if not exists tickets_printer_idx on public.tickets(printer_id, created_at desc);

create table if not exists public.ticket_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null constraint ticket_events_ticket_id_fkey references public.tickets(id) on delete cascade,
  actor_id uuid null constraint ticket_events_actor_id_fkey references public.profiles(id) on delete set null,
  event_type text not null check (event_type in ('created', 'assigned', 'status_changed', 'note')),
  from_status public.ticket_status null,
  to_status public.ticket_status null,
  note text null check (note is null or char_length(note) <= 3000),
  created_at timestamptz not null default now()
);

create index if not exists ticket_events_ticket_idx on public.ticket_events(ticket_id, created_at);

create table if not exists public.ticket_attachments (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null constraint ticket_attachments_ticket_id_fkey references public.tickets(id) on delete cascade,
  uploader_id uuid not null constraint ticket_attachments_uploader_id_fkey references public.profiles(id) on delete restrict,
  storage_path text not null unique,
  original_name text not null check (char_length(btrim(original_name)) between 1 and 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes between 1 and 8388608),
  created_at timestamptz not null default now()
);

create index if not exists ticket_attachments_ticket_idx on public.ticket_attachments(ticket_id, created_at);

create table if not exists public.remote_resolutions (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null unique constraint remote_resolutions_session_id_fkey references public.triage_sessions(id) on delete restrict,
  company_id uuid not null constraint remote_resolutions_company_id_fkey references public.companies(id) on delete restrict,
  requester_id uuid not null constraint remote_resolutions_requester_id_fkey references public.profiles(id) on delete restrict,
  printer_id uuid not null constraint remote_resolutions_printer_id_fkey references public.printers(id) on delete restrict,
  category_id uuid not null constraint remote_resolutions_category_id_fkey references public.issue_categories(id) on delete restrict,
  resolution_note text not null check (char_length(btrim(resolution_note)) between 3 and 2000),
  resolved_at timestamptz not null default now()
);

create index if not exists remote_resolutions_company_idx on public.remote_resolutions(company_id, resolved_at desc);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid null,
  schema_name text not null,
  table_name text not null,
  row_id text null,
  operation text not null check (operation in ('INSERT', 'UPDATE', 'DELETE')),
  old_data jsonb null,
  new_data jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists audit_log_table_created_idx on public.audit_log(table_name, created_at desc);
create index if not exists audit_log_actor_idx on public.audit_log(actor_id, created_at desc) where actor_id is not null;

-- ---------- Generic timestamps ----------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.install_updated_at_trigger(p_table regclass)
returns void
language plpgsql
set search_path = public
as $$
declare
  trigger_name text := replace(p_table::text, '.', '_') || '_touch_updated_at';
begin
  execute format('drop trigger if exists %I on %s', trigger_name, p_table);
  execute format('create trigger %I before update on %s for each row execute function public.touch_updated_at()', trigger_name, p_table);
end;
$$;

select public.install_updated_at_trigger('public.companies');
select public.install_updated_at_trigger('public.profiles');
select public.install_updated_at_trigger('public.printers');
select public.install_updated_at_trigger('public.issue_categories');
select public.install_updated_at_trigger('public.triage_steps');
select public.install_updated_at_trigger('public.triage_sessions');
select public.install_updated_at_trigger('public.triage_answers');
select public.install_updated_at_trigger('public.tickets');

drop function public.install_updated_at_trigger(regclass);

-- ---------- Auth profile trigger ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, company_id, full_name, email, role, active)
  values (
    new.id,
    null,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, 'Usuário'), '@', 1)),
    coalesce(new.email, new.id::text || '@pending.local'),
    'client',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- ---------- Authorization helper functions ----------
create or replace function private.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid() and active = true;
$$;

create or replace function private.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select company_id from public.profiles where id = auth.uid() and active = true;
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() = 'admin', false);
$$;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.current_user_role() in ('technician', 'admin'), false);
$$;

revoke all on function private.current_user_role() from public;
revoke all on function private.current_company_id() from public;
revoke all on function private.is_admin() from public;
revoke all on function private.is_staff() from public;
grant usage on schema private to authenticated;
grant execute on function private.current_user_role() to authenticated;
grant execute on function private.current_company_id() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_staff() to authenticated;

-- ---------- Audit ----------
create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row_id text;
begin
  v_row_id := coalesce((to_jsonb(new) ->> 'id'), (to_jsonb(old) ->> 'id'));
  insert into public.audit_log(actor_id, schema_name, table_name, row_id, operation, old_data, new_data)
  values (
    auth.uid(),
    tg_table_schema,
    tg_table_name,
    v_row_id,
    tg_op,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end
  );
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['companies','profiles','printers','tickets'] loop
    execute format('drop trigger if exists %I on public.%I', t || '_audit', t);
    execute format('create trigger %I after insert or update or delete on public.%I for each row execute function public.audit_row_change()', t || '_audit', t);
  end loop;
end $$;

-- ---------- Transactional business functions ----------
create or replace function public.start_triage(p_printer_id uuid, p_category_id uuid)
returns public.triage_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_printer public.printers;
  v_session public.triage_sessions;
begin
  select * into v_profile from public.profiles where id = auth.uid() and active = true;
  if not found then raise exception 'Usuário sem perfil ativo.' using errcode = '42501'; end if;
  if v_profile.role <> 'client' then raise exception 'A triagem deve ser iniciada por um usuário cliente.' using errcode = '42501'; end if;
  if v_profile.company_id is null then raise exception 'Usuário não vinculado a uma empresa.' using errcode = '23514'; end if;
  if not exists(select 1 from public.companies where id=v_profile.company_id and active=true) then
    raise exception 'A empresa do usuário está inativa.' using errcode='42501';
  end if;

  select * into v_printer from public.printers where id = p_printer_id and active = true;
  if not found or v_printer.company_id <> v_profile.company_id then
    raise exception 'Equipamento inválido para esta empresa.' using errcode = '42501';
  end if;
  if not exists(select 1 from public.issue_categories where id = p_category_id and active = true) then
    raise exception 'Categoria de problema inválida.' using errcode = '23503';
  end if;

  insert into public.triage_sessions(company_id, requester_id, printer_id, category_id)
  values (v_profile.company_id, v_profile.id, p_printer_id, p_category_id)
  returning * into v_session;
  return v_session;
end;
$$;

create or replace function public.record_remote_resolution(p_session_id uuid, p_note text)
returns public.remote_resolutions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.triage_sessions;
  v_resolution public.remote_resolutions;
begin
  if char_length(btrim(coalesce(p_note,''))) < 3 then raise exception 'Informe uma observação de resolução.' using errcode='23514'; end if;
  select * into v_session from public.triage_sessions where id = p_session_id for update;
  if not found or v_session.requester_id <> auth.uid() then raise exception 'Sessão de triagem não autorizada.' using errcode='42501'; end if;
  if v_session.status <> 'started' then raise exception 'Esta triagem já foi finalizada.' using errcode='23514'; end if;
  if not exists(select 1 from public.triage_answers where session_id=v_session.id and response='resolved') then
    raise exception 'Nenhuma etapa foi marcada como resolvida.' using errcode='23514';
  end if;

  update public.triage_sessions set status='resolved_remote', completed_at=now() where id=v_session.id;
  insert into public.remote_resolutions(session_id, company_id, requester_id, printer_id, category_id, resolution_note)
  values(v_session.id, v_session.company_id, v_session.requester_id, v_session.printer_id, v_session.category_id, btrim(p_note))
  returning * into v_resolution;
  return v_resolution;
end;
$$;

create or replace function public.create_ticket_from_triage(
  p_session_id uuid,
  p_description text,
  p_priority public.ticket_priority default 'normal'
)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.triage_sessions;
  v_ticket public.tickets;
begin
  if char_length(btrim(coalesce(p_description,''))) not between 10 and 2000 then
    raise exception 'A descrição deve possuir entre 10 e 2000 caracteres.' using errcode='23514';
  end if;

  select * into v_session from public.triage_sessions where id = p_session_id for update;
  if not found or v_session.requester_id <> auth.uid() then raise exception 'Sessão de triagem não autorizada.' using errcode='42501'; end if;
  if v_session.status <> 'started' then raise exception 'Esta triagem já foi finalizada.' using errcode='23514'; end if;
  if exists(select 1 from public.triage_answers where session_id = v_session.id and response = 'resolved') then
    raise exception 'A triagem possui uma etapa marcada como resolvida e não pode ser escalada.' using errcode='23514';
  end if;
  if (select count(*) from public.triage_answers where session_id = v_session.id and response = 'not_resolved')
     < (select count(*) from public.triage_steps where category_id = v_session.category_id and active = true) then
    raise exception 'Conclua todas as etapas da triagem antes de abrir o chamado.' using errcode='23514';
  end if;

  insert into public.tickets(company_id, requester_id, printer_id, category_id, triage_session_id, priority, description)
  values(v_session.company_id, v_session.requester_id, v_session.printer_id, v_session.category_id, v_session.id, p_priority, btrim(p_description))
  returning * into v_ticket;

  insert into public.ticket_events(ticket_id, actor_id, event_type, to_status, note)
  values(v_ticket.id, auth.uid(), 'created', 'open', 'Chamado criado após triagem remota sem resolução.');

  update public.triage_sessions set status='escalated', completed_at=now() where id=v_session.id;
  return v_ticket;
end;
$$;

create or replace function public.assign_ticket_to_me(p_ticket_id uuid)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.tickets;
begin
  if not private.is_staff() then raise exception 'Ação restrita à equipe técnica.' using errcode='42501'; end if;
  select * into v_ticket from public.tickets where id=p_ticket_id for update;
  if not found then raise exception 'Chamado não encontrado.' using errcode='P0002'; end if;
  if v_ticket.status in ('resolved','cancelled') then raise exception 'Chamado encerrado não pode ser atribuído.' using errcode='23514'; end if;
  if v_ticket.assigned_to is not null and v_ticket.assigned_to <> auth.uid() then
    raise exception 'Chamado já atribuído a outro técnico.' using errcode='23514';
  end if;

  update public.tickets set assigned_to=auth.uid() where id=v_ticket.id returning * into v_ticket;
  insert into public.ticket_events(ticket_id, actor_id, event_type, note)
  values(v_ticket.id, auth.uid(), 'assigned', 'Chamado atribuído ao técnico atual.');
  return v_ticket;
end;
$$;

create or replace function public.update_ticket_status(p_ticket_id uuid, p_status public.ticket_status, p_note text default null)
returns public.tickets
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ticket public.tickets;
  v_old public.ticket_status;
  v_allowed boolean := false;
begin
  if not private.is_staff() then raise exception 'Ação restrita à equipe técnica.' using errcode='42501'; end if;
  select * into v_ticket from public.tickets where id=p_ticket_id for update;
  if not found then raise exception 'Chamado não encontrado.' using errcode='P0002'; end if;
  v_old := v_ticket.status;

  v_allowed := case
    when v_old='open' and p_status in ('in_progress','cancelled') then true
    when v_old='in_progress' and p_status in ('waiting_customer','resolved','cancelled') then true
    when v_old='waiting_customer' and p_status in ('in_progress','resolved','cancelled') then true
    else false
  end;
  if not v_allowed then raise exception 'Transição de status inválida: % -> %', v_old, p_status using errcode='23514'; end if;
  if p_status='resolved' and char_length(btrim(coalesce(p_note,''))) < 3 then
    raise exception 'Informe uma observação de resolução.' using errcode='23514';
  end if;

  update public.tickets
  set status=p_status,
      assigned_to=coalesce(assigned_to, auth.uid()),
      resolution_note=case when p_status='resolved' then btrim(p_note) else resolution_note end,
      resolved_at=case when p_status='resolved' then now() else resolved_at end
  where id=p_ticket_id
  returning * into v_ticket;

  insert into public.ticket_events(ticket_id, actor_id, event_type, from_status, to_status, note)
  values(v_ticket.id, auth.uid(), 'status_changed', v_old, p_status, nullif(btrim(coalesce(p_note,'')),''));
  return v_ticket;
end;
$$;

revoke all on function public.start_triage(uuid,uuid) from public;
revoke all on function public.record_remote_resolution(uuid,text) from public;
revoke all on function public.create_ticket_from_triage(uuid,text,public.ticket_priority) from public;
revoke all on function public.assign_ticket_to_me(uuid) from public;
revoke all on function public.update_ticket_status(uuid,public.ticket_status,text) from public;
grant execute on function public.start_triage(uuid,uuid) to authenticated;
grant execute on function public.record_remote_resolution(uuid,text) to authenticated;
grant execute on function public.create_ticket_from_triage(uuid,text,public.ticket_priority) to authenticated;
grant execute on function public.assign_ticket_to_me(uuid) to authenticated;
grant execute on function public.update_ticket_status(uuid,public.ticket_status,text) to authenticated;

-- ---------- RLS ----------
alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.printers enable row level security;
alter table public.issue_categories enable row level security;
alter table public.triage_steps enable row level security;
alter table public.triage_sessions enable row level security;
alter table public.triage_answers enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_events enable row level security;
alter table public.ticket_attachments enable row level security;
alter table public.remote_resolutions enable row level security;
alter table public.audit_log enable row level security;

-- Companies
create policy "companies_select" on public.companies for select to authenticated
using (private.is_staff() or id = private.current_company_id());
create policy "companies_admin_insert" on public.companies for insert to authenticated
with check (private.is_admin());
create policy "companies_admin_update" on public.companies for update to authenticated
using (private.is_admin()) with check (private.is_admin());
create policy "companies_admin_delete" on public.companies for delete to authenticated
using (private.is_admin());

-- Profiles: read only from browser; mutation should be done by controlled admin/server flow.
create policy "profiles_select" on public.profiles for select to authenticated
using (id = auth.uid() or private.is_staff());

-- Printers
create policy "printers_select" on public.printers for select to authenticated
using (private.is_staff() or (
  company_id = private.current_company_id()
  and active = true
  and exists(select 1 from public.companies c where c.id=company_id and c.active=true)
));
create policy "printers_admin_insert" on public.printers for insert to authenticated
with check (private.is_admin() and exists(select 1 from public.companies c where c.id=company_id and c.active=true));
create policy "printers_admin_update" on public.printers for update to authenticated
using (private.is_admin()) with check (private.is_admin() and exists(select 1 from public.companies c where c.id=company_id and c.active=true));
create policy "printers_admin_delete" on public.printers for delete to authenticated using (private.is_admin());

-- Catalog
create policy "categories_select" on public.issue_categories for select to authenticated using (active=true or private.is_admin());
create policy "categories_admin_all" on public.issue_categories for all to authenticated using (private.is_admin()) with check (private.is_admin());
create policy "steps_select" on public.triage_steps for select to authenticated using (active=true or private.is_admin());
create policy "steps_admin_all" on public.triage_steps for all to authenticated using (private.is_admin()) with check (private.is_admin());

-- Triage
create policy "triage_sessions_select" on public.triage_sessions for select to authenticated
using (requester_id=auth.uid() or private.is_staff());
create policy "triage_answers_select" on public.triage_answers for select to authenticated
using (exists(select 1 from public.triage_sessions s where s.id=session_id and (s.requester_id=auth.uid() or private.is_staff())));
create policy "triage_answers_insert" on public.triage_answers for insert to authenticated
with check (exists(
  select 1 from public.triage_sessions s
  join public.triage_steps st on st.id=step_id and st.category_id=s.category_id and st.active=true
  where s.id=session_id and s.requester_id=auth.uid() and s.status='started'
));
create policy "triage_answers_update" on public.triage_answers for update to authenticated
using (exists(select 1 from public.triage_sessions s where s.id=session_id and s.requester_id=auth.uid() and s.status='started'))
with check (exists(
  select 1 from public.triage_sessions s
  join public.triage_steps st on st.id=step_id and st.category_id=s.category_id and st.active=true
  where s.id=session_id and s.requester_id=auth.uid() and s.status='started'
));

-- Tickets and related data
create policy "tickets_select" on public.tickets for select to authenticated
using (requester_id=auth.uid() or private.is_staff());
create policy "events_select" on public.ticket_events for select to authenticated
using (exists(select 1 from public.tickets t where t.id=ticket_id and (t.requester_id=auth.uid() or private.is_staff())));
create policy "attachments_select" on public.ticket_attachments for select to authenticated
using (exists(select 1 from public.tickets t where t.id=ticket_id and (t.requester_id=auth.uid() or private.is_staff())));
create policy "attachments_insert" on public.ticket_attachments for insert to authenticated
with check (
  uploader_id=auth.uid()
  and split_part(storage_path, '/', 1)=auth.uid()::text
  and split_part(storage_path, '/', 2)=ticket_id::text
  and exists(select 1 from public.tickets t where t.id=ticket_id and (t.requester_id=auth.uid() or private.is_staff()))
);
create policy "attachments_delete" on public.ticket_attachments for delete to authenticated
using (uploader_id=auth.uid() or private.is_admin());

create policy "remote_resolutions_select" on public.remote_resolutions for select to authenticated
using (requester_id=auth.uid() or private.is_staff());

-- Audit is deliberately admin-only.
create policy "audit_admin_select" on public.audit_log for select to authenticated using (private.is_admin());

-- ---------- Grants / least privilege ----------
revoke all on all tables in schema public from anon;
grant select on public.companies, public.profiles, public.printers, public.issue_categories, public.triage_steps,
  public.triage_sessions, public.triage_answers, public.tickets, public.ticket_events,
  public.ticket_attachments, public.remote_resolutions, public.audit_log to authenticated;
grant insert, update, delete on public.companies, public.printers, public.issue_categories, public.triage_steps to authenticated;
grant insert, update on public.triage_answers to authenticated;
grant insert, delete on public.ticket_attachments to authenticated;
grant usage on schema public to authenticated;

-- Realtime for ticket dashboards. Ignore duplicate membership if re-running manually.
do $$ begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.ticket_events;
exception when duplicate_object then null; end $$;

commit;
