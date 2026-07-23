import { assertEquals } from "jsr:@std/assert@1.0.13";
import { ConversasAdapter, PortalAPI } from "./index.ts";
import type { EnviarConversaParams } from "./index.ts";

Deno.test("ConversasAdapter.enviar aceita contratos proativos genericos", async () => {
  const envios: EnviarConversaParams[] = [
    {
      id_robo: 1,
      id_interface: "2",
      destinatario: { id_user: "usuario_1" },
      mensagem: { texto: "Ola" },
      idempotency_key: "envio-1",
      confirmado: true,
    },
    {
      id_robo: 1,
      id_interface: "2",
      id_inbox: 10,
      destinatario: { telefone: "+5511999999999" },
      mensagem: {
        midia: "https://example.com/imagem.png",
        audio: "https://example.com/audio.ogg",
        metadados: { origem: "teste" },
      },
      idempotency_key: "envio-2",
      confirmado: true,
    },
    {
      id_robo: 1,
      destinatario: { chat_id: "123" },
      template: {
        nome: "boas_vindas",
        lingua: "pt_BR",
        components: [{ type: "body", parameters: [] }],
      },
      idempotency_key: "envio-3",
      confirmado: true,
    },
  ];

  const adapter = new ConversasAdapter();
  for (const envio of envios) {
    assertEquals(await adapter.enviar(envio), undefined);
  }

  assertEquals(await new PortalAPI().conversas.enviar(envios[0]), undefined);
});
