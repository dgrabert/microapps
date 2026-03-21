# SDK de MicroApps

## Instalacao

```typescript
import { MicroApp, aiFunction, p, preprocessing, postprocessing, moderator } from "jsr:@virti/microapp-sdk@0.30.0";
```

---

## AI Functions

AI Functions sao tools que o LLM pode chamar durante a conversa. O SDK 0.30 usa o helper `p` para
declarar tipos e dunders para metadados.

### Helper `p` — Referencia completa

```typescript
import { p } from "jsr:@virti/microapp-sdk";

// ── Primitivos ──────────────────────────────────────────────────────────
p.string("Descricao do campo.")           // tipo string
p.integer("Descricao.")                    // tipo inteiro
p.number("Descricao.")                     // tipo numerico (float)
p.boolean("Descricao.")                    // tipo booleano

// ── Enum (valores fechados) ─────────────────────────────────────────────
p.enum(["MQL", "SQL"], "Tipo de processo.")
p.enum(["baixa", "media", "alta"], "Prioridade da tarefa.")

// ── Array ───────────────────────────────────────────────────────────────
p.array(p.string(), "Lista de tags.")
p.array(p.integer(), "IDs dos itens selecionados.")

// ── Sub-objeto (grupo de params com description e when_to_call proprios) ─
p.object({
    __description__: "O que este grupo de params faz.",
    __when_to_call__: "Quando o LLM deve usar estes params.",
    properties: {
        campo1: p.string("Descricao."),
        campo2: p.integer("Descricao.").optional(),
    },
})

// ── Sub-objeto sem params (acao que nao precisa de dados) ───────────────
p.object({
    __description__: "Sai do modo atual.",
    __when_to_call__: "Quando o usuario quiser voltar.",
})

// ── Sub-objeto com override total ───────────────────────────────────────
p.object({
    __description__: "Modo restrito.",
    __when_to_call__: "Apenas quando o admin solicitar.",
    __override__: false,  // ignora o original, usa so o que esta aqui
    properties: {
        id: p.integer("ID obrigatorio neste modo."),
    },
})

// ── Modificador .optional() — funciona em qualquer p.* ─────────────────
p.string("Campo opcional.").optional()
p.integer("ID opcional.").optional()
p.enum(["a", "b"], "Opcao.").optional()
p.array(p.string(), "Tags.").optional()
p.object({ ... }).optional()
```

### Dunders — Metadados do tool

| Chave | Tipo | Default | Onde usar | Descricao |
|---|---|---|---|---|
| `__description__` | string | obrigatorio | return do setup, p.object | O que faz (visivel ao LLM no schema) |
| `__when_to_call__` | string | obrigatorio | return do setup, p.object | Quando chamar (visivel ao LLM nas instrucoes). `{this}` = nome da funcao |
| `__auto_moderate__` | boolean | true | return do setup | Se a resposta e moderada pelo pipeline |
| `__background__` | boolean | false | return do setup | Se executa em background (nao bloqueia a resposta) |
| `__override__` | boolean | true | p.object | Se false, substituicao total (ignora o original no merge dinamico) |

---

### Exemplo 1: AI Function simples (params flat, sem acoes)

Para funcoes com poucos params, sem necessidade de agrupamento:

```typescript
@aiFunction(() => ({
    __description__: "Busca informacoes no banco de conhecimento via RAG.",
    __when_to_call__: "Chame {this} quando nao houver informacoes suficientes para responder.",
    params: {
        busca: p.string("Termo ou pergunta a buscar."),
        incluir_midias: p.boolean("Se true, busca tambem em midias (PDFs, imagens)."),
    },
}))
async consultar_banco(params: { busca: string; incluir_midias: boolean }) {
    // implementacao...
    return `Resultado da busca: ...`;
}
```

### Exemplo 2: AI Function com params opcionais

```typescript
@aiFunction(() => ({
    __description__: "Transfere o atendimento para um humano.",
    __when_to_call__: "Chame {this} quando o usuario solicitar falar com um atendente humano.",
    params: {
        motivo: p.string("Motivo da transferencia.").optional(),
        departamento: p.enum(["vendas", "suporte", "financeiro"], "Departamento destino.").optional(),
        urgente: p.boolean("Se true, marca como prioridade alta.").optional(),
    },
}))
async transferir(params: { motivo?: string; departamento?: string; urgente?: boolean }) {
    return `Transferindo para ${params.departamento || "atendimento geral"}...`;
}
```

### Exemplo 3: AI Function com acoes agrupadas (padrao recomendado)

