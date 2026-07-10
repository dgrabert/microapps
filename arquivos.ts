import { wrapper } from "./decorators.ts";

export type TipoArquivo = "audio" | "imagem" | "documento" | "video";

/**
 * Um anexo (arquivo) presente na conversa ou enviado ao usuário.
 *
 * Abstração tipada sobre a `key` S3 crua: além da referência, traz nome
 * amigável, tipo, mimetype e tamanho já resolvidos.
 */
export interface Anexo {
  /** Referência interna do arquivo (key S3). Uso avançado. */
  key: string;
  /** Nome de arquivo amigável (sem o prefixo uuid quando possível). */
  nome: string;
  /** Categoria do arquivo. */
  tipo: TipoArquivo;
  /** Mimetype, quando conhecido. */
  mimetype?: string;
  /** Tamanho em bytes, quando conhecido. */
  tamanho?: number;
  /** Origem da mensagem em que o anexo apareceu. */
  origem: "cliente" | "robo" | "humano";
  /** Legenda associada ao arquivo, quando houver. */
  legenda?: string;
  /** Timestamp ISO da mensagem, quando disponível. */
  timestamp?: string;
}

@wrapper
export class GestorArquivos {
  _arquivos: Record<string, {
    tipo: TipoArquivo;
    data: string;
    nome_arquivo: string;
    legenda?: string;
    metadados?: Record<any, any>;
    publico?: boolean;
    mimetype?: string;
    tamanho_max_imagens?: number;
  }> = {};
  _proximo_id: number = 1;

  upload_arquivo_base64(params: {
    tipo: TipoArquivo;
    data: string;
    nome_arquivo: string;
    legenda?: string;
    metadados?: Record<any, any>;
    publico?: boolean;
    mimetype?: string;
    tamanho_max_imagens?: number;
  }): Promise<string> {
    const key = `mock-arquivo-${this._proximo_id++}-${params.nome_arquivo}`;
    this._arquivos[key] = { ...params };
    return Promise.resolve(key);
  }

  gerar_url_presigned(params: {
    arquivo: string;
    validade_segundos: number;
  }): Promise<string> {
    return Promise.resolve(
      `mock://arquivo/${params.arquivo}?validade=${params.validade_segundos}`,
    );
  }
}
