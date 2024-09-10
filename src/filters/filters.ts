import type { LogRender, Collection, LogData, LevelFilter } from '../_contracts/index.ts';
import type { BaseLog } from '../log/index.ts';
import { formatLevels, isString } from '../util/index.ts';

/**
 * Filter a collection of logs by the namespace.
 */
export function filterNamespace(collection: Collection = [], ns: string[]): Collection {
  return filterCollection(collection, (log) => {
    const log_ns = log.namespace;
    if (log_ns) {
      // Loop over each log ns value and see if any match any ns value.
      return log_ns.map((val) => (isString(ns) ? val === ns : ns.includes(val))).includes(true);
    }
    return false;
  });
}

/**
 * Filter and render the collection of logs by the label.
 */
export function filterLabel(collection: Collection = [], lbl: string): Collection {
  return filterCollection(collection, (log) => log.label?.name === lbl);
}

/**
 * Filter the collection of logs by their log level.
 */
export function filterLevel(collection: Collection = [], levels: LevelFilter): Collection {
  return filterCollection(collection, (log) => {
    // Calculating the formatted levels for each log because they could have different config
    return formatLevels(levels, log.cfg).includes(log.level ?? Infinity);
  });
}

/**
 * Executes a callback on each value of a collection. The callback receives a
 * log data object for each log in the collection. If a truthy value is returned the
 * current log of the iteration will be added into a new collection. If a falsy value is
 * returned it will be omitted.
 */
export function filterCollection(
  collection: Collection,
  // deno-lint-ignore no-explicit-any
  cb: (log: LogData<any>) => boolean
): Collection {
  return collection.reduce((acc, log) => {
    const result = cb(log.data);
    return result ? acc.concat([log]) : acc;
  }, [] as Collection);
}

/**
 * If the provided log has been previously rendered, this function
 * re-renders it to the console.
 */
// deno-lint-ignore no-explicit-any
export function rerender(log: BaseLog<any>): void {
  if (log.render) {
    render(log.render);
  }
}

/**
 * Render a log to the console based on a log render object.
 */
export function render([method, args]: LogRender): void {
  console[method](...(args as unknown[]));
}
