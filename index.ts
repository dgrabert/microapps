export function preprocessing<T>({ tier }: { tier: number }) {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.preprocessing[target.name] = {
      tier,
      fn: (obj: any) => (target.call(obj)),
    };

    return target;
  };
}

export function moderator<T>() {
  return function (target: T, _context: any) {
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

type AiFunctionSettings = {
  description: string;
  whenToCall: string;
  params?: Record<string, AIParam>;
  auto_moderate?: boolean;
};

export function aiFunction(
  setup: <T extends MicroApp>(
    instance: T,
  ) => AiFunctionSettings | Promise<AiFunctionSettings>,
) {
  return function (target: any, _context: any) {
    MicroApp.__pipeline__.ai_function[target.name] = {
      setup,
      fn: (obj: any, params: object) => {
        console.log("executing", target.name, params);
        return target.call(obj, params);
      },
    };

    return target;
  };
}

export function postprocessing<T>({ tier }: { tier: number }) {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.postprocessing[target.name] = {
      tier,
      fn: (obj: any) => (target.call(obj)),
    };

    return target;
  };
}

function wrapper<T>(target: T, _context: any) {
  if (Deno.env.get("MOCK")) {
    return target;
  }
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

        MicroApp.__calls__.push({
          context_id: id,
          reject,
          resolve,
        });

        MicroApp.__bridge__.call({
          context_id: id,
          microapp_name: target.prototype.constructor.name,
          function_name: prop,
          params: params,
          meta: this.__meta__,
        });

        return promise;
      };
    }
  }
  return target;
}

@wrapper
class ControladorInterface {
  async get_interface_nome(): Promise<
    "whatsapp" | "site" | "bitrix" | "generico"
  > {
    return "generico";
  }
}

@wrapper
class WhatsappInterface {
  async is_active(): Promise<bool> {
    return false;
  }

  async send_template(
    { nome_template, id_user, components }: {
      nome_template: string;
      id_user: string;
      components: any;
    },
  ) {}
}

@wrapper
class LivechatInterface {
  async is_active(): Promise<bool> {
    return false;
  }
}

@wrapper
class Logger {
  async debug(p: { msg: string }) {
    console.log(`DEBUG: ${p.msg}`);
  }
  async info(p: { msg: string }) {
    console.log(`INFO: ${p.msg}`);
  }
  async warning(p: { msg: string }) {
    console.log(`WARN: ${p.msg}`);
  }
  async error(p: { msg: string }) {
    console.log(`ERROR: ${p.msg}`);
  }
}

@wrapper
class GPT {
  /**
   * Define o modelo LLM a ser utilizado.
   *
   * @param modelo - Nome do modelo a ser utilizado (ex: "gpt-4o-mini")
   */
  async set_modelo({ modelo }: { modelo: string }): Promise<void> {}

  /**
   * Executa uma chamada ao LLM e retorna a resposta.
   *
   * @param mensagens - Lista de mensagens para enviar ao LLM
   * @param tools - Lista opcional de ferramentas que o LLM pode usar
   * @param response_format - Especificação opcional do formato da resposta
   * @returns A resposta do LLM, razão de finalização e quaisquer chamadas de ferramentas
   */
  async run({
    mensagens,
    tools = [],
    response_format = {},
  }: {
    mensagens: MensagemLLM[];
    tools?: any[];
    response_format?: Record<string, any>;
  }): Promise<[string, string, any]> {
    return ["", "", null];
  }

  /**
   * Realiza um processo de votação usando múltiplas chamadas LLM para determinar consenso.
   *
   * @param num_votos - Número de votos a coletar (deve ser ímpar)
   * @param mensagem_sistema - Mensagem do sistema contendo critérios de votação
   * @param mensagens_a_apurar - Mensagens a serem avaliadas
   * @param resposta_padrao - Resposta padrão se incerto (true/false)
   * @param cadeia_pensamentos - Se deve incluir cadeia de pensamentos na resposta
   * @returns Booleano indicando se a votação foi aprovada
   */
  async votar({
    num_votos,
    mensagem_sistema,
    mensagens_a_apurar,
    resposta_padrao = false,
    cadeia_pensamentos = false,
  }: {
    num_votos: number;
    mensagem_sistema: string;
    mensagens_a_apurar: string;
    resposta_padrao?: boolean;
    cadeia_pensamentos?: boolean;
  }): Promise<boolean> {
    return false;
  }
}

