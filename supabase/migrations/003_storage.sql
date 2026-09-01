-- Private evidence bucket and access policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'ticket-evidence',
  'ticket-evidence',
  false,
  8388608,
  array['image/jpeg','image/png','image/webp','text/plain','application/pdf','application/octet-stream']
)
on conflict (id) do update set
  public=false,
  file_size_limit=excluded.file_size_limit,
  allowed_mime_types=excluded.allowed_mime_types;

-- Uploads must live under <auth.uid()>/<ticket_id>/<file>.
drop policy if exists "ticket_evidence_insert" on storage.objects;
create policy "ticket_evidence_insert"
on storage.objects for insert to authenticated
with check (
  bucket_id='ticket-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (
    select 1 from public.tickets t
    where t.id::text = (storage.foldername(name))[2]
      and (t.requester_id = auth.uid() or private.is_staff())
  )
);

drop policy if exists "ticket_evidence_select" on storage.objects;
create policy "ticket_evidence_select"
on storage.objects for select to authenticated
using (
  bucket_id='ticket-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or private.is_staff()
  )
);

drop policy if exists "ticket_evidence_delete" on storage.objects;
create policy "ticket_evidence_delete"
on storage.objects for delete to authenticated
using (
  bucket_id='ticket-evidence'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or private.is_admin()
  )
);
