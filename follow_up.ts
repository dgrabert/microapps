import { wrapper } from "./decorators.ts";

@wrapper
export class FollowUp {
  _enviados: number = 0;
  _total: number = 0;
  _agendado: boolean = false;
  _abandonou_conversa: boolean = true;
  _conversa_finalizou: boolean = true;
  _enviar_em_conversa_finalizada: boolean = true;

  quantidade_fups_enviados(): Promise<number> {
    return Promise.resolve(this._enviados);
  }

  total_fups(): Promise<number> {
    return Promise.resolve(this._total);
  }

  enviou_todos(): Promise<boolean> {
    return Promise.resolve(this._enviados >= this._total);
  }

  abandonou_conversa(): Promise<boolean> {
    return Promise.resolve(this._abandonou_conversa);
  }

  agendar_proximo_fup(p?: { forcar_agendar: boolean }): Promise<boolean> {
    if (p?.forcar_agendar) {
      console.log(`forçando follow up`);
    }
    this._agendado = true;
    return Promise.resolve(true);
  }

  fup_enviado(): Promise<void> {
    this._enviados++;
    this._agendado = false;
    return Promise.resolve();
  }

  resetar_fup(): Promise<void> {
    this._enviados = 0;
    this._agendado = false;
    return Promise.resolve();
  }

  conversa_finalizou(): Promise<boolean> {
    return Promise.resolve(this._conversa_finalizou);
  }

  enviar_em_conversa_finalizada(): Promise<boolean> {
    return Promise.resolve(this._enviar_em_conversa_finalizada);
  }
}
