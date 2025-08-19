import { wrapper } from "./decorators.ts";

export type Etapa = {
  nome: string;
};

@wrapper
export class ControladorFluxo {
  _etapa: string = "Etapa";

  etapa_existe(p: { nome_etapa: string }): Promise<boolean> {
    return Promise.resolve(p.nome_etapa === this._etapa);
  }

  set_etapa(p: { nome_etapa: string }): Promise<void> {
    this._etapa = p.nome_etapa;
    return Promise.resolve();
  }

  get_etapa_atual(): Promise<Etapa> {
    return Promise.resolve({ "nome": this._etapa });
  }
}
