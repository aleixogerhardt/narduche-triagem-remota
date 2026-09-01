import type { TicketPriority, TicketStatus } from '../types/domain'

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

export const statusLabel: Record<TicketStatus, string> = {
  open: 'Aberto',
  in_progress: 'Em atendimento',
  waiting_customer: 'Aguardando cliente',
  resolved: 'Resolvido',
  cancelled: 'Cancelado',
}

export const priorityLabel: Record<TicketPriority, string> = {
  low: 'Baixa', normal: 'Normal', high: 'Alta', urgent: 'Urgente',
}

export function friendlyError(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error && 'message' in error) return String((error as { message: unknown }).message)
  return 'Ocorreu um erro inesperado.'
}
