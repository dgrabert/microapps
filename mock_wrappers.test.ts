import { assertEquals, assertInstanceOf } from "jsr:@std/assert";
import { GestorArquivos } from "./arquivos.ts";
import {
  BitrixCRM,
  CRM,
  CVCRM,
  EmailCRM,
  PiperunCRM,
  RDStationCRM,
  WebhookCRM,
} from "./crm.ts";
import { ControladorFluxo } from "./fluxo.ts";
import { FollowUp } from "./follow_up.ts";
import { InfosConta, InfosRobo, InfosUser } from "./infosUser.ts";
import {
  ChatWootInterface,
  ControladorInterface,
  LivechatInterface,
  Message,
  MessageContent,
  TelegramInterface,
  TemplateMessage,
  WhatsappInterface,
} from "./interfaces.ts";
import { GPT } from "./llm.ts";
import { Logger } from "./logger.ts";
import { Conversa } from "./mensagens.ts";
import { MicroappManager } from "./microapp_manager.ts";
import { PromptNode } from "./prompt.ts";
import { SchedulerMetodos } from "./scheduler.ts";
import { MicroAppUtils } from "./utils.ts";
import { VarsUser } from "./varsUser.ts";

Deno.test("SchedulerMetodos mocka agendamentos em RAM", async () => {
  const scheduler = new SchedulerMetodos();

  const created = await scheduler.agenda_tarefa({
    method_name: "rodar",
    execution_date: "2026-01-01T00:00:00Z",
    microapp_id: 7,
    parameters: { ok: true },
  });

  assertEquals(created.data.id, "1");
  assertEquals((await scheduler.listar_tarefas({ microapp_id: 7 })).length, 1);
  assertEquals((await scheduler.listar_tarefas({ microapp_id: 8 })).length, 0);

  await scheduler.cancelar_tarefa({ method_name: "rodar", microapp_id: 7 });
  assertEquals(await scheduler.listar_tarefas({}), []);
});

Deno.test("RDStationCRM mocka contatos, deals e cadastros auxiliares", async () => {
  const crm = new RDStationCRM();
  crm.pipelines.push({ id: "pipe", name: "Vendas" });
  crm.stages_by_pipeline_id.pipe = [{ id: "stage", name: "Novo" }];
  crm.users.push({ id: "user", email: "a@b.com" });
  crm.custom_fields.push({ id: "field", name: "Campo", entity: "deal" });
  crm.teams.push({ id: "team", name: "Time" });

  const contact = await crm.create_contact({ id_user: "whatsapp_1" });
  const deal = await crm.create_ai_deal({
    id_user: "whatsapp_1",
    contact_id: contact.id,
    owner_id: "user",
    pipeline_id: "pipe",
    stage_id: "stage",
  });

  assertEquals(await crm.find_contact({ id_user: "whatsapp_1" }), contact);
  assertEquals(await crm.find_ai_deal({ contact_id: contact.id }), deal);
  assertEquals(
    (await crm.save_deal({
      id_contato: contact.id,
      id_deal: deal.id,
      data: { name: "Deal" },
    }))?.name,
    "Deal",
  );
  assertEquals(await crm.get_pipeline_by_name({ name: "Vendas" }), {
    id: "pipe",
    name: "Vendas",
  });
  assertEquals(await crm.get_stages_by_pipeline_id({ pipeline_id: "pipe" }), [{
    id: "stage",
    name: "Novo",
  }]);
  assertEquals(await crm.get_user_by_email({ email: "a@b.com" }), {
    id: "user",
    email: "a@b.com",
  });
  assertEquals(
    await crm.get_custom_field_by_name({ name: "Campo", entity: "deal" }),
    { id: "field", name: "Campo", entity: "deal" },
  );
  assertEquals(await crm.list_teams(), [{ id: "team", name: "Time" }]);
});

