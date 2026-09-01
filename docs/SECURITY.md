# Segurança — Narduche v6

## Princípio principal

O frontend não é considerado uma barreira de segurança. Esconder um botão não impede uma requisição manual. Por isso, autorização é aplicada no PostgreSQL por Row Level Security (RLS) e dentro das funções RPC críticas.

## Perfis

### Cliente
- lê apenas a própria empresa;
- lê impressoras ativas da própria empresa;
- lê as próprias triagens, respostas, resoluções e chamados;
- não pode alterar empresa, impressora, função de usuário ou status técnico.

### Técnico
- lê empresas, equipamentos e chamados necessários ao suporte;
- pode assumir chamados e alterar status por RPC validada;
- pode ler evidências autorizadas.

### Administrador
- gerencia empresas e equipamentos;
- possui acesso operacional de suporte;
- pode consultar `audit_log`.

## Auth

Senhas não são armazenadas em `public.profiles`. O Supabase Auth é responsável por hash, sessão e renovação de token.

A aplicação usa somente `VITE_SUPABASE_PUBLISHABLE_KEY`/anon key no navegador. `service_role` nunca deve ir para `.env.local` do frontend.

## Storage

O bucket `ticket-evidence` é privado. Objetos são gravados no caminho:

```text
<auth.uid()>/<ticket_id>/<uuid>-arquivo.ext
```

A política do Storage limita upload ao diretório do próprio usuário. A leitura usa autorização do usuário ou função de equipe técnica. O frontend gera URL assinada com curta duração para abertura do arquivo.

## Security Definer

Funções auxiliares de autorização ficam no schema `private`, que não é exposto pela Data API. Elas usam `SECURITY DEFINER` com `search_path = ''` e nomes de objetos qualificados por schema.

As RPCs públicas que precisam alterar várias tabelas também fixam `search_path = ''`, revogam execução de `PUBLIC` e concedem `EXECUTE` somente a `authenticated`. Cada RPC revalida identidade, função e estado do registro antes de gravar.
