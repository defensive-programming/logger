import { SharedPrinter } from './SharedPrinter.ts';
import type { LogRender, FinalLogData } from '../_contracts/index.ts';
import { applyChalkStyles, initialCaps } from '../util/index.ts';

export class NodePrinter extends SharedPrinter {
  // deno-lint-ignore no-explicit-any
  constructor(data: FinalLogData<any>) {
    super(data);
  }

  // ------- PRINT METHODS -------- //

  /**
   * The primary method for printing logs to the node console.
   */
  public printLog(): LogRender {
    const method = this.data.definition.method;
    const leader = this.fLeader();
    const meta = this.fMeta();

    const render_args =
      meta === '' ? [leader, ...this.data.args] : [leader, meta, ...this.data.args];

    return [method, render_args];
  }

  /**
   * The method for printing group logs to the node console.
   */
  public printGroup(): LogRender {
    const render_args = this.setupPrintGroup();
    return ['group', render_args];
  }

  /**
   * The method for printing collapsed group logs to the node console.
   */
  public printGroupCollapsed(): LogRender {
    const render_args = this.setupPrintGroup();
    return ['groupCollapsed', render_args];
  }

  /**
   * The method for printing stack traces to the node console.
   */
  public printTrace(): LogRender {
    const render = this.printLog();
    const args = render?.[1] ?? [];
    return ['trace', args];
  }

  /**
   * The method for ending a log group in the node console.
   */
  public printGroupEnd(): LogRender {
    return ['groupEnd', []];
  }

  /**
   * The method for printing a table to the node console.
   */
  public printTable(): LogRender {
    return ['table', this.data.args];
  }

  /**
   * The method for printing a dir style log to the node console.
   */
  public printDir(): LogRender {
    return ['dir', this.data.args];
  }

  /**
   * The method for printing a dirxml style log to the node console.
   */
  public printDirxml(): LogRender {
    return ['dirxml', this.data.args];
  }

  /**
   * This method formats a group style log based on the provided arguments.
   */
  private setupPrintGroup(): unknown[] {
    const partial_args = [this.fLeader()];
    return typeof this.data.args[0] === 'string'
      ? [...partial_args, this.data.args[0]]
      : partial_args;
  }

  // ------- PRINT FORMATTERS -------- //

  /**
   * Formats the leader of the log string. This contains the emoji if enabled,
   * the log level name, and the number of arguments being printed.
   */
  private fLeader(): string {
    const emoji = this.use_emoji ? this.fEmoji() : '';
    const padding = this.use_emoji ? 14 + emoji.length : 14;

    // If the leader length is greater than the padding, add a space to the end for pretty formatting
    const leaderRaw = `${emoji} ${this.fName()}(${this.data.args.length})`;
    const leader = leaderRaw.length >= padding ? `${leaderRaw} ` : leaderRaw;

    const paddedLeader = this.addPadding(leader, padding);

    // If the log instance is configured as unstyled, prevent applying chalk styles.
    if (this.data.cfg.unstyled) {
      return paddedLeader;
    }
    //
    return applyChalkStyles(
      paddedLeader,
      this.data.definition.terminal,
      this.data.cfg.terminalColorFidelity
    );
  }

  /**
   * Add spaces to the end of a log title to make them all align.
   */
  private addPadding(str: string, len: number): string {
    const diff = len - str.length;
    let padded = str;
    for (let i = 0; i <= diff; i += 1) {
      padded += ' ';
    }
    return padded;
  }

  /**
   * Adds the emoji to the log leader if enabled.
   */
  private fEmoji(): string {
    return ` ${this.data.definition.emoji ?? ''}`;
  }

  /**
   * Adds the log level name to the leader in initial caps.
   */
  private fName(): string {
    return initialCaps(this.data.definition.levelName ?? '');
  }

  /**
   * Formats the meta section of the log string which includes the
   * log namespace, the label, the timestamp from the timer, the count
   * from the counter, or the test result from any assertions if any of
   * these modifiers were applied to this log.
   */
  private fMeta(): string {
    return `${
      this.timestamp
    }${this.fNamespace()}${this.fLabel()}${this.fTime()}${this.fCount()}${this.fAssert()}${this.fTest()}`;
  }

  /**
   * Formats the time on the log string based on any time modifiers
   * that have been applied to this log.
   */
  private fTime(): string {
    const timeNow = this.data.timeNow;
    const timeEllapsed = this.data.label.timeEllapsed;
    const labelTxt = `${timeNow ?? timeEllapsed ?? ''}`;

    return labelTxt !== '' ? `(${this.use_emoji ? '⏱' : ''}${labelTxt}) ` : '';
  }

  /**
   * Formats the count on the log string based on any counter modifiers
   * that have been applied to this log.
   */
  private fCount(): string {
    const count = this.data.label.count;
    return count !== null ? `(Count: ${count})` : '';
  }

  /**
   * Formats the label on the log string based on the label
   * modifier applied to this log.
   */
  private fLabel(): string {
    return this.data.label.name ? `[${this.data.label.name}] ` : '';
  }

  /**
   * Adds indicator text to the log render when
   * the assertion fails.
   */
  private fAssert(): string {
    return this.data.assertion === false ? `${this.use_emoji ? '❌ ' : ''}Assertion failed:` : '';
  }

  /**
   * Adds indicator text to the log render when
   * the test expression passes.
   */
  public fTest(): string {
    return this.data.expression === true ? `${this.use_emoji ? '✅ ' : ''}Expression Passed:` : '';
  }
}
