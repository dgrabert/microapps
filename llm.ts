import { wrapper } from "./decorators.ts";

// Definição do tipo Mensagem no formato JSON
export type MensagemLLM = {
  role: "assistant" | "user" | "function" | "system" | "tool";
  content?: string;
  tool_calls?: Array<Record<string, string>>;
  tool_call_id?: string;
};

@wrapper
export class GPT {
  /**
   * Define o modelo LLM a ser utilizado.
   *
   * @param modelo - Nome do modelo a ser utilizado (ex: "gpt-4o-mini")
   */
  async set_modelo({ modelo }: { modelo: string }): Promise<void> {}

  /**
   * Executa uma chamada ao LLM e retorna a resposta.
   *
   * @param mensagens - Lista de mensagens para enviar ao LLM
   * @param tools - Lista opcional de ferramentas que o LLM pode usar
   * @param response_format - Especificação opcional do formato da resposta
   * @returns A resposta do LLM, razão de finalização e quaisquer chamadas de ferramentas
   */
  async run({
    mensagens,
    tools = [],
    response_format = {},
  }: {
    mensagens: MensagemLLM[];
    tools?: any[];
    response_format?: Record<string, any>;
  }): Promise<[string, string, any]> {
    return ["", "", null];
  }

  /**
   * Realiza um processo de votação usando múltiplas chamadas LLM para determinar consenso.
   *
   * @param num_votos - Número de votos a coletar (deve ser ímpar)
   * @param mensagem_sistema - Mensagem do sistema contendo critérios de votação
   * @param mensagens_a_apurar - Mensagens a serem avaliadas
   * @param resposta_padrao - Resposta padrão se incerto (true/false)
   * @param cadeia_pensamentos - Se deve incluir cadeia de pensamentos na resposta
   * @returns Booleano indicando se a votação foi aprovada
   */
  async votar({
    num_votos,
    mensagem_sistema,
    mensagens_a_apurar,
    resposta_padrao = false,
    cadeia_pensamentos = false,
  }: {
    num_votos: number;
    mensagem_sistema: string;
    mensagens_a_apurar: string;
    resposta_padrao?: boolean;
    cadeia_pensamentos?: boolean;
  }): Promise<boolean> {
    return false;
  }
}
