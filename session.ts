import { wrapper } from "./decorators.ts";

/**
 * Objeto de sessão injetado pelo backend quando um microapp é chamado
 * via endpoint de API externa.
 *
 * - `body` e `headers` são propriedades locais (acesso síncrono),
 *   populadas pelo worker durante `init_microapp`.
 * - `set_user()` é um método que chama o backend via bridge para
 *   vincular a execução a um usuário.
 *
 * Exemplo:
 * ```ts
 * @api()
 * async meuMetodo() {
 *   const origin = this.session.headers["Origin"] ?? "";
 *   const dados = this.session.body;
 *   await this.session.set_user({ id_user: "user_123" });
 * }
 * ```
 */
@wrapper
export class MicroappSession {
  body: any = {};
  headers: Record<string, string> = {};

  async set_user(_params: { id_user: string }): Promise<void> {}
}
