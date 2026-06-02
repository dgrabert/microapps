import { wrapper } from "./decorators.ts";

@wrapper
export class VarsUser {
  _dados: Record<string, string> = {};

  get(p: { chave: string }): Promise<string | undefined> {
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

  get_all(): Promise<Record<string, string>> {
    return Promise.resolve({ ...this._dados });
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
