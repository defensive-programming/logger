/* eslint-disable @typescript-eslint/no-namespace */
import type { Shed } from '../shed/Shed.ts';

declare global {
  interface globalThis {
    $shed?: Shed;
    ADZE_ENV?: 'test' | 'dev';
    ADZE_ENV_CONTEXT?: 'globalThis';
  }
}

/**
 * Class with various properties describing the current environment.
 */
export class Env {
  public readonly global: typeof globalThis;

  public readonly isBrowser: boolean;

  public _isChrome = false;

  public _isFirefox = false;

  public _isSafari = false;

  constructor() {
    this.global = globalThis;
    this.isBrowser = Env.isBrowser();
    if (Env.envIsWindow()) {
      this._isChrome = Env.isChrome();
      this._isFirefox = Env.isFirefox();
      this._isSafari = Env.isSafari();
    }
  }

  /**
   * Getter for identifying if the current environment is the Chrome browser.
   */
  public get isChrome(): boolean {
    return this._isChrome;
  }

  /**
   * Getter for identifying if the current environment is the Firefox browser.
   */
  public get isFirefox(): boolean {
    return this._isFirefox;
  }

  /**
   * Getter for identifying if the current environment is the Safari browser.
   */
  public get isSafari(): boolean {
    return this._isSafari;
  }

  /**
   * Static method that returns the environment's global context.
   */
  public static global = (): typeof globalThis => globalThis;

  /**
   * Static method that validates the current environment is `Window`.
   */
  public static isBrowser = (): boolean => typeof window !== 'undefined';

  /**
   * TypeGuard to determine if the env value is the Window object.
   */
  public static envIsWindow = (): boolean => Env.isBrowser();

  /**
   * Static method that validates the current environment is Chrome.
   */
  public static isChrome(): boolean {
    const _glbl = Env.global();
    if (Env.envIsWindow()) {
      return _glbl.navigator?.userAgent?.indexOf('Chrome') > -1;
    }
    return false;
  }

  /**
   * Static method that validates the current environment is Firefox.
   */
  public static isFirefox(): boolean {
    const _glbl = Env.global();
    if (Env.envIsWindow()) {
      return _glbl.navigator?.userAgent?.indexOf('Firefox') > -1;
    }
    return false;
  }

  /**
   * Static method that validates the current environment is Safari.
   */
  public static isSafari(): boolean {
    const _glbl = Env.global();
    if (Env.envIsWindow()) {
      return _glbl.navigator?.userAgent?.indexOf('Safari') > -1 && !Env.isChrome();
    }
    return false;
  }
}
