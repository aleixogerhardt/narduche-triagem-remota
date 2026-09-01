# Arquitetura — Narduche v6

## Objetivo

A v6 elimina o `localStorage` como fonte de verdade dos dados operacionais. Empresas, impressoras, triagens, respostas, chamados, eventos e evidências ficam em um PostgreSQL centralizado via Supabase.

## Camadas

```text
React + TypeScript
      │
      ├── React Router: navegação e proteção de rotas
      ├── Tailwind: design responsivo
      ├── Motion: animações e microinterações
      ├── TanStack Query: cache de servidor, invalidação e refetch
      ├── React Hook Form + Zod: formulários e validação
      │
      ▼
services/api.ts
      │
      ▼
Supabase JS
      │
      ├── Auth
      ├── PostgREST/RPC
      ├── Realtime
      └── Storage privado
      │
      ▼
PostgreSQL
      ├── PK / FK / UNIQUE / CHECK
      ├── índices
      ├── transações via funções RPC
      ├── RLS
      └── auditoria
```

## Por que os dados agora persistem entre máquinas?

Na v5, o modo de demonstração salvava o estado em `localStorage`, que pertence a um navegador específico. Dois computadores possuem armazenamentos independentes.

Na v6, o navegador nunca é o banco principal. Após autenticação, o frontend consulta o mesmo projeto Supabase. Assim, um chamado criado no celular é uma linha na tabela `public.tickets` e pode ser lido no PC conforme as políticas RLS.

## Separação de responsabilidades

- `src/pages`: telas e fluxo de interação.
- `src/components`: design system e layout reutilizável.
- `src/context`: sessão e perfil do usuário.
- `src/services/api.ts`: acesso a dados; as páginas não escrevem SQL.
- `src/lib`: cliente Supabase e utilitários.
- `supabase/migrations`: evolução versionada do banco.

## Operações transacionais

A abertura de chamado usa `create_ticket_from_triage`. A função bloqueia a sessão, valida o proprietário, cria o chamado, cria o evento inicial e finaliza a sessão de triagem dentro de uma única transação do PostgreSQL.

Isso evita um estado parcial como “chamado criado sem sessão marcada como escalada”.
