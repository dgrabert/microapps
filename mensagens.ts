import { wrapper } from "./decorators.ts";

export type Mensagem = {
  origem: string;
  conteudo: {
    texto?: string;
    midia?: string;
    audio?: string;
    tool_calls?: any[];
  };
  is_spam?: boolean;
  tipo?: string;
  timestamp?: string;
  modelo?: string;
  id_user?: string;
  id_robo?: number;
  tracking?: any;
  tool_call_id?: string;
  metadados?: any;
  message_id?: number;
  id_agendamento_prospeccao?: number;
};

@wrapper
export class Conversa {
  idRobo: number = 123;
  idUsuario: string = "id_usuario";
  mensagens: Mensagem[] = [
    {
      origem: "cliente",
      conteudo: {
        texto: "Olá, estou interessado em comprar",
      },
    },
  ];

  ids(): Promise<[number, string]> {
    return Promise.resolve([this.idRobo, this.idUsuario]);
  }

  to_text(
    params: {
      backlog?: number;
      ignore_tools_msgs?: boolean;
      max_input_user?: number;
      tag_name?: string;
    },
  ): Promise<string> {
    return Promise.resolve("");
  }

  ultima_interacao(params: { origem?: string } = {}): Promise<string> {
    return Promise.resolve("");
  }

  append(params: { mensagem: Mensagem }): Promise<void> {
    this.mensagens.push(params.mensagem);
    return Promise.resolve();
  }

  concat(p: { mensagens: Mensagem[] }): Promise<void> {
    this.mensagens = this.mensagens.concat(p.mensagens);
    return Promise.resolve();
  }

  is_spam(params: { previous_messages?: number } = {}): Promise<boolean> {
    return Promise.resolve(false);
  }

  get_last_message(
    p: { origem?: string } = {},
  ): Promise<Mensagem | null> {
    return Promise.resolve(
      this.mensagens.findLast((m) => {
        if (p.origem) {
          return m.origem === p.origem;
        }
        return true;
      }) ?? null,
    );
  }

  pega_ultimo_bloco(params: { origem: string }): Promise<Mensagem[]> {
    return Promise.resolve([]);
  }

  primeira_msg_do_cliente(): Promise<boolean> {
    return Promise.resolve(false);
  }

  ultima_mensagem_origem(
    params: { origem?: string } = {},
  ): Promise<Mensagem | null> {
    return Promise.resolve(null);
  }

  pega_todas_mensagens(
    params: { ignore_debug_msgs?: boolean } = { ignore_debug_msgs: true },
  ): Promise<Mensagem[]> {
    /**
     * Retorna todas as mensagens da conversa.
     *
     * @param ignore_debug_msgs - Se true, ignora mensagens do tipo debug.
     * @returns Lista com todas as mensagens da conversa.
     */
    return Promise.resolve(this.mensagens);
  }

  resumir(p: { acontecimento: string }): Promise<string> {
    return Promise.resolve(p.acontecimento);
  }
}
