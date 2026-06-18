import { wrapper } from "./decorators.ts";

export type TipoArquivo = "audio" | "imagem" | "documento" | "video";

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
