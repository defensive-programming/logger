import type { LevelFilter, Collection } from '../_contracts/index.ts';
import {
  render,
  rerender,
  filterCollection,
  filterLabel,
  filterLevel,
  filterNamespace,
} from '../filters/index.ts';
import type { Shed } from './Shed.ts';
import type { Env } from '../env/index.ts';

/**
 * This class wraps utility functions for use in the global context. These will mostly be
 * useful for manual browser debugging purposes.
 */
export class Tools {
  /**
   * Reference to the Shed instance.
   */
  private shed: Shed;

  /**
   * Instance of the Env class.
   */
  private env: Env;

  /**
   * Pass-through alias for the render function.
   */
  public render = render;

  /**
   * Pass-through alias for the rerender function.
   */
  public rerender = rerender;

  /**
   * Pass-through alias for the filterCollection function.
   */
  public filterCollection = filterCollection;

  /**
   * Pass-through alias for the filterLabel function.
   */
  public filterLabel = filterLabel;

  /**
   * Pass-through alias for the filterLevel function.
   */
  public filterLevel = filterLevel;

  /**
   * Pass-through alias for the filterNamespace function.
   */
  public filterNamespace = filterNamespace;

  constructor(env: Env, shed: Shed) {
    this.shed = shed;
    this.env = env;
  }

  /**
   * Shortcut method for rendering a level filtered collection from the Shed cache.
   */
  public renderCache(filter: LevelFilter): Collection {
    const filtered = this.shed.getCollection(filter); // @ts-ignore: HACK:
    if (this.env.global.ADZE_ENV !== 'dev') {
      filtered.forEach(rerender);
    }
    return filtered;
  }

  /**
   * Shortcut method for rendering a level and namespace filtered collection from the Shed cache.
   */
  public renderNamespace(filter: LevelFilter, ...ns: string[]): Collection {
    const filtered = this.filterNamespace(this.shed.getCollection(filter), ns); // @ts-ignore: HACK:
    if (this.env.global.ADZE_ENV !== 'dev') {
      filtered.forEach(rerender);
    }
    return filtered;
  }

  /**
   * Shortcut method for rendering a level and label filtered collection from the Shed cache.
   */
  public renderLabel(filter: LevelFilter, label: string): Collection {
    const filtered = this.filterLabel(this.shed.getCollection(filter), label); // @ts-ignore: HACK:
    if (this.env.global.ADZE_ENV !== 'dev') {
      filtered.forEach(rerender);
    }
    return filtered;
  }
}
