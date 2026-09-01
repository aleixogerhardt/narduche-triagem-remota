# Changelog

## v6.0.0

### Arquitetura
- reescrita do frontend em React + TypeScript + Vite;
- removido `localStorage` como repositório operacional;
- Supabase/PostgreSQL passa a ser obrigatório para dados reais;
- TanStack Query centraliza consultas, invalidação e sincronização;
- React Router organiza rotas e proteção por perfil;
- React Hook Form + Zod validam formulários;
- Tailwind CSS + Radix UI estruturam o design system;
- Motion adiciona transições e microinterações;
- Sonner substitui alerts nativos.

### Banco
- migrations versionadas;
- modelo relacional normalizado;
- PK/FK/UNIQUE/CHECK;
- índices operacionais;
- RLS para cliente, técnico e administrador;
- RPC transacional para início/finalização de triagem e abertura de chamado;
- bloqueio de transições inválidas de status;
- `ticket_events` para histórico;
- `audit_log` para alterações críticas;
- Storage privado com limite de 8 MB e URL assinada;
- Realtime em `tickets` e `ticket_events`.

### UX
- nova tela de login;
- dashboard responsivo;
- central de empresas;
- central de equipamentos;
- triagem guiada animada;
- central de chamados em tempo real;
- detalhes com timeline e anexos;
- navegação mobile e desktop.
