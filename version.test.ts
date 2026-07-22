import { assertEquals } from "jsr:@std/assert@1.0.13";
import config from "./deno.json" with { type: "json" };
import { MicroApp, SDK_VERSION, SDK_VERSION_TUPLE } from "./index.ts";

Deno.test("versao do runtime deriva do deno.json", () => {
  assertEquals(SDK_VERSION, config.version);
  assertEquals(SDK_VERSION_TUPLE, [0, 39, 1]);
  assertEquals(MicroApp.__version__, SDK_VERSION_TUPLE);
});