Deno.test("CVCRM mocka leads, corretores, empreendimentos e situacoes", async () => {
  const crm = new CVCRM();
  crm.corretores.push({ idcorretor: 3, nome: "Ana", email: "ana@exemplo.com" });
  crm.empreendimentos.push({ idempreendimento: "10", nome: "Predio" });
  crm.situacoes.push({ id: 2, nome: "Novo" });

  await crm.salvar_lead({
    id_usuario: "whatsapp_11999999999",
    json_body: {
      acao: "inclusao",
      nome: "Lead",
      telefone: "11999999999",
      email: "lead@exemplo.com",
      modulo: "gestor",
      origem: "CH",
      tags: ["tag"],
      idcorretor: 3,
      idempreendimento: 10,
      idsituacao: 2,
    },
  });

  const [, lead] = await crm.consultar_lead({
    id_usuario: "whatsapp_11999999999",
  });
  assertEquals(lead?.nome, "Lead");
  assertEquals(
    await crm.get_corretor_by_id({ id_corretor: "3" }),
    crm.corretores[0],
  );
  assertEquals(
    await crm.get_empreendimento_by_id({ id_empreendimento: "10" }),
    crm.empreendimentos[0],
  );
  assertEquals(await crm.list_situacoes(), [{ id: 2, nome: "Novo" }]);
});

Deno.test("EmailCRM pode ser instanciado em MOCK", () => {
  assertInstanceOf(new EmailCRM(), EmailCRM);
});

Deno.test("BitrixCRM pode ser instanciado em MOCK", () => {
  assertInstanceOf(new BitrixCRM(), BitrixCRM);
});

Deno.test("PiperunCRM pode ser instanciado em MOCK", () => {
  assertInstanceOf(new PiperunCRM(), PiperunCRM);
});

Deno.test("WebhookCRM pode ser instanciado em MOCK", () => {
  assertInstanceOf(new WebhookCRM(), WebhookCRM);
});

Deno.test("CRM agrega os CRMs mockados", () => {
  const crm = new CRM();
  assertInstanceOf(crm.cvcrm, CVCRM);
  assertInstanceOf(crm.rdstation, RDStationCRM);
});

Deno.test("InfosUser mocka get, set e delete", async () => {
  const infos = new InfosUser();
  await infos.set({ chave: "nome", conteudo: "Ana" });
  assertEquals(await infos.get({ chave: "nome" }), "Ana");
  assertEquals(await infos.delete({ chave: "nome" }), true);
});

Deno.test("InfosRobo mocka get, set e delete", async () => {
  const infos = new InfosRobo();
  await infos.set({ chave: "modo", conteudo: "teste" });
  assertEquals(await infos.get({ chave: "modo" }), "teste");
  assertEquals(await infos.delete({ chave: "modo" }), true);
});

Deno.test("InfosConta mocka get, set e delete", async () => {
  const infos = new InfosConta();
  await infos.set({ chave: "plano", conteudo: "pro" });
  assertEquals(await infos.get({ chave: "plano" }), "pro");
  assertEquals(await infos.delete({ chave: "plano" }), true);
});

Deno.test("VarsUser mocka get, set, get_all e delete", async () => {
  const vars = new VarsUser();
  await vars.set({ chave: "email", conteudo: "a@b.com" });
  assertEquals(await vars.get({ chave: "email" }), "a@b.com");
  assertEquals(await vars.get_all(), { email: "a@b.com" });
  assertEquals(await vars.delete({ chave: "email" }), true);
});

Deno.test("ControladorInterface retorna valores padrao mockados", async () => {
  const controlador = new ControladorInterface();
  assertEquals(await controlador.get_interface_nome(), "generico");
  assertEquals(
    await controlador.need_template_after_one_day({ id_user: "u" }),
    false,
  );
});

Deno.test("WhatsappInterface mocka atividade, mensagens e templates", async () => {
  const whatsapp = new WhatsappInterface();
  whatsapp.active = true;

  assertEquals(await whatsapp.is_active(), true);
  assertEquals(
    await whatsapp.get_id_user_from_number("(11) 99999-9999"),
    "whatsapp_11999999999",
  );
  await whatsapp.send_message({ conversa: new Conversa(), id_user: "u" });
  await whatsapp.send_template({
    template: new TemplateMessage("tpl"),
    id_user: "u",
  });
  await whatsapp.send_template_number({
    template: new TemplateMessage("tpl"),
    phone_number: "119",
  });

  assertEquals(whatsapp.mensagens_enviadas.length, 1);
  assertEquals(whatsapp.templates_enviados.length, 1);
  assertEquals(whatsapp.templates_enviados_numero.length, 1);
});

