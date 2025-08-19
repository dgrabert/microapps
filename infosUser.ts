import { wrapper } from "./decorators.ts";

@wrapper
export class InfosUser {
  _dados: Record<string, any> = {};

  get(p: { chave: string }): Promise<any | undefined> {
    if (!p.chave) {
      return Promise.reject("Parametro chave obrigatorio");
    }
    return Promise.resolve(this._dados[p.chave]);
  }

  set(p: { chave: string; conteudo: any }): Promise<boolean> {
    if (!p.chave) {
      return Promise.reject("Parametro chave obrigatorio");
    }
    this._dados[p.chave] = p.conteudo;
    return Promise.resolve(true);
  }

  delete(p: { chave: string }): Promise<boolean> {
    if (!p.chave) {
      return Promise.reject("Parametro chave obrigatorio");
    }
    const existe = p.chave in this._dados;
    delete this._dados[p.chave];
    return Promise.resolve(existe);
  }
}
