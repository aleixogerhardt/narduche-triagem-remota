-- Narduche v6 — bootstrap inicial de perfis.
-- 1) Crie os usuários em Authentication > Users.
-- 2) Substitua os e-mails e empresa abaixo pelos valores reais.
-- 3) Execute uma única vez no SQL Editor.

begin;

-- Primeiro administrador. Não precisa de empresa.
update public.profiles
set role = 'admin', active = true, company_id = null, full_name = 'Administrador Narduche'
where lower(email) = lower('admin@exemplo.com');

-- Técnico. Também pode operar entre empresas.
update public.profiles
set role = 'technician', active = true, company_id = null, full_name = 'Técnico Narduche'
where lower(email) = lower('tecnico@exemplo.com');

-- Exemplo de empresa cliente.
insert into public.companies(name, contact_email)
select 'Empresa Demonstração', 'contato@empresa.com'
where not exists (
  select 1 from public.companies where lower(btrim(name)) = lower('Empresa Demonstração')
);

-- Cliente: vínculo obrigatório com empresa ativa.
update public.profiles p
set role = 'client', active = true, company_id = c.id, full_name = 'Cliente Demonstração'
from public.companies c
where lower(p.email) = lower('cliente@exemplo.com')
  and lower(btrim(c.name)) = lower('Empresa Demonstração');

commit;
