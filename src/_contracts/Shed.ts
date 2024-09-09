import type { Label } from '../label/index.ts';
import type { Defaults, Configuration, LogRender, LogData } from './index.ts';
import type { FinalLogData } from './Log.ts';

export type LabelMap = Map<string, Label>;

export type ListenerLocations = Array<[number, number]>;

export type ListenerBuckets = Map<number, ListenerBucket>;

export type ListenerBucket = Map<number, ListenerCallback>;

export type ListenerCallback = (
  // deno-lint-ignore no-explicit-any
  LogData: LogData<any> | FinalLogData<any>,
  render: LogRender | null,
  printed: boolean
) => void;

export interface ShedConfig {
  cacheLimit: number;
  shouldUseStrictExclude: boolean;
  globalCfg: Defaults | null;
}

export interface ShedUserConfig extends Partial<Omit<ShedConfig, 'globalCfg'>> {
  globalCfg?: Configuration | null;
}

export interface LabelData {
  name: string | null;
  timeEllapsed: string | null;
  count: number | null;
}
