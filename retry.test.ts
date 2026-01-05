import { MicroApp } from "./base.ts";
import { retry } from "./retry.ts";

Deno.test("@retry", async (t) => {
  await t.step(
    "retenta N vezes sem usar o agendamento de microapp",
    async () => {
      class App extends MicroApp {
        count = 0;

        @retry({ attempts: 3, seconds: 0.01, factor: 1 })
        async func() {
          this.count++;
          await new Promise((_, reject) => setTimeout(reject, 1));
        }
      }

      const mapp = new App();

      try {
        await mapp.func();
        throw new Error("esperava que a funcao lancasse um erro");
      } catch {
        const wantCount = 3;
        if (mapp.count !== wantCount) {
          throw new Error(
            `esperava que retentasse ${wantCount} vezes, mas retentou ${mapp.count}`,
          );
        }
      }
    },
  );

  await t.step(
    "retenta usando o agendamento de microapp",
    async () => {
      class App extends MicroApp {
        count = 0;

        @retry({ attempts: 2, seconds: 5 * 60, factor: 1 })
        async func() {
          this.count++;
          await new Promise((_, reject) => setTimeout(reject, 1));
        }
      }

      const mapp = new App();

      try {
        await mapp.func();
        throw new Error("esperava que a funcao lancasse um erro");
      } catch {
        const wantCount = 1;
        if (mapp.count !== wantCount) {
          throw new Error(
            `esperava que retentasse ${wantCount} vezes, mas retentou ${mapp.count}`,
          );
        }
      }
    },
  );
});
