import { wrapper } from "./decorators.ts";
import type { Conversa } from "./mensagens.ts";

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
  ) {}
}

export class Message {
  constructor(
    public conteudo: MessageContent,
    public origem?: ["robo", "humano", "cliente", "tool"] | null,
    public tipo?: ["padrao", "debug", "aviso", "template", "instrucao"] | null,
    public modelo?: string | null,
    public timestamp?: string | null,
  ) {}
}

@wrapper
export class ControladorInterface {
  get_interface_nome(): Promise<
    "whatsapp" | "site" | "bitrix" | "generico" | "chatwoot" | "telegram"
  > {
    return Promise.resolve("generico");
  }

  need_template_after_one_day(a: { id_user: string }): Promise<boolean> {
    return Promise.resolve(false);
  }
}

@wrapper
class ChatInterface {
  mensagens_enviadas: Array<{ conversa: Conversa; id_user: string }> = [];
  mensagens_enviadas_numero: Array<
    { mensagem: Message; phone_number: string }
  > = [];

  get_id_user_from_number(num: string): Promise<string> {
    console.log(`${num}`);
    return Promise.resolve(`whatsapp_${num.replace(/\D/g, "")}`);
  }

  send_message(p: { conversa: Conversa; id_user: string }): Promise<void> {
    console.log(
      `Simulando envio de mensagem para ${p.id_user}`,
    );
    this.mensagens_enviadas.push(p);
    return Promise.resolve();
  }

  send_message_number(
    p: { mensagem: Message; phone_number: string },
  ): Promise<void> {
    console.log(
      `Simulando envio de mensagem para ${p.phone_number}: ${p.mensagem}`,
    );
    this.mensagens_enviadas_numero.push(p);
    return Promise.resolve();
  }
}

@wrapper
export class WhatsappInterface extends ChatInterface {
  active: boolean = false;
  templates_enviados: Array<{ template: TemplateMessage; id_user: string }> =
    [];
  templates_enviados_numero: Array<
    { template: TemplateMessage; phone_number: string }
  > = [];

  is_active(): Promise<boolean> {
    return Promise.resolve(this.active);
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
    this.templates_enviados.push(p);
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
    this.templates_enviados_numero.push(p);
    return Promise.resolve();
  }
}

@wrapper
export class LivechatInterface {
  active: boolean = false;

  is_active(): Promise<boolean> {
    return Promise.resolve(this.active);
  }
}

@wrapper
export class TelegramInterface extends ChatInterface {
  active: boolean = false;

