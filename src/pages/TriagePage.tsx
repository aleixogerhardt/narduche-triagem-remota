import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, Link2, Printer as PrinterIcon, RotateCcw, ShieldAlert, Sparkles, Upload, Wrench } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button, Card, EmptyState, Input, Label, PageHeader, SecondaryButton, Select, Spinner, Textarea } from '../components/ui'
import { friendlyError } from '../lib/utils'
import { createTicketFromTriage, listCategories, listPrinters, listSteps, recordRemoteResolution, saveTriageAnswer, startTriage, uploadTicketEvidence } from '../services/api'
import type { IssueCategory, Printer, TicketPriority, TriageSession, TriageStep } from '../types/domain'

const icons: Record<string, typeof Wrench> = { toner: Sparkles, paper: PrinterIcon, connection: Link2, quality: CircleHelp, noise: AlertTriangle, other: Wrench }

type Stage = 'select' | 'steps' | 'resolved' | 'escalate' | 'done'

export function TriagePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const printersQ = useQuery({ queryKey: ['printers'], queryFn: listPrinters })
  const categoriesQ = useQuery({ queryKey: ['categories'], queryFn: listCategories })
  const [printer, setPrinter] = useState<Printer | null>(null)
  const [category, setCategory] = useState<IssueCategory | null>(null)
  const [session, setSession] = useState<TriageSession | null>(null)
  const [steps, setSteps] = useState<TriageStep[]>([])
  const [index, setIndex] = useState(0)
  const [stage, setStage] = useState<Stage>('select')
  const [busy, setBusy] = useState(false)
  const [resolutionNote, setResolutionNote] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TicketPriority>('normal')
  const [file, setFile] = useState<File | null>(null)
  const progress = steps.length ? Math.round(((index + 1) / steps.length) * 100) : 0
  const current = steps[index]
  const canStart = printer && category

  const selectedSummary = useMemo(() => printer && category ? `${printer.name} · ${category.name}` : '', [printer, category])

  if (printersQ.isLoading || categoriesQ.isLoading) return <Spinner label="Preparando triagem..." />

  async function begin() {
    if (!printer || !category) return
    setBusy(true)
    try {
      const loadedSteps = await listSteps(category.id)
      if (!loadedSteps.length) throw new Error('A categoria selecionada não possui etapas ativas.')
      const newSession = await startTriage(printer.id, category.id)
      setSession(newSession); setSteps(loadedSteps); setIndex(0); setStage('steps')
    } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }

  async function answer(resolved: boolean) {
    if (!session || !current) return
    setBusy(true)
    try {
      await saveTriageAnswer(session.id, current.id, resolved ? 'resolved' : 'not_resolved')
      if (resolved) { setStage('resolved'); return }
      if (index < steps.length - 1) setIndex(i => i + 1)
      else setStage('escalate')
    } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }

  async function finishRemote() {
    if (!session) return
    if (resolutionNote.trim().length < 3) return toast.error('Descreva brevemente o que resolveu o problema.')
    setBusy(true)
    try {
      await recordRemoteResolution(session.id, resolutionNote)
      toast.success('Resolução remota registrada.')
      await qc.invalidateQueries({ queryKey: ['tickets'] })
      setStage('done')
    } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }

  async function escalate() {
    if (!session) return
    if (description.trim().length < 10) return toast.error('Descreva o problema com pelo menos 10 caracteres.')
    setBusy(true)
    try {
      const ticket = await createTicketFromTriage(session.id, description, priority)
      if (file) {
        try {
          await uploadTicketEvidence(ticket.id, file)
        } catch (uploadError) {
          toast.warning(`O chamado foi criado, mas o anexo não foi enviado: ${friendlyError(uploadError)}`)
        }
      }
      await qc.invalidateQueries({ queryKey: ['tickets'] })
      toast.success(`Chamado ${ticket.ticket_number} criado.`)
      navigate(`/chamados/${ticket.id}`)
    } catch (e) { toast.error(friendlyError(e)) } finally { setBusy(false) }
  }

  function reset() {
    setPrinter(null); setCategory(null); setSession(null); setSteps([]); setIndex(0); setStage('select'); setResolutionNote(''); setDescription(''); setFile(null); setPriority('normal')
  }

  return <>
    <PageHeader eyebrow="Triagem remota" title="Diagnóstico guiado" description="Escolha o equipamento e siga todas as verificações seguras. O chamado só é escalado quando a triagem não resolve a falha." />
    <AnimatePresence mode="wait">
      {stage === 'select' && <motion.div key="select" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]">
        <Card><div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-300"><PrinterIcon className="h-5 w-5"/></div><div><h2 className="font-bold text-white">1. Equipamento</h2><p className="text-xs text-slate-500">Somente máquinas autorizadas para sua empresa.</p></div></div>
          {(printersQ.data?.length ?? 0) === 0 ? <EmptyState title="Sem equipamentos" description="Nenhuma impressora ativa foi encontrada para esta conta." /> : <div className="space-y-2">{printersQ.data!.map(p=><button key={p.id} onClick={()=>setPrinter(p)} className={`w-full rounded-xl border p-3 text-left transition ${printer?.id===p.id?'border-indigo-400/50 bg-indigo-500/10':'border-slate-800 bg-slate-950/25 hover:border-slate-700'}`}><div className="text-sm font-semibold text-slate-200">{p.name}</div><div className="mt-1 text-xs text-slate-500">{p.model} · {p.location || 'Local não informado'}</div></button>)}</div>}
        </Card>
        <Card><div className="mb-4 flex items-center gap-3"><div className="rounded-xl bg-cyan-500/10 p-2.5 text-cyan-300"><Wrench className="h-5 w-5"/></div><div><h2 className="font-bold text-white">2. Tipo de problema</h2><p className="text-xs text-slate-500">Cada categoria possui um checklist específico.</p></div></div>
          <div className="grid gap-2 sm:grid-cols-2">{categoriesQ.data?.map(c=>{const Icon=icons[c.icon]??Wrench;return <button key={c.id} onClick={()=>setCategory(c)} className={`rounded-xl border p-4 text-left transition ${category?.id===c.id?'border-cyan-400/50 bg-cyan-500/10':'border-slate-800 bg-slate-950/25 hover:border-slate-700'}`}><Icon className="h-5 w-5 text-cyan-300"/><div className="mt-3 text-sm font-semibold text-slate-200">{c.name}</div><div className="mt-1 text-xs leading-5 text-slate-500">{c.description}</div></button>})}</div>
          <Button onClick={begin} disabled={!canStart || busy} className="mt-5 w-full">{busy?'Iniciando...':<>Começar triagem <ArrowRight className="h-4 w-4"/></>}</Button>
        </Card>
      </motion.div>}

      {stage === 'steps' && current && <motion.div key={`step-${current.id}`} initial={{opacity:0,x:16}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-12}} className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between text-xs text-slate-500"><span>{selectedSummary}</span><span>Passo {index+1} de {steps.length}</span></div>
        <div className="mb-5 h-2 overflow-hidden rounded-full bg-slate-800"><motion.div animate={{width:`${progress}%`}} className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400" /></div>
        <Card className="p-5 sm:p-7"><div className="flex items-start gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-500/10 text-indigo-300"><span className="text-lg font-black">{index+1}</span></div><div><h2 className="text-xl font-bold text-white">{current.title}</h2><p className="mt-3 text-sm leading-7 text-slate-300">{current.instruction}</p></div></div>
        {current.safety_note && <div className="mt-6 flex gap-3 rounded-xl border border-amber-400/20 bg-amber-400/8 p-4 text-sm leading-6 text-amber-100"><ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300"/><div><strong>Segurança:</strong> {current.safety_note}</div></div>}
        <div className="mt-7 grid gap-3 sm:grid-cols-2"><SecondaryButton onClick={()=>answer(false)} disabled={busy}>Não resolveu {index < steps.length-1 && <ArrowRight className="h-4 w-4"/>}</SecondaryButton><Button onClick={()=>answer(true)} disabled={busy}><CheckCircle2 className="h-4 w-4"/>Problema resolvido</Button></div></Card>
      </motion.div>}

      {stage === 'resolved' && <motion.div key="resolved" initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}} className="mx-auto max-w-2xl"><Card><div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300"><CheckCircle2 className="h-7 w-7"/></div><h2 className="mt-5 text-2xl font-bold text-white">Ótimo — a triagem resolveu</h2><p className="mt-2 text-sm leading-7 text-slate-400">Registre brevemente o que solucionou a falha. Isso gera uma resolução remota rastreável sem abrir chamado técnico.</p><div className="mt-5"><Label>Observação de resolução</Label><Textarea rows={4} value={resolutionNote} onChange={e=>setResolutionNote(e.target.value)} placeholder="Ex.: havia um fragmento de papel na tampa traseira; após remover e reiniciar, o equipamento voltou a imprimir."/></div><div className="mt-4 flex gap-3"><SecondaryButton onClick={()=>setStage('steps')}><ArrowLeft className="h-4 w-4"/>Voltar</SecondaryButton><Button onClick={finishRemote} disabled={busy} className="flex-1">{busy?'Salvando...':'Registrar resolução'}</Button></div></Card></motion.div>}

      {stage === 'escalate' && <motion.div key="escalate" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} className="mx-auto max-w-2xl"><Card><div className="grid h-14 w-14 place-items-center rounded-2xl bg-amber-400/10 text-amber-300"><AlertTriangle className="h-7 w-7"/></div><h2 className="mt-5 text-2xl font-bold text-white">Triagem concluída sem resolução</h2><p className="mt-2 text-sm leading-7 text-slate-400">Todas as verificações foram registradas. Agora descreva o comportamento observado para criar um chamado já contextualizado.</p><div className="mt-5"><Label>Descrição do problema</Label><Textarea rows={5} value={description} onChange={e=>setDescription(e.target.value)} placeholder="Informe mensagens do visor, quando a falha acontece e o que já foi observado."/></div><div className="mt-4 grid gap-4 sm:grid-cols-2"><div><Label>Prioridade</Label><Select value={priority} onChange={e=>setPriority(e.target.value as TicketPriority)}><option value="low">Baixa</option><option value="normal">Normal</option><option value="high">Alta</option><option value="urgent">Urgente</option></Select></div><div><Label>Evidência opcional</Label><label className="flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-950/30 px-3 text-sm text-slate-400 hover:border-indigo-400/40"><Upload className="h-4 w-4"/><span className="truncate">{file?.name ?? 'Foto, PDF ou log (até 8 MB)'}</span><Input type="file" className="hidden" accept="image/jpeg,image/png,image/webp,text/plain,application/pdf,.log" onChange={e=>setFile(e.target.files?.[0]??null)}/></label></div></div><Button onClick={escalate} disabled={busy} className="mt-5 w-full">{busy?'Criando chamado...':'Abrir chamado técnico'}</Button></Card></motion.div>}

      {stage === 'done' && <motion.div key="done" initial={{opacity:0,scale:.98}} animate={{opacity:1,scale:1}} className="mx-auto max-w-xl"><Card className="text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-400/10 text-emerald-300"><CheckCircle2 className="h-8 w-8"/></div><h2 className="mt-5 text-2xl font-bold text-white">Triagem encerrada</h2><p className="mt-2 text-sm leading-7 text-slate-400">A resolução foi registrada no banco central da Narduche.</p><Button onClick={reset} className="mt-5"><RotateCcw className="h-4 w-4"/>Fazer outra triagem</Button></Card></motion.div>}
    </AnimatePresence>
  </>
}
