import { assert, assertEquals } from "jsr:@std/assert";
import { MicroApp } from "../base.ts";
import { type RoletaAtendente, RoletaChatwoot } from "./index.ts";

class TesteRoleta extends MicroApp {}

const CHAVE_HISTORICO_ATENDENTES = "roleta:historico_atendentes";
const AGORA_FIXO = new Date("2026-06-22T12:00:00.000Z");

function segundosAtras(segundos: number): string {
  return new Date(Date.now() - segundos * 1000).toISOString();
}

function minutosAntes(base: Date, minutos: number): string {
  return new Date(base.getTime() - minutos * 60 * 1000).toISOString();
}

function assertIsoDate(value: string) {
  assert(!Number.isNaN(Date.parse(value)), `timestamp invalido: ${value}`);
}

Deno.test("RoletaChatwoot.girar", async (t) => {
  await t.step(
    "sorteia e incrementa indice sem atribuir no chatwoot",
    async () => {
      const atendentes: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
        { nome: "B", email: "b@exemplo.com" },
      ];

      const mapp = new TesteRoleta();
      const roleta = new RoletaChatwoot({
        microapp: mapp,
        atendentes,
        id_roleta: "girar_test",
      });

      const a1 = await roleta.girar();
      assert(a1, "esperava sortear o primeiro atendente");
      assertEquals(a1, atendentes[0]);
      assertEquals(roleta.motivoEscolha, "next");

      const a2 = await roleta.girar();
      assert(a2, "esperava sortear o segundo atendente");
      assertEquals(a2, atendentes[1]);
      assertEquals(roleta.motivoEscolha, "next");

      const a3 = await roleta.girar();
      assert(a3, "esperava sortear o primeiro novamente");
      assertEquals(a3, atendentes[0]);
      assertEquals(roleta.motivoEscolha, "next");
    },
  );

  await t.step("marca motivo quando ha somente um atendente", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "girar_um_atendente",
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[0]);
    assertEquals(roleta.motivoEscolha, "only_one");
  });

  await t.step("marca motivo quando escolhe atendente online", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    mapp.interface_chatwoot.agents = [
      {
        id: 2,
        account_id: 1,
        availability_status: "online",
        auto_offline: false,
        confirmed: true,
        email: "b@exemplo.com",
        available_name: "B",
        name: "B",
        role: "agent",
        thumbnail: "",
      },
    ];
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "girar_online",
      somente_atendentes_online: true,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[1]);
    assertEquals(roleta.motivoEscolha, "next_online");
  });

  await t.step(
    "marca motivo quando usa fallback sem atendente online",
    async () => {
      const atendentes: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
        { nome: "B", email: "b@exemplo.com" },
      ];

      const mapp = new TesteRoleta();
      const roleta = new RoletaChatwoot({
        microapp: mapp,
        atendentes,
        id_roleta: "girar_fallback",
        somente_atendentes_online: true,
      });

      const result = await roleta.girar();
      assert(result, "esperava escolher um atendente por fallback");
      assertEquals(roleta.motivoEscolha, "next_fallback");
    },
  );

  await t.step("retorna null sem atendentes", async () => {
    const mapp = new TesteRoleta();
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes: [],
      id_roleta: "girar_vazio",
    });

    const result = await roleta.girar();
    assertEquals(result, null);
    assertEquals(roleta.motivoEscolha, undefined);

    const idx = await mapp.infosRobo.get({ chave: "roleta:idx:girar_vazio" });
    assertEquals(idx, undefined);
  });

  await t.step(
    "ignora config_atendentes sem ordenacao por recencia",
    async () => {
      const atendentes: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
        { nome: "B", email: "b@exemplo.com" },
      ];

      const mapp = new TesteRoleta();
      const roleta = new RoletaChatwoot({
        microapp: mapp,
        atendentes,
        id_roleta: "girar_ignora_config",
        config_atendentes: {
          "b@exemplo.com": { peso: 100 },
        },
      });

      assertEquals(await roleta.girar(), atendentes[0]);
      assertEquals(await roleta.girar(), atendentes[1]);
    },
  );
});

