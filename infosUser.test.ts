import { assertEquals } from "jsr:@std/assert";
import { MicroApp } from "./base.ts";
import { InfosConta } from "./infosUser.ts";

Deno.test("MicroApp expõe InfosConta", async () => {
  const app = new MicroApp();

  assertEquals(app.infosConta instanceof InfosConta, true);
  await app.infosConta.set({ chave: "key", conteudo: { value: 1 } });
  assertEquals(await app.infosConta.get({ chave: "key" }), { value: 1 });
  assertEquals(await app.infosConta.delete({ chave: "key" }), true);
  assertEquals(await app.infosConta.get({ chave: "key" }), undefined);
});
