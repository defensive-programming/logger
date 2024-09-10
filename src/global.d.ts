import type { Shed } from './shed/Shed.ts';

declare global { // deno-lint-ignore no-var
  var $shed: Shed; // deno-lint-ignore no-var
  var ADZE_ENV: 'test' | 'dev';
}

export {}
