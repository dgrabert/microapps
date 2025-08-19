import { GestorArquivos } from "./arquivos.ts";
import { ControladorFluxo } from "./fluxo.ts";
import { InfosUser } from "./infosUser.ts";
import {
  ChatWootInterface,
  ControladorInterface,
  LivechatInterface,
  WhatsappInterface,
} from "./interfaces.ts";
import { GPT } from "./llm.ts";
import { Logger } from "./logger.ts";
import { Conversa } from "./mensagens.ts";
import { PromptNode } from "./prompt.ts";
import { SchedulerMetodos } from "./scheduler.ts";
import { VarsUser } from "./varsUser.ts";

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
  interface_chatwoot: ChatWootInterface;
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
    this.interface_chatwoot = new ChatWootInterface();
    this.controlador_interface = new ControladorInterface();
    this.metodosagendados = new SchedulerMetodos();
  }
}
