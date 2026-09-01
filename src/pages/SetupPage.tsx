import { Code2, Database, Terminal } from 'lucide-react'
import { Brand } from '../components/Brand'
import { Card } from '../components/ui'

export function SetupPage() {
  return <div className="min-h-screen p-4 sm:p-8"><div className="mx-auto max-w-3xl"><Brand/><div className="mt-10"><div className="text-xs font-bold uppercase tracking-[.18em] text-amber-300">Configuração necessária</div><h1 className="mt-2 text-3xl font-bold text-white">Conecte o PostgreSQL antes de usar o sistema</h1><p className="mt-3 text-sm leading-7 text-slate-400">A v6 não usa localStorage como banco operacional. Isso é proposital: todos os dispositivos devem consultar a mesma base Supabase.</p></div>
  <div className="mt-7 grid gap-4 sm:grid-cols-3">{[[Database,'1. Supabase','Crie um projeto e aplique as migrations.'],[Code2,'2. Ambiente','Copie .env.example para .env.local.'],[Terminal,'3. Execute','Rode npm install e npm run dev.']].map(([Icon,title,desc]) => {const C=Icon as typeof Database; return <Card key={String(title)}><C className="h-5 w-5 text-indigo-300"/><h2 className="mt-4 font-bold text-white">{String(title)}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{String(desc)}</p></Card>})}</div>
  <Card className="mt-5"><h2 className="font-bold text-white">.env.local</h2><pre className="mt-3 overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs leading-6 text-cyan-200">VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co{`\n`}VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA</pre><p className="mt-3 text-xs text-slate-500">Não coloque a chave service_role no frontend.</p></Card></div></div>
}
