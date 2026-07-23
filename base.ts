import { GestorArquivos } from "./arquivos.ts";
import { Arquivos } from "./arquivos_facade.ts";
import { ControladorFluxo } from "./fluxo.ts";
import { InfosConta, InfosRobo, InfosUser } from "./infosUser.ts";
import {
  ChatWootInterface,
  ControladorInterface,
  LivechatInterface,
  TelegramInterface,
  WhatsappInterface,
} from "./interfaces.ts";
import { GPT } from "./llm.ts";
import { Logger } from "./logger.ts";
import { Conversa } from "./mensagens.ts";
import { PromptNode } from "./prompt.ts";
import { SchedulerMetodos } from "./scheduler.ts";
import { VarsUser } from "./varsUser.ts";
import { FollowUp } from "./follow_up.ts";
import { CRM } from "./crm.ts";
import { PortalAPI } from "./portalApi.ts";
import { MicroAppUtils } from "./utils.ts";
import { MicroappManager } from "./microapp_manager.ts";
import { SDK_VERSION_TUPLE } from "./version.ts";

const BRIDGE_CONTEXT_IDS_KEY = Symbol.for(
  "@virti/microapp-sdk.bridge-context-ids",
);
const LEGACY_CONTEXT_ID_MAX = 1_000_000;
const bridgeGlobal = globalThis as any;
if (!(bridgeGlobal[BRIDGE_CONTEXT_IDS_KEY] instanceof Set)) {
  bridgeGlobal[BRIDGE_CONTEXT_IDS_KEY] = new Set();
}

const activeBridgeContextIds = bridgeGlobal[BRIDGE_CONTEXT_IDS_KEY] as Set<
  number
>;

type BridgeCall = {
  context_id: number;
  reject: (reason?: unknown) => void;
  resolve: (value: unknown) => void;
};

function randomSafeInteger(): number {
  const values = crypto.getRandomValues(new Uint32Array(2));
  return (values[0] & 0x1f_ffff) * 0x1_0000_0000 + values[1];
}

export class MicroApp {
  llm: GPT;
  vars: VarsUser;
  infosUser: InfosUser;
  infosRobo: InfosRobo;
  infosConta: InfosConta;
  logger: Logger;
  fluxo: ControladorFluxo;
  prompt: PromptNode;
  gestor_arquivos: GestorArquivos;
  arquivos: Arquivos;
  conversa: Conversa;
  interface_livechat: LivechatInterface;
  interface_whatsapp: WhatsappInterface;
  interface_chatwoot: ChatWootInterface;
  interface_telegram: TelegramInterface;
  controlador_interface: ControladorInterface;
  metodosagendados: SchedulerMetodos;
  fup: FollowUp;
  crm: CRM;
  portalApi: PortalAPI;
  utils: MicroAppUtils;
  microapp_manager: MicroappManager;

  static __version__ = SDK_VERSION_TUPLE;

  static __pipeline__: Record<string, Record<string, any>> = {
    preprocessing: {},
    ai_function: {},
    moderator: {},
    postprocessing: {},
    exposed: {},
    api: {},
  };

  // O worker injeta um array por microapp; manter esse contrato entre versões.
  static __calls__: BridgeCall[] = [];

  static __next_call_id__(
    calls: ReadonlyArray<Pick<BridgeCall, "context_id">> = MicroApp.__calls__,
    generate: () => number = randomSafeInteger,
  ): number {
    let contextId: number;
    do {
      contextId = generate();
    } while (
      !Number.isSafeInteger(contextId) || contextId <= LEGACY_CONTEXT_ID_MAX ||
      activeBridgeContextIds.has(contextId) ||
      calls.some((call) => call.context_id === contextId)
    );

    activeBridgeContextIds.add(contextId);
    return contextId;
  }

  static __release_call_id__(contextId: number): void {
    activeBridgeContextIds.delete(contextId);
  }

  static __bridge__ = {
    call: function (params: object) {},
    receive: function (
      params: {
        error_message: string;
        type: string;
        context_id: number;
        value: any;
        message?: string;
      },
    ): any {
      if (params.type !== "execution_result") return;

      const index = MicroApp.__calls__.findIndex((call) =>
        call.context_id === params.context_id
      );
      if (index === -1) return;
      const [call] = MicroApp.__calls__.splice(index, 1);
      MicroApp.__release_call_id__(params.context_id);
      if (params.error_message) {
        call.reject(params.error_message);
        return;
      }

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
    },
  };

  constructor() {
    this.llm = new GPT();
    this.vars = new VarsUser();
    this.logger = new Logger();
    this.fluxo = new ControladorFluxo();
    this.infosUser = new InfosUser();
    this.infosRobo = new InfosRobo();
    this.infosConta = new InfosConta();
    this.prompt = new PromptNode("Mock Root");
    this.gestor_arquivos = new GestorArquivos();
    this.conversa = new Conversa();
    this.arquivos = new Arquivos(this.gestor_arquivos, this.conversa);
    this.interface_livechat = new LivechatInterface();
    this.interface_whatsapp = new WhatsappInterface();
    this.interface_chatwoot = new ChatWootInterface();
    this.interface_telegram = new TelegramInterface();
    this.controlador_interface = new ControladorInterface();
    this.metodosagendados = new SchedulerMetodos();
    this.fup = new FollowUp();
    this.crm = new CRM();
    this.portalApi = new PortalAPI();
    this.utils = new MicroAppUtils();
    this.microapp_manager = new MicroappManager();
  }
}
