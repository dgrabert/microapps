/**
 * PortalAPI — API programática interna da plataforma.
 *
 * Permite que micro apps TypeScript acessem funcionalidades administrativas
 * (robôs, canais, conversas, integrações, etc.) via bridge.
 *
 * Uso:
 * ```ts
 * const robos = await this.portalApi.robos.listar();
 * const canal = await this.portalApi.canais.criar({ tipo: "livechat", id_robo: 1 });
 * ```
 *
 * O `id_conta` é injetado automaticamente pelo backend — micro apps TS
 * nunca precisam informar a conta.
 */

import { wrapper } from "./decorators.ts";

@wrapper
export class RobosAdapter {
  listar(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
  criar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  editar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  deletar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  fluxo_buscar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  fluxo_atualizar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  fluxo_criar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
}

@wrapper
export class CanaisAdapter {
  listar(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
  criar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  editar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  deletar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
}

@wrapper
export class ConversasAdapter {
  listar(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
  informacoes(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  historico(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  exportar_csv(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
}

@wrapper
export class CampanhasAdapter {
  listar(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
  criar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  editar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  deletar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  templates(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
}

@wrapper
export class IntegracoesAdapter {
  listar(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
  criar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  editar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  deletar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  autenticar_rdstation(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
}

@wrapper
export class FontesDadosAdapter {
  listar(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
  criar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  editar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  deletar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  processar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
}

@wrapper
export class BancoConhecimentosAdapter {
  listar(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
  criar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  editar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  deletar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  pesquisar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
}

@wrapper
export class MicroappsAdapter {
  listar(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
  criar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  editar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
  deletar(_p: Record<string, any>): Promise<any> { return Promise.resolve(); }
}

@wrapper
export class DashboardAdapter {
  consultar(_p?: Record<string, any>): Promise<any> { return Promise.resolve(); }
}


export class PortalAPI {
  robos: RobosAdapter;
  canais: CanaisAdapter;
  conversas: ConversasAdapter;
  campanhas: CampanhasAdapter;
  integracoes: IntegracoesAdapter;
  fontes_dados: FontesDadosAdapter;
  banco_conhecimentos: BancoConhecimentosAdapter;
  microapps: MicroappsAdapter;
  dashboard: DashboardAdapter;

  constructor() {
    this.robos = new RobosAdapter();
    this.canais = new CanaisAdapter();
    this.conversas = new ConversasAdapter();
    this.campanhas = new CampanhasAdapter();
    this.integracoes = new IntegracoesAdapter();
    this.fontes_dados = new FontesDadosAdapter();
    this.banco_conhecimentos = new BancoConhecimentosAdapter();
    this.microapps = new MicroappsAdapter();
    this.dashboard = new DashboardAdapter();
  }
}
