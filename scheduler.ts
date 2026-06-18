import { wrapper } from "./decorators.ts";

export type Tarefa = {
  id: string;
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
  _tarefas: Tarefa[] = [];
  _proximo_id: number = 1;

  agenda_tarefa(p: {
    method_name: string;
    execution_date: string;
    microapp_id?: number;
    parameters: Record<string, any>;
    construtor?: Record<string, any>;
  }): Promise<RespostaAgendamento> {
    this._methods[p.method_name] = p;
    const resposta = {
      success: true,
      data: { id: String(this._proximo_id++) },
    };
    this._tarefas.push({
      id: resposta.data.id,
      id_microapp: p.microapp_id ?? 1,
      metodo: p.method_name,
      parameteros: p.parameters,
      criado_em: new Date().toISOString(),
      data_execucao: p.execution_date,
      status: "pendente",
    });
    return Promise.resolve(resposta);
  }

  cancelar_tarefa_por_id(p: { id: string }): Promise<void> {
    this._tarefas = this._tarefas.filter((t) => t.id !== p.id);
    return Promise.resolve();
  }

  listar_tarefas(p: { microapp_id?: number }): Promise<Tarefa[]> {
    if (p.microapp_id == null) {
      return Promise.resolve(this._tarefas);
    }
    return Promise.resolve(
      this._tarefas.filter((t) => t.id_microapp === p.microapp_id),
    );
  }

  cancelar_tarefa(p: {
    method_name: string;
    microapp_id?: number;
  }): Promise<void> {
    this._tarefas = this._tarefas.filter((t) => {
      if (t.metodo !== p.method_name) {
        return true;
      }
      return p.microapp_id != null && t.id_microapp !== p.microapp_id;
    });
    return Promise.resolve();
  }
}
