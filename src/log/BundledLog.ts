import type { Env } from '../env/index.ts';
import type { Printer } from '../printers/index.ts';
import type { Bundle, Configuration, Constraints } from '../_contracts/index.ts';
import { BaseLog } from './BaseLog.ts';

export class BundledLog<C extends Constraints> extends BaseLog<C> {
  private _bundle: Bundle;

  constructor(printer: typeof Printer, env: Env, bundle: Bundle, user_cfg?: Configuration) {
    super(printer, env, user_cfg);
    this._bundle = bundle;
  }

  public get bundle(): Bundle {
    return this._bundle;
  }
}
