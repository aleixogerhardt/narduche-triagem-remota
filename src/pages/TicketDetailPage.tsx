import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarClock, CheckCircle2, FileText, Paperclip, Printer, UserRound, Wrench } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, Card, Label, PageHeader, Select, Spinner, StatusBadge, Textarea } from '../components/ui'
import { useAuth } from '../context/useAuth'
import { formatDate, friendlyError, statusLabel } from '../lib/utils'
import { useTicketRealtime } from '../lib/useTicketRealtime'
import { assignTicketToMe, getAttachmentSignedUrl, getTicket, listTicketAttachments, listTicketEvents, updateTicketStatus } from '../services/api'
import type { TicketStatus } from '../types/domain'

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  open: ['in_progress', 'cancelled'],
  in_progress: ['waiting_customer', 'resolved', 'cancelled'],
  waiting_customer: ['in_progress', 'resolved', 'cancelled'],
  resolved: [],
  cancelled: [],
}

export function TicketDetailPage() {
  useTicketRealtime()
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const qc = useQueryClient()
  const ticketQ = useQuery({ queryKey: ['ticket', id], queryFn: () => getTicket(id), enabled: Boolean(id) })
  const eventsQ = useQuery({ queryKey: ['ticket-events', id], queryFn: () => listTicketEvents(id), enabled: Boolean(id) })
  const filesQ = useQuery({ queryKey: ['ticket-files', id], queryFn: () => listTicketAttachments(id), enabled: Boolean(id) })
  const [status,setStatus]=useState<TicketStatus>('in_progress')
  const [note,setNote]=useState('')
  const staff=profile?.role==='technician'||profile?.role==='admin'
  const currentStatus = ticketQ.data?.status
  useEffect(() => {
    if (currentStatus) {
      const next = allowedTransitions[currentStatus][0]
      if (next) setStatus(next)
    }
  }, [currentStatus])

  async function refresh(){ await Promise.all([qc.invalidateQueries({queryKey:['ticket',id]}),qc.invalidateQueries({queryKey:['ticket-events',id]}),qc.invalidateQueries({queryKey:['tickets']})]) }
  const assign=useMutation({mutationFn:()=>assignTicketToMe(id),onSuccess:async()=>{toast.success('Chamado atribuído.');await refresh()},onError:e=>toast.error(friendlyError(e))})
  const update=useMutation({mutationFn:()=>updateTicketStatus(id,status,note),onSuccess:async()=>{toast.success('Status atualizado.');setNote('');await refresh()},onError:e=>toast.error(friendlyError(e))})
  async function openFile(path:string){try{window.open(await getAttachmentSignedUrl(path),'_blank','noopener,noreferrer')}catch(e){toast.error(friendlyError(e))}}

  if(ticketQ.isLoading)return <Spinner label="Carregando chamado..."/>
  if(!ticketQ.data)return <Card>Chamado não encontrado.</Card>
  const t=ticketQ.data
  return <><PageHeader eyebrow="Chamado técnico" title={t.ticket_number} description={`${t.issue_categories?.name ?? 'Ocorrência'} · ${t.companies?.name ?? ''}`} action={<StatusBadge status={t.status}/>}/>
  <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
    <div className="space-y-5">
      <Card><div className="grid gap-4 sm:grid-cols-2">{[[Printer,'Equipamento',`${t.printers?.name ?? '—'} · ${t.printers?.model ?? ''}`],[UserRound,'Solicitante',t.requester?.full_name ?? '—'],[Wrench,'Responsável',t.assignee?.full_name ?? 'Não atribuído'],[CalendarClock,'Aberto em',formatDate(t.created_at)]].map(([Icon,label,value])=>{const C=Icon as typeof Printer;return <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4"><C className="h-4 w-4 text-indigo-300"/><div className="mt-3 text-xs uppercase tracking-wider text-slate-600">{String(label)}</div><div className="mt-1 text-sm font-semibold text-slate-200">{String(value)}</div></div>})}</div><div className="mt-5"><div className="text-xs font-bold uppercase tracking-[.14em] text-slate-500">Descrição</div><p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-300">{t.description}</p></div>{t.resolution_note&&<div className="mt-5 rounded-xl border border-emerald-400/20 bg-emerald-400/8 p-4"><div className="flex items-center gap-2 font-semibold text-emerald-200"><CheckCircle2 className="h-4 w-4"/>Resolução</div><p className="mt-2 text-sm leading-6 text-emerald-100/80">{t.resolution_note}</p></div>}</Card>
      <Card><h2 className="font-bold text-white">Linha do tempo</h2><div className="mt-5 space-y-0">{eventsQ.data?.map((e,i)=><div key={e.id} className="relative flex gap-4 pb-6 last:pb-0"><div className="relative z-10 mt-1.5 h-3 w-3 shrink-0 rounded-full bg-indigo-400 ring-4 ring-indigo-400/10"/>{i!==(eventsQ.data?.length??0)-1&&<div className="absolute left-[5px] top-5 h-[calc(100%-8px)] w-px bg-slate-800"/>}<div><div className="text-sm font-semibold text-slate-200">{e.event_type==='created'?'Chamado criado':e.event_type==='assigned'?'Chamado atribuído':e.event_type==='status_changed'?'Status alterado':'Observação'}</div><div className="mt-1 text-xs text-slate-500">{formatDate(e.created_at)}{e.actor?.full_name?` · ${e.actor.full_name}`:''}</div>{e.note&&<p className="mt-2 text-sm leading-6 text-slate-400">{e.note}</p>}</div></div>)}</div></Card>
    </div>
    <div className="space-y-5">
      {staff&&<Card><h2 className="font-bold text-white">Ações técnicas</h2><p className="mt-1 text-xs leading-5 text-slate-500">As transições válidas são verificadas novamente no PostgreSQL.</p>{!t.assigned_to&&<Button onClick={()=>assign.mutate()} disabled={assign.isPending} className="mt-4 w-full">Assumir chamado</Button>}<div className="mt-4"><Label>Novo status</Label><Select value={status} onChange={e=>setStatus(e.target.value as TicketStatus)} disabled={allowedTransitions[t.status].length===0}>{allowedTransitions[t.status].map(next=><option key={next} value={next}>{statusLabel[next]}</option>)}</Select></div><div className="mt-3"><Label>Observação {status==='resolved'?'(obrigatória)':''}</Label><Textarea rows={4} value={note} onChange={e=>setNote(e.target.value)} placeholder="Descreva o andamento ou a solução aplicada."/></div><Button className="mt-3 w-full" onClick={()=>update.mutate()} disabled={update.isPending || allowedTransitions[t.status].length===0}>{allowedTransitions[t.status].length===0?'Chamado encerrado':'Atualizar atendimento'}</Button></Card>}
      <Card><div className="flex items-center gap-2"><Paperclip className="h-4 w-4 text-indigo-300"/><h2 className="font-bold text-white">Evidências</h2></div><div className="mt-4 space-y-2">{(filesQ.data?.length??0)===0?<p className="text-sm text-slate-500">Nenhum anexo.</p>:filesQ.data!.map(f=><button key={f.id} onClick={()=>openFile(f.storage_path)} className="flex w-full items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-3 text-left hover:border-slate-700"><FileText className="h-4 w-4 text-cyan-300"/><div className="min-w-0"><div className="truncate text-sm font-semibold text-slate-200">{f.original_name}</div><div className="text-xs text-slate-600">{Math.ceil(f.size_bytes/1024)} KB</div></div></button>)}</div></Card>
    </div>
  </div></>
}
