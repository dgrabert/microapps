import { wrapper } from "./decorators.ts";

export type TemplateComponent = {
  type: "header" | "body" | "footer" | "buttons";
  text?: string;
  parameters: {
    type: "text" | "image" | "currency" | "date_time";
    parameter_name?: string;
    text?: string;
  }[];
};

export class TemplateMessage {
  constructor(
    public nome: string,
    public components?: TemplateComponent[],
    public categoria?: string,
    public lingua: "en_US" | "pt_BR" | "pt_PT" = "pt_BR",
    public status: "aprovado" | "recusado" = "aprovado",
  ) {}
}

@wrapper
export class ControladorInterface {
  get_interface_nome(): Promise<
    "whatsapp" | "site" | "bitrix" | "generico"
  > {
    return Promise.resolve("generico");
  }

  need_template_after_one_day(_args: {id_user: string}): Promise<boolean> {
    return Promise.resolve(false);
  }
}

@wrapper
export class WhatsappInterface {
  is_active(): Promise<boolean> {
    return Promise.resolve(false);
  }

  send_template(p: {
    template: TemplateMessage;
    id_user: string;
  }): Promise<void> {
    console.log(
      `Simulando envio de template via whatsapp: template_or_text=${
        JSON.stringify(p.template)
      } - id_user=${p.id_user}`,
    );
    return Promise.resolve();
  }
}

@wrapper
export class LivechatInterface {
  is_active(): Promise<boolean> {
    return Promise.resolve(false);
  }
}

@wrapper
export class ChatWootInterface {
  send_template(p: {
    template: TemplateMessage;
    id_user: string;
    inbox_id?: number;
  }): Promise<void> {
    console.log(
      `Simulando envio de template via chatwoot: template_or_text=${
        JSON.stringify(p.template)
      } - id_user=${p.id_user} - inbox_id=${p.inbox_id}`,
    );
    return Promise.resolve();
  }
}
