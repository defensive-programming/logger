import type { Bundle, Bundler } from '../_contracts/index.ts';
import { Printer } from '../printers/index.ts';
import { Env } from '../env/index.ts';
import { type Log, BundledLog } from '../log/index.ts';

/**
 * Bundles logs together by wrapping all subsequent logs in a Bundle callback
 * that curries them into an array. This bundle array can be used to recall and
 * filter logs without the need for a global `Shed`.
 *
 * **Example:**
 * ```javascript
 * import { adze, bundle, filterAll } from 'adze';
 *
 * const bundled = bundle(adze());
 * bundled.log("This is a log.");
 * const { log } = bundled.log("This is another log.");
 * filterAll(log.bundle); // -> reprints all "bundled" logs.
 * ```
 */
// deno-lint-ignore no-explicit-any
export function bundle(_log: Log<any> | (() => Log<any>)): Bundler {
  const bundle_arr = [] as Bundle;
  return () => {
    const log = typeof _log === 'function' ? _log() : _log;
    const bundled_log = new BundledLog(Printer, new Env(), bundle_arr).hydrate(log.data);
    bundle_arr.push(bundled_log);
    return bundled_log;
  };
}
