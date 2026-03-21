import { MicroApp } from "./base.ts";

/**
 * Decorator que registra um método como etapa de pré-processamento no pipeline do MicroApp.
 * Métodos decorados são executados antes da IA executar AI functions e gerar a resposta. Eles ordenados pelo `tier` (prioridade).
 * @param tier - Nível de prioridade de execução no pré-processamento.
 */
export function preprocessing<T>({ tier }: { tier: number }): any {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.preprocessing[target.name] = {
      tier,
      fn: (obj: any) => (target.call(obj)),
    };

    return target;
  };
}

/**
 * Decorator que registra um método como moderador no pipeline do MicroApp.
 * Moderadores são funções que avaliam a resposta da LLM e podem aprovar ou reprovar a resposta, fazendo com que a LLM gere a resposta novamente com as instruções especificadas.
 */
export function moderator<T>(): any {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.moderator[target.name] = {
      fn: (obj: any, params: object) => (target.call(obj, params)),
    };

    return target;
  };
}

/**
 * Tipo base de um parâmetro JSON Schema.
 */
export type AIParamType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "array"
  | "object";

/**
 * Um parâmetro de uma AI function.
 *
 * Para tipos primitivos, use o helper ``p`` (ex: ``p.string("desc")``).
 * Para sub-objetos, use ``p.object({ __description__, __when_to_call__, properties })``.
 * Para marcar como opcional, use ``.optional()`` (ex: ``p.integer("ID").optional()``).
 *
 * @example
 * ```ts
 * params: {
 *     acao: p.enum(["listar", "criar"], "Ação a executar."),
 *     listar: p.object({
 *         __description__: "Lista itens.",
 *         __when_to_call__: "Quando precisar listar.",
 *         properties: {
 *             pagina: p.integer("Página.").optional(),
 *         },
 *     }).optional(),
 * }
 * ```
 */
export type AIParam = {
  type?: AIParamType;
  __description__?: string;
  description?: string; // retrocompat SDK < 0.30
  enum?: string[];
  items?: AIParam;
  properties?: Record<string, AIParam>;
  required?: string[];
  __when_to_call__?: string;
  __override__?: boolean;
  _optional?: boolean;
  optional?: () => AIParam;
};

/**
 * Configurações de sub-objeto para ``p.object()``.
 */
export type AIObjectConfig = {
  __description__?: string;
  __when_to_call__?: string;
  __override__?: boolean;
  properties?: Record<string, AIParam>;
};

/**
 * Configurações de uma AI function registrada no pipeline.
 *
 * Use dunders para metadados:
 * - ``__description__``: o que o tool faz
 * - ``__when_to_call__``: quando o LLM deve chamar ({this} = nome da função)
 * - ``__auto_moderate__``: se a resposta é moderada (default: true)
 * - ``__background__``: se executa em background (default: false)
 *
 * Pode ser ``null`` para desativar a função dinamicamente (hard-disable).
 *
 * @example
 * ```ts
 * @aiFunction(() => ({
 *     __description__: "Gerencia robôs.",
 *     __when_to_call__: "Chame {this} para gerenciar robôs.",
 *     params: {
 *         acao: p.enum(["listar", "criar"], "Ação."),
 *         listar: p.object({ ... }).optional(),
 *     },
 * }))
 * ```
 */
export type AiFunctionSettings = {
  __description__: string;
  __when_to_call__: string;
  __auto_moderate__?: boolean;
  __background__?: boolean;
  params?: Record<string, AIParam>;

  // Retrocompat SDK < 0.30 — bridge Python aceita ambos
  description?: string;
  whenToCall?: string;
  auto_moderate?: boolean;
  background?: boolean;
} | null;


// ═══════════════════════════════════════════════════════════════════════════
// Helper ``p`` — builders de tipo para AI function params
// ═══════════════════════════════════════════════════════════════════════════

function _withOptional(param: AIParam): AIParam {
  param.optional = () => ({ ...param, _optional: true, optional: undefined });
  return param;
}

