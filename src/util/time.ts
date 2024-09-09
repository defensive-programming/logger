import type { HrTime } from '../_contracts/index.ts';
import { hrtime } from '../util/index.ts';

/**
 * Takes an HrTime tuple and converts it into a human-readable formatted
 * string in the format of `{sec}s {ms}ms`.
 */
export function formatTime([sec, nano]: HrTime): string {
  return `${sec}s ${nano / 1000000}ms`;
}

/**
 * Generates the current execution time.
 */
export function captureTimeNow(): string {
  return formatTime(hrtime());
}
