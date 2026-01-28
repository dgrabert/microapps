import { wrapper } from "./decorators.ts";

@wrapper
export class FollowUp {
  quantidade_fups_enviados(): Promise<void> {
    return Promise.resolve();
  }

  total_fups(): Promise<number> {
    return Promise.resolve(0);
  }

  enviou_todos(): Promise<boolean> {
    return Promise.resolve(true);
  }

  abandonou_conversa(): Promise<boolean> {
    return Promise.resolve(true);
  }

  agendar_proximo_fup(p?: { forcar_agendar: boolean }): Promise<boolean> {
    if (p?.forcar_agendar) {
      console.log(`forçando follow up`);
    }
    return Promise.resolve(true);
  }

  fup_enviado(): Promise<void> {
    return Promise.resolve();
  }

  resetar_fup(): Promise<void> {
    return Promise.resolve();
  }

  conversa_finalizou(): Promise<boolean> {
    return Promise.resolve(true);
  }

  enviar_em_conversa_finalizada(): Promise<boolean> {
    return Promise.resolve(true);
  }
}
