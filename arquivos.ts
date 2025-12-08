import { wrapper } from "./decorators.ts";

export type TipoArquivo = "audio" | "imagem" | "documento" | "video";

@wrapper
export class GestorArquivos {
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
    return Promise.resolve("key");
  }

  gerar_url_presigned(params: {
    arquivo: string;
    validade_segundos: number;
  }): Promise<string> {
    return Promise.resolve("url presigned");
  }
}
