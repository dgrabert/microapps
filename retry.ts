import type { MicroApp } from "@virti/microapp-sdk";

/**
 * Decorator de retry com backoff exponencial para métodos de MicroApps.
 *
 * Como usar:
 *   - attempts: número máximo de tentativas
 *   - seconds: segundos do primeiro atraso
 *   - factor: multiplicador exponencial do backoff (1 para intervalo constante, 2 para duplicar o intervalo a cada tentativa, etc)
 *
 * Exemplo:
 *   class Pedido extends MicroApp {
 *     @retry({ attempts: 5, seconds: 1, factor: 2 })
 *     async processarPedido(params: { id: string }) {
 *       // sua lógica aqui
 *     }
 *   }
 */
export function retry(p: {
  attempts: number;
  seconds: number;
  factor: number;
}): (target: any, context: ClassMethodDecoratorContext) => (this: MicroApp, params?: Record<string, any>) => Promise<any> {
  return function (target: any, context: ClassMethodDecoratorContext) {
    return async function (this: MicroApp, params?: Record<string, any>) {
      const chave = `retry-attempt-${target.name}-params-${
        JSON.stringify(params ?? {})
      }`;

      const currentAttempt: number = await this.infosUser.get({ chave }) || 1;
      if (currentAttempt === p.attempts) {
        await this.infosUser.delete({ chave });
      }

      for (let attempt = currentAttempt; attempt <= p.attempts; attempt++) {
        try {
          await this.logger.debug({
            msg: {
              "decorator de retry":
                `executando tentativa ${attempt}/${p.attempts}`,
            },
          });
          return await target.apply(this, [params]);
        } catch (error) {
          await this.logger.debug({
            msg: {
              "decorator de retry":
                `tentativa ${attempt}/${p.attempts} falhou com o erro: ${
                  JSON.stringify(error)
                }`,
            },
          });
          const delay = 1000 * p.seconds * p.factor ** (attempt - 1);
          if (attempt === p.attempts) {
            throw error;
          }

          let totalExecutionSeconds = 0;
          for (let i = 1; i <= attempt; i++) {
            totalExecutionSeconds += p.seconds * p.factor ** (i - 1);
          }

          const executionDate = new Date();
          executionDate.setTime(executionDate.getTime() + delay);

          // passou de 2 minutos totais executando, ja joga pra metodo agendado
          if (totalExecutionSeconds / 60 >= 2) {
            const resposta = await this.metodosagendados.agenda_tarefa({
              method_name: target.name,
              execution_date: executionDate.toISOString(),
              parameters: params ?? {},
            });

            if (!resposta.success) {
              await this.logger.debug({
                msg: {
                  "decorator de retry":
                    `não foi possível agendar a execução de ${target.name} como tarefa agendada`,
                },
              });
              return;
            }

            await this.infosUser.set({
              chave,
              conteudo: attempt + 1,
            });

            return;
          }

          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    };
  };
}
