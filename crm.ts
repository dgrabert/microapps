import { wrapper, wrapperMethod } from "./decorators.ts";

export type RDDeal = {
  id: string;
  name?: string;
  recurrence_price?: number;
  one_time_price?: number;
  total_price?: number;
  expected_close_date?: string;
  rating?: number;
  status?: "won" | "lost" | "ongoing" | "paused";
  closed_at?: string;
  pipeline_id?: string;
  stage_id?: string;
  owner_id?: string;
  source_id?: string;
  campaign_id?: string;
  lost_reason_id?: string;
  organization_id?: string;
  contact_ids?: string[];
  custom_fields?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
};

export type RDContact = {
  id: string;
  name?: string;
  job_title?: string;
  phones?: Array<{ phone: string }>;
  emails?: Array<{ email: string }>;
  birthday?: string;
  organization_id?: string;
  custom_fields?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
  _deal_ia?: RDDeal | null;
};

export type RDTeam = {
  id: string;
  name?: string;
  users?: Array<{ id: string; email?: string; name?: string }>;
};

export type CVSituacao = {
  id?: number;
  nome?: string;
};

export type CVCorretor = {
  id?: number;
  idcorretor?: number;
  nome?: string;
  email?: string;
};

export type CVEmpreendimento = {
  id?: number;
  nome?: string;
};

export type CVEmpreendimentoDetalhe = {
  idempreendimento?: string;
  idempreendimento_int?: string;
  referencia_externa?: string;
  nome?: string;
};

export type CVInteracao = {
  id?: number;
  descricao?: string;
  data_cad?: string;
};

export type CVLeadSalvarInteracao = {
  tipo: "W";
  descricao: string;
};

export type CVLeadSalvarRequest = {
  acao: "alteracao" | "inclusao";
  permitir_alteracao?: boolean;
  permitir_trocar_atendente?: boolean;
  nome: string;
  telefone: string;
  email: string;
  telefone_alternativo?: string;
  idlead?: number;
  idempreendimento?: number | number[];
  idcorretor?: number;
  email_corretor?: string;
  modulo: "gestor";
  origem: "CH";
  idsituacao?: number;
  lead_utilizar_fila?: boolean;
  utilizar_fila_corretor?: boolean;
  tags: string[];
  interacoes?: CVLeadSalvarInteracao;
  midia?: string;
  campos_adicionais?: Record<string, any>;
  remover_corretor?: boolean;
  remover_imobiliaria?: boolean;
};

export type CVLead = {
  idlead: number;
  situacao?: CVSituacao;
  empreendimento?: Array<CVEmpreendimento | string>;
  interacao?: CVInteracao[];
  corretor?: CVCorretor;
  nome?: string;
  email?: string;
  telefone?: string;
  tags?: string[];
};

export class RDStationCRM {
  @wrapperMethod
  api_request(_p: {
    path: string;
    method: string;
    data?: Record<string, any> | null;
    query_params?: Record<string, any>;
  }): Promise<any> {
    return Promise.resolve();
  }

  @wrapperMethod
  find_contact(_p: {
    id_user: string;
  }): Promise<RDContact | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  create_contact(_p: {
    id_user: string;
  }): Promise<RDContact> {
    return Promise.resolve({} as RDContact);
  }

  @wrapperMethod
  find_ai_deal(_p: {
    contact_id: string;
  }): Promise<RDDeal | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  create_ai_deal(_p: {
    id_user: string;
    contact_id: string;
    owner_id: string;
    pipeline_id?: string;
    stage_id?: string;
  }): Promise<RDDeal> {
    return Promise.resolve({} as RDDeal);
  }

  @wrapperMethod
  save_deal(_p: {
    id_contato: string;
    id_deal: string | null;
    data: Record<string, any>;
  }): Promise<RDDeal | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  get_pipeline_by_name(_p: {
    name: string;
  }): Promise<{ id: string; name: string } | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  get_stages_by_pipeline_id(_p: {
    pipeline_id: string;
  }): Promise<Array<{ id: string; name: string; order?: number }>> {
    return Promise.resolve([]);
  }

  @wrapperMethod
  get_user_by_email(_p: {
    email: string;
  }): Promise<{ id: string; email: string; name?: string } | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  get_custom_field_by_name(_p: {
    name: string;
    entity?: string;
  }): Promise<{ id: string; name: string; slug?: string } | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  list_teams(): Promise<RDTeam[]> {
    return Promise.resolve([]);
  }
}