/**
 * Builders de tipo para parâmetros de AI functions.
 *
 * @example
 * ```ts
 * import { p } from "jsr:@virti/microapp-sdk";
 *
 * p.string("Nome do usuário.")
 * p.integer("Quantidade.").optional()
 * p.enum(["a", "b"], "Ação.")
 * p.array(p.string(), "Lista de tags.")
 * p.object({
 *     __description__: "Sub-objeto.",
 *     __when_to_call__: "Quando precisar.",
 *     properties: { campo: p.string("Desc.") },
 * }).optional()
 * ```
 */
export const p: {
  string(description: string): AIParam;
  integer(description: string): AIParam;
  number(description: string): AIParam;
  boolean(description: string): AIParam;
  enum(values: string[], description: string): AIParam;
  array(items: AIParam, description: string): AIParam;
  object(config: AIObjectConfig): AIParam;
} = {
  /** Parâmetro do tipo string. */
  string(description: string): AIParam {
    return _withOptional({ type: "string", __description__: description });
  },

  /** Parâmetro do tipo inteiro. */
  integer(description: string): AIParam {
    return _withOptional({ type: "integer", __description__: description });
  },

  /** Parâmetro do tipo numérico (float). */
  number(description: string): AIParam {
    return _withOptional({ type: "number", __description__: description });
  },

  /** Parâmetro do tipo booleano. */
  boolean(description: string): AIParam {
    return _withOptional({ type: "boolean", __description__: description });
  },

  /**
   * Parâmetro com valores fechados (enum).
   * Tipo inferido como string — não precisa declarar ``type``.
   */
  enum(values: string[], description: string): AIParam {
    return _withOptional({ enum: values, __description__: description });
  },

  /**
   * Parâmetro do tipo array.
   * @param items - Schema dos itens do array (ex: ``p.string()``).
   */
  array(items: AIParam, description: string): AIParam {
    // Limpa optional() do items se existir
    const cleanItems = { ...items };
    delete cleanItems.optional;
    delete cleanItems._optional;
    return _withOptional({ type: "array", items: cleanItems, __description__: description });
  },

  /**
   * Sub-objeto com metadados (description, when_to_call) e propriedades tipadas.
   *
   * @example
   * ```ts
   * p.object({
   *     __description__: "Lista robôs.",
   *     __when_to_call__: "Quando precisar listar.",
   *     __override__: false,  // substituição total (default: true = merge)
   *     properties: {
   *         id_robo: p.integer("ID.").optional(),
   *     },
   * })
   * ```
   */
  object(config: AIObjectConfig): AIParam {
    const param: AIParam = {
      type: "object",
      __description__: config.__description__,
      __when_to_call__: config.__when_to_call__,
    };
    if (config.__override__ !== undefined) {
      param.__override__ = config.__override__;
    }
    if (config.properties) {
      // Limpa optional() de cada property e calcula required
      const cleanProps: Record<string, AIParam> = {};
      const required: string[] = [];
      for (const [key, val] of Object.entries(config.properties)) {
        const clean = { ...val };
        const isOptional = clean._optional === true;
        delete clean.optional;
        delete clean._optional;
        cleanProps[key] = clean;
        if (!isOptional) {
          required.push(key);
        }
      }
      param.properties = cleanProps;
      if (required.length > 0) {
        param.required = required;
      }
    }
    return _withOptional(param);
  },
};

/**
 * Decorator que registra um método como uma AI function no pipeline do MicroApp.
 * AI functions são funções que a IA pode invocar autonomamente durante uma conversa.
 * Recebe uma função `setup` que retorna as configurações (descrição, quando chamar, parâmetros).
 * No `setup` podemos construir os parâmetros da AI function dinamicamente, usando por exemplo varsUser, infosUser, chamadas de API.
 * Erros de execução são capturados e retornados como mensagem de erro com um código identificador.
 * @param setup - Função que recebe a instância do MicroApp e retorna as configurações da AI function.
 */
