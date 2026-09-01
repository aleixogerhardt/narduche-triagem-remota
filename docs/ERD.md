# DER lógico — Narduche v6

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : possui
  COMPANIES ||--o{ PROFILES : vincula
  COMPANIES ||--o{ PRINTERS : possui
  COMPANIES ||--o{ TRIAGE_SESSIONS : contextualiza
  COMPANIES ||--o{ TICKETS : contextualiza

  ISSUE_CATEGORIES ||--o{ TRIAGE_STEPS : possui
  ISSUE_CATEGORIES ||--o{ TRIAGE_SESSIONS : classifica
  ISSUE_CATEGORIES ||--o{ TICKETS : classifica

  PROFILES ||--o{ TRIAGE_SESSIONS : solicita
  PRINTERS ||--o{ TRIAGE_SESSIONS : passa_por
  TRIAGE_SESSIONS ||--o{ TRIAGE_ANSWERS : registra
  TRIAGE_STEPS ||--o{ TRIAGE_ANSWERS : recebe
  TRIAGE_SESSIONS ||--o| REMOTE_RESOLUTIONS : encerra_remotamente
  TRIAGE_SESSIONS ||--o| TICKETS : escala

  PROFILES ||--o{ TICKETS : solicita
  PROFILES ||--o{ TICKETS : atende
  PRINTERS ||--o{ TICKETS : origina
  TICKETS ||--o{ TICKET_EVENTS : historico
  TICKETS ||--o{ TICKET_ATTACHMENTS : evidencia
  PROFILES ||--o{ TICKET_EVENTS : executa
  PROFILES ||--o{ TICKET_ATTACHMENTS : envia
```

## Decisões de modelagem

- dados cadastrais, triagem, atendimento, histórico e evidências possuem responsabilidades separadas;
- `tickets` guarda o estado atual; `ticket_events` guarda o histórico imutável das mudanças operacionais;
- uma sessão de triagem pode terminar em resolução remota **ou** ser escalada para no máximo um chamado;
- anexos ficam no Storage privado; o PostgreSQL armazena apenas metadados e o caminho controlado;
- `audit_log` é separado do histórico do chamado porque registra alterações administrativas em diferentes entidades.