export class CVCRM {
  leads: CVLead[] = [];
  corretores: CVCorretor[] = [];
  empreendimentos: CVEmpreendimentoDetalhe[] = [];

  @wrapperMethod
  api_request(_p: {
    path: string;
    method: string;
    data?: Record<string, any> | null;
    query_params?: Record<string, any>;
  }): Promise<any> {
    return Promise.resolve();
  }

  @wrapperMethod
  get_lead_by_id(p: { idlead: string }): Promise<CVLead | null> {
    return Promise.resolve(
      this.leads.find((lead) => String(lead.idlead) === String(p.idlead)) ??
        null,
    );
  }

  @wrapperMethod
  consultar_lead(
    p: { id_usuario: string },
  ): Promise<[Record<string, string> | null, CVLead | null]> {
    const telefone = String(p.id_usuario).split("_").slice(1).join("_");
    const lead = telefone
      ? this.leads.find((lead) => String(lead.telefone) === telefone) ?? null
      : null;
    return Promise.resolve([null, lead]);
  }

  @wrapperMethod
  salvar_lead(p: {
    id_usuario: string;
    json_body: CVLeadSalvarRequest;
  }): Promise<void> {
    const body = p.json_body;
    const telefoneUsuario = String(p.id_usuario).split("_").slice(1).join("_");
    const idlead = body.idlead == null ? undefined : Number(body.idlead);
    let lead = idlead == null
      ? undefined
      : this.leads.find((lead) => Number(lead.idlead) === idlead);

    if (!lead) {
      lead = {
        idlead: idlead ?? this.proximoIdLead(),
      };
      this.leads.push(lead);
    }

    lead.nome = body.nome;
    lead.telefone = body.telefone || telefoneUsuario || lead.telefone;
    lead.email = body.email;
    lead.tags = body.tags;

    if (body.idsituacao != null) {
      lead.situacao = { ...lead.situacao, id: body.idsituacao };
    }

    if (body.remover_corretor || body.remover_imobiliaria) {
      delete lead.corretor;
    } else if (body.idcorretor != null) {
      lead.corretor = this.corretores.find((corretor) =>
        String(corretor.idcorretor ?? corretor.id) === String(body.idcorretor)
      );
    } else if (body.email_corretor) {
      lead.corretor = this.corretores.find((corretor) =>
        corretor.email === body.email_corretor
      );
    }

    if (body.idempreendimento != null) {
      const ids = Array.isArray(body.idempreendimento)
        ? body.idempreendimento
        : [body.idempreendimento];
      lead.empreendimento = ids.map((id) => ({ id }));
    }

    return Promise.resolve();
  }

  @wrapperMethod
  get_corretor_by_id(p: { id_corretor: string }): Promise<CVCorretor | null> {
    return Promise.resolve(
      this.corretores.find((corretor) =>
        String(corretor.idcorretor ?? corretor.id) === String(p.id_corretor)
      ) ?? null,
    );
  }

  @wrapperMethod
  get_empreendimento_by_id(
    p: { id_empreendimento: string },
  ): Promise<CVEmpreendimentoDetalhe | null> {
    return Promise.resolve(
      this.empreendimentos.find((empreendimento) =>
        String(
          empreendimento.idempreendimento_int ??
            empreendimento.idempreendimento,
        ) === String(p.id_empreendimento)
      ) ?? null,
    );
  }

  @wrapperMethod
  list_situacoes(): Promise<CVSituacao[]> {
    return Promise.resolve([]);
  }

  private proximoIdLead(): number {
    const maiorId = this.leads.reduce(
      (maior, lead) => Math.max(maior, Number(lead.idlead) || 0),
      0,
    );
    return maiorId + 1;
  }
}

@wrapper
export class EmailCRM {}

@wrapper
export class BitrixCRM {}

@wrapper
export class PiperunCRM {}

@wrapper
export class WebhookCRM {}

export class CRM {
  cvcrm: CVCRM;
  email: EmailCRM;
  bitrix: BitrixCRM;
  piperun: PiperunCRM;
  webhook: WebhookCRM;
  rdstation: RDStationCRM;

  constructor() {
    this.cvcrm = new CVCRM();
    this.email = new EmailCRM();
    this.bitrix = new BitrixCRM();
    this.piperun = new PiperunCRM();
    this.webhook = new WebhookCRM();
    this.rdstation = new RDStationCRM();
  }
}
