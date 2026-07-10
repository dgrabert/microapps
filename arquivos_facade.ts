import type { Anexo, GestorArquivos, TipoArquivo } from "./arquivos.ts";
import type { Conversa } from "./mensagens.ts";

/** Codifica bytes em base64 (sem dependência externa; processa em blocos). */
function encodeBase64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000; // evita estourar o limite de argumentos de fromCharCode
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

/** Extensões → categoria de arquivo do SDK. */
const _EXT_IMAGEM = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg", "heic"];
const _EXT_AUDIO = ["mp3", "ogg", "oga", "wav", "m4a", "aac", "opus", "amr"];
const _EXT_VIDEO = ["mp4", "mov", "webm", "avi", "mkv", "3gp", "m4v"];

const _MIME_POR_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  txt: "text/plain",
  csv: "text/csv",
  json: "application/json",
  zip: "application/zip",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function _extensao(nome: string): string {
  const base = nome.split(/[\\/]/).pop() ?? nome;
  const idx = base.lastIndexOf(".");
  return idx >= 0 ? base.slice(idx + 1).toLowerCase() : "";
}

function _basename(caminho: string): string {
  return caminho.split(/[\\/]/).pop() || caminho;
}

/** Infere a categoria do arquivo a partir do nome. Default: "documento". */
export function inferirTipoArquivo(nome: string): TipoArquivo {
  const ext = _extensao(nome);
  if (_EXT_IMAGEM.includes(ext)) return "imagem";
  if (_EXT_AUDIO.includes(ext)) return "audio";
  if (_EXT_VIDEO.includes(ext)) return "video";
  return "documento";
}

/** Infere o mimetype a partir do nome, quando conhecido. */
export function inferirMimetype(nome: string): string | undefined {
  return _MIME_POR_EXT[_extensao(nome)];
}

/**
 * Fachada ergonômica de arquivos/mídia (NÃO usa @wrapper — orquestra os
 * wrappers bridgeados `gestor_arquivos` e `conversa`).
 *
 * Concentra as operações de alto nível: listar os anexos que o usuário mandou,
 * baixar um anexo para o workspace, e enviar um arquivo ao usuário — escondendo
 * o vaivém de `key` S3 e a montagem manual da mensagem de mídia.
 */
export class Arquivos {
  constructor(
    private gestor: GestorArquivos,
    private conversa: Conversa,
  ) {}

  /**
   * Lista os anexos que o USUÁRIO enviou na conversa (mensagens de origem
   * "cliente" com mídia). Observação: a conversa pode vir truncada — anexos
   * muito antigos podem não aparecer.
   */
  async do_usuario(
    params: { tipo?: TipoArquivo; offset?: number; limite?: number } = {},
  ): Promise<Anexo[]> {
    const anexos = await this.conversa.anexos({
      origem: "cliente",
      tipo: params.tipo,
    });
    const offset = params.offset ?? 0;
    const limite = params.limite ?? 10;
    return anexos.slice(offset, offset + limite);
  }

  /**
   * Baixa um anexo (por key ou `Anexo`) para o workspace e retorna o caminho
   * absoluto do arquivo salvo. Por padrão salva em `<cwd>/arquivos_usuario/`.
   */
  async baixar(
    params: { arquivo: string | Anexo; destino?: string },
  ): Promise<string> {
    const key = typeof params.arquivo === "string"
      ? params.arquivo
      : params.arquivo.key;
    const nome = typeof params.arquivo === "string"
      ? _basename(key)
      : (params.arquivo.nome || _basename(key));

    const url = await this.gestor.gerar_url_presigned({
      arquivo: key,
      validade_segundos: 3600,
    });
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Falha ao baixar arquivo '${nome}' (HTTP ${resp.status}).`);
    }
    const bytes = new Uint8Array(await resp.arrayBuffer());

    const destino = params.destino ?? `${Deno.cwd()}/arquivos_usuario`;
    await Deno.mkdir(destino, { recursive: true });
    const caminho = `${destino}/${nome}`;
    await Deno.writeFile(caminho, bytes);
    return caminho;
  }

  /**
   * Envia um arquivo ao usuário (anexa na conversa). A origem do conteúdo pode
   * ser um `caminho` no workspace, `data` base64, ou uma `key`/`Anexo` já no S3.
   * Com `incluir_link=true`, também devolve uma URL temporária (presigned).
   */
  async enviar_ao_usuario(params: {
    caminho?: string;
    data?: string;
    arquivo?: string | Anexo;
    nome?: string;
    legenda?: string;
    tipo?: TipoArquivo;
    incluir_link?: boolean;
  }): Promise<Anexo & { url?: string }> {
    let key: string;
    let nome = params.nome;
    let tipo = params.tipo;
    let mimetype: string | undefined;

    if (params.arquivo !== undefined) {
      key = typeof params.arquivo === "string"
        ? params.arquivo
        : params.arquivo.key;
      if (!nome && typeof params.arquivo !== "string") nome = params.arquivo.nome;
    } else {
      let dataB64: string;
      if (params.caminho !== undefined) {
        const bytes = await Deno.readFile(params.caminho);
        dataB64 = encodeBase64(bytes);
        if (!nome) nome = _basename(params.caminho);
      } else if (params.data !== undefined) {
        dataB64 = params.data;
      } else {
        throw new Error(
          "enviar_ao_usuario: informe 'caminho', 'data' ou 'arquivo'.",
        );
      }
      if (!nome) nome = "arquivo";
      tipo = tipo ?? inferirTipoArquivo(nome);
      mimetype = inferirMimetype(nome);
      key = await this.gestor.upload_arquivo_base64({
        nome_arquivo: nome,
        tipo,
        data: dataB64,
        legenda: params.legenda,
        mimetype,
      });
    }

    if (!nome) nome = _basename(key);
    if (!tipo) tipo = inferirTipoArquivo(nome);

    await this.conversa.append({
      mensagem: {
        origem: "robo",
        conteudo: { texto: params.legenda, midia: key },
      },
    });

    const anexo: Anexo & { url?: string } = {
      key,
      nome,
      tipo,
      mimetype,
      origem: "robo",
      legenda: params.legenda,
    };
    if (params.incluir_link) {
      anexo.url = await this.gestor.gerar_url_presigned({
        arquivo: key,
        validade_segundos: 86400,
      });
    }
    return anexo;
  }
}
