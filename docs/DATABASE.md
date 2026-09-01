# Modelo de dados — Narduche v6

## Entidades principais

```text
companies
  ├── profiles
  ├── printers
  │     ├── triage_sessions
  │     │      ├── triage_answers
  │     │      ├── remote_resolutions
  │     │      └── tickets
  │     └── tickets
  └── tickets
         ├── ticket_events
         └── ticket_attachments

issue_categories
  ├── triage_steps
  ├── triage_sessions
  └── tickets
```

## Integridade

- todas as chaves primárias de domínio usam UUID;
- `profiles.id` é o mesmo UUID de `auth.users.id`;
- relações importantes usam `ON DELETE RESTRICT` para preservar histórico;
- anexos e eventos usam `ON DELETE CASCADE` somente quando pertencem integralmente ao chamado;
- empresa possui nome único sem diferença de maiúsculas/minúsculas;
- número de série da impressora é único sem diferença de maiúsculas/minúsculas;
- uma triagem pode gerar no máximo um chamado (`triage_session_id UNIQUE`);
- cada passo recebe no máximo uma resposta por sessão (`UNIQUE(session_id, step_id)`);
- campos textuais e tamanhos de anexos possuem `CHECK` no banco, além da validação no frontend.

## Índices

Foram criados índices para os filtros mais prováveis:

- chamados por empresa e data;
- chamados por solicitante e data;
- chamados por status e data;
- chamados por técnico/status;
- impressoras por empresa/status;
- triagens por solicitante/status;
- eventos e anexos por chamado;
- auditoria por tabela/data.

## Rastreabilidade

`ticket_events` mantém a linha do tempo operacional do chamado. `audit_log` captura INSERT/UPDATE/DELETE de empresas, perfis, impressoras e chamados, preservando `old_data` e `new_data` em JSONB.

## Persistência e concorrência

RPCs críticas utilizam `SELECT ... FOR UPDATE`, reduzindo risco de duas ações simultâneas finalizarem a mesma triagem ou alterarem o mesmo chamado de forma incompatível.
