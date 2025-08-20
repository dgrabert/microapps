import { MicroApp } from "./base.ts";

export function preprocessing<T>({ tier }: { tier: number }) {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.preprocessing[target.name] = {
      tier,
      fn: (obj: any) => (target.call(obj)),
    };

    return target;
  };
}

export function moderator<T>() {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.moderator[target.name] = {
      fn: (obj: any, params: object) => (target.call(obj, params)),
    };

    return target;
  };
}

type AIParam = {
  type: "string" | "boolean" | "enum";
  description: string;
};

type AiFunctionSettings = {
  description: string;
  whenToCall: string;
  params?: Record<string, AIParam>;
  auto_moderate?: boolean;
};

export function aiFunction(
  setup: <T extends MicroApp>(
    instance: T,
  ) => AiFunctionSettings | Promise<AiFunctionSettings>,
) {
  return function (target: any, _context: any) {
    MicroApp.__pipeline__.ai_function[target.name] = {
      setup,
      fn: (obj: any, params: object) => {
        console.log("executing", target.name, params);
        return target.call(obj, params);
      },
    };

    return target;
  };
}

export function postprocessing<T>({ tier }: { tier: number }) {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.postprocessing[target.name] = {
      tier,
      fn: (obj: any) => (target.call(obj)),
    };

    return target;
  };
}

export function exposed<T extends Function>() {
  return function (target: T, _context: any) {
    MicroApp.__pipeline__.exposed[target.name] = {
      fn: (obj: any, params: object) => (target.call(obj, params)),
    };

    return target;
  };
}

export function wrapper<T>(target: T, _context: any) {
  if (Deno.env.get("MOCK")) {
    return target;
  }
  const props = Object.getOwnPropertyNames(target.prototype);
  for (const prop of props) {
    if (prop === "constructor") {
      continue;
    }
    if (typeof target.prototype[prop] === "function") {
      target.prototype[prop] = function (params) {
        let resolve;
        let reject;

        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });

        const id = Math.round(Math.random() * 1_000_000);

        MicroApp.__calls__.push({
          context_id: id,
          reject,
          resolve,
        });

        MicroApp.__bridge__.call({
          context_id: id,
          microapp_name: target.prototype.constructor.name,
          function_name: prop,
          params: params,
          meta: this.__meta__,
        });

        return promise;
      };
    }
  }
  return target;
}
