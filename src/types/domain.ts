export type UserRole = 'client' | 'technician' | 'admin'
export type TicketStatus = 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'cancelled'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TriageResponse = 'resolved' | 'not_resolved' | 'skipped'

export interface Profile {
  id: string
  company_id: string | null
  full_name: string
  email: string
  role: UserRole
  active: boolean
}

export interface Company {
  id: string
  name: string
  document: string | null
  contact_email: string | null
  contact_phone: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Printer {
  id: string
  company_id: string
  name: string
  manufacturer: string | null
  model: string
  serial_number: string
  asset_tag: string | null
  location: string | null
  notes: string | null
  active: boolean
  created_at: string
  updated_at: string
  companies?: { name: string } | null
}

export interface IssueCategory {
  id: string
  slug: string
  name: string
  description: string
  icon: string
  active: boolean
  sort_order: number
}

export interface TriageStep {
  id: string
  category_id: string
  sort_order: number
  title: string
  instruction: string
  safety_note: string | null
  media_url: string | null
  active: boolean
}

export interface TriageSession {
  id: string
  company_id: string
  requester_id: string
  printer_id: string
  category_id: string
  status: 'started' | 'resolved_remote' | 'escalated' | 'abandoned'
  started_at: string
  completed_at: string | null
}

export interface Ticket {
  id: string
  ticket_number: string
  company_id: string
  requester_id: string
  assigned_to: string | null
  printer_id: string
  category_id: string
  triage_session_id: string | null
  status: TicketStatus
  priority: TicketPriority
  description: string
  resolution_note: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
  companies?: { name: string } | null
  printers?: { name: string; model: string; serial_number: string; location: string | null } | null
  issue_categories?: { name: string; icon: string } | null
  requester?: { full_name: string; email: string } | null
  assignee?: { full_name: string; email: string } | null
}

export interface TicketEvent {
  id: string
  ticket_id: string
  actor_id: string | null
  event_type: 'created' | 'assigned' | 'status_changed' | 'note'
  from_status: TicketStatus | null
  to_status: TicketStatus | null
  note: string | null
  created_at: string
  actor?: { full_name: string } | null
}

export interface TicketAttachment {
  id: string
  ticket_id: string
  uploader_id: string
  storage_path: string
  original_name: string
  mime_type: string
  size_bytes: number
  created_at: string
}
