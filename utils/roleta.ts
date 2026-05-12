import type { MicroApp } from "../base.ts";

export type RoletaAtendente = {
  nome?: string;
  email: string;
  telefone?: string;
  external_id?: string;
};

export class RoletaChatwoot {
  public motivoEscolha?: "only_one" | "next" | "next_online" | "next_fallback";
  constructor(
    private options: {
      microapp: MicroApp;
      id_roleta: string;
      atendentes?: readonly RoletaAtendente[];
      somente_atendentes_online?: boolean;
    },
  ) {
  }

  chave_email(): string {
    return `roleta:email:${this.options.id_roleta}`;
  }

  chave_index(): string {
    return `roleta:idx:${this.options.id_roleta}`;
  }

  chave_atendentes(): string {
    return `roleta:atendentes:${this.options.id_roleta}`;
  }

  /**
   * Sorteia o próximo atendente da roleta sem atribuir no Chatwoot.
   * Persiste a lista de atendentes e incrementa o índice da roleta.
   */
  async girar(): Promise<RoletaAtendente | null> {
    // imagina que temos a seguinte roleta com os atendentes A, B, C, D
    //
    // 0 1 2 3  -- indice
    // A B C D  -- email
    //
    // na primeira vez ao ser utilizada, ela nao esta em nenhum atendente
    // podemos dizer que o indice atual é -1
    //
    // - encontramos o indice do atual na roleta (no caso vai ser -1)
    // - tiramos o atual da roleta (no-op, nao tem indice -1 no array)
    // - tentamos escolher a partir do atual e damos uma volta completa
    // - no caso de -1, apenas pulamos e tentamos escolher a partir do 0
    //
    // SITUACAO: HAPPY PATH
    //
    // 1a tentativa
    // |
    // v
    // 0 1 2 3
    // A B C D
    //
    // escolhemos esse, setamos o email do atual para A e o indice para 0
    //
    //
    //
    // SITUACAO: NINGUEM ONLINE
    //
    // 1a tentativa
    // |
    // v
    // 0 1 2 3
    // A B C D
    //
    // 2a tentativa
    //   |
    //   v
    // 0 1 2 3
    // A B C D
    //
    // 3a tentativa
    //     |
    //     v
    // 0 1 2 3
    // A B C D
    //
    // 4a tentativa
    //       |
    //       v
    // 0 1 2 3
    // A B C D
    //
    // 5a tentativa: fallback, mesmo que nao esteja online, eh escolhido por ser o proximo
    // |
    // v
    // 0 1 2 3
    // A B C D
    //
    //
    // tentamos (atendentes.length+1 = 5) vezes, porque ai o ultimo testado sera o proximo da roleta,
    // mesmo que nenhum esteja disponivel
    //
    //
    //
    // SITUACAO: EXISTE UM CORRETOR ATUAL
    // atual: corretor C
    //
    //     |
    //     v
    // 0 1 2 3
    // A B C D
    //
    // tentamos pegar pelo email, se falhar, pegamos pelo indice mesmo
    // pegamos o indice dele e setamos o indice atual = 2
    // filtramos o indice atual da roleta
    //
    // atual passa a ser o D:
    //       |
    //       v
    // 0 1 _ 2
    // A B C D
    //
    // tentamos o D, se nao funcionar, tentamos 3+1 vezes, caindo no D como fallback
    //
    //
    //
    // SITUACAO: CORRETOR SAIU
    //
    // E se estiver no corretor D e ele sair?
    //
    // Antes: idx=3, email=D
    //       |
    //       v
    // 0 1 2 3
    // A B C D
    //
    // - DEVE: procurar por email e falhar, fazendo fallback pro indice
    // - DEVE: aplicar o modulo no indice, resultando em 0
    // - NAO DEVE: filtrar o indice atual 0
    //
    // Depois: idx=0, email=A
    // |
    // v
    // 0 1 2 _
    // A B C _
    //
    //
    //
    // SITUACAO: CORRETOR NOVO
    // E se um corretor C entrar antes do D?
    //
    // Antes:
    //     |
    //     v
    // 0 1 2 3
    // A B D E
    //
    // Depois:
    //     |
    //     v
    // 0 1 2 3 4
    // A B C D E
    //
    // Vai buscar pelo email D, atualizando o indice para 3
    //
    //       |
    //       v
    // 0 1 2 3 4
    // A B C D E
    //
    // de resto eh igual, com a desvantagem que o corretor novo por entrar antes do D, vai demorar pra receber leads

    const microapp = this.options.microapp;
    this.motivoEscolha = undefined;

    let atendentes: RoletaAtendente[] = this.options.atendentes ||
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

    if (atendentes.length === 1) {
      this.motivoEscolha = "only_one";
      return atendentes[0];
    }

    let idx = 0;

    const emailAtual = await microapp.infosRobo.get({
      chave: this.chave_email(),
    });

    const emailAtualIdx = atendentes.findIndex((a) =>
      emailAtual && a.email === emailAtual
    );

    if (emailAtualIdx !== -1) {
      // temos certeza q o corretor atual ta na roleta, devemos filtra-lo pra n correr
      // o risco de escolher-lo duas vezes seguidas
      idx = emailAtualIdx;
      atendentes = atendentes.filter((_, i) => i !== idx);
    } else {
      // o corretor deve ter saido do time ou foi removido do chatwoot
      // devemos seguir a partir do indice atual, q vai nos dar o proximo corretor da fila
      idx = await microapp.infosRobo.get({
        chave: this.chave_index(),
      }) ?? 0;
    }

    // garantir que idx ta entre [0, atendentes.length)
    idx = idx % atendentes.length;

    let atendente_elegivel = false;
    let atendente = atendentes[idx];
    const max_tentativas = atendentes.length + 1;

    for (let i = 0; i < max_tentativas; i++) {
      idx = (idx + i) % atendentes.length;
      atendente = atendentes[idx];

      await microapp.infosRobo.set({
        chave: this.chave_index(),
        conteudo: idx,
      });

      await microapp.infosRobo.set({
        chave: this.chave_email(),
        conteudo: atendente.email,
      });

      const atendente_online = await microapp.interface_chatwoot
        .is_agent_online({
          email: atendente.email,
        });

      if (atendente_online || !this.options.somente_atendentes_online) {
        atendente_elegivel = true;

        if (this.options.somente_atendentes_online) {
          this.motivoEscolha = "next_online";
          await microapp.logger.debug({
            msg: {
              "Roleta":
                `Atendente com email ${atendente.email} escolhido por estar online após ${
                  i + 1
                } tentativas.`,
            },
          });
        } else {
          this.motivoEscolha = "next";
          await microapp.logger.debug({
            msg: {
              "Roleta":
                `Atendente com email ${atendente.email} escolhido por ser o próximo da fila. Índice: ${
                  idx + i
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
            `Nenhum atendente elegível após ${max_tentativas} tentativas. Elegendo o próximo da fila.`,
        },
      });
      this.motivoEscolha = "next_fallback";
      return atendente;
    }

    return atendente;
  }

  /**
   * Sorteia o próximo atendente e atribui a conversa no Chatwoot.
   * Mantido por compatibilidade — usa girar() internamente.
   */
  async associar_usuario(): Promise<RoletaAtendente | null> {
    const atendente = await this.girar();
    if (!atendente) {
      return null;
    }

    const microapp = this.options.microapp;
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
