# Narduche v6 — Triagem Remota

Reestruturação profissional do MVP de triagem remota. Esta versão foi criada especificamente para corrigir o maior problema da v5: **dados e chamados não podem depender do navegador onde foram criados**.

## Mudança principal da v6

A v5 possuía um modo `demo` que usava `localStorage`. Esse armazenamento é local de cada navegador, portanto um chamado criado em um PC não aparecia automaticamente em outro PC ou celular.

A v6 **não possui mais banco operacional em localStorage**.

```text
Celular ─┐
         ├── Internet ── Supabase ── PostgreSQL
PC ──────┤                    │
Tablet ──┘                    ├── Auth
                              ├── RLS
                              ├── Realtime
                              └── Storage privado
```

Todos os dispositivos autorizados consultam a mesma base de dados.

---

## Stack

### Frontend
- React 19 + TypeScript
- Vite 8
- React Router 7
- Tailwind CSS 4
- Motion for React (sucessor do Framer Motion)
- Radix UI primitives
- Lucide React
- Sonner
- React Hook Form + Zod
- TanStack Query v5

### Backend / dados
- Supabase
- PostgreSQL
- Supabase Auth
- Row Level Security (RLS)
- PostgreSQL RPCs transacionais
- Supabase Realtime
- Supabase Storage privado
- auditoria em `audit_log`

---

# 1. Requisitos

Use **Node.js 22 ou superior**.

Confirme:

```bash
node -v
npm -v
```

---

# 2. Instalar o frontend

Na pasta do projeto:

```bash
npm install
```

Depois:

```bash
npm run dev
```

O Vite mostrará algo como:

```text
http://localhost:5173
```

Por padrão o servidor aceita acesso pela rede local, então no celular também poderá ser aberto pelo IP do computador, por exemplo:

```text
http://192.168.0.20:5173
```

---

# 3. Criar o banco Supabase

Crie um projeto no Supabase.

Depois copie `.env.example` para `.env.local`:

### Windows CMD

```bat
copy .env.example .env.local
```

### PowerShell

```powershell
Copy-Item .env.example .env.local
```

Preencha:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

**Nunca use `service_role` no frontend.**

---

# 4. Aplicar o banco profissional

A estrutura está versionada em `supabase/migrations`.

Faça login no CLI:

```bash
npx supabase login
```

Vincule ao projeto:

```bash
npx supabase link --project-ref SEU_PROJECT_REF
```

Aplique todas as migrations:

```bash
npx supabase db push
```

Arquivos aplicados:

```text
001_initial_schema.sql
002_catalog_seed.sql
003_storage.sql
```

Isso cria tabelas, tipos, índices, constraints, RLS, funções transacionais, auditoria, catálogo de triagem, bucket privado e políticas de arquivos.

---

# 5. Criar usuários

No painel Supabase:

```text
Authentication > Users > Add user
```

Ao criar um usuário, um trigger cria automaticamente uma linha em `public.profiles`, inicialmente **inativa**. Isso evita que uma conta nova obtenha acesso ao sistema antes de ser vinculada corretamente.

Depois execute e adapte:

```text
supabase/BOOTSTRAP_USERS.sql
```

O primeiro administrador é promovido manualmente uma única vez. Depois o sistema pode ser evoluído para uma tela de gestão de usuários.

Para cliente, é obrigatório definir uma empresa e ativar a conta.

---

# 6. Rodar

```bash
npm run dev
```

Para verificar tipos:

```bash
npm run typecheck
```

Para gerar a versão de produção:

```bash
npm run build
```

Para visualizar o build:

```bash
npm run preview
```

---

# 7. Como provar ao professor que o banco é compartilhado

1. Abra a Narduche no celular e entre como cliente.
2. Faça uma triagem completa e abra um chamado.
3. No computador, entre com um usuário técnico.
4. Abra **Chamados**.
5. O mesmo protocolo deve aparecer.
6. No PC, clique em **Assumir chamado** e altere para **Em atendimento**.
7. No celular, reabra o chamado: o status virá do mesmo PostgreSQL.

Isso demonstra na prática que não existe mais dependência de `localStorage`.

---

# 8. Banco de dados

Principais tabelas:

```text
companies
profiles
printers
issue_categories
triage_steps
triage_sessions
triage_answers
remote_resolutions
tickets
ticket_events
ticket_attachments
audit_log
```

### Princípios implementados

- UUID como identificador de domínio;
- PK e FK explícitas;
- `ON DELETE RESTRICT` para dados históricos relevantes;
- constraints `UNIQUE` e `CHECK`;
- índices voltados aos filtros reais da aplicação;
- timestamps com trigger de atualização;
- transações nas operações críticas;
- `SELECT ... FOR UPDATE` para evitar corrida em finalização de triagem/chamado;
- RLS como autorização no banco;
- audit log para alterações críticas;
- bucket privado para evidências;
- URLs assinadas de curta duração;
- Realtime nos chamados.

Veja `docs/DATABASE.md`, `docs/ERD.md`, `docs/SECURITY.md` e `supabase/VERIFY_DATABASE.sql`.

---

# 9. Interface

A v6 também abandona a abordagem de CDN/JavaScript puro da versão anterior e passa a usar build moderno.

O visual é **Mobile First**, com:

- sidebar no desktop;
- navegação inferior no celular;
- Motion para transições de página e microinterações;
- cards animados;
- wizard de triagem com progresso animado;
- feedback com Sonner;
- componentes acessíveis baseados em Radix;
- Tailwind para responsividade e design system;
- ícones Lucide;
- formulários validados com Zod.

---

# 10. Estrutura

```text
Narduche-Triagem-Remota-v6/
├── package.json
├── vite.config.ts
├── .env.example
├── src/
│   ├── components/
│   │   ├── brand/
│   │   ├── layout/
│   │   └── ui/
│   ├── context/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   ├── types/
│   ├── main.tsx
│   └── router.tsx
├── supabase/
│   ├── migrations/
│   ├── BOOTSTRAP_USERS.sql
│   └── config.toml
└── docs/
    ├── ARCHITECTURE.md
    ├── DATABASE.md
    ├── ERD.md
    ├── SECURITY.md
    └── TESTING.md
```

---

## Observação importante

Nenhum projeto pode ser prometido como “zero bugs” sem executar o build e os testes no ambiente final com as dependências instaladas e um Supabase real. Por isso, a v6 foi estruturada para permitir `typecheck`, build reproduzível, migrations versionadas e teste multi-dispositivo antes da apresentação.

# 11. GitHub

Você pode publicar o estado final como primeiro commit. Para uma entrega acadêmica, é melhor continuar fazendo commits reais e descritivos a partir desse ponto do que inventar um histórico retroativo.

Guia completo: `docs/GITHUB.md`.

Antes do primeiro push:

```bash
npm install
npm run test:smoke
npm run typecheck
npm run lint
npm run build
```

Depois:

```bash
git init
git add .
git commit -m "feat: entrega inicial da Narduche v6"
git branch -M main
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
```

O `.gitignore` exclui arquivos de ambiente, `node_modules` e builds. **Nunca envie `.env.local`, senha ou `service_role` para o GitHub.**

## Validação desta cópia

O smoke test estrutural e a análise sintática dos arquivos TypeScript foram executados antes do empacotamento. O `npm install` completo não pôde ser finalizado no ambiente de geração por indisponibilidade de acesso ao registry; por isso, execute `npm install`, `npm run typecheck`, `npm run lint` e `npm run build` na sua máquina antes da apresentação e antes de marcar uma release no GitHub.

