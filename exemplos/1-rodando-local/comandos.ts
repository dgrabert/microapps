import { MicroApp, preprocessing } from "jsr:@virti/microapp-sdk@0.12.2";

export default class MicroAppComandos extends MicroApp {
  mensagem: string;

  // campos do construtor são configuráveis nas configurações do robô
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