Agrupa multiplas operacoes de um mesmo dominio em 1 tool com enum de `acao`:

```typescript
@aiFunction(() => ({
    __description__: "Gerencia tarefas do usuario no quadro de atividades.",
    __when_to_call__: "Chame {this} para listar, criar, editar ou remover tarefas.",
    params: {
        acao: p.enum(["listar", "criar", "editar", "remover"], "Acao a executar."),
        listar: p.object({
            __description__: "Lista tarefas com filtros opcionais.",
            __when_to_call__: "Quando o usuario pedir para ver suas tarefas.",
            properties: {
                status: p.enum(["todas", "pendente", "andamento", "concluida"], "Filtro por status.").optional(),
                responsavel: p.string("Filtro por responsavel.").optional(),
                pagina: p.integer("Pagina (padrao: 1).").optional(),
            },
        }).optional(),
        criar: p.object({
            __description__: "Cria uma nova tarefa.",
            __when_to_call__: "Quando o usuario quiser criar ou anotar uma tarefa.",
            properties: {
                titulo: p.string("Titulo da tarefa."),
                descricao: p.string("Descricao detalhada.").optional(),
                prioridade: p.enum(["baixa", "media", "alta"], "Prioridade.").optional(),
                responsavel: p.string("ID do responsavel.").optional(),
            },
        }).optional(),
        editar: p.object({
            __description__: "Edita uma tarefa existente.",
            __when_to_call__: "Quando o usuario quiser alterar titulo, status ou prioridade de uma tarefa.",
            properties: {
                id_tarefa: p.integer("ID da tarefa."),
                titulo: p.string("Novo titulo.").optional(),
                status: p.enum(["pendente", "andamento", "concluida"], "Novo status.").optional(),
                prioridade: p.enum(["baixa", "media", "alta"], "Nova prioridade.").optional(),
            },
        }).optional(),
        remover: p.object({
            __description__: "Remove uma tarefa permanentemente.",
            __when_to_call__: "NUNCA execute sem confirmacao explicita do usuario.",
            properties: {
                id_tarefa: p.integer("ID da tarefa a remover."),
            },
        }).optional(),
    },
}))
async tarefas(params: { acao: string; listar?: any; criar?: any; editar?: any; remover?: any }) {
    switch (params.acao) {
        case "listar":
            // ...
            return "Tarefas: ...";
        case "criar":
            return `Tarefa '${params.criar?.titulo}' criada.`;
        case "editar":
            return `Tarefa #${params.editar?.id_tarefa} atualizada.`;
        case "remover":
            return `Tarefa #${params.remover?.id_tarefa} removida.`;
        default:
            return `Acao '${params.acao}' nao reconhecida.`;
    }
}
```

### Exemplo 4: AI Function com arrays e objetos complexos

```typescript
@aiFunction(() => ({
    __description__: "Envia mensagens em massa para uma lista de contatos.",
    __when_to_call__: "Chame {this} quando o usuario quiser enviar mensagem para multiplos contatos.",
    __background__: true,  // executa em background (nao bloqueia)
    params: {
        telefones: p.array(p.string(), "Lista de telefones no formato +55119XXXXXXXX."),
        mensagem: p.string("Texto da mensagem a enviar."),
        agendar_para: p.string("Data/hora ISO 8601 para agendar o envio.").optional(),
    },
}))
async envio_massa(params: { telefones: string[]; mensagem: string; agendar_para?: string }) {
    return `Enviando para ${params.telefones.length} contatos...`;
}
```

### Exemplo 5: AI Function com hard-disable dinamico

Desabilita a funcao em runtime baseado em estado da conversa:

```typescript
@aiFunction(async (mapp) => {
    // Verifica se a funcionalidade esta habilitada
    const habilitado = await mapp.vars.get({ chave: "habilitar_agendamento" });
    if (!habilitado) return null; // hard-disable — funcao nao aparece pro LLM

    // Verifica se ja tem email cadastrado
    const email = await mapp.vars.get({ chave: "email_usuario" });

    return {
        __description__: "Agenda uma reuniao no calendario.",
        __when_to_call__: "Chame {this} quando o usuario quiser agendar uma reuniao ou demonstracao.",
        params: {
            horario: p.string("Data e hora no formato ISO 8601."),
            assunto: p.string("Assunto da reuniao."),
            // Se ja tem email, nao precisa pedir de novo
            ...(email ? {} : {
                email: p.string("Email do convidado."),
            }),
        },
    };
})
async agendar(params: { horario: string; assunto: string; email?: string }) {
    return `Reuniao agendada para ${params.horario}.`;
}
```

### Exemplo 6: AI Function com description/when_to_call dinamicos

O setup async permite construir textos com variaveis em runtime:

```typescript
@aiFunction(async (mapp) => {
    const condicoes = await mapp.vars.get({ chave: "condicoes_etapa" });
    if (!condicoes || condicoes.length === 0) return null;

    const lista = condicoes.map((c: any) => `- **${c.nome}**: ${c.descricao}`).join("\n");
    const nomes = condicoes.map((c: any) => c.nome);

    return {
        __description__: "Redireciona o usuario para uma etapa do fluxo.",
        __when_to_call__: `Chame {this} SOMENTE quando uma das condicoes for atendida:\n\n${lista}\n\nNunca chame se nenhuma condicao for atendida.`,
        __auto_moderate__: false,
        params: {
            condicao_satisfeita: p.enum(nomes, "Nome da condicao que foi satisfeita."),
        },
    };
})
async direcionar(params: { condicao_satisfeita: string }) {
    return `Redirecionando: condicao '${params.condicao_satisfeita}' satisfeita.`;
}
```

### Exemplo 7: AI Function com __auto_moderate__ = false

Desativa a moderacao automatica (util para funcoes que retornam conteudo livre):

```typescript
@aiFunction(() => ({
    __description__: "Retorna informacoes de preco dos planos.",
    __when_to_call__: "SEMPRE chame {this} quando o usuario perguntar sobre precos ou valores. NUNCA invente precos.",
    __auto_moderate__: false,
    params: {
        plano: p.enum(["Pro", "Avancado"], "Plano escolhido."),
        quantidade: p.number("Numero de atendimentos mensais."),
    },
}))
async calcular_preco(params: { plano: string; quantidade: number }) {
    // calculo real...
    return `Plano ${params.plano}: R$ 2.087,79/mes para ${params.quantidade} atendimentos.`;
}
```

### Exemplo 8: AI Function com __background__ = true

Executa em background sem bloquear a resposta do LLM:

```typescript
@aiFunction(() => ({
    __description__: "Exporta conversas para CSV. Roda em background.",
    __when_to_call__: "Chame {this} quando o usuario solicitar exportacao ou relatorio de conversas.",
    __background__: true,
    params: {
        id_robo: p.integer("ID do robo.").optional(),
        data_inicio: p.string("Data inicio ISO 8601.").optional(),
        data_fim: p.string("Data fim ISO 8601.").optional(),
    },
}))
async exportar_csv(params: { id_robo?: number; data_inicio?: string; data_fim?: string }) {
    // processamento demorado...
    return "Arquivo CSV gerado e enviado.";
}
```

### Exemplo 9: AI Function que varia por interface (WhatsApp vs Web)

```typescript
@aiFunction(async (mapp) => {
    const iface = await mapp.controlador_interface.get_interface_nome();
    const isWhatsapp = iface === "whatsapp";

    return {
        __description__: "Autentica o usuario no sistema.",
        __when_to_call__: "Chame {this} quando o usuario precisar se identificar.",
        params: isWhatsapp
            ? {
                // No WhatsApp, o telefone ja eh conhecido
                cpf: p.string("CPF do usuario."),
            }
            : {
                // Na web, precisa de telefone tambem
                cpf: p.string("CPF do usuario."),
                telefone: p.string("Telefone com DDD."),
                senha: p.string("Senha de acesso."),
            },
    };
})
async autenticar(params: { cpf: string; telefone?: string; senha?: string }) {
    return `Usuario ${params.cpf} autenticado.`;
}
```

### Exemplo 10: AI Function com sub-objeto sem params (acao vazia)

```typescript
@aiFunction(() => ({
    __description__: "Gerencia a impersonacao de contas.",
    __when_to_call__: "Chame {this} para impersonar ou sair da impersonacao.",
    params: {
        acao: p.enum(["impersonar", "sair"], "Acao."),
        impersonar: p.object({
            __description__: "Impersona outra conta.",
            __when_to_call__: "Quando o admin quiser operar em outra conta.",
            properties: {
                id_conta: p.integer("ID da conta a impersonar."),
            },
        }).optional(),
        sair: p.object({
            __description__: "Sai da impersonacao.",
            __when_to_call__: "Quando quiser voltar a conta original.",
            // sem properties — nao precisa de params
        }).optional(),
    },
}))
async impersonacao(params: { acao: string; impersonar?: any; sair?: any }) {
    if (params.acao === "impersonar") {
        return `Impersonando conta ${params.impersonar?.id_conta}.`;
    }
    return "Saiu da impersonacao.";
}
```

---

## Portal API

Micro apps TypeScript acessam a API da plataforma via `this.portalApi`.
O `id_conta` e injetado automaticamente — nunca precisa informar.

### Exemplo de uso

```typescript
// Listar robos
const robos = await this.portalApi.robos.listar();

