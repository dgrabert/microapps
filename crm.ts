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
  api_requests: Array<{
    path: string;
    method: string;
    data?: Record<string, any> | null;
    query_params?: Record<string, any>;
  }> = [];
  contacts: RDContact[] = [];
  deals: RDDeal[] = [];
  pipelines: Array<{ id: string; name: string }> = [];
  stages_by_pipeline_id: Record<
    string,
    Array<{ id: string; name: string; order?: number }>
  > = {};
  users: Array<{ id: string; email: string; name?: string }> = [];
  custom_fields: Array<
    { id: string; name: string; slug?: string; entity?: string }
  > = [];
  teams: RDTeam[] = [];
  private nextContactId = 1;
  private nextDealId = 1;

  @wrapperMethod
  api_request(p: {
    path: string;
    method: string;
    data?: Record<string, any> | null;
    query_params?: Record<string, any>;
  }): Promise<any> {
    this.api_requests.push({ ...p });
    return Promise.resolve(p.data ?? null);
  }

  @wrapperMethod
  find_contact(p: {
    id_user: string;
  }): Promise<RDContact | null> {
    return Promise.resolve(
      this.contacts.find((contact) =>
        contact.id === p.id_user || contact.custom_fields?.id_user === p.id_user
      ) ?? null,
    );
  }

  @wrapperMethod
  create_contact(p: {
    id_user: string;
  }): Promise<RDContact> {
    const existing = this.contacts.find((contact) =>
      contact.id === p.id_user || contact.custom_fields?.id_user === p.id_user
    );
    if (existing) {
      return Promise.resolve(existing);
    }

    const contact: RDContact = {
      id: `mock-contact-${this.nextContactId++}`,
      custom_fields: { id_user: p.id_user },
    };
    this.contacts.push(contact);
    return Promise.resolve(contact);
  }

  @wrapperMethod
  find_ai_deal(_p: {
    contact_id: string;
  }): Promise<RDDeal | null> {
    return Promise.resolve(
      this.deals.find((deal) => deal.contact_ids?.includes(_p.contact_id)) ??
        null,
    );
  }

  @wrapperMethod
  create_ai_deal(p: {
    id_user: string;
    contact_id: string;
    owner_id: string;
    pipeline_id?: string;
    stage_id?: string;
  }): Promise<RDDeal> {
    const deal: RDDeal = {
      id: `mock-deal-${this.nextDealId++}`,
      contact_ids: [p.contact_id],
      owner_id: p.owner_id,
      pipeline_id: p.pipeline_id,
      stage_id: p.stage_id,
      status: "ongoing",
      custom_fields: { id_user: p.id_user },
    };
    this.deals.push(deal);
    return Promise.resolve(deal);
  }

  @wrapperMethod
  save_deal(p: {
    id_contato: string;
    id_deal: string | null;
    data: Record<string, any>;
  }): Promise<RDDeal | null> {
    let deal = p.id_deal == null
      ? undefined
      : this.deals.find((deal) => deal.id === p.id_deal);
    if (!deal) {
      deal = {
        id: p.id_deal ?? `mock-deal-${this.nextDealId++}`,
        contact_ids: [p.id_contato],
      };
      this.deals.push(deal);
    }
    Object.assign(deal, p.data);
    if (!deal.contact_ids?.includes(p.id_contato)) {
      deal.contact_ids = [...(deal.contact_ids ?? []), p.id_contato];
    }
    return Promise.resolve(deal);
  }

  @wrapperMethod
  get_pipeline_by_name(p: {
    name: string;
  }): Promise<{ id: string; name: string } | null> {
    return Promise.resolve(
      this.pipelines.find((pipeline) => pipeline.name === p.name) ?? null,
    );
  }

  @wrapperMethod
  get_stages_by_pipeline_id(p: {
    pipeline_id: string;
  }): Promise<Array<{ id: string; name: string; order?: number }>> {
    return Promise.resolve(this.stages_by_pipeline_id[p.pipeline_id] ?? []);
  }

  @wrapperMethod
  get_user_by_email(p: {
    email: string;
  }): Promise<{ id: string; email: string; name?: string } | null> {
    return Promise.resolve(
      this.users.find((user) => user.email === p.email) ?? null,
    );
  }

  @wrapperMethod
  get_custom_field_by_name(p: {
    name: string;
    entity?: string;
  }): Promise<{ id: string; name: string; slug?: string; entity?: string } | null> {
    return Promise.resolve(
      this.custom_fields.find((field) =>
        field.name === p.name && (p.entity == null || field.entity === p.entity)
      ) ?? null,
    );
  }

  @wrapperMethod
  list_teams(): Promise<RDTeam[]> {
    return Promise.resolve(this.teams);
  }
}

export class CVCRM {
  leads: CVLead[] = [];
  corretores: CVCorretor[] = [];
  empreendimentos: CVEmpreendimentoDetalhe[] = [];
  situacoes: CVSituacao[] = [];

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
    return Promise.resolve(this.situacoes);
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