@wrapper
class VarsUser {
  _dados: Record<string, any> = {};

  get(p: { chave: string }): Promise<any | undefined> {
    return Promise.resolve(this._dados[p.chave]);
  }

  set(p: { chave: string; conteudo: any }): Promise<boolean> {
    this._dados[p.chave] = p.conteudo;
    return Promise.resolve(true);
  }

  delete(p: { chave: string }): Promise<boolean> {
    const existe = p.chave in this._dados;
    delete this._dados[p.chave];
    return Promise.resolve(existe);
  }
}

@wrapper
class InfosUser {
  _dados: Record<string, any> = {};

  get(p: { chave: string }): Promise<any | undefined> {
    return Promise.resolve(this._dados[p.chave]);
  }

  set(p: { chave: string; conteudo: any }): Promise<boolean> {
    this._dados[p.chave] = p.conteudo;
    return Promise.resolve(true);
  }

  delete(p: { chave: string }): Promise<boolean> {
    const existe = p.chave in this._dados;
    delete this._dados[p.chave];
    return Promise.resolve(existe);
  }
}

@wrapper
class PromptNode {
  async add_item({ item }: { item: string | string[] }): Promise<PromptNode> {
    const _ = item;
    return new PromptNode();
  }

  async remove_item({ item }: { item: string }): Promise<PromptNode> {
    return new PromptNode();
  }

  async clear_items(): Promise<PromptNode> {
    return new PromptNode();
  }

  async add_node({ name }: { name: string }): Promise<PromptNode> {
    return new PromptNode();
  }

  async node({ name }: { name: string }): Promise<PromptNode> {
    return new PromptNode();
  }

  async remove_node({ name }: { name: string }): Promise<PromptNode> {
    return new PromptNode();
  }

  async find_node({ name }: { name: string }): Promise<PromptNode | null> {
    return null;
  }

  async to_json(): Promise<string> {
    return "";
  }

