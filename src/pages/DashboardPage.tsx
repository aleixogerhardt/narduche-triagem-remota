import { useQuery } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { ArrowRight, Building2, CheckCircle2, ClipboardList, Printer, Wrench } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, EmptyState, PageHeader, Spinner, StatusBadge } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { formatDate } from '../lib/utils'
import { useTicketRealtime } from '../lib/useTicketRealtime'
import { listCompanies, listPrinters, listTickets } from '../services/api'

export function DashboardPage() {
  const { profile } = useAuth()
  useTicketRealtime()
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: listTickets })
  const printers = useQuery({ queryKey: ['printers'], queryFn: listPrinters })
  const companies = useQuery({ queryKey: ['companies'], queryFn: listCompanies, enabled: profile?.role === 'admin' })
  if (tickets.isLoading || printers.isLoading) return <Spinner />

  const open = (tickets.data ?? []).filter(t => ['open','in_progress','waiting_customer'].includes(t.status)).length
  const resolved = (tickets.data ?? []).filter(t => t.status === 'resolved').length
  const stats = profile?.role === 'admin'
    ? [[Building2,'Empresas',companies.data?.length ?? 0],[Printer,'Equipamentos',printers.data?.length ?? 0],[ClipboardList,'Chamados ativos',open],[CheckCircle2,'Resolvidos',resolved]] as const
    : [[Printer,'Equipamentos',printers.data?.length ?? 0],[ClipboardList,'Chamados ativos',open],[CheckCircle2,'Resolvidos',resolved]] as const

  return <>
    <PageHeader eyebrow="Narduche" title={`Olá, ${profile?.full_name?.split(' ')[0] ?? 'usuário'}`} description={profile?.role === 'client' ? 'Faça uma triagem antes de abrir um chamado. O diagnóstico fica registrado para a equipe técnica.' : 'Acompanhe os atendimentos e o estado operacional da plataforma.'} action={profile?.role === 'client' ? <Link to="/triagem" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white">Iniciar triagem <ArrowRight className="h-4 w-4"/></Link> : undefined}/>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(([Icon,label,value],i)=>{const C=Icon;return <motion.div key={label} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:i*.05}}><Card className="h-full"><div className="flex items-start justify-between"><div><div className="text-sm text-slate-500">{label}</div><div className="mt-2 text-3xl font-black text-white">{value}</div></div><div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-300"><C className="h-5 w-5"/></div></div></Card></motion.div>})}</div>

    <div className="mt-6 grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
      <Card><div className="mb-4 flex items-center justify-between"><div><h2 className="font-bold text-white">Chamados recentes</h2><p className="mt-1 text-xs text-slate-500">Dados lidos diretamente do PostgreSQL.</p></div><Link to="/chamados" className="text-xs font-semibold text-indigo-300">Ver todos</Link></div>
      {(tickets.data?.length ?? 0)===0 ? <EmptyState title="Nenhum chamado" description="Quando uma triagem for escalada, o chamado aparecerá aqui."/> : <div className="space-y-2">{tickets.data!.slice(0,5).map(t=><Link key={t.id} to={`/chamados/${t.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-3 transition hover:border-slate-700"><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-200">{t.ticket_number} · {t.issue_categories?.name ?? 'Chamado'}</div><div className="mt-1 truncate text-xs text-slate-500">{t.printers?.name} · {formatDate(t.created_at)}</div></div><StatusBadge status={t.status}/></Link>)}</div>}</Card>
      <Card><div className="rounded-2xl bg-gradient-to-br from-indigo-500/15 to-cyan-400/5 p-4"><Wrench className="h-6 w-6 text-indigo-300"/><h2 className="mt-4 font-bold text-white">Fluxo orientado</h2><p className="mt-2 text-sm leading-6 text-slate-400">A triagem registra cada etapa antes da escalada, melhorando a qualidade das informações do suporte.</p></div></Card>
    </div>
  </>
}