// Buscar fluxo de um robo
const fluxo = await this.portalApi.robos.fluxo_buscar({ id_robo: 42 });

// Listar conversas com filtro
const conversas = await this.portalApi.conversas.listar({
    id_robo: 42, pagina: 1
});

// Criar canal
const canal = await this.portalApi.canais.criar({
    tipo: "livechat", id_robo: 42
});

// Pesquisar no banco de conhecimento
const resultado = await this.portalApi.banco_conhecimentos.pesquisar({
    id_banco: 1, query: "como configurar webhook"
});
```

### Dominios e metodos disponiveis

| Dominio | Metodos |
|---|---|
| `portalApi.robos` | listar, criar, editar, deletar, fluxo_buscar, fluxo_atualizar, fluxo_criar |
| `portalApi.canais` | listar, criar, editar, deletar |
| `portalApi.conversas` | listar, informacoes, historico, exportar_csv |
| `portalApi.campanhas` | listar, criar, editar, deletar, templates |
| `portalApi.integracoes` | listar, criar, editar, deletar, autenticar_rdstation |
| `portalApi.fontes_dados` | listar, criar, editar, deletar, processar |
| `portalApi.banco_conhecimentos` | listar, criar, editar, deletar, pesquisar |
| `portalApi.microapps` | listar, criar, editar, deletar |
| `portalApi.dashboard` | consultar |

---

## Migracao do SDK < 0.30

### O que mudou

- **Helper `p`** substitui `{ type: "string", description: "..." }` por `p.string("...")`
- **Dunders** no return do setup (`__description__`, `__when_to_call__`, `__auto_moderate__`, `__background__`)
- **`portalApi`** para acessar APIs da plataforma
- **`.optional()`** para marcar params opcionais

### Retrocompatibilidade

O formato antigo (`description`, `whenToCall`, `{ type: "string", description: "..." }`)
**continua funcionando**. A bridge Python detecta a versao do SDK e aceita ambos.
Nao e obrigatorio migrar micro apps existentes imediatamente.

### Antes e depois

```typescript
// ── ANTES (SDK < 0.30) ─────────────────────────────────────────────────
@aiFunction(() => ({
    description: "Calcula preco.",
    whenToCall: "Chame {this} quando perguntar sobre precos.",
    auto_moderate: false,
    params: {
        plano: { type: "string", enum: ["Pro", "Avancado"], description: "Plano." },
        quantidade: { type: "number", description: "Quantidade de atendimentos." },
        incluir_desconto: { type: "boolean", description: "Aplicar desconto.", required: false },
    },
}))

