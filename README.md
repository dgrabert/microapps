# SDK de MicroApps

## Rodando local

### Crie um MicroApp ou use esse de exemplo

Esse microapp recebe um parâmetro configurável `mensagem` no construtor. Esse campo é configurável na configuração de microapps do robô.

Se o usuário mandar uma mensagem que inicie com "!msg", a pipeline será interrompida e o robô retornará a resposta fixa `this.mensagem`.
Se não, ele responderá normalmente.

```typescript
// comandos.ts
import { MicroApp, preprocessing } from "jsr:@virti/microapp-sdk@0.12.2";

export default class MicroAppComandos extends MicroApp {
  mensagem: string;

  constructor(mensagem?: string) {
    super();

    if (!mensagem) {
      this.mensagem = "hello";
    } else {
      this.mensagem = mensagem;
    }
  }

  @preprocessing({ tier: -5000 })
  async processaComando() {
    const last_msg = await this.conversa.get_last_message({
      origem: "cliente",
    });
    if (last_msg!.conteudo.texto?.startsWith("!msg")) {
      return this.mensagem;
    }
  }
}
```

### Crie um script que inicia o microapp e executa o método desejado

Já rodando localmente não precisamos de robô nem pipeline.
Conseguimos simular o comportamento do robô "mockando" as comunicações com o backend, o que é útil para testes manuais ou automatizados.

```typescript
// local.ts
import MicroAppComandos from "./comandos.ts";

const app = new MicroAppComandos("mensagem customizada");

// "mockando" a mensagem do usuario
// como é um comando, deve interromper a pipeline e retornar
// "mensagem vazia"
app.conversa.mensagens = [{
  origem: "cliente",
  conteudo: {
    texto: "!msg",
  },
}];

let resultado = await app.processaComando();
console.log(resultado); // "mensagem customizada"

// como não é um comando, deve retornar undefined, o que não
// interrompe a pipeline
app.conversa.mensagens.push({
  origem: "cliente",
  conteudo: {
    texto: "nao eh um comando",
  },
});

resultado = await app.processaComando();
console.log(resultado); // undefined
```

### Execute o arquivo

A variável de ambiente `MOCK` faz com que o microapp rode de forma isolada, sem precisar de comunicação com o robô.

```shell
MOCK=1 deno run -A ./local.ts
```
