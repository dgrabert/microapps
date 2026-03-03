import { wrapper, wrapperMethod } from "./decorators.ts";

export type RDTeam = {
  id: string;
  name?: string;
  users?: Array<{ id: string; email?: string; name?: string }>;
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
  }): Promise<Record<string, any> | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  create_contact(_p: {
    id_user: string;
  }): Promise<Record<string, any>> {
    return Promise.resolve({});
  }

  @wrapperMethod
  find_ai_deal(_p: {
    contact_id: string;
  }): Promise<Record<string, any> | null> {
    return Promise.resolve(null);
  }

  @wrapperMethod
  create_ai_deal(_p: {
    id_user: string;
    contact_id: string;
    owner_id: string;
    pipeline_id?: string;
    stage_id?: string;
  }): Promise<Record<string, any>> {
    return Promise.resolve({});
  }

  @wrapperMethod
  save_deal(_p: {
    id_contato: string;
    id_deal: string | null;
    data: Record<string, any>;
  }): Promise<Record<string, any> | null> {
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

@wrapper
export class CVCRM {}

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
