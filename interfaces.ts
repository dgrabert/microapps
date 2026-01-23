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

export class MessageContent {
  constructor(
    public texto?: string,
    public midia?: string,
    public audio?: string,
    public tool_calls?: object[],
  ) {};
}

export class Message {
  constructor(
    public conteudo: MessageContent,
    public origem?: ["robo", "humano", "cliente", "tool"] | null,
    public tipo?: ["padrao", "debug", "aviso", "template", "instrucao"] | null,
    public modelo?: string | null,
    public timestamp?: string | null,
  ) {};
}


@wrapper
export class ControladorInterface {
  get_interface_nome(): Promise<
    "whatsapp" | "site" | "bitrix" | "generico"
  > {
    return Promise.resolve("generico");
  }

  need_template_after_one_day(a: { id_user: string }): Promise<boolean> {
    return Promise.resolve(false);
  }
  get_teams(): Promise<Team[]> {
    return Promise.resolve([]);
  }

  assign_team(p: { id_user: string; id_team: string }): Promise<boolean> {
    console.log(`Assinando usuario ${p.id_user} para o time ${p.id_team}`);
    return Promise.resolve(false);
  }
}

@wrapper
class ChatInterface {
  get_id_user_from_number(num: string): Promise<string> {
    console.log(`${num}`);
    return Promise.resolve("");
  }

  send_message_number(p: {mensagem: Message, phone_number: string}): Promise<void> {
    console.log(
      `Simulando envio de mensagem para ${p.phone_number}: ${p.mensagem}`,
    );
    return Promise.resolve()
  }
}

@wrapper
export class WhatsappInterface extends ChatInterface {
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

  send_template_number(p: {
    template: TemplateMessage;
    phone_number: string;
  }): Promise<void> {
    console.log(
      `Simulando envio de template via chatwoot: template_or_text=${
        JSON.stringify(p.template)
      } - numero=${p.phone_number}`,
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

export type Team = {
  id: number | string;
  name: string;
  description: string;
  allow_auto_asign: boolean;
  account_id: number | string;
  is_member: boolean;
};

export type TeamMember = {
  id: number;
  account_id: number;
  availability_status: string;
  auto_offline: boolean;
  confirmed: boolean;
  email: string;
  available_name: string;
  name: string;
  role: string;
  thumbnail: string;
};

@wrapper
export class ChatWootInterface extends ChatInterface {
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

  send_template_number(p: {
    template: TemplateMessage;
    phone_number: string;
    inbox_id?: number;
  }): Promise<void> {
    console.log(
      `Simulando envio de template via chatwoot: template_or_text=${
        JSON.stringify(p.template)
      } - id_user=${p.phone_number} - inbox_id=${p.inbox_id}`,
    );
    return Promise.resolve();
  }

  send_to_human(p: {
    id_user: string;
    team_destination?: string;
    person_destination?: string;
    assign_to_person_team?: boolean;
  }): Promise<Record<string, any> | null> {
    console.log(`simulando send_to_human: ${JSON.stringify(p)}`);
    return Promise.resolve({});
  }

  get_teams(): Promise<Team[]> {
    console.log(`simulando get_teams`);
    return Promise.resolve([]);
  }

  get_team_members(p: { team_id: number }): Promise<TeamMember[]> {
    console.log(`simulando get_team_members: ${JSON.stringify(p)}`);
    return Promise.resolve([]);
  }

  unassign_conversation(
    p: { id_user: string; assignee: boolean; team: boolean },
  ): Promise<void> {
    console.log(`simulando unassign_conversation: ${JSON.stringify(p)}`);
    return Promise.resolve();
  }
}
