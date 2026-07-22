import config from "./deno.json" with { type: "json" };

/** Versao declarada no manifesto do pacote, unica fonte de verdade do SDK. */
export const SDK_VERSION: string = config.version;

const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(SDK_VERSION);
if (!match) {
  throw new Error(`Versao invalida no deno.json: ${SDK_VERSION}`);
}

/** Formato legado enviado ao backend no registro das funcoes. */
export const SDK_VERSION_TUPLE: [number, number, number] = [
  Number(match[1]),
  Number(match[2]),
  Number(match[3]),
];