// ── DEPOIS (SDK 0.30) ──────────────────────────────────────────────────
@aiFunction(() => ({
    __description__: "Calcula preco.",
    __when_to_call__: "Chame {this} quando perguntar sobre precos.",
    __auto_moderate__: false,
    params: {
        plano: p.enum(["Pro", "Avancado"], "Plano."),
        quantidade: p.number("Quantidade de atendimentos."),
        incluir_desconto: p.boolean("Aplicar desconto.").optional(),
    },
}))
```

---

## Preprocessing e Postprocessing

Nao mudaram no SDK 0.30 — continuam funcionando como antes:

```typescript
@preprocessing({ tier: -5000 })
async processaComando() {
    const last_msg = await this.conversa.get_last_message({ origem: "cliente" });
    if (last_msg!.conteudo.texto?.startsWith("!help")) {
        return "Comandos disponiveis: !help, !status";
    }
    // retornar undefined = nao interrompe a pipeline
}

@postprocessing({ tier: 0 })
async adicionaAssinatura() {
    // modifica a resposta do LLM antes de enviar
}

@moderator()
async moderaResposta() {
    // valida a resposta do LLM, pode rejeitar
}
```

---

## Rodando local

```typescript
// local.ts
import MeuApp from "./index.ts";

const app = new MeuApp();

// Mocka a mensagem do usuario
app.conversa.mensagens = [{
    origem: "cliente",
    conteudo: { texto: "qual o preco do plano Pro?" },
}];

// Testa a funcao diretamente
const resultado = await app.calcular_preco({ plano: "Pro", quantidade: 500 });
console.log(resultado);
```

```shell
MOCK=1 deno run -A ./local.ts
```
