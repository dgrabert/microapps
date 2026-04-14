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

export type CVLead = {
  idlead: number;
  situacao?: CVSituacao;
  empreendimento?: Array<CVEmpreendimento | string>;
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
  get_lead_by_id(_p: { idlead: string }): Promise<CVLead | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  get_corretor_by_id(_p: { id_corretor: string }): Promise<CVCorretor | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  list_situacoes(): Promise<CVSituacao[]> {
    return Promise.resolve([]);
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
