# Publicação no GitHub — Narduche v6

## Pode publicar apenas o projeto final?

Sim. O GitHub não exige que o histórico completo de desenvolvimento exista para que o repositório seja válido. Para uma entrega acadêmica, porém, um repositório com commits organizados demonstra melhor o uso de controle de versão.

O importante é **não inventar nem retroagir commits** para simular um histórico que não existiu. Publique o estado atual e, a partir dele, faça commits reais e descritivos.

## Antes do primeiro commit

Não publique:

- `.env.local`;
- chave `service_role` do Supabase;
- senhas;
- `node_modules/`;
- `dist/`.

O `.gitignore` deste projeto já cobre os arquivos principais.

Depois do primeiro `npm install`, será gerado `package-lock.json`. **Inclua esse arquivo no GitHub**, pois ele melhora a reprodutibilidade das instalações.

## Primeiro envio

```bash
git init
git add .
git status
git commit -m "feat: entrega inicial da Narduche v6"
git branch -M main
git remote add origin URL_DO_SEU_REPOSITORIO
git push -u origin main
```

## Commits reais recomendados depois do envio inicial

Exemplos para alterações futuras:

```text
feat: integrar autenticação e perfis do Supabase
feat: adicionar cadastro de empresas e equipamentos
feat: implementar fluxo de triagem remota
feat: persistir chamados no PostgreSQL
feat: adicionar timeline e anexos privados
fix: corrigir atualização de chamados em múltiplos dispositivos
docs: atualizar DER e documentação do banco
style: refinar interface mobile da Narduche
```

Use esses nomes apenas quando a respectiva alteração realmente for feita.

## Verificações antes de cada push

```bash
npm run test:smoke
npm run typecheck
npm run lint
npm run build
```

## GitHub Actions

O arquivo `.github/workflows/quality.yml` executa typecheck, lint e build no GitHub a cada push/pull request. Isso ajuda a provar que a versão enviada continua compilável.
