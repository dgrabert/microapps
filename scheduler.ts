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
  error?: string;
};

@wrapper
export class SchedulerMetodos {
  _methods: Record<string, any> = {};

  agenda_tarefa(p: {
    method_name: string;
    execution_date: string;
    microapp_id?: number;
    parameters: Record<string, any>;
    construtor?: Record<string, any>;
  }): Promise<RespostaAgendamento> {
    this._methods[p.method_name] = p;
    return Promise.resolve({
      success: true,
      data: { id: Math.round(Math.random() * 1000) },
    });
  }

  cancelar_tarefa_por_id(_p: { id: string }): Promise<void> {
    return Promise.resolve();
  }

  listar_tarefas(_p: { microapp_id?: number }): Promise<Tarefas[]> {
    return Promise.resolve([]);
  }

  cancelar_tarefa(_p: {
    method_name: string;
    microapp_id?: number;
  }): Promise<void> {
    return Promise.resolve();
  }
}
