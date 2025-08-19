import { wrapper } from "./decorators.ts";

@wrapper
export class GestorArquivos {
  upload_arquivo(params: {
    obj_arquivo: string;
    tipo: "audio" | "imagem" | "documento" | "video";
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