Deno.test("LivechatInterface mocka atividade", async () => {
  const livechat = new LivechatInterface();
  livechat.active = true;
  assertEquals(await livechat.is_active(), true);
});

Deno.test("TelegramInterface mocka atividade e mensagens", async () => {
  const telegram = new TelegramInterface();
  telegram.active = true;
  await telegram.send_message_number({
    mensagem: new Message(new MessageContent("oi")),
    phone_number: "1",
  });
  assertEquals(await telegram.is_active(), true);
  assertEquals(telegram.mensagens_enviadas_numero.length, 1);
});

Deno.test("ChatWootInterface mocka atendimento, labels, notas e status", async () => {
  const chatwoot = new ChatWootInterface();
  chatwoot.agents.push({
    id: 1,
    account_id: 1,
    availability_status: "online",
    auto_offline: false,
    last_presence_at: "2026-01-01T00:00:00Z",
    confirmed: true,
    email: "ana@exemplo.com",
    available_name: "Ana",
    name: "Ana",
    role: "agent",
    thumbnail: "",
  });
  chatwoot.teams.push({
    id: 1,
    name: "Vendas",
    description: "",
    allow_auto_asign: true,
    account_id: 1,
    is_member: true,
  });

  assertEquals(
    await chatwoot.assign_agent({ id_user: "u", person_destination: "Ana" }),
    true,
  );
  assertEquals(await chatwoot.is_atendente_online({ id_user: "u" }), true);
  assertEquals(
    await chatwoot.assign_team({ id_user: "u", team_destination: "vendas" }),
    true,
  );
  await chatwoot.add_label({ id_user: "u", label: "Lead Quente" });
  await chatwoot.send_private_note({ id_user: "u", content: "nota" });
  await chatwoot.send_template({
    template: new TemplateMessage("tpl"),
    id_user: "u",
  });
  await chatwoot.toggle_conversation_status({
    id_user: "u",
    status: "resolved",
  });

  assertEquals(
    (await chatwoot.get_atendente({ id_user: "u" }))?.email,
    "ana@exemplo.com",
  );
  assertEquals(
    (await chatwoot.get_conversation_details({ id_user: "u" })).labels,
    ["lead_quente"],
  );
  assertEquals(chatwoot.notas_privadas.length, 1);
  assertEquals(chatwoot.templates_enviados.length, 1);
  assertEquals(chatwoot.conversation_info.status, "resolved");
});

Deno.test("ControladorFluxo mocka mudanca de etapa", async () => {
  const fluxo = new ControladorFluxo();
  await fluxo.set_etapa({ nome_etapa: "Etapa 2" });
  assertEquals(await fluxo.get_etapa_atual(), { nome: "Etapa 2" });
  assertEquals(await fluxo.mudou_etapa(), true);
  assertEquals(await fluxo.mudou_etapa(), false);
});

Deno.test("FollowUp mocka contadores e flags", async () => {
  const fup = new FollowUp();
  fup._total = 1;

  assertEquals(await fup.total_fups(), 1);
  assertEquals(await fup.enviou_todos(), false);
  assertEquals(await fup.agendar_proximo_fup(), true);
  await fup.fup_enviado();
  assertEquals(await fup.quantidade_fups_enviados(), 1);
  assertEquals(await fup.enviou_todos(), true);
  await fup.resetar_fup();
  assertEquals(await fup.quantidade_fups_enviados(), 0);
});

Deno.test("GestorArquivos mocka upload e URL", async () => {
  const gestor = new GestorArquivos();
  const key = await gestor.upload_arquivo_base64({
    tipo: "imagem",
    data: "abc",
    nome_arquivo: "a.png",
  });
  assertEquals(key, "mock-arquivo-1-a.png");
  assertEquals(
    await gestor.gerar_url_presigned({ arquivo: key, validade_segundos: 60 }),
    `mock://arquivo/${key}?validade=60`,
  );
});

