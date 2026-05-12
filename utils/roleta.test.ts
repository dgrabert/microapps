import { assert, assertEquals } from "jsr:@std/assert";
import { MicroApp } from "../base.ts";
import { type RoletaAtendente, RoletaChatwoot } from "./index.ts";

class TesteRoleta extends MicroApp {}

Deno.test("RoletaChatwoot.girar", async (t) => {
  await t.step(
    "sorteia e incrementa indice sem atribuir no chatwoot",
    async () => {
      const corretores: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
        { nome: "B", email: "b@exemplo.com" },
      ];

      const mapp = new TesteRoleta();
      const roleta = new RoletaChatwoot({
        microapp: mapp,
        atendentes: corretores,
        id_roleta: "girar_test",
      });

      const a1 = await roleta.girar();
      assert(a1, "esperava sortear o primeiro atendente");
      assertEquals(a1, corretores[0]);
      assertEquals(roleta.motivoEscolha, "next");

      const a2 = await roleta.girar();
      assert(a2, "esperava sortear o segundo atendente");
      assertEquals(a2, corretores[1]);
      assertEquals(roleta.motivoEscolha, "next");

      const a3 = await roleta.girar();
      assert(a3, "esperava sortear o primeiro novamente");
      assertEquals(a3, corretores[0]);
      assertEquals(roleta.motivoEscolha, "next");
    },
  );

  await t.step("marca motivo quando ha somente um atendente", async () => {
    const corretores: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes: corretores,
      id_roleta: "girar_um_atendente",
    });

    const result = await roleta.girar();
    assertEquals(result, corretores[0]);
    assertEquals(roleta.motivoEscolha, "only_one");
  });

  await t.step("marca motivo quando escolhe atendente online", async () => {
    const corretores: RoletaAtendente[] = [
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
      atendentes: corretores,
      id_roleta: "girar_online",
      somente_atendentes_online: true,
    });

    const result = await roleta.girar();
    assertEquals(result, corretores[1]);
    assertEquals(roleta.motivoEscolha, "next_online");
  });

  await t.step(
    "marca motivo quando usa fallback sem atendente online",
    async () => {
      const corretores: RoletaAtendente[] = [
        { nome: "A", email: "a@exemplo.com" },
        { nome: "B", email: "b@exemplo.com" },
      ];

      const mapp = new TesteRoleta();
      const roleta = new RoletaChatwoot({
        microapp: mapp,
        atendentes: corretores,
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
});

Deno.test("RoletaChatwoot.associar_usuario", async (t) => {
  await t.step("associa e incrementa indice", async () => {
    const corretores: RoletaAtendente[] = [
      { nome: "A", email: "a@exemplo.com" },
      { nome: "B", email: "b@exemplo.com" },
    ];

    const mapp = new TesteRoleta();
    const roleta = new RoletaChatwoot({
      microapp: mapp,
      atendentes: corretores,
      id_roleta: "corretores",
    });

    const a1 = await roleta.associar_usuario();
    assert(a1, "esperava associar o primeiro atendente");
    assertEquals(a1, corretores[0]);

    const a2 = await roleta.associar_usuario();
    assert(a2, "esperava associar o segundo atendente");
    assertEquals(a2, corretores[1]);

    const a3 = await roleta.associar_usuario();
    assert(a3, "esperava associar o segundo atendente");
    assertEquals(a3, corretores[0]);
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
});
