import type { MicroApp } from "../base.ts";

export type RoletaAtendente = {
  nome?: string;
  email: string;
  telefone?: string;
};

export class RoletaChatwoot {
  constructor(
    private options: {
      microapp: MicroApp;
      id_roleta: string;
      atendentes?: readonly RoletaAtendente[];
      somente_atendentes_online?: boolean;
    },
  ) {
  }

  chave_index(): string {
    return `roleta:idx:${this.options.id_roleta}`;
  }

  chave_atendentes(): string {
    return `roleta:atendentes:${this.options.id_roleta}`;
  }

  async associar_usuario(): Promise<RoletaAtendente | null> {
    const microapp = this.options.microapp;

    const atendentes: RoletaAtendente[] = this.options.atendentes ||
      await microapp.infosRobo.get({
        chave: this.chave_atendentes(),
      });

    await microapp.infosRobo.set({
      chave: this.chave_atendentes(),
      conteudo: atendentes,
    });

    if (atendentes.length === 0) {
      await microapp.logger.debug({
        msg: {
          "Roleta":
            `Tentou girar a roleta mas não há nenhum atendente configurado nesta roleta (${this.options.id_roleta})`,
        },
      });
      return null;
    }

    const atual = await microapp.infosRobo.get({
      chave: this.chave_index(),
    }) || 0;

    let atendente_elegivel = false;
    let atendente = atendentes[atual % atendentes.length];
    const max_tentativas = atendentes.length;

    for (let i = 0; i < max_tentativas; i++) {
      atendente = atendentes[(atual + i) % atendentes.length];
      await microapp.infosRobo.set({
        chave: this.chave_index(),
        conteudo: (atual + i + 1) % atendentes.length,
      });

      const atendente_online = await microapp.interface_chatwoot
        .is_agent_online({
          email: atendente.email,
        });

      if (atendente_online || !this.options.somente_atendentes_online) {
        atendente_elegivel = true;

        if (this.options.somente_atendentes_online) {
          await microapp.logger.debug({
            msg: {
              "Roleta":
                `Atendente com email ${atendente.email} escolhido por estar online após ${
                  i + 1
                } tentativas.`,
            },
          });
        } else {
          await microapp.logger.debug({
            msg: {
              "Roleta":
                `Atendente com email ${atendente.email} escolhido por ser o próximo da fila. Índice: ${
                  atual + i
                }`,
            },
          });
        }
        break;
      }

      await microapp.logger.debug({
        msg: {
          "Roleta":
            `Atendente com email ${atendente.email} não está online no momento.`,
        },
      });
    }

    if (!atendente_elegivel) {
      await microapp.logger.debug({
        msg: {
          "Roleta":
            `Nenhum atendente elegível após ${max_tentativas} tentativas.`,
        },
      });
      return null;
    }

    const [, id_user] = await microapp.conversa.ids();

    await microapp.interface_chatwoot.unassign_conversation({
      id_user,
      assignee: true,
      team: true,
    });

    await microapp.interface_chatwoot.send_to_human({
      id_user,
      person_destination: atendente.email,
      assign_to_person_team: true,
    });

    return atendente;
  }
}
