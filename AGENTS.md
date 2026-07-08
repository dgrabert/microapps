# AGENTS.md — microapps SDK

## Wrapped Methods

- Ao simular qualquer método `@wrapper` ou `@wrapperMethod`, não inventar campos ou semânticas; usar somente campos já tipados ou confirmados na documentação oficial/integração real.

## Documentação

- Na documentação pública do SDK, usar a convenção genérica "usuário". Não usar "lead" para descrever pessoas/conversas, porque o SDK atende contextos além de vendas.
- Nunca citar nomes de clientes reais na documentação, exemplos, testes ou mocks do SDK público. Use nomes genéricos/neutros.

## Release do SDK

- Antes de publicar uma nova versão, conferir a última versão publicada/tag existente.
- Atualizar `deno.json` para a nova versão do pacote.
- Atualizar `MicroApp.__version__` em `base.ts` para a mesma versão em formato de array, porque o backend usa esse valor como `sdk_version`.
- Atualizar imports versionados do README público para a nova versão.
- Rodar os testes do SDK antes de criar tag/publicar.
- Não rodar `release.sh`, criar tags, publicar no JSR ou fazer push sem pedido explícito.
