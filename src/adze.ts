import type { Configuration, Constraints } from './_contracts/index.ts';
import { Log } from './log/index.ts';
import { Printer } from './printers/index.ts';
import { Env } from './env/index.ts';

/*
 * Planned features:
 *
 * - Select log levels optionally by name in listener creation.
 * - Analytics and Reporting support.
 * - Remote server for receiving and analyzing logs.
 * - Add easy functions for transporting logging data to various sources.
 *     - Write to a file.
 *     - Write to local storage.
 *     - Push to an API endpoint.
 */

/**
 * The entry point for creating Adze logs. This factory function can be used directly or configuration
 * can be provided and the result can be sealed into a new variable. This allows for multiple
 * logging instances with different configurations. Refer to the `seal()` modifier.
 *
 * **--- Default levels ---**
 *
 * + (0) alert
 * + (1) error
 * + (2) warn
 * + (3) info
 * + (4) fail
 * + (5) success
 * + (6) log
 * + (7) debug
 * + (8) verbose
 */
export function adze<C extends Constraints>(user_cfg: Configuration = {}): Log<C> {
  return new Log<C>(Printer, new Env(), user_cfg);
}
