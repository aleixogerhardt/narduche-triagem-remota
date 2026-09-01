# Narduche — Triagem Remota

Sistema web desenvolvido para otimizar o processo de atendimento técnico de impressoras por meio de uma triagem remota guiada.

A plataforma permite que usuários realizem verificações iniciais antes da abertura de um chamado técnico, possibilitando a resolução de problemas simples remotamente e fornecendo informações mais completas para a equipe técnica quando uma intervenção for necessária.

## Objetivo

O Narduche — Triagem Remota busca reduzir atendimentos presenciais desnecessários e melhorar a qualidade das informações recebidas pela equipe técnica.

O sistema oferece um fluxo estruturado no qual o usuário seleciona o equipamento, informa o problema e realiza uma sequência de verificações orientadas.

Caso o problema não seja solucionado durante a triagem, um chamado pode ser criado com as informações coletadas durante o processo.

## Principais funcionalidades

* Autenticação de usuários;
* Controle de acesso por perfil;
* Cadastro e gerenciamento de empresas;
* Cadastro e gerenciamento de impressoras;
* Triagem guiada de problemas;
* Registro das respostas da triagem;
* Resolução remota de ocorrências;
* Abertura e acompanhamento de chamados;
* Atribuição de chamados para técnicos;
* Atualização de status dos atendimentos;
* Envio de evidências e anexos;
* Atualização de chamados em tempo real;
* Histórico de eventos;
* Registro de auditoria;
* Interface responsiva para computadores e dispositivos móveis.

## Tecnologias

### Frontend

* React
* TypeScript
* Vite
* React Router
* Tailwind CSS
* TanStack Query
* React Hook Form
* Zod
* Radix UI
* Motion
* Lucide React
* Sonner

### Backend e banco de dados

* Supabase
* PostgreSQL
* Supabase Auth
* Row Level Security (RLS)
* PostgreSQL RPC
* Supabase Realtime
* Supabase Storage

## Arquitetura

A aplicação utiliza uma arquitetura cliente-servidor, com o frontend desenvolvido em React e os serviços de backend fornecidos pelo Supabase.

```text
Computador ─┐
Celular ────┼── Internet ── Supabase ── PostgreSQL
Tablet ─────┘                    │
                                ├── Authentication
                                ├── Row Level Security
                                ├── Realtime
                                └── Storage
```

Os dispositivos conectados ao sistema utilizam uma base de dados centralizada, permitindo que informações sobre empresas, equipamentos, triagens e chamados sejam compartilhadas entre usuários autorizados.

## Banco de dados

Entre as principais entidades do sistema estão:

* Empresas;
* Usuários;
* Impressoras;
* Categorias de problemas;
* Etapas de triagem;
* Sessões de triagem;
* Respostas;
* Resoluções remotas;
* Chamados;
* Eventos dos chamados;
* Anexos;
* Registros de auditoria.

O banco utiliza relacionamentos, restrições de integridade, índices e políticas de Row Level Security para controle de acesso aos dados.

A documentação detalhada está disponível em:

```text
docs/DATABASE.md
docs/ERD.md
docs/SECURITY.md
docs/ARCHITECTURE.md
```

## Controle de acesso

O sistema possui diferentes níveis de acesso.

**Cliente**

Pode acessar os equipamentos vinculados à sua empresa, realizar triagens e acompanhar seus chamados.

**Técnico**

Pode visualizar chamados de suporte, assumir atendimentos e atualizar seus respectivos status.

**Administrador**

Possui acesso às funcionalidades administrativas do sistema, incluindo gerenciamento de empresas e equipamentos.

As regras de autorização também são aplicadas no banco de dados por meio de políticas de Row Level Security.

## Interface

A interface foi desenvolvida seguindo uma abordagem Mobile First e se adapta a diferentes tamanhos de tela.

Entre os recursos utilizados estão:

* Navegação adaptada para desktop e dispositivos móveis;
* Formulários com validação;
* Feedback visual das operações;
* Fluxo de triagem em etapas;
* Indicadores de progresso;
* Componentes acessíveis;
* Animações e microinterações.

## Executando o projeto

### Requisitos

* Node.js 22 ou superior
* npm
* Projeto Supabase configurado

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/bypain/narduche-triagem-remota.git
cd narduche-triagem-remota
npm install
```

Crie o arquivo `.env.local` utilizando `.env.example` como referência:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Em seguida:

```bash
npm run dev
```

## Banco de dados

As migrations necessárias estão disponíveis em:

```text
supabase/migrations/
```

Para aplicar a estrutura utilizando o Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

## Qualidade do projeto

O projeto possui comandos para verificação de tipos, análise estática e geração do build de produção.

```bash
npm run typecheck
npm run lint
npm run build
```

## Estrutura principal

```text
narduche-triagem-remota/
├── src/
│   ├── components/
│   ├── context/
│   ├── lib/
│   ├── pages/
│   ├── services/
│   └── types/
│
├── supabase/
│   ├── migrations/
│   ├── BOOTSTRAP_USERS.sql
│   └── config.toml
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── ERD.md
│   ├── SECURITY.md
│   └── TESTING.md
│
├── tests/
├── package.json
└── vite.config.ts
```

## Segurança

As credenciais utilizadas localmente não são armazenadas no repositório.

Arquivos de ambiente, como `.env.local`, são ignorados pelo Git e o frontend utiliza somente a chave pública destinada ao cliente.

O controle de acesso aos dados é realizado por meio da autenticação e das políticas de Row Level Security configuradas no PostgreSQL.

---

**Narduche — Triagem Remota**

Sistema de triagem remota para otimização do atendimento técnico de impressoras.
