import type { MicroApp } from "../base.ts";

export type Atendente = {
  nome?: string;
  email: string;
};

export class RoletaChatwoot {
  constructor(
    private microapp: MicroApp,
    private id: string,
    private atendentes: readonly Atendente[],
  ) {}

  async associar_usuario(): Promise<Atendente | null> {
    if (this.atendentes.length === 0) {
      return null;
    }

    const chave = `roleta:idx:${this.id}`;
    const atual = await this.microapp.infosRobo.get({ chave }) || 0;

    await this.microapp.infosRobo.set({
      chave,
      conteudo: (atual + 1) % this.atendentes.length,
    });

    const atendente = this.atendentes[atual % this.atendentes.length]!;

    const [, id_user] = await this.microapp.conversa.ids();

    await this.microapp.interface_chatwoot.unassign_conversation({
      id_user,
      assignee: true,
      team: true,
    });

    await this.microapp.interface_chatwoot.send_to_human({
      id_user,
      person_destination: atendente.email,
      assign_to_person_team: true,
    });

    await this.microapp.infosUser.set({
      chave: `roleta:atendente:${this.id}`,
      conteudo: atendente,
    });

    return atendente;
  }
}
