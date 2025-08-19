import { wrapper } from "./decorators.ts";

export type Tarefas = {
  id: number;
  id_microapp: number;
  metodo: string;
  parameteros: Record<string, string | number | boolean>;
  criado_em: string;
  data_execucao: string;
  status: string;
};

export type RespostaAgendamento = {
  success: boolean;
  data: Record<string, string | number | boolean>;
  error: string;
};

@wrapper
export class SchedulerMetodos {
  async agenda_tarefa({
    method_name,
    parameters,
    execution_date,
    microapp_id,
  }: {
    method_name: string;
    parameters: Record<string, string | number | boolean>;
    execution_date: string;
    microapp_id?: number;
  }): Promise<RespostaAgendamento> {
    return { success: false, data: {}, error: "sem dados" };
  }

  async cancelar_tarefa_por_id({ id }: { id: string }): Promise<void> {}

  async listar_tarefas({
    microapp_id,
  }: {
    microapp_id?: number;
  }): Promise<Tarefas[]> {
    return [];
  }

  async cancelar_tarefa({
    method_name,
    microapp_id,
  }: {
    method_name: string;
    microapp_id?: number;
  }): Promise<void> {}
}
