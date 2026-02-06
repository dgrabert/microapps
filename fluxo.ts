import { wrapper } from "./decorators.ts";

export type Etapa = {
  nome: string;
};

@wrapper
export class ControladorFluxo {
  _etapa_atual: string = "Etapa 1";
  _etapa_anterior: string = "Etapa anterior";
  _etapas: Etapa[] = [
    { nome: "Etapa 1" },
    { nome: "Etapa 2" },
    { nome: "Etapa anterior" },
    { nome: "Etapa 3" },
  ];

  etapa_existe(p: { nome_etapa: string }): Promise<boolean> {
    return Promise.resolve(
      Boolean(this._etapas.find((e) => e.nome === p.nome_etapa)),
    );
  }

  set_etapa(
    p: { nome_etapa: string; gerar_evento_crm?: boolean },
  ): Promise<void> {
    console.log(`Fluxo: ${this._etapa_atual} -> ${p.nome_etapa}`);
    this._etapa_anterior = this._etapa_atual;
    this._etapa_atual = p.nome_etapa;
    return Promise.resolve();
  }

  get_etapa_atual(): Promise<Etapa> {
    const etapa = this._etapas.find((e) => e.nome === this._etapa_atual) ??
      this._etapas[0];
    console.log(`Fluxo: etapa atual: ${etapa}`);
    return Promise.resolve(etapa);
  }

  voltar_etapa(_p?: { gerar_evento_crm?: boolean }): Promise<void> {
    console.log(`Fluxo: ${this._etapa_atual} -> ${this._etapa_anterior}`);
    this._etapa_atual = this._etapa_anterior;
    return Promise.resolve();
  }
}
