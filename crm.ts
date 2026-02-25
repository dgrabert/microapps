import { wrapper } from "./decorators.ts";

@wrapper
export class RDStationCRM {
  api_request({
    path,
    method,
    data = null,
    query_params = {},
  }: {
    path: string;
    method: string;
    data?: Record<string, any> | null;
    query_params?: Record<string, any>;
  }): Promise<any> {
    return Promise.resolve();
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
