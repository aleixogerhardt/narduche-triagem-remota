# Qualidade de software — Narduche v6

A organização da v6 foi pensada para ser justificável academicamente usando atributos normalmente associados à ISO/IEC 25010.

## Adequação funcional
- triagem guiada;
- resolução remota registrada;
- escalonamento para chamado;
- gestão de empresas e equipamentos;
- atendimento por status;
- evidências e linha do tempo.

## Confiabilidade
- PostgreSQL como fonte de verdade;
- constraints no banco;
- operações críticas transacionais;
- bloqueio `FOR UPDATE` em finalizações concorrentes;
- histórico de eventos separado do estado atual.

## Segurança
- Supabase Auth;
- RLS por perfil;
- princípio de menor privilégio nos GRANTs;
- funções RPC críticas com validação no servidor;
- bucket privado;
- URLs assinadas;
- ausência de `service_role` no frontend.

## Usabilidade
- Mobile First;
- fluxo de triagem por uma decisão de cada vez;
- feedback visual com Sonner;
- progresso animado;
- linguagem não técnica nas etapas do usuário;
- respeito a `prefers-reduced-motion`.

## Manutenibilidade
- TypeScript;
- componentes reutilizáveis;
- separação de UI e acesso a dados;
- migrations versionadas;
- catálogo de triagem no banco em vez de regras espalhadas na interface;
- arquivos de documentação e smoke test.

## Portabilidade
- aplicação web responsiva;
- build Vite estático;
- configuração por variáveis de ambiente;
- deploy possível em Netlify/Vercel e banco independente no Supabase.

## Eficiência
- índices para consultas principais;
- TanStack Query reduz requisições repetidas por cache e invalidação controlada;
- Realtime invalida dados somente em eventos relevantes;
- Motion é aplicado a transform/opacity em interações principais.
