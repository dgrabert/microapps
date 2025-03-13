const calls = [];

export const bridge = {
  call: function (params: object) {},
  receive: function (
    params: { type: string; context_id: number; value: any; message?: string },
  ) {
    for (const call of calls) {
      if (call.context_id !== params.context_id) {
        continue;
      }
      if (params.type === "execution_result") {
        if (params.error_message) {
          call.reject(params.error_message);
        } else {
          call.resolve(params.value);
        }
      }
    }
  },
};

export function preprocessing<T>({ tier }: { tier: number }) {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.preprocessing[target.name] = {
      tier,
      fn: (obj: any) => (target.call(obj)),
    };

    return target;
  };
}

export function moderator() {
  return function (target: Function, _context: any) {
    MicroApp.__pipeline__.moderator[target.name] = {
      fn: (obj: any, params: object) => (target.call(obj, params)),
    };

    return target;
  };
}

type AIParam = {
  type: "string" | "boolean" | "enum";
  description: string;
};

export function aiFunction(
  setup: () => {
    description: string;
    whenToCall: string;
    params?: Record<string, AIParam>;
  },
) {
  return function (target: any, _context: any) {
    const { description, whenToCall, params } = setup();

    MicroApp.__pipeline__.ai_function[target.name] = {
      description,
      whenToCall,
      params,
      fn: (obj: any, params: object) => {
        console.log("executing", target.name, params);
        return target.call(obj, params);
      },
    };

    return target;
  };
}

export function postprocessing({ tier }: { tier: number }) {
  return function (target: Function, _context: any) {
    MicroApp.__pipeline__.postprocessing[target.name] = {
      tier,
      fn: (obj: any) => (target.call(obj)),
    };

    return target;
  };
}

function wrapper<T>(target: T, _context: any) {
  const props = Object.getOwnPropertyNames(target.prototype);
  for (const prop of props) {
    if (prop === "constructor") {
      continue;
    }
    if (typeof target.prototype[prop] === "function") {
      target.prototype[prop] = function (params) {
        let resolve;
        let reject;

        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });

        const id = Math.round(Math.random() * 1_000_000);

        calls.push({
          context_id: id,
          reject,
          resolve,
        });

        MicroApp.__bridge__.call({
          context_id: id,
          microapp_name: target.prototype.constructor.name,
          function_name: prop,
          params: params,
        });

        return promise;
      };
    }
  }
  return target;
}

@wrapper
class Logger {
  async debug({ msg }) {}
}

@wrapper
class GPT {
  async run({ mensagens }) {}
}

@wrapper
class VarsUser {
  async get({ chave }: { chave: string }): Promise<string | undefined> {
    throw new Error("todo");
  }
  async set(
    { chave, conteudo }: { chave: string; conteudo: string },
  ): Promise<boolean> {
    return chave === conteudo;
  }
}

@wrapper
class InfosUser {
  async get({ chave }: { chave: string }): Promise<string | undefined> {
    return chave;
  }
  async set(
    { chave, conteudo }: { chave: string; conteudo: string },
  ): Promise<boolean> {
    return chave === conteudo;
  }
  async delete({ chave }: { chave: string }): Promise<boolean> {
    return chave !== "";
  }
}

@wrapper
class PromptNode {
  async add_item({ item }: { item: string | string[] }): Promise<PromptNode> {
    const _ = item;
    return new PromptNode();
  }
  async to_text(): Promise<string> {
    return "";
  }
}

type Etapa = {
  nome: string;
};

@wrapper
class ControladorFluxo {
  async set_etapa({ nome_etapa }: { nome_etapa: string }) {}
  async get_etapa_atual(): Promise<Etapa> {}
}

@wrapper
class GestorArquivos {
  async upload_arquivo(params: {
    path_arquivo: string;
    tipo: "audio" | "imagem" | "documento" | "video";
  }): Promise<string> {
    return String(params);
  }

  async gerar_url_presigned(params: {
    arquivo: string;
    validade_segundos: number;
  }): Promise<string> {
    return String(params);
  }
}

@wrapper
class Conversa {
  async to_text(
    params: {
      backlog?: number;
      ignore_tools_msgs?: boolean;
      max_input_user?: number;
      tag_name?: string;
    },
  ) {
    return "";
  }
}

export class MicroApp {
  llm: GPT;
  vars: VarsUser;
  infosUser: InfosUser;
  logger: Logger;
  fluxo: ControladorFluxo;
  prompt: PromptNode;
  gestor_arquivos: GestorArquivos;
  conversa: Conversa;

  static __pipeline__: Record<string, Record<string, any>> = {
    preprocessing: {},
    ai_function: {},
    moderator: {},
    postprocessing: {},
  };

  static __bridge__ = {
    call: function (params: object) {},
    receive: function (
      params: {
        type: string;
        context_id: number;
        value: any;
        message?: string;
      },
    ) {
      for (const call of calls) {
        if (call.context_id !== params.context_id) {
          continue;
        }
        if (params.type === "execution_result") {
          if (params.error_message) {
            call.reject(params.error_message);
          } else {
            call.resolve(params.value);
          }
        }
      }
    },
  };

  constructor() {
    this.llm = new GPT();
    this.vars = new VarsUser();
    this.logger = new Logger();
    this.fluxo = new ControladorFluxo();
    this.infosUser = new InfosUser();
    this.prompt = new PromptNode();
    this.gestor_arquivos = new GestorArquivos();
    this.conversa = new Conversa();
  }
}
