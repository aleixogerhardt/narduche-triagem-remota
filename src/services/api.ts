import { requireSupabase } from '../lib/supabase'

import type {
  Company,
  IssueCategory,
  Printer,
  Profile,
  Ticket,
  TicketAttachment,
  TicketEvent,
  TicketPriority,
  TicketStatus,
  TriageResponse,
  TriageSession,
  TriageStep,
} from '../types/domain'

const ticketSelect = `
  *,
  companies(name),
  printers(name,model,serial_number,location),
  issue_categories(name,icon),
  requester:profiles!tickets_requester_id_fkey(full_name,email),
  assignee:profiles!tickets_assigned_to_fkey(full_name,email)
`

function unwrap<T>(
  result: {
    data: T | null
    error: { message: string } | null
  },
): T {
  if (result.error) {
    throw new Error(result.error.message)
  }

  if (result.data == null) {
    throw new Error('O servidor não retornou dados.')
  }

  return result.data
}

/* =========================================================
   AUTENTICAÇÃO
   ========================================================= */

export async function signIn(
  email: string,
  password: string,
) {
  const client = requireSupabase()

  const {
    data,
    error,
  } = await client.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function signOut() {
  const {
    error,
  } = await requireSupabase().auth.signOut()

  if (error) {
    throw new Error(error.message)
  }
}

export async function getMyProfile(
  userId?: string,
): Promise<Profile> {
  const client = requireSupabase()

  let id = userId

  if (!id) {
    const {
      data: authData,
    } = await client.auth.getUser()

    id = authData.user?.id
  }

  if (!id) {
    throw new Error(
      'Sessão não encontrada.',
    )
  }

  const result = await client
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()

  return unwrap(
    result as never,
  ) as Profile
}

/* =========================================================
   EMPRESAS
   ========================================================= */

export async function listCompanies(): Promise<
  Company[]
> {
  const {
    data,
    error,
  } = await requireSupabase()
    .from('companies')
    .select('*')
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Company[]
}

function companyDatabaseError(
  error: {
    code?: string
    message?: string
    details?: string
  },
): Error {
  const message =
    error.message ?? ''

  /*
    Nome duplicado.
  */
  if (
    message.includes(
      'companies_name_ci_uq',
    )
  ) {
    return new Error(
      'Já existe uma empresa cadastrada com esse nome.',
    )
  }

  /*
    CNPJ/documento duplicado.
  */
  if (
    message.includes(
      'companies_document_uq',
    )
  ) {
    return new Error(
      'Já existe uma empresa cadastrada com esse CNPJ.',
    )
  }

  /*
    Tentativa de excluir empresa que ainda possui
    registros relacionados.
  */
  if (
    error.code === '23503' ||
    message.includes(
      'foreign key constraint',
    )
  ) {
    return new Error(
      'Esta empresa possui usuários, impressoras, triagens ou chamados vinculados e não pode ser excluída. Desative a empresa para preservar o histórico.',
    )
  }

  return new Error(
    message ||
      'Não foi possível concluir a operação com a empresa.',
  )
}

export async function saveCompany(
  input: Partial<Company> &
    Pick<Company, 'name'>,
): Promise<Company> {
  const client = requireSupabase()

  const payload = {
    name: input.name.trim(),

    /*
      O banco recebe CNPJ somente com números.
    */
    document:
      input.document
        ?.replace(/\D/g, '')
        .trim() || null,

    contact_email:
      input.contact_email
        ?.trim()
        .toLowerCase() || null,

    /*
      O banco recebe telefone somente com números.
    */
    contact_phone:
      input.contact_phone
        ?.replace(/\D/g, '')
        .trim() || null,

    active:
      input.active ?? true,
  }

  if (input.id) {
    const {
      data,
      error,
    } = await client
      .from('companies')
      .update(payload)
      .eq('id', input.id)
      .select()
      .single()

    if (error) {
      throw companyDatabaseError(
        error,
      )
    }

    if (!data) {
      throw new Error(
        'A empresa não foi encontrada após a atualização.',
      )
    }

    return data as Company
  }

  const {
    data,
    error,
  } = await client
    .from('companies')
    .insert(payload)
    .select()
    .single()

  if (error) {
    throw companyDatabaseError(
      error,
    )
  }

  if (!data) {
    throw new Error(
      'O servidor não retornou a empresa cadastrada.',
    )
  }

  return data as Company
}

export async function deleteCompany(
  companyId: string,
): Promise<void> {
  const {
    error,
  } = await requireSupabase()
    .from('companies')
    .delete()
    .eq('id', companyId)

  if (error) {
    throw companyDatabaseError(
      error,
    )
  }
}

/* =========================================================
   IMPRESSORAS
   ========================================================= */

export async function listPrinters(): Promise<
  Printer[]
> {
  const {
    data,
    error,
  } = await requireSupabase()
    .from('printers')
    .select(
      '*, companies(name)',
    )
    .order('name')

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Printer[]
}

export async function savePrinter(
  input: Partial<Printer> &
    Pick<
      Printer,
      | 'company_id'
      | 'name'
      | 'model'
      | 'serial_number'
    >,
): Promise<Printer> {
  const client = requireSupabase()

  const payload = {
    company_id:
      input.company_id,

    name:
      input.name.trim(),

    manufacturer:
      input.manufacturer
        ?.trim() || null,

    model:
      input.model.trim(),

    serial_number:
      input.serial_number.trim(),

    asset_tag:
      input.asset_tag
        ?.trim() || null,

    location:
      input.location
        ?.trim() || null,

    notes:
      input.notes
        ?.trim() || null,

    active:
      input.active ?? true,
  }

  if (input.id) {
    const result = await client
      .from('printers')
      .update(payload)
      .eq(
        'id',
        input.id,
      )
      .select()
      .single()

    return unwrap(
      result as never,
    ) as Printer
  }

  const result = await client
    .from('printers')
    .insert(payload)
    .select()
    .single()

  return unwrap(
    result as never,
  ) as Printer
}

/* =========================================================
   CATEGORIAS E TRIAGEM
   ========================================================= */

export async function listCategories(): Promise<
  IssueCategory[]
> {
  const {
    data,
    error,
  } = await requireSupabase()
    .from(
      'issue_categories',
    )
    .select('*')
    .eq('active', true)
    .order('sort_order')

  if (error) {
    throw new Error(error.message)
  }

  return (
    data ?? []
  ) as IssueCategory[]
}

export async function listSteps(
  categoryId: string,
): Promise<TriageStep[]> {
  const {
    data,
    error,
  } = await requireSupabase()
    .from('triage_steps')
    .select('*')
    .eq(
      'category_id',
      categoryId,
    )
    .eq('active', true)
    .order('sort_order')

  if (error) {
    throw new Error(error.message)
  }

  return (
    data ?? []
  ) as TriageStep[]
}

export async function startTriage(
  printerId: string,
  categoryId: string,
): Promise<TriageSession> {
  const result =
    await requireSupabase().rpc(
      'start_triage',
      {
        p_printer_id:
          printerId,

        p_category_id:
          categoryId,
      },
    )

  return unwrap(
    result as never,
  ) as TriageSession
}

export async function saveTriageAnswer(
  sessionId: string,
  stepId: string,
  response: TriageResponse,
  notes?: string,
) {
  const {
    data,
    error,
  } = await requireSupabase()
    .from(
      'triage_answers',
    )
    .upsert(
      {
        session_id:
          sessionId,

        step_id:
          stepId,

        response,

        notes:
          notes?.trim() ||
          null,
      },
      {
        onConflict:
          'session_id,step_id',
      },
    )
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function recordRemoteResolution(
  sessionId: string,
  note: string,
) {
  const result =
    await requireSupabase().rpc(
      'record_remote_resolution',
      {
        p_session_id:
          sessionId,

        p_note:
          note,
      },
    )

  return unwrap(
    result as never,
  )
}

export async function createTicketFromTriage(
  sessionId: string,
  description: string,
  priority: TicketPriority,
): Promise<Ticket> {
  const result =
    await requireSupabase().rpc(
      'create_ticket_from_triage',
      {
        p_session_id:
          sessionId,

        p_description:
          description,

        p_priority:
          priority,
      },
    )

  return unwrap(
    result as never,
  ) as Ticket
}

/* =========================================================
   CHAMADOS
   ========================================================= */

export async function listTickets(): Promise<
  Ticket[]
> {
  const {
    data,
    error,
  } = await requireSupabase()
    .from('tickets')
    .select(ticketSelect)
    .order(
      'created_at',
      {
        ascending: false,
      },
    )

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as Ticket[]
}

export async function getTicket(
  id: string,
): Promise<Ticket> {
  const result =
    await requireSupabase()
      .from('tickets')
      .select(ticketSelect)
      .eq('id', id)
      .single()

  return unwrap(
    result as never,
  ) as Ticket
}

export async function listTicketEvents(
  ticketId: string,
): Promise<TicketEvent[]> {
  const {
    data,
    error,
  } = await requireSupabase()
    .from(
      'ticket_events',
    )
    .select(
      '*, actor:profiles!ticket_events_actor_id_fkey(full_name)',
    )
    .eq(
      'ticket_id',
      ticketId,
    )
    .order('created_at')

  if (error) {
    throw new Error(error.message)
  }

  return (
    data ?? []
  ) as TicketEvent[]
}

export async function listTicketAttachments(
  ticketId: string,
): Promise<TicketAttachment[]> {
  const {
    data,
    error,
  } = await requireSupabase()
    .from(
      'ticket_attachments',
    )
    .select('*')
    .eq(
      'ticket_id',
      ticketId,
    )
    .order('created_at')

  if (error) {
    throw new Error(error.message)
  }

  return (
    data ?? []
  ) as TicketAttachment[]
}

export async function assignTicketToMe(
  ticketId: string,
): Promise<Ticket> {
  const result =
    await requireSupabase().rpc(
      'assign_ticket_to_me',
      {
        p_ticket_id:
          ticketId,
      },
    )

  return unwrap(
    result as never,
  ) as Ticket
}

export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus,
  note?: string,
): Promise<Ticket> {
  const result =
    await requireSupabase().rpc(
      'update_ticket_status',
      {
        p_ticket_id:
          ticketId,

        p_status:
          status,

        p_note:
          note ?? null,
      },
    )

  return unwrap(
    result as never,
  ) as Ticket
}

/* =========================================================
   ANEXOS
   ========================================================= */

export async function uploadTicketEvidence(
  ticketId: string,
  file: File,
): Promise<TicketAttachment> {
  if (
    file.size >
    8 * 1024 * 1024
  ) {
    throw new Error(
      'O arquivo deve ter no máximo 8 MB.',
    )
  }

  const client =
    requireSupabase()

  const {
    data: authData,
  } =
    await client.auth.getUser()

  if (!authData.user) {
    throw new Error(
      'Sessão expirada.',
    )
  }

  const safeName =
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    )

  const path =
    `${authData.user.id}/${ticketId}/${crypto.randomUUID()}-${safeName}`

  const {
    error: uploadError,
  } = await client.storage
    .from(
      'ticket-evidence',
    )
    .upload(
      path,
      file,
      {
        upsert: false,

        contentType:
          file.type ||
          undefined,
      },
    )

  if (uploadError) {
    throw new Error(
      uploadError.message,
    )
  }

  const {
    data,
    error,
  } = await client
    .from(
      'ticket_attachments',
    )
    .insert({
      ticket_id:
        ticketId,

      uploader_id:
        authData.user.id,

      storage_path:
        path,

      original_name:
        file.name,

      mime_type:
        file.type ||
        'application/octet-stream',

      size_bytes:
        file.size,
    })
    .select()
    .single()

  if (error) {
    await client.storage
      .from(
        'ticket-evidence',
      )
      .remove([path])

    throw new Error(
      error.message,
    )
  }

  return data as TicketAttachment
}

export async function getAttachmentSignedUrl(
  path: string,
) {
  const {
    data,
    error,
  } = await requireSupabase()
    .storage
    .from(
      'ticket-evidence',
    )
    .createSignedUrl(
      path,
      120,
    )

  if (error) {
    throw new Error(error.message)
  }

  return data.signedUrl
}

/* =========================================================
   REALTIME
   ========================================================= */

export function subscribeTickets(
  onChange: () => void,
) {
  const client =
    requireSupabase()

  const channel =
    client
      .channel(
        'narduche-tickets',
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tickets',
        },
        onChange,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table:
            'ticket_events',
        },
        onChange,
      )
      .subscribe()

  return () => {
    void client.removeChannel(
      channel,
    )
  }
}