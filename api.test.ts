import { assertEquals, assertThrows } from "jsr:@std/assert@1.0.13";
import { api, ApiRequest, ApiResponse, MicroApp } from "./index.ts";
import type { ApiAuth } from "./index.ts";

Deno.test("api decorator registers metadata and wraps request", async () => {
  MicroApp.__pipeline__.api = {};

  class TestApp extends MicroApp {
    @api({ path: "/dash/*", methods: ["GET"], auth: "portal" })
    async dash(req: ApiRequest) {
      return ApiResponse.json({
        key: req.headers.get("x-key"),
        q: req.query.get("q"),
      });
    }
  }

  const entry = MicroApp.__pipeline__.api.dash;
  assertEquals(entry.path, "/dash/*");
  assertEquals(entry.methods, ["GET"]);
  assertEquals(entry.auth, "portal");

  const result = await entry.fn(new TestApp(), {
    requestId: "req_1",
    method: "GET",
    path: "/dash/a",
    headers: { "X-Key": "abc" },
    query: { q: "teste" },
    idRobo: 1,
    idMicroapp: 2,
    idUsuario: null,
  });

  assertEquals(result.__virti_api_response, true);
  assertEquals(result.type, "response");
  assertEquals(result.body, { key: "abc", q: "teste" });
});

Deno.test("api aceita auth publica explicita e rejeita valor desconhecido", () => {
  const authValues = ["public", "portal"] satisfies ApiAuth[];
  assertEquals(authValues, ["public", "portal"]);

  MicroApp.__pipeline__.api = {};

  class PublicApp extends MicroApp {
    @api({ path: "/publica", auth: "public" })
    publica(_req: ApiRequest) {
      return ApiResponse.empty();
    }

    @api({ path: "/compativel" })
    compativel(_req: ApiRequest) {
      return ApiResponse.empty();
    }
  }

  assertEquals(MicroApp.__pipeline__.api.publica.auth, undefined);
  assertEquals(MicroApp.__pipeline__.api.compativel.auth, undefined);
  assertThrows(
    () => api({ path: "/invalida", auth: "private" as ApiAuth }),
    TypeError,
    "Auth de API invalida",
  );
});

Deno.test("ApiResponse.asUser serializes control signal", () => {
  const result = ApiResponse.asUser("chatwoot_123");
  assertEquals(JSON.parse(JSON.stringify(result)), {
    __virti_api_response: true,
    type: "as_user",
    status: 204,
    headers: {},
    bodyType: "empty",
    body: null,
    idUsuario: "chatwoot_123",
  });
});
