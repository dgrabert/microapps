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
    return null!;
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
    return null!;
  }

  async deletar_microapp(p: {
    id_microapp: number;
  }): Promise<{ ok?: boolean; id?: number; erro?: string }> {
    return null!;
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
    return null!;
  }

  async validar_schema(p: {
    url: string;
    branch: string;
    entrypoint: string;
    user?: string;
    secret?: string;
  }): Promise<{ valido: boolean; erro?: string | null }> {
    return null!;
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
    return null!;
  }
}
