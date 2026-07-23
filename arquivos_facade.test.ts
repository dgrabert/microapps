import { assertEquals, assertExists, assertRejects } from "jsr:@std/assert";
import { GestorArquivos } from "./arquivos.ts";
import { Conversa } from "./mensagens.ts";
import {
  Arquivos,
  inferirMimetype,
  inferirTipoArquivo,
} from "./arquivos_facade.ts";

const UUID = "123e4567-e89b-12d3-a456-426614174000";

function novaConversaComAnexos(): Conversa {
  const conversa = new Conversa();
  conversa.mensagens = [
    { origem: "cliente", conteudo: { texto: "oi" } },
    { origem: "cliente", conteudo: { midia: `imagem/${UUID}-foto.png` } },
    {
      origem: "cliente",
      conteudo: { midia: `documento/${UUID}-contrato.pdf` },
    },
    { origem: "robo", conteudo: { midia: `documento/${UUID}-boleto.pdf` } },
    { origem: "cliente", conteudo: { midia: "x" }, tipo: "debug" },
  ];
  return conversa;
}

Deno.test("Conversa.anexos: só anexos do cliente, tipo inferido e uuid removido", async () => {
  const conversa = novaConversaComAnexos();
  const anexos = await conversa.anexos();

  assertEquals(anexos.length, 2);
  assertEquals(anexos[0].nome, "foto.png");
  assertEquals(anexos[0].tipo, "imagem");
  assertEquals(anexos[0].key, `imagem/${UUID}-foto.png`);
  assertEquals(anexos[1].nome, "contrato.pdf");
  assertEquals(anexos[1].tipo, "documento");
});

Deno.test("Conversa.anexos: origem=todos inclui robo; filtro por tipo", async () => {
  const conversa = novaConversaComAnexos();

  assertEquals((await conversa.anexos({ origem: "todos" })).length, 3);
  assertEquals((await conversa.anexos({ origem: "robo" })).length, 1);

  const imagens = await conversa.anexos({ origem: "todos", tipo: "imagem" });
  assertEquals(imagens.length, 1);
  assertEquals(imagens[0].nome, "foto.png");
});

Deno.test("Arquivos.do_usuario: delega para cliente e pagina", async () => {
  const conversa = novaConversaComAnexos();
  const arquivos = new Arquivos(new GestorArquivos(), conversa);

  const todos = await arquivos.do_usuario();
  assertEquals(todos.length, 2);
  assertEquals(todos.every((a) => a.origem === "cliente"), true);

  const pag = await arquivos.do_usuario({ offset: 1, limite: 1 });
  assertEquals(pag.length, 1);
  assertEquals(pag[0].nome, "contrato.pdf");
});

Deno.test("Arquivos.enviar_ao_usuario: sobe (data), anexa na conversa e devolve link", async () => {
  const gestor = new GestorArquivos();
  const conversa = new Conversa();
  conversa.mensagens = [];
  const arquivos = new Arquivos(gestor, conversa);

  const anexo = await arquivos.enviar_ao_usuario({
    data: "ZGFkb3M=", // "dados" em base64
    nome: "relatorio.pdf",
    legenda: "Segue o relatório",
    metadados: { transporte: { ptt: false }, contexto: "teste" },
    incluir_link: true,
  });

  // Subiu para o S3 (mock) com o tipo inferido
  assertEquals(anexo.tipo, "documento");
  assertExists(gestor._arquivos[anexo.key]);
  assertEquals(gestor._arquivos[anexo.key].nome_arquivo, "relatorio.pdf");
  assertEquals(gestor._arquivos[anexo.key].mimetype, "application/pdf");

  // Anexou a mensagem de mídia na conversa (origem robo, midia = key)
  assertEquals(conversa.mensagens.length, 1);
  const msg = conversa.mensagens[0];
  assertEquals(msg.origem, "robo");
  assertEquals(msg.conteudo.midia, anexo.key);
  assertEquals(msg.conteudo.texto, "Segue o relatório");
  assertEquals(msg.metadados, {
    transporte: { ptt: false },
    contexto: "teste",
  });

  // Link presigned incluído
  assertExists(anexo.url);
});

Deno.test("Arquivos.enviar_ao_usuario: por key já no S3 não faz upload", async () => {
  const gestor = new GestorArquivos();
  const conversa = new Conversa();
  conversa.mensagens = [];
  const arquivos = new Arquivos(gestor, conversa);

  const anexo = await arquivos.enviar_ao_usuario({
    arquivo: `imagem/${UUID}-mapa.png`,
    legenda: "mapa",
  });

  assertEquals(Object.keys(gestor._arquivos).length, 0); // nada subiu
  assertEquals(anexo.key, `imagem/${UUID}-mapa.png`);
  assertEquals(anexo.tipo, "imagem");
  assertEquals(conversa.mensagens[0].conteudo.midia, anexo.key);
});

Deno.test("Arquivos.enviar_ao_usuario: erro sem origem", async () => {
  const arquivos = new Arquivos(new GestorArquivos(), new Conversa());
  await assertRejects(
    () => arquivos.enviar_ao_usuario({ nome: "x.pdf" }),
    Error,
    "caminho",
  );
});

Deno.test("inferir tipo e mimetype por extensão", () => {
  assertEquals(inferirTipoArquivo("a.png"), "imagem");
  assertEquals(inferirTipoArquivo("a.mp3"), "audio");
  assertEquals(inferirTipoArquivo("a.mp4"), "video");
  assertEquals(inferirTipoArquivo("a.pdf"), "documento");
  assertEquals(inferirTipoArquivo("semext"), "documento");
  assertEquals(inferirMimetype("a.pdf"), "application/pdf");
  assertEquals(inferirMimetype("a.desconhecido"), undefined);
});