Deno.test("Conversa mocka historico em RAM", async () => {
  const conversa = new Conversa();
  await conversa.append({
    mensagem: { origem: "robo", conteudo: { texto: "Resposta" } },
  });
  await conversa.append({
    mensagem: { origem: "cliente", conteudo: { texto: "Outra" } },
  });

  assertEquals(await conversa.ids(), [123, "id_usuario"]);
  assertEquals(await conversa.ultima_interacao({ origem: "cliente" }), "Outra");
  assertEquals(
    (await conversa.get_last_message({ origem: "robo" }))?.conteudo.texto,
    "Resposta",
  );
  assertEquals(
    (await conversa.pega_ultimo_bloco({ origem: "cliente" })).length,
    1,
  );
  assertEquals(await conversa.primeira_msg_do_cliente(), false);
  assertEquals(
    (await conversa.to_text({ backlog: 2 })).includes("robo: Resposta"),
    true,
  );
});

Deno.test("PromptNode mocka arvore em RAM", async () => {
  const prompt = new PromptNode("root");
  await prompt.add_item({ item: "a" });
  await (await prompt.add_node({ name: "child" })).add_item({ item: "b" });

  const json = await prompt.to_json();
  const restored = new PromptNode("empty");
  await restored.from_json({ jsonString: json });

  assertEquals((await restored.find_node({ name: "child" }))?.items, ["b"]);
  assertEquals((await restored.to_text()).includes("<root>"), true);
});

Deno.test("GPT mocka modelo, run e votar", async () => {
  const gpt = new GPT();
  await gpt.set_modelo({ modelo: "modelo" });

  assertEquals(
    await gpt.run({ mensagens: [{ role: "user", content: "Oi" }] }),
    ["mock(modelo): Oi", "stop", null],
  );
  assertEquals(
    await gpt.votar({
      num_votos: 1,
      mensagem_sistema: "",
      mensagens_a_apurar: "",
      resposta_padrao: true,
    }),
    true,
  );
});

Deno.test("Logger mocka metodos de log", async () => {
  const logger = new Logger();
  await logger.debug({ msg: "debug" });
  await logger.info({ msg: "info" });
  await logger.warning({ msg: "warn" });
  await logger.error({ msg: "error" });
});

Deno.test("MicroAppUtils mocka utilitarios", async () => {
  const utils = new MicroAppUtils();

  assertEquals(await utils.sanitize_dict({ a: "", b: " ok " }), {
    a: null,
    b: "ok",
  });
  assertEquals(await utils.validar_email("a@b.com"), true);
  assertEquals(await utils.validar_telefone("11999999999"), "+5511999999999");
  assertEquals(
    await utils.validar_uuid("550e8400-e29b-41d4-a716-446655440000"),
    true,
  );
  assertEquals(await utils.validar_cpf("52998224725"), true);
  assertEquals(await utils.validar_cnpj("11222333000181"), true);
  assertEquals(await utils.remover_acentos("ação"), "acao");
  assertEquals(await utils.truncar("abcdef", 5), "ab...");
  assertEquals(await utils.slugify("Ação Teste"), "acao-teste");
  assertEquals(
    await utils.parse_date("2026-01-01T00:00:00Z"),
    "2026-01-01T00:00:00.000Z",
  );
  assertEquals(
    await utils.formatar_data_br("2026-01-01T00:00:00Z"),
    "31/12/2025",
  );
  assertEquals(await utils.cosine_similarity([1, 0], [1, 0]), 1);
});

Deno.test("MicroappManager mocka CRUD e execucao efemera", async () => {
  const manager = new MicroappManager();
  const created = await manager.criar_microapp({
    nome: "M",
    url: "https://exemplo.com",
    branch: "main",
    entrypoint: "main.ts",
  });

  assertEquals(created.id, 1);
  assertEquals((await manager.listar_microapps({})).length, 1);
  assertEquals(
    (await manager.atualizar_microapp({ id_microapp: 1, nome: "N" })).nome,
    "N",
  );
  assertEquals(
    await manager.validar_schema({ url: "u", branch: "b", entrypoint: "e" }),
    { valido: true, erro: null },
  );
  assertEquals(
    await manager.executar_conversa_efemera({
      mensagens: ["oi"],
      id_microapp: 1,
    }),
    {
      respostas: ["mock: oi"],
      erros: [],
      estado_final: { infos_user: {}, vars_user: {} },
    },
  );
  assertEquals(await manager.deletar_microapp({ id_microapp: 1 }), {
    ok: true,
    id: 1,
  });
});
