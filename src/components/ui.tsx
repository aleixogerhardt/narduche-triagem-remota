import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'motion/react'
import { AlertCircle, LoaderCircle, X } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cn, priorityLabel, statusLabel } from '../lib/utils'
import type { TicketPriority, TicketStatus } from '../types/domain'

export function Button({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-indigo-400/20 bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-950/25 transition hover:-translate-y-px active:translate-y-0 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-50',
    className,
  )} {...props}>{children}</button>
}

export function SecondaryButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-700/80 bg-slate-900/65 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:-translate-y-px hover:border-slate-600 hover:bg-slate-800/75 active:translate-y-0 active:scale-[.985] disabled:opacity-50',
    className,
  )} {...props}>{children}</button>
}

export function DangerButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <SecondaryButton className={cn('border-red-500/25 bg-red-500/10 text-red-200 hover:bg-red-500/15', className)} {...props}>{children}</SecondaryButton>
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn('min-h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/65 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10', className)} {...props} />
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn('w-full rounded-xl border border-slate-700/80 bg-slate-950/65 px-3.5 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10', className)} {...props} />
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn('min-h-11 w-full rounded-xl border border-slate-700/80 bg-slate-950/65 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400/60 focus:ring-4 focus:ring-indigo-500/10', className)} {...props} />
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[.12em] text-slate-400">{children}</label>
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('surface rounded-2xl p-4 sm:p-5', className)}>{children}</motion.section>
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div>
      {eyebrow && <div className="mb-1 text-xs font-bold uppercase tracking-[.18em] text-indigo-300">{eyebrow}</div>}
      <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{title}</h1>
      {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{description}</p>}
    </div>
    {action}
  </div>
}

export function Spinner({ label = 'Carregando...' }: { label?: string }) {
  return <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-slate-400"><LoaderCircle className="h-5 w-5 animate-spin" />{label}</div>
}

export function EmptyState({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/25 px-5 py-10 text-center">
    <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800/80 text-slate-300">{icon ?? <AlertCircle className="h-5 w-5" />}</div>
    <h3 className="font-semibold text-slate-100">{title}</h3>
    <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-slate-500">{description}</p>
  </div>
}

const statusStyle: Record<TicketStatus, string> = {
  open: 'border-sky-400/25 bg-sky-400/10 text-sky-200',
  in_progress: 'border-amber-400/25 bg-amber-400/10 text-amber-200',
  waiting_customer: 'border-violet-400/25 bg-violet-400/10 text-violet-200',
  resolved: 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200',
  cancelled: 'border-slate-500/30 bg-slate-500/10 text-slate-300',
}
export function StatusBadge({ status }: { status: TicketStatus }) {
  return <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold', statusStyle[status])}>{statusLabel[status]}</span>
}

const priorityStyle: Record<TicketPriority, string> = {
  low: 'text-slate-400', normal: 'text-blue-300', high: 'text-amber-300', urgent: 'text-red-300',
}
export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return <span className={cn('text-xs font-semibold', priorityStyle[priority])}>{priorityLabel[priority]}</span>
}

export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(nextOpen) => {
        /*
          O Radix pode emitir "false" por eventos internos
          de foco, clique externo ou mudança de aba.

          Como o modal é controlado pela aplicação,
          ignoramos fechamentos implícitos.

          O fechamento é feito explicitamente pelo botão X,
          ESC ou pelo código da página após salvar.
        */
        if (nextOpen) {
          onOpenChange(true)
        }
      }}
    >
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm"
              />
            </Dialog.Overlay>

            <Dialog.Content
              asChild
              onEscapeKeyDown={(event) => {
                event.preventDefault()
                onOpenChange(false)
              }}
              onPointerDownOutside={(event) => {
                event.preventDefault()
              }}
              onFocusOutside={(event) => {
                event.preventDefault()
              }}
              onInteractOutside={(event) => {
                event.preventDefault()
              }}
            >
              <motion.div
                initial={{
                  opacity: 0,
                  scale: 0.97,
                  y: 14,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                  y: 8,
                }}
                className="glass fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl p-5 sm:p-6"
              >
                <div className="pr-10">
                  <Dialog.Title className="text-xl font-bold text-white">
                    {title}
                  </Dialog.Title>

                  {description && (
                    <Dialog.Description className="mt-1 text-sm leading-6 text-slate-400">
                      {description}
                    </Dialog.Description>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="mt-5">
                  {children}
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
