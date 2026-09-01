import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, EmptyState, Input, PageHeader, PriorityBadge, Spinner, StatusBadge } from '../components/ui'
import { formatDate } from '../lib/utils'
import { useTicketRealtime } from '../lib/useTicketRealtime'
import { listTickets } from '../services/api'
import type { TicketStatus } from '../types/domain'

export function TicketsPage() {
  useTicketRealtime()
  const query = useQuery({ queryKey: ['tickets'], queryFn: listTickets, refetchInterval: 30000 })
  const [search,setSearch]=useState('')
  const [status,setStatus]=useState<TicketStatus|'all'>('all')
  const filtered=useMemo(()=> (query.data??[]).filter(t=>{
    const hay=[t.ticket_number,t.description,t.printers?.name,t.printers?.model,t.companies?.name,t.requester?.full_name].join(' ').toLowerCase()
    return (status==='all'||t.status===status) && hay.includes(search.toLowerCase())
  }),[query.data,search,status])
  if(query.isLoading)return <Spinner label="Carregando chamados..."/>
  return <><PageHeader eyebrow="Atendimento" title="Chamados" description="Os registros são compartilhados entre os dispositivos autorizados por meio do PostgreSQL."/>
  <Card className="mb-4"><div className="grid gap-3 md:grid-cols-[1fr_auto]"><div className="relative"><Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-600"/><Input className="pl-9" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar por protocolo, equipamento, empresa ou solicitante..."/></div><select value={status} onChange={e=>setStatus(e.target.value as TicketStatus|'all')} className="min-h-11 rounded-xl border border-slate-700 bg-slate-950/65 px-3 text-sm text-slate-200"><option value="all">Todos os status</option><option value="open">Aberto</option><option value="in_progress">Em atendimento</option><option value="waiting_customer">Aguardando cliente</option><option value="resolved">Resolvido</option><option value="cancelled">Cancelado</option></select></div></Card>
  <Card>{filtered.length===0?<EmptyState title="Nenhum chamado encontrado" description="Ajuste os filtros ou conclua uma triagem sem resolução para criar um chamado." icon={<ClipboardList className="h-5 w-5"/>}/>:<div className="divide-y divide-slate-800/80">{filtered.map(t=><Link to={`/chamados/${t.id}`} key={t.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 sm:grid-cols-[1fr_auto] sm:items-center"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-bold text-slate-100">{t.ticket_number}</span><StatusBadge status={t.status}/><PriorityBadge priority={t.priority}/></div><div className="mt-2 truncate text-sm text-slate-300">{t.issue_categories?.name} · {t.printers?.name}</div><div className="mt-1 truncate text-xs text-slate-500">{t.companies?.name ?? 'Empresa'} · {t.requester?.full_name ?? 'Solicitante'} · {formatDate(t.created_at)}</div></div><div className="text-xs font-semibold text-indigo-300">Abrir detalhes →</div></Link>)}</div>}</Card></>
}
