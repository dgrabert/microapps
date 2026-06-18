/**
 * MicroAppUtils — Utilidades comuns para micro apps TypeScript.
 *
 * Acessível via `this.utils` no micro app.
 *
 * @example
 * ```ts
 * const limpo = await this.utils.sanitize("");       // null
 * const valido = await this.utils.validar_email("a@b.com");  // true
 * const tel = await this.utils.validar_telefone("11999999999"); // "+5511999999999"
 * const agora = await this.utils.now_br();           // datetime Brasília
 * ```
 */

import { wrapper } from "./decorators.ts";

@wrapper
export class MicroAppUtils {
  // Sanitização
  sanitize(value: unknown): Promise<unknown> {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return Promise.resolve(trimmed === "" ? null : trimmed);
    }
    if (Array.isArray(value)) {
      return Promise.resolve(value.map((item) => this.sanitizeSync(item)));
    }
    if (value && typeof value === "object") {
      return this.sanitize_dict(value as Record<string, unknown>);
    }
    return Promise.resolve(value);
  }

  sanitize_dict(d: Record<string, unknown>): Promise<Record<string, unknown>> {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(d)) {
      result[key] = this.sanitizeSync(value);
    }
    return Promise.resolve(result);
  }

  // Validação
  validar_email(email: string): Promise<boolean> {
    return Promise.resolve(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
  }

  validar_telefone(telefone: string): Promise<string | null> {
    let digits = telefone.replace(/\D/g, "");
    if (digits.length === 10 || digits.length === 11) {
      digits = `55${digits}`;
    }
    if (digits.length < 12 || digits.length > 13) {
      return Promise.resolve(null);
    }
    return Promise.resolve(`+${digits}`);
  }

  validar_uuid(value: string): Promise<boolean> {
    return Promise.resolve(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        .test(value),
    );
  }

  validar_cpf(cpf: string): Promise<boolean> {
    const digits = cpf.replace(/\D/g, "");
    if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
      return Promise.resolve(false);
    }
    const calc = (length: number) => {
      let sum = 0;
      for (let i = 0; i < length; i++) {
        sum += Number(digits[i]) * (length + 1 - i);
      }
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };
    return Promise.resolve(
      calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]),
    );
  }

  validar_cnpj(cnpj: string): Promise<boolean> {
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
      return Promise.resolve(false);
    }
    const calc = (length: number) => {
      const weights = length === 12
        ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
        : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
      const sum = weights.reduce(
        (acc, weight, index) => acc + Number(digits[index]) * weight,
        0,
      );
      const rest = sum % 11;
      return rest < 2 ? 0 : 11 - rest;
    };
    return Promise.resolve(
      calc(12) === Number(digits[12]) && calc(13) === Number(digits[13]),
    );
  }

  // Texto
  remover_acentos(texto: string): Promise<string> {
    return Promise.resolve(this.removeAcentos(texto));
  }

  truncar(texto: string, max_chars = 100, sufixo = "..."): Promise<string> {
    if (texto.length <= max_chars) {
      return Promise.resolve(texto);
    }
    return Promise.resolve(
      `${texto.slice(0, Math.max(0, max_chars - sufixo.length))}${sufixo}`,
    );
  }

  slugify(texto: string): Promise<string> {
    return Promise.resolve(
      this.removeAcentos(texto)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, ""),
    );
  }

  // Data/Hora
  now_br(): Promise<string> {
    return Promise.resolve(
      new Date().toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
        .replace(" ", "T"),
    );
  }

  parse_date(texto: string): Promise<string | null> {
    const time = Date.parse(texto);
    if (Number.isNaN(time)) {
      return Promise.resolve(null);
    }
    return Promise.resolve(new Date(time).toISOString());
  }

  formatar_data_br(dt: string): Promise<string> {
    const date = new Date(dt);
    if (Number.isNaN(date.getTime())) {
      return Promise.resolve("");
    }
    return Promise.resolve(
      date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
    );
  }

  // Similaridade
  cosine_similarity(a: number[], b: number[]): Promise<number> {
    if (a.length !== b.length || a.length === 0) {
      return Promise.resolve(0);
    }
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      normA += a[i] ** 2;
      normB += b[i] ** 2;
    }
    if (normA === 0 || normB === 0) {
      return Promise.resolve(0);
    }
    return Promise.resolve(dot / (Math.sqrt(normA) * Math.sqrt(normB)));
  }

  private sanitizeSync(value: unknown): unknown {
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed === "" ? null : trimmed;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeSync(item));
    }
    if (value && typeof value === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(value)) {
        result[key] = this.sanitizeSync(item);
      }
      return result;
    }
    return value;
  }

  private removeAcentos(texto: string): string {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
}
