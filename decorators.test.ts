import {
  assert,
  assertEquals,
  assertFalse,
  assertMatch,
  assertStringIncludes,
} from "jsr:@std/assert@1.0.13";
import { aiFunction, MicroApp } from "./index.ts";

Deno.test("aiFunction registra no log o mesmo error_id retornado", async () => {
  MicroApp.__pipeline__.ai_function = {};

  class TestApp extends MicroApp {
    @aiFunction(() => ({
      __description__: "Falha para teste.",
      __when_to_call__: "Durante o teste.",
    }))
    falhar() {
      throw new Error("detalhe interno");
    }
  }

  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(" "));

  let result: string;
  try {
    result = await MicroApp.__pipeline__.ai_function.falhar.fn(
      new TestApp(),
      {},
    );
  } finally {
    console.log = originalLog;
  }

  const match = result.match(/Código de erro ([0-9a-f-]+)$/i);
  assert(match);
  assertMatch(
    match[1],
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  );
  assertEquals(logs.length, 1);
  assertStringIncludes(logs[0], `error_id=${match[1]}`);
  assertStringIncludes(logs[0], "detalhe interno");
  assertFalse(result.includes("detalhe interno"));
  assertFalse(result.includes(" at "));
});