Deno.test("RoletaChatwoot.girar com ordenacao_por_recencia", async (t) => {
  await t.step(
    "usa array vazio quando nao existe historico e nao mexe no indice",
    async () => {
      const atendentes: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
        { nome: "B", email: "b@exemplo.com" },
      ];

      const mapp = new TesteRoleta();
      const roleta = new RoletaChatwoot({
        microapp: mapp,
        atendentes,
        id_roleta: "recencia_sem_historico",
        ordenacao_por_recencia: true,
      });

      const result = await roleta.girar();
      assertEquals(result, atendentes[0]);
      assertEquals(roleta.motivoEscolha, "next");
      assertEquals(
        await mapp.infosRobo.get({
          chave: "roleta:idx:recencia_sem_historico",
        }),
        undefined,
      );
      assertEquals(
        await mapp.infosRobo.get({
          chave: "roleta:email:recencia_sem_historico",
        }),
        undefined,
      );
    },
  );

  await t.step("popula historico vazio e da mais de uma volta", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    let agora = new Date("2026-06-22T12:00:00.000Z");
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_mais_de_uma_volta",
      ordenacao_por_recencia: true,
      agora: () => agora,
    });

    assertEquals(
      await mapp.infosConta.get({ chave: CHAVE_HISTORICO_ATENDENTES }),
      undefined,
    );
    assertEquals(await roleta.girar(), atendentes[0]);
    agora = new Date("2026-06-22T12:01:00.000Z");
    assertEquals(await roleta.girar(), atendentes[1]);
    agora = new Date("2026-06-22T13:02:00.000Z");
    assertEquals(await roleta.girar(), atendentes[0]);

    const historico = await mapp.infosConta.get({
      chave: CHAVE_HISTORICO_ATENDENTES,
    });
    assertEquals(historico.length, 2);
    assertEquals(
      historico.map((item: { atendente_email: string }) =>
        item.atendente_email
      ),
      ["b@exemplo.com", "a@exemplo.com"],
    );
  });

  await t.step("escolhe atendente sem historico primeiro", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [{
        atendente_email: "a@exemplo.com",
        id_user: "lead_a",
        timestamp: minutosAntes(AGORA_FIXO, 1),
        nome_roleta: "outra_roleta",
      }],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_infinito",
      ordenacao_por_recencia: true,
      agora: () => AGORA_FIXO,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[1]);
  });

  await t.step(
    "sem historico passa atendente com mais de uma hora sem lead",
    async () => {
      const atendentes: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
        { nome: "B", email: "b@exemplo.com" },
      ];

      const mapp = new TesteRoleta();
      await mapp.infosConta.set({
        chave: CHAVE_HISTORICO_ATENDENTES,
        conteudo: [{
          atendente_email: "a@exemplo.com",
          id_user: "lead_a",
          timestamp: new Date(
            AGORA_FIXO.getTime() - 3650 * 1000,
          ).toISOString(),
          nome_roleta: "roleta_a",
        }],
      });
      const roleta = new RoletaChatwoot({
        microapp: mapp,
        atendentes,
        id_roleta: "recencia_sem_historico_maior_que_uma_hora",
        ordenacao_por_recencia: true,
        agora: () => AGORA_FIXO,
      });

      const result = await roleta.girar();
      assertEquals(result, atendentes[1]);
    },
  );

  await t.step("aplica peso no tempo sem lead", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [
        {
          atendente_email: "a@exemplo.com",
          id_user: "lead_a",
          timestamp: minutosAntes(AGORA_FIXO, 5),
          nome_roleta: "roleta_a",
        },
        {
          atendente_email: "b@exemplo.com",
          id_user: "lead_b",
          timestamp: minutosAntes(AGORA_FIXO, 7),
          nome_roleta: "roleta_b",
        },
      ],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_peso",
      ordenacao_por_recencia: true,
      config_atendentes: {
        "a@exemplo.com": { peso: 2 },
      },
      agora: () => AGORA_FIXO,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[0]);
  });

  await t.step("peso alto pode passar atendente sem historico", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [{
        atendente_email: "a@exemplo.com",
        id_user: "lead_a",
        timestamp: new Date(AGORA_FIXO.getTime() - 3650 * 1000).toISOString(),
        nome_roleta: "roleta_a",
      }],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_peso_alto_com_historico",
      ordenacao_por_recencia: true,
      config_atendentes: {
        "a@exemplo.com": { peso: 2 },
      },
      agora: () => AGORA_FIXO,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[0]);
  });

  await t.step("peso zero pune atendente sem historico", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [{
        atendente_email: "b@exemplo.com",
        id_user: "lead_b",
        timestamp: minutosAntes(AGORA_FIXO, 1),
        nome_roleta: "roleta_b",
      }],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_peso_zero",
      ordenacao_por_recencia: true,
      config_atendentes: {
        "a@exemplo.com": { peso: 0 },
      },
      agora: () => AGORA_FIXO,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[1]);
  });

  await t.step("config vazia e ausente usam peso padrao", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [
        {
          atendente_email: "a@exemplo.com",
          id_user: "lead_a",
          timestamp: minutosAntes(AGORA_FIXO, 5),
          nome_roleta: "roleta_a",
        },
        {
          atendente_email: "b@exemplo.com",
          id_user: "lead_b",
          timestamp: minutosAntes(AGORA_FIXO, 7),
          nome_roleta: "roleta_b",
        },
      ],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_peso_padrao",
      ordenacao_por_recencia: true,
      config_atendentes: {
        "a@exemplo.com": {},
      },
      agora: () => AGORA_FIXO,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[1]);
  });

  await t.step("peso invalido usa peso padrao", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
      { nome: "C", email: "c@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [
        {
          atendente_email: "a@exemplo.com",
          id_user: "lead_a",
          timestamp: minutosAntes(AGORA_FIXO, 5),
          nome_roleta: "roleta_a",
        },
        {
          atendente_email: "b@exemplo.com",
          id_user: "lead_b",
          timestamp: minutosAntes(AGORA_FIXO, 7),
          nome_roleta: "roleta_b",
        },
        {
          atendente_email: "c@exemplo.com",
          id_user: "lead_c",
          timestamp: minutosAntes(AGORA_FIXO, 6),
          nome_roleta: "roleta_c",
        },
      ],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_peso_invalido",
      ordenacao_por_recencia: true,
      config_atendentes: {
        "a@exemplo.com": { peso: NaN },
        "b@exemplo.com": { peso: -1 },
        "c@exemplo.com": { peso: Infinity },
      },
      agora: () => AGORA_FIXO,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[1]);
  });

  await t.step("escolhe quem esta ha mais tempo sem lead", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
      { nome: "C", email: "c@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [
        {
          atendente_email: "a@exemplo.com",
          id_user: "lead_a",
          timestamp: segundosAtras(1_000),
          nome_roleta: "roleta_a",
        },
        {
          atendente_email: "b@exemplo.com",
          id_user: "lead_b",
          timestamp: segundosAtras(2_000),
          nome_roleta: "roleta_b",
        },
        {
          atendente_email: "c@exemplo.com",
          id_user: "lead_c",
          timestamp: segundosAtras(100),
          nome_roleta: "roleta_c",
        },
      ],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_maior_tempo",
      ordenacao_por_recencia: true,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[1]);
  });

  await t.step("ignora historico de email fora da roleta atual", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [
        {
          atendente_email: "fora@exemplo.com",
          id_user: "lead_fora",
          timestamp: segundosAtras(50_000),
          nome_roleta: "fora",
        },
        {
          atendente_email: "a@exemplo.com",
          id_user: "lead_a",
          timestamp: segundosAtras(100),
          nome_roleta: "roleta_a",
        },
        {
          atendente_email: "b@exemplo.com",
          id_user: "lead_b",
          timestamp: segundosAtras(500),
          nome_roleta: "roleta_b",
        },
      ],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_ignora_fora",
      ordenacao_por_recencia: true,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[1]);
  });

  await t.step("usa menor tempo sem lead quando ha duplicidade", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [
        {
          atendente_email: "a@exemplo.com",
          id_user: "lead_a_antigo",
          timestamp: segundosAtras(3_000),
          nome_roleta: "roleta_a",
        },
        {
          atendente_email: "a@exemplo.com",
          id_user: "lead_a_recente",
          timestamp: segundosAtras(100),
          nome_roleta: "roleta_a",
        },
        {
          atendente_email: "b@exemplo.com",
          id_user: "lead_b",
          timestamp: segundosAtras(500),
          nome_roleta: "roleta_b",
        },
      ],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_duplicidade",
      ordenacao_por_recencia: true,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[1]);
  });

  await t.step("historico eh global entre roletas", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    const primeiraRoleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_global_1",
      ordenacao_por_recencia: true,
    });
    const segundaRoleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_global_2",
      ordenacao_por_recencia: true,
    });

    assertEquals(await primeiraRoleta.girar(), atendentes[0]);
    assertEquals(await segundaRoleta.girar(), atendentes[1]);
  });

  await t.step(
    "historico global afeta roletas com membros em comum",
    async () => {
      const time1: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
        { nome: "B", email: "b@exemplo.com" },
        { nome: "C", email: "c@exemplo.com" },
      ];
      const time2: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
        { nome: "C", email: "c@exemplo.com" },
        { nome: "D", email: "d@exemplo.com" },
        { nome: "E", email: "e@exemplo.com" },
      ];

      const mapp = new TesteRoleta();
      let agora = new Date("2026-06-22T12:00:00.000Z");
      const roletaTime1 = new RoletaChatwoot({
        microapp: mapp,
        atendentes: time1,
        id_roleta: "recencia_time_1",
        ordenacao_por_recencia: true,
        agora: () => agora,
      });
      const roletaTime2 = new RoletaChatwoot({
        microapp: mapp,
        atendentes: time2,
        id_roleta: "recencia_time_2",
        ordenacao_por_recencia: true,
        agora: () => agora,
      });

      assertEquals(await roletaTime2.girar(), time2[0]);
      agora = new Date("2026-06-22T12:01:00.000Z");
      assertEquals(await roletaTime1.girar(), time1[1]);
      agora = new Date("2026-06-22T12:02:00.000Z");
      assertEquals(await roletaTime1.girar(), time1[2]);
      agora = new Date("2026-06-22T12:03:00.000Z");
      assertEquals(await roletaTime2.girar(), time2[2]);
    },
  );

  await t.step(
    "salva historico com id_user, timestamp ISO e nome da roleta",
    async () => {
      const atendentes: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
      ];

      const mapp = new TesteRoleta();
      mapp.conversa.idUsuario = "chatwoot_123";
      const roleta = new RoletaChatwoot({
        microapp: mapp,
        atendentes,
        id_roleta: "recencia_registro",
        ordenacao_por_recencia: true,
        agora: () => AGORA_FIXO,
      });

      assertEquals(await roleta.girar(), atendentes[0]);
      const historico = await mapp.infosConta.get({
        chave: CHAVE_HISTORICO_ATENDENTES,
      });

      assertEquals(historico.length, 1);
      assertEquals(historico[0].atendente_email, "a@exemplo.com");
      assertEquals(historico[0].id_user, "chatwoot_123");
      assertEquals(historico[0].nome_roleta, "recencia_registro");
      assertEquals(historico[0].timestamp, AGORA_FIXO.toISOString());
      assertIsoDate(historico[0].timestamp);
    },
  );

  await t.step("remove registros antigos do mesmo atendente", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [
        {
          atendente_email: "a@exemplo.com",
          id_user: "lead_a_antigo",
          timestamp: segundosAtras(1_000),
          nome_roleta: "antiga",
        },
        {
          atendente_email: "b@exemplo.com",
          id_user: "lead_b",
          timestamp: segundosAtras(500),
          nome_roleta: "outra",
        },
      ],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_compacta",
      ordenacao_por_recencia: true,
    });

    assertEquals(await roleta.girar(), atendentes[0]);
    const historico = await mapp.infosConta.get({
      chave: CHAVE_HISTORICO_ATENDENTES,
    });

    assertEquals(historico.length, 2);
    assertEquals(
      historico.filter((item: { atendente_email: string }) =>
        item.atendente_email === "a@exemplo.com"
      ).length,
      1,
    );
    assertEquals(historico[0].atendente_email, "b@exemplo.com");
    assertEquals(historico[1].atendente_email, "a@exemplo.com");
  });

  await t.step("ignora somente_atendentes_online por enquanto", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    mapp.interface_chatwoot.agents = [
      {
        id: 2,
        account_id: 1,
        availability_status: "online",
        auto_offline: false,
        confirmed: true,
        email: "b@exemplo.com",
        available_name: "B",
        name: "B",
        role: "agent",
        thumbnail: "",
      },
    ];
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [{
        atendente_email: "b@exemplo.com",
        id_user: "lead_b",
        timestamp: segundosAtras(10),
        nome_roleta: "roleta_b",
      }],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "recencia_ignora_online",
      somente_atendentes_online: true,
      ordenacao_por_recencia: true,
    });

    const result = await roleta.girar();
    assertEquals(result, atendentes[0]);
    assertEquals(roleta.motivoEscolha, "next");
  });
});

