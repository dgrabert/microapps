import {
  assertEquals,
  assertNotEquals,
  assertRejects,
} from "jsr:@std/assert@1.0.13";
import { MicroApp, wrapperMethod } from "./index.ts";

const pendingCall = { reject: () => undefined, resolve: () => undefined };

Deno.test("geradores de duas copias evitam colisao no holder compartilhado", () => {
  const calls: Array<typeof pendingCall & { context_id: number }> = [];
  const holderA = { calls };
  const holderB = { calls };
  const candidatesA = [9_007_000_000_000_001];
  const candidatesB = [9_007_000_000_000_001, 9_007_000_000_000_002];

  const idA = MicroApp.__next_call_id__(
    holderA.calls,
    () => candidatesA.shift()!,
  );
  holderA.calls.push({ context_id: idA, ...pendingCall });
  const idB = MicroApp.__next_call_id__(
    holderB.calls,
    () => candidatesB.shift()!,
  );
  holderB.calls.push({ context_id: idB, ...pendingCall });

  assertNotEquals(idA, idB);
  assertEquals(calls.length, 2);

  calls.splice(0, calls.length);
  MicroApp.__release_call_id__(idA);
  MicroApp.__release_call_id__(idB);
  assertEquals(calls.length, 0);
});

Deno.test("bridge correlaciona chamadas e remove resultados da memoria", async () => {
  const originalMock = Deno.env.get("MOCK");
  const originalCall = MicroApp.__bridge__.call;
  const originalCalls = MicroApp.__calls__;
  const sent: Array<{ context_id: number; params: unknown }> = [];

  try {
    Deno.env.delete("MOCK");
    MicroApp.__calls__ = [];
    MicroApp.__bridge__.call = (params: object) => {
      sent.push(params as { context_id: number; params: unknown });
    };

    const wrapped = wrapperMethod(
      () => undefined,
      { name: "consultar" } as unknown as ClassMethodDecoratorContext,
    );
    const instance = { __meta__: { name: "Teste" } };
    const first = wrapped.call(instance, { ordem: 1 });
    const second = wrapped.call(instance, { ordem: 2 });

    assertEquals(sent.length, 2);
    assertNotEquals(sent[0].context_id, sent[1].context_id);
    assertEquals(Number.isSafeInteger(sent[0].context_id), true);
    assertEquals(sent[0].context_id > 1_000_000, true);
    assertEquals(MicroApp.__calls__.length, 2);

    MicroApp.__bridge__.receive({
      context_id: sent[1].context_id,
      type: "execution_result",
      error_message: "",
      value: "segundo",
    });
    assertEquals(await second, "segundo");
    assertEquals(MicroApp.__calls__.map((call) => call.context_id), [
      sent[0].context_id,
    ]);

    MicroApp.__bridge__.receive({
      context_id: sent[0].context_id,
      type: "execution_result",
      error_message: "falha",
      value: null,
    });

    let rejection: unknown;
    try {
      await first;
    } catch (err) {
      rejection = err;
    }
    assertEquals(rejection, "falha");
    assertEquals(MicroApp.__calls__.length, 0);

    MicroApp.__bridge__.call = () => {
      throw new Error("bridge indisponivel");
    };
    const failed = wrapped.call(instance, {});
    assertEquals(MicroApp.__calls__.length, 0);
    await assertRejects(() => failed, Error, "bridge indisponivel");
  } finally {
    if (originalMock === undefined) Deno.env.delete("MOCK");
    else Deno.env.set("MOCK", originalMock);
    MicroApp.__bridge__.call = originalCall;
    MicroApp.__calls__ = originalCalls;
  }
});
