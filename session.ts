// Re-exporta MicroappSession de base.ts para manter backward compatibility.
// A classe está definida em base.ts para evitar import circular com decorators.ts.
export { MicroappSession } from "./base.ts";