  is_active(): Promise<boolean> {
    return Promise.resolve(this.active);
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

export type AgentInfo = {
  id: number;
  account_id: number;
  availability_status: "online" | "offline";
  auto_offline: boolean;
  confirmed: boolean;
  email: string;
  available_name: string;
  name: string;
  role: string;
  thumbnail: string;
};

export type ChatWootAssignee = Partial<AgentInfo> & {
  id?: number;
  name?: string;
  availability_status?: "online" | "offline";
};

export type ConversationMeta = {
  channel: string;
  assignee?: ChatWootAssignee;
};

export type ConversationInfo = {
  meta: ConversationMeta;
  id: number;
  account_id: number;
  uuid: string;
  agent_last_seen_at: number;
  assignee_last_seen_at: number;
  contact_last_seen_at: number;
  inbox_id: number;
  labels: string[];
  muted: boolean;
  snoozed_until: number | null;
  status: string;
  created_at: number;
  updated_at: number;
  timestamp: number;
  first_reply_created_at: number;
  unread_count: number;
  last_activity_at: number;
  waiting_since: number;
};

@wrapper
export class ChatWootInterface extends ChatInterface {
  agents: AgentInfo[] = [];
  teams: Team[] = [];
  team_members: Record<number, TeamMember[]> = {};
  templates_enviados: Array<
    { template: TemplateMessage; id_user: string; inbox_id?: number }
  > = [];
  templates_enviados_numero: Array<
    { template: TemplateMessage; phone_number: string; inbox_id?: number }
  > = [];
  notas_privadas: Array<{ id_user: string; content: string }> = [];
  conversation_info: ConversationInfo = {
    meta: { channel: "Channel::Api" },
    id: 1,
    account_id: 1,
    uuid: "mock-conversation",
    agent_last_seen_at: 0,
    assignee_last_seen_at: 0,
    contact_last_seen_at: 0,
    inbox_id: 1,
    labels: [],
    muted: false,
    snoozed_until: null,
    status: "open",
    created_at: 0,
    updated_at: 0,
    timestamp: 0,
    first_reply_created_at: 0,
    unread_count: 0,
    last_activity_at: 0,
    waiting_since: 0,
  };

  get_atendente(p: { id_user: string }): Promise<ChatWootAssignee | null> {
    console.log(`simulando get_atendente: ${JSON.stringify(p)}`);
    return Promise.resolve(this.conversation_info.meta.assignee ?? null);
  }

  is_atendente_online(p: { id_user: string }): Promise<boolean> {
    console.log(`simulando is_atendente_online: ${JSON.stringify(p)}`);
    const email = this.conversation_info.meta.assignee?.email;
    if (!email) {
      return Promise.resolve(false);
    }
    return this.is_agent_online({ email });
  }

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
    this.templates_enviados.push(p);
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
    this.templates_enviados_numero.push(p);
    return Promise.resolve();
  }

  send_to_human(p: {
    id_user: string;
    team_destination?: string;
    person_destination?: string;
    assign_to_person_team?: boolean;
  }): Promise<Record<string, unknown> | null> {
    console.log(`simulando send_to_human: ${JSON.stringify(p)}`);
    if (!p.team_destination && !p.person_destination) {
      throw new Error("Sem time ou pessoa de destino");
    }

    if (p.team_destination) {
      const team = this.findTeamByName(p.team_destination);
      if (!team && !p.person_destination) {
        return Promise.resolve(null);
      }
    }

    if (p.person_destination) {
      const assignee = this.findAgentByNameOrEmail(p.person_destination);
      if (!assignee) {
        return Promise.resolve(null);
      }
      this.conversation_info.meta.assignee = assignee;
    }

    return Promise.resolve({});
  }

  assign_agent(p: {
    id_user: string;
    person_destination: string;
  }): Promise<boolean | null> {
    console.log(`simulando assign_agent: ${JSON.stringify(p)}`);
    const assignee = this.findAgentByNameOrEmail(p.person_destination);
    if (!assignee) {
      return Promise.resolve(null);
    }
    this.conversation_info.meta.assignee = assignee;
    return Promise.resolve(true);
  }

  assign_team(p: {
    id_user: string;
    team_destination: string;
  }): Promise<boolean | null> {
    console.log(`simulando assign_team: ${JSON.stringify(p)}`);
    if (!this.findTeamByName(p.team_destination)) {
      return Promise.resolve(null);
    }
    return Promise.resolve(true);
  }

  update_contact_name(p: { id_user: string; name: string }): Promise<boolean> {
    console.log(`simulando update_contact_name: ${JSON.stringify(p)}`);
    return Promise.resolve(true);
  }

  add_label(p: { id_user: string; label: string }): Promise<void> {
    console.log(`simulando add_label: ${JSON.stringify(p)}`);
    const label = this.normalizeLabel(p.label);
    if (label && !this.conversation_info.labels.includes(label)) {
      this.conversation_info.labels = [...this.conversation_info.labels, label];
    }
    return Promise.resolve();
  }

  set_labels(p: { id_user: string; labels: string[] }): Promise<void> {
    console.log(`simulando set_labels: ${JSON.stringify(p)}`);
    const labels: string[] = [];
    for (const label of p.labels) {
      const normalized = this.normalizeLabel(label);
      if (normalized && !labels.includes(normalized)) {
        labels.push(normalized);
      }
    }
    this.conversation_info.labels = labels;
    return Promise.resolve();
  }

  send_private_note(p: { id_user: string; content: string }): Promise<void> {
    console.log(`simulando send_private_note: ${JSON.stringify(p)}`);
    this.notas_privadas.push(p);
    return Promise.resolve();
  }

  get_teams(): Promise<Team[]> {
    console.log(`simulando get_teams`);
    return Promise.resolve(this.teams);
  }

  get_team_members(p: { team_id: number }): Promise<TeamMember[]> {
    console.log(`simulando get_team_members: ${JSON.stringify(p)}`);
    return Promise.resolve(this.team_members[p.team_id] ?? []);
  }

  unassign_conversation(
    p: { id_user: string; assignee: boolean; team: boolean },
  ): Promise<void> {
    console.log(`simulando unassign_conversation: ${JSON.stringify(p)}`);
    if (p.assignee) {
      delete this.conversation_info.meta.assignee;
    }
    return Promise.resolve();
  }

  is_agent_online(p: { email: string }): Promise<boolean> {
    return Promise.resolve(
      Boolean(
        this.agents.find((a) =>
          a.email === p.email && a.availability_status === "online"
        ),
      ),
    );
  }

  get_conversation_details(_p: { id_user: string }): Promise<ConversationInfo> {
    return Promise.resolve(this.conversation_info);
  }

  toggle_conversation_status(
    p: { id_user: string; status: "open" | "resolved" | "pending" | "snoozed" },
  ): Promise<void> {
    console.log(`simulando toggle_conversation: ${JSON.stringify(p)}`);
    this.conversation_info.status = p.status;
    return Promise.resolve();
  }

  private findAgentByNameOrEmail(destination: string): ChatWootAssignee | null {
    const agent = this.agents.find((agent) =>
      agent.email === destination || agent.name === destination
    );
    if (agent) {
      return agent;
    }

    for (const members of Object.values(this.team_members)) {
      const member = members.find((member) =>
        member.email === destination || member.name === destination
      );
      if (member) {
        return {
          id: member.id,
          account_id: member.account_id,
          auto_offline: member.auto_offline,
          confirmed: member.confirmed,
          email: member.email,
          available_name: member.available_name,
          name: member.name,
          role: member.role,
          thumbnail: member.thumbnail,
        };
      }
    }

    return null;
  }

  private findTeamByName(name: string): Team | null {
    const destination = this.normalizeTeamName(name);
    return this.teams.find((team) =>
      this.normalizeTeamName(team.name) === destination
    ) ?? null;
  }

  private normalizeTeamName(name: string): string {
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
      .trim();
  }

  private normalizeLabel(label: string): string {
    return label.replaceAll(" ", "_").toLowerCase();
  }
}
