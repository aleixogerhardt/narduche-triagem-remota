# Roteiro de testes — Narduche v6

## Antes de apresentar

1. `npm install`
2. `npm run typecheck`
3. `npm run build`
4. confirme `.env.local` apontando para o projeto Supabase correto;
5. aplique `npx supabase db push`;
6. abra o sistema em dois navegadores/dispositivos.

## Teste de persistência multi-dispositivo

1. No celular, entre como cliente.
2. Faça a triagem até abrir um chamado.
3. No PC, entre como técnico.
4. Abra **Chamados**.
5. O protocolo criado no celular deve aparecer sem copiar arquivo ou exportar localStorage.
6. No PC, assuma o chamado e marque como “Em atendimento”.
7. No celular, reabra o chamado; o novo status deve ser exibido.

## Teste de empresa/equipamento

1. Entre como administrador.
2. Cadastre uma empresa.
3. Cadastre uma impressora vinculada a ela.
4. Edite a impressora e transfira para outra empresa.
5. Confirme que o UUID do equipamento permanece o mesmo no banco.
6. Tente cadastrar a mesma série em outra impressora: o banco deve rejeitar.

## Teste de segurança

- Cliente não deve abrir rotas de Empresas/Equipamentos.
- Cliente não deve conseguir consultar chamado de outro usuário alterando o UUID da URL.
- Cliente não deve conseguir chamar `update_ticket_status`.
- Técnico não deve conseguir criar/editar empresa por requisição direta.
- Anexo do cliente não deve possuir URL pública permanente.