Deno.test("RoletaChatwoot.associar_usuario", async (t) => {
  await t.step("associa e incrementa indice", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "corretores",
    });

    const a1 = await roleta.associar_usuario();
    assert(a1, "esperava associar o primeiro atendente");
    assertEquals(a1, atendentes[0]);

    const a2 = await roleta.associar_usuario();
    assert(a2, "esperava associar o segundo atendente");
    assertEquals(a2, atendentes[1]);

    const a3 = await roleta.associar_usuario();
    assert(a3, "esperava associar o segundo atendente");
    assertEquals(a3, atendentes[0]);
  });

  await t.step("retorna null sem atendentes", async () => {
    const mapp = new TesteRoleta();
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes: [],
      id_roleta: "corretores",
    });

    const result = await roleta.associar_usuario();
    assertEquals(result, null);

    const idx = await mapp.infosRobo.get({ chave: "roleta:idx:corretores" });
    assertEquals(idx, undefined);
  });

  await t.step("associa usando ordenacao por recencia", async () => {
    const atendentes: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    mapp.interface_chatwoot.agents = [
      {
        id: 1,
        account_id: 1,
        availability_status: "online",
        auto_offline: false,
        confirmed: true,
        email: "a@exemplo.com",
        available_name: "A",
        name: "A",
        role: "agent",
        thumbnail: "",
      },
      {
        id: 2,
        account_id: 1,
        availability_status: "online",
        auto_offline: false,
        confirmed: true,
        email: "b@exemplo.com",
        available_name: "B",
        name: "B",
        role: "agent",
        thumbnail: "",
      },
    ];
    await mapp.infosConta.set({
      chave: CHAVE_HISTORICO_ATENDENTES,
      conteudo: [{
        atendente_email: "a@exemplo.com",
        id_user: "lead_a",
        timestamp: segundosAtras(10),
        nome_roleta: "roleta_a",
      }],
    });
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes,
      id_roleta: "associar_recencia",
      ordenacao_por_recencia: true,
    });

    const result = await roleta.associar_usuario();
    assertEquals(result, atendentes[1]);
    assertEquals(
      mapp.interface_chatwoot.conversation_info.meta.assignee?.email,
      "b@exemplo.com",
    );
  });
});
