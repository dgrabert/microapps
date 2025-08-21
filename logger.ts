import { wrapper } from "./decorators.ts";

@wrapper
export class Logger {
  debug(p: { msg: string }): Promise<void> {
    console.log(`DEBUG: ${p.msg}`);
    return Promise.resolve();
  }
  info(p: { msg: string }): Promise<void> {
    console.log(`INFO: ${p.msg}`);
    return Promise.resolve();
  }
  warning(p: { msg: string }): Promise<void> {
    console.log(`WARN: ${p.msg}`);
    return Promise.resolve();
  }
  error(p: { msg: string }): Promise<void> {
    console.log(`ERROR: ${p.msg}`);
    return Promise.resolve();
  }
}
