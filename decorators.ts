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
 * Um parâmetro de uma AI function.
 * Especifica o tipo do parâmetro (string, number, boolean, etc.) e uma descrição para orientar a IA.
 */
export type AIParam = {
  type:
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "empty"
    | "enum"
    | "array"
    | "object";
  description: string;
};

/**
 * Configurações de uma AI function registrada no pipeline.
 * Inclui a descrição da função, quando ela deve ser chamada pela IA (`whenToCall`),
 * os parâmetros esperados e se deve ser auto-moderada. Pode ser `null` para desativar a função dinamicamente.
 */
export type AiFunctionSettings = {
  description: string;
  whenToCall: string;
  params?: Record<string, AIParam>;
  auto_moderate?: boolean;
} | null;

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
 * Decorator que registra um método como acessível via endpoint de API externa.
 * Métodos decorados com `@api()` podem ser invocados pelo endpoint
 * `POST /executa/<id_conta>/robo/<id_robo>/microapp/<id_microapp>/<metodo>`.
 *
 * Exemplo:
 * ```ts
 * @api()
 * async consultarSaldo({ conta }: { conta: string }) {
 *   return { saldo: 100 };
 * }
 * ```
 */
export function api<T extends Function>(): any {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.api[target.name] = {
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
