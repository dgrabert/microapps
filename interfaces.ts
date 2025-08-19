import { wrapper } from "./decorators.ts";

@wrapper
export class ControladorInterface {
  get_interface_nome(): Promise<
    "whatsapp" | "site" | "bitrix" | "generico"
  > {
    return Promise.resolve("generico");
  }
}

@wrapper
export class WhatsappInterface {
  is_active(): Promise<boolean> {
    return Promise.resolve(false);
  }

  async send_template(
    { nome_template, id_user, components }: {
      nome_template: string;
      id_user: string;
      components: any;
    },
  ) {}
}

@wrapper
export class LivechatInterface {
  is_active(): Promise<boolean> {
    return Promise.resolve(false);
  }
}
