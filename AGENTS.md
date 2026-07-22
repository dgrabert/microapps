# AGENTS.md — microapps SDK

## Wrapped Methods

- Ao simular qualquer método `@wrapper` ou `@wrapperMethod`, não inventar campos ou semânticas; usar somente campos já tipados ou confirmados na documentação oficial/integração real.

## Documentação

- Na documentação pública do SDK, usar a convenção genérica "usuário". Não usar "lead" para descrever pessoas/conversas, porque o SDK atende contextos além de vendas.
- Nunca citar nomes de clientes reais na documentação, exemplos, testes ou mocks do SDK público. Use nomes genéricos/neutros.

## Release do SDK

- Antes de publicar uma nova versão, conferir a última versão publicada/tag existente.
- Atualizar apenas `deno.json` para a nova versão do pacote. `MicroApp.__version__` deriva automaticamente desse manifesto via `version.ts`; nunca duplicar a versão em código.
- Atualizar imports versionados do README público para a nova versão.
- Rodar os testes do SDK antes de criar tag/publicar.
- Não rodar `release.sh`, criar tags, publicar no JSR ou fazer push sem pedido explícito.
