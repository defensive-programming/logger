import { Shed } from '../shed/index.ts';
import { Env } from '../env/index.ts';
import type { ShedUserConfig } from '../_contracts/index.ts';

/**
 * A typeguard that indicates that a global Shed store exists.
 */
export function shedExists(store: Shed | undefined): store is Shed {
  return store !== undefined;
}
/**
 * Creates a new Shed instance in your environment's global context.
 */
export function createShed(config?: ShedUserConfig): Shed {
  const env = new Env();
  env.global.$shed = new Shed(env, config);
  return env.global.$shed;
}

/**
 * Removes the Shed from the environment's global context.
 */
export function removeShed(): void {
  Reflect.deleteProperty(globalThis, '$shed');
}