export function aiFunction<T extends MicroApp>(
  setup: (
    instance: T,
  ) => AiFunctionSettings | Promise<AiFunctionSettings>,
): any {
  return function (target: any, _context: any) {
    MicroApp.__pipeline__.ai_function[target.name] = {
      setup,
      fn: async (obj: any, params: object) => {
        try {
          return await target.call(obj, params);
        } catch (err) {
          const eid = Math.round(Math.random() * 1_000_000);
          console.log(
            `Erro ao executar a AI function ${target.name}:\n${err}\n\n${err?.stack}`,
          );
          return `Erro ao executar a AI function ${target.name}. Código de erro ${eid}`;
        }
      },
    };

    return target;
  };
}

/**
 * Decorator que registra um método como etapa de pós-processamento no pipeline do MicroApp.
 * Métodos decorados são executados após a LLM ter gerado a resposta e respondido o usuário. Eles são ordenados pelo `tier` (prioridade).
 * @param tier - Nível de prioridade de execução no pós-processamento.
 */
export function postprocessing<T>({ tier }: { tier: number }): any {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.postprocessing[target.name] = {
      tier,
      fn: (obj: any) => (target.call(obj)),
    };

    return target;
  };
}

/**
 * Decorator que registra um método como exposto no pipeline do MicroApp.
 * Métodos expostos ficam disponíveis para serem chamados externamente, recebendo parâmetros arbitrários.
 */
export function exposed<T extends Function>(): any {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.exposed[target.name] = {
      fn: (obj: any, params: object) => (target.call(obj, params)),
    };

    return target;
  };
}

/**
 * Decorator de método que intercepta a chamada original e a redireciona pela bridge do MicroApp.
 * Em vez de executar o método diretamente, envia a chamada pelo sistema de bridge (comunicação entre processos)
 * e retorna uma Promise que é resolvida quando a bridge responde.
 * Em modo MOCK (variável de ambiente `MOCK`), retorna o método original sem interceptação.
 */
export function wrapperMethod(
  target: any,
  context: ClassMethodDecoratorContext,
): any {
  if (Deno.env.get("MOCK")) {
    return target;
  }

  const functionName = String(context.name);

  return function (this: any, params: any) {
    let resolve!: (value: any) => void;
    let reject!: (reason?: any) => void;

    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });

    const id = Math.round(Math.random() * 1_000_000);

    MicroApp.__calls__.push({
      context_id: id,
      reject,
      resolve,
    });

    MicroApp.__bridge__.call({
      context_id: id,
      microapp_name: this.constructor.name,
      function_name: functionName,
      params,
      meta: this.__meta__,
    });

    return promise;
  };
}

/**
 * Decorator de classe que intercepta todos os métodos do prototype e os redireciona pela bridge do MicroApp.
 * Percorre todas as propriedades do prototype (exceto o constructor) e substitui cada método por
 * uma versão que envia a chamada pela bridge, retornando uma Promise resolvida pela resposta.
 * Em modo MOCK (variável de ambiente `MOCK`), retorna a classe original sem modificações.
 */
export function wrapper<T extends { prototype: any }>(
  target: T,
  _context: any,
): T {
  if (Deno.env.get("MOCK")) {
    return target;
  }

  const props = Object.getOwnPropertyNames(target.prototype);

  for (const prop of props) {
    if (prop === "constructor") continue;

    const original = target.prototype[prop];
    if (typeof original !== "function") continue;

    target.prototype[prop] = function (params: any) {
      let resolve!: (value: any) => void;
      let reject!: (reason?: any) => void;

      const promise = new Promise((res, rej) => {
        resolve = res;
        reject = rej;
      });

      const id = Math.round(Math.random() * 1_000_000);

      MicroApp.__calls__.push({
        context_id: id,
        reject,
        resolve,
      });

      MicroApp.__bridge__.call({
        context_id: id,
        microapp_name: this.constructor.name,
        function_name: prop,
        params,
        meta: this.__meta__,
      });

      return promise;
    };
  }

  return target;
}
