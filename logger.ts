import { wrapper } from "./decorators.ts";

@wrapper
export class Logger {
  debug(p: { msg: string }) {
    console.log(`DEBUG: ${p.msg}`);
    return Promise.resolve();
  }
  info(p: { msg: string }) {
    console.log(`INFO: ${p.msg}`);
    return Promise.resolve();
  }
  warning(p: { msg: string }) {
    console.log(`WARN: ${p.msg}`);
    return Promise.resolve();
  }
  error(p: { msg: string }) {
    console.log(`ERROR: ${p.msg}`);
    return Promise.resolve();
  }
}
