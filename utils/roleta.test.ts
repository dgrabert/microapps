import { assert, assertEquals } from "jsr:@std/assert";
import { MicroApp } from "../base.ts";
import { type Atendente, RoletaChatwoot } from "./index.ts";

class TesteRoleta extends MicroApp {}

Deno.test("RoletaChatwoot.associar_usuario", async (t) => {
  await t.step("associa e incrementa indice", async () => {
    const corretores: Atendente[] = [
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
