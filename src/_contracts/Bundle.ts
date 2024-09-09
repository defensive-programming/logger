import type { BundledLog } from '../log/index.ts';

/**
 * Generates a new bundled log.
 */
// deno-lint-ignore no-explicit-any
export type Bundler = () => BundledLog<any>;

/**
 * Array of bundled logs.
 */
// deno-lint-ignore no-explicit-any
export type Bundle = BundledLog<any>[];