  async from_json({ jsonString }: { jsonString: string }): Promise<void> {
    return;
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
  async etapa_existe({ nome_etapa }: { nome_etapa: string }): Promise<boolean> {}
  async set_etapa({ nome_etapa }: { nome_etapa: string }) {}
  async get_etapa_atual(): Promise<Etapa> {}
}

@wrapper
class GestorArquivos {
  async upload_arquivo(params: {
    obj_arquivo: string;
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
export class Conversa {
  idRobo: number = 123;
  idUsuario: string = "id_usuario";
  mensagens: Mensagem[] = [
    {
      origem: "cliente",
      conteudo: {
        texto: "Olá, estou interessado em comprar",
      },
    },
  ];

  ids(): Promise<[number, string]> {
    return Promise.resolve([this.idRobo, this.idUsuario]);
  }

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

  ultima_interacao(params: { origem?: string } = {}): Promise<string> {
    return Promise.resolve("");
  }

  append(params: { mensagem: Mensagem }): Promise<void> {
    this.mensagens.push(params.mensagem);
    return Promise.resolve(undefined);
  }

  concat(params: { mensagens: Mensagem[] }): Promise<void> {
    this.mensagens = this.mensagens.concat(mensagens);
    return Promise.resolve(undefined);
  }

  is_spam(params: { previous_messages?: number } = {}): Promise<boolean> {
    return Promise.resolve(false);
  }

  async get_last_message(
    params: { origem?: string } = {},
  ): Promise<Mensagem | null> {
    return null;
  }

  async pega_ultimo_bloco(params: { origem: string }): Promise<Mensagem[]> {
    return [];
  }

  async primeira_msg_do_cliente(): Promise<boolean> {
    return false;
  }

  async ultima_mensagem_origem(
    params: { origem?: string } = {},
  ): Promise<Mensagem | null> {
    return null;
  }

  async pega_todas_mensagens(
    params: { ignore_debug_msgs?: boolean } = { ignore_debug_msgs: true },
  ): Promise<Mensagem[]> {
    /**
     * Retorna todas as mensagens da conversa.
     *
     * @param ignore_debug_msgs - Se true, ignora mensagens do tipo debug.
     * @returns Lista com todas as mensagens da conversa.
     */
    return this.mensagens;
  }
}

export type Tarefas = {
    id: number,
    id_microapp: number,
    metodo: string
    parameteros: Record<string, string | number | boolean>,
    criado_em: string
    data_execucao: string
    status: string
}

export type RespostaAgendamento =  {
    success: boolean,
    data: Record<string, string | number | boolean>,
    error: string
}

@wrapper
class SchedulerMetodos {
  async agenda_tarefa({ 
    method_name, 
    parameters, 
    execution_date,
    microapp_id, 
  }: { 
    method_name: string,
    parameters: Record<string, string | number | boolean>,
    execution_date: string
    microapp_id?: number,
  }): Promise<RespostaAgendamento> {
        return {success: false, data: {}, error: "sem dados"}
    }

  async cancelar_tarefa_por_id({id}: {id: string}): Promise<void> {}
  
  async listar_tarefas({
    microapp_id
  }: {
    microapp_id?: number
  }): Promise<Tarefas[]> {

    return []
  }

  async cancelar_tarefa({ 
    method_name, 
    microapp_id, 
  }: { 
    method_name: string,
    microapp_id?: number,
  }): Promise<void> {}
}


// Definição do tipo Mensagem no formato JSON
export type MensagemLLM = {
  role: "assistant" | "user" | "function" | "system" | "tool";
  content?: string;
  tool_calls?: Array<Record<string, string>>;
  tool_call_id?: string;
};

export type Mensagem = {
  origem: string;
  conteudo: {
    texto?: string;
    midia?: string;
    audio?: string;
    tool_calls?: any[];
  };
  is_spam?: boolean;
  tipo?: string;
  timestamp?: string;
  modelo?: string;
  id_user?: string;
  id_robo?: number;
  tracking?: any;
  tool_call_id?: string;
  metadados?: any;
  message_id?: number;
  id_agendamento_prospeccao?: number;
};

export class MicroApp {
  llm: GPT;
  vars: VarsUser;
  infosUser: InfosUser;
  logger: Logger;
  fluxo: ControladorFluxo;
  prompt: PromptNode;
  gestor_arquivos: GestorArquivos;
  conversa: Conversa;
  interface_livechat: LivechatInterface;
  interface_whatsapp: WhatsappInterface;
  controlador_interface: ControladorInterface;
  metodosagendados: SchedulerMetodos;

  static __version__ = [0, 5, 0];

  static __pipeline__: Record<string, Record<string, any>> = {
    preprocessing: {},
    ai_function: {},
    moderator: {},
    postprocessing: {},
  };

  static __calls__: {
    context_id: number;
    reject: any;
    resolve: any;
  }[] = [];

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
      for (const call of MicroApp.__calls__) {
        if (call.context_id !== params.context_id) {
          continue;
        }
        if (params.type === "execution_result") {
          if (params.error_message) {
            call.reject(params.error_message);
          } else {
            // TODO: tratar tambem casos como array de objetos
            const className = params.value?.__meta__?.name;
            if (!className) {
              call.resolve(params.value);
              return;
            }

            try {
              const obj = eval(`new ${className}()`);
              Object.assign(obj, params.value);
              call.resolve(obj);
            } catch (_err) {
              call.resolve(params.value);
            }
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
    this.interface_livechat = new LivechatInterface();
    this.interface_whatsapp = new WhatsappInterface();
    this.controlador_interface = new ControladorInterface();
    this.metodosagendados = new SchedulerMetodos();
  }
}
