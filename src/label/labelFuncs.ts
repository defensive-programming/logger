import type { Label } from './Label.ts';
import { Env } from '../env/index.ts';
import { shedExists } from '../util/index.ts';

/**
 * Attempts to get a label by the given name from the shed if it exists.
 */
export function getLabel(name: string): Label | undefined { // @ts-ignore: HACK:
  const shed = Env.global().$shed;
  if (shedExists(shed)) {
    return shed.getLabel(name);
  }
}

/**
 * Attempts to add a label to the global store if it exists.
 */
export function addLabel(label: Label): Label { // @ts-ignore: HACK:
  const shed = Env.global().$shed;
  if (shedExists(shed)) {
    shed.addLabel(label);
  }
  return label;
}
