import { wrapper } from "./decorators.ts";

/**
 * MicroappManager — Wrapper bridge para gerenciamento de microapps.
 *
 * Permite ao microapp-maker (TS) fazer CRUD de microapps no banco,
 * validar schemas e rodar testes E2E via pipeline efêmera.
 *
 * Os métodos são stubs — a execução real acontece no Python via bridge.
 * O nome da classe DEVE ser exatamente "MicroappManager" para casar
 * com o __name__ da classe Python no dispatch do bridge.
 */
@wrapper
export class MicroappManager {
  __meta__: Record<string, unknown> = {};
  _microapps: {
    id: number;
    nome: string;
    url: string;
    branch: string;
    entrypoint: string;
  }[] = [];
  _proximo_id: number = 1;

  async criar_microapp(p: {
    nome: string;
    url: string;
    entrypoint: string;
    branch: string;
    user?: string;
    secret?: string;
  }): Promise<{
    id?: number;
    nome?: string;
    url?: string;
    branch?: string;
    entrypoint?: string;
    erro?: string;
  }> {
    const microapp = {
      id: this._proximo_id++,
      nome: p.nome,
      url: p.url,
      branch: p.branch,
      entrypoint: p.entrypoint,
    };
    this._microapps.push(microapp);
    return microapp;
  }

  async atualizar_microapp(p: {
    id_microapp: number;
    nome?: string;
    url?: string;
    entrypoint?: string;
    branch?: string;
    user?: string;
    secret?: string;
  }): Promise<{
    id?: number;
    nome?: string;
    url?: string;
    branch?: string;
    entrypoint?: string;
    erro?: string;
  }> {
    const microapp = this._microapps.find((item) => item.id === p.id_microapp);
    if (!microapp) {
      return { erro: "Microapp não encontrado" };
    }
    if (p.nome != null) microapp.nome = p.nome;
    if (p.url != null) microapp.url = p.url;
    if (p.branch != null) microapp.branch = p.branch;
    if (p.entrypoint != null) microapp.entrypoint = p.entrypoint;
    return microapp;
  }

  async deletar_microapp(p: {
    id_microapp: number;
  }): Promise<{ ok?: boolean; id?: number; erro?: string }> {
    const tamanhoAntes = this._microapps.length;
    this._microapps = this._microapps.filter((item) =>
      item.id !== p.id_microapp
    );
    if (this._microapps.length === tamanhoAntes) {
      return { ok: false, id: p.id_microapp, erro: "Microapp não encontrado" };
    }
    return { ok: true, id: p.id_microapp };
  }

  async listar_microapps(
    _p: Record<string, never>,
  ): Promise<
    {
      id: number;
      nome: string;
      url: string;
      branch: string;
      entrypoint: string;
    }[]
  > {
    return this._microapps;
  }

  async validar_schema(p: {
    url: string;
    branch: string;
    entrypoint: string;
    user?: string;
    secret?: string;
  }): Promise<{ valido: boolean; erro?: string | null }> {
    if (!p.url || !p.branch || !p.entrypoint) {
      return { valido: false, erro: "Campos obrigatórios ausentes" };
    }
    return { valido: true, erro: null };
  }

  async executar_conversa_efemera(p: {
    mensagens: string[];
    id_microapp: number;
    infos_user?: Record<string, unknown>;
    vars_user?: Record<string, unknown>;
  }): Promise<{
    respostas: string[];
    erros: string[];
    estado_final: Record<string, unknown>;
  }> {
    return {
      respostas: p.mensagens.map((mensagem) => `mock: ${mensagem}`),
      erros: [],
      estado_final: {
        infos_user: p.infos_user ?? {},
        vars_user: p.vars_user ?? {},
      },
    };
  }
}
