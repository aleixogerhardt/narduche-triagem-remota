import { readFile, access } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(new URL('..', import.meta.url).pathname)
const required = [
  'package.json', 'index.html', 'vite.config.ts', 'src/main.tsx', 'src/router.tsx',
  'src/services/api.ts', 'src/lib/supabase.ts', 'src/pages/TriagePage.tsx',
  'src/pages/TicketsPage.tsx', 'src/pages/AdminCompaniesPage.tsx',
  'src/pages/AdminPrintersPage.tsx', 'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_catalog_seed.sql', 'supabase/migrations/003_storage.sql',
]

let failed = false
for (const file of required) {
  try { await access(resolve(root, file)); console.log('OK', file) }
  catch { console.error('FALTA', file); failed = true }
}

const api = await readFile(resolve(root, 'src/services/api.ts'), 'utf8')
if (/localStorage|sessionStorage/.test(api)) { console.error('FALHA: camada operacional usa storage do navegador.'); failed = true }
else console.log('OK camada de dados sem localStorage/sessionStorage')

const schema = await readFile(resolve(root, 'supabase/migrations/001_initial_schema.sql'), 'utf8')
for (const token of ['enable row level security', 'create_ticket_from_triage', 'select * into v_session from public.triage_sessions where id = p_session_id for update', 'audit_log', 'ticket_events']) {
  if (!schema.toLowerCase().includes(token.toLowerCase())) { console.error('FALTA SQL:', token); failed = true }
  else console.log('OK SQL', token)
}

const storage = await readFile(resolve(root, 'supabase/migrations/003_storage.sql'), 'utf8')
if (!storage.includes("'ticket-evidence'") || !storage.includes('public,') || !storage.includes('false')) {
  console.error('FALHA: bucket privado não identificado.'); failed = true
} else console.log('OK bucket privado ticket-evidence')

if (failed) process.exit(1)
console.log('\nSmoke test estrutural concluído sem falhas.')
