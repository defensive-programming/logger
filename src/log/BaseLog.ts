import {
  Configuration,
  Constraints,
  Defaults,
  LogRender,
  LogTimestamp,
  MetaData,
  LogLevelDefinition,
  PrintMethod,
  LogData,
  FinalLogData,
  TerminatedLog,
} from '../_contracts';
import {
  isString,
  stacktrace,
  timestamp,
  toConsole,
  isFinalLogData,
  shedExists,
  defaultsDeep,
  cloneDeep,
  captureTimeNow,
} from '../util';
import { Label, addLabel, getLabel } from '../label';
import { defaults } from '../_defaults';
import { Env } from '../env';
import { Printer } from '../printers';
import { allowed, parseFilterLevels } from '../conditions';

export class BaseLog<C extends Constraints> {
  /**
   * The Printer class constructor.
   */
  protected Printer: typeof Printer;

  /**
   * Instance of the Env class.
   */
  protected env: Env = new Env();

  /**
   * The Adze log configuration merged with defaults.
   */
  protected cfg: Defaults;

  /**
   * The level of this log instance.
   */
  private _level: number | null = null;

  /**
   * The log level definition selected for this log
   * after it has been terminated.
   */
  private definition: LogLevelDefinition | null = null;

  /**
   * Arguments passed into a terminating method.
   */
  private args: unknown[] | null = null;

  /**
   * The log render after this log has been terminated.
   */
  private _render: LogRender | null = null;

  /**
   * The timestamp object generated when this log has been terminated.
   */
  private _timestamp: LogTimestamp | null = null;

  /**
   * The stacktrace of the log when it has been terminated.
   */
  private stacktrace: string | null = null;

  /**
   * The namespaces assigned to this log.
   */
  private _namespaceVal: C['allowedNamespaces'][] | null = null;

  /**
   * The label instance assigned to this log.
   */
  private _labelVal: Label | null = null;

  /**
   * The time ellapsed when this log was terminated.
   */
  private timeNowVal: string | null = null;

  /**
   * Queue of modifiers applied to this log instance.
   * These will be executed in order when the log is terminated.
   */
  protected modifierQueue: Array<(ctxt: BaseLog<C>) => void> = [];

  /**
   * The function used to generate a log render when
   * the log is terminated.
   */
  private printer: PrintMethod = 'printLog';

  /**
   * Meta data attached to this log instance through the
   * meta modifier. This is retrievable in log listeners.
   */
  private metaData: MetaData = {};

  // ======================================
  //   Flags
  // ======================================

  /**
   * The result of the expression evaluated from
   * the assertion modifier. If this value is false,
   * the log will print the provided message denoting
   * the failure of the assertion.
   */
  private assertion: boolean | undefined;

  /**
   * The result of the expression evaluated from
   * the assertion modifier. If this value is false,
   * the log will print the provided message denoting
   * the failure of the assertion.
   */
  private expression: boolean | undefined;

  /**
   * Flag which tells the log instance to ignore global filter.
   */
  private isOutstand = false;

  /**
   * Flag which tells the log instance to skip rendering.
   */
  private isSilent = false;

  /**
   * Flag which indicates if the log is allowed to print to the console.
   */
  private printed = false;

  /**
   * Flag which tells the log instance to add the
   * MDC context to the log render arguments.
   */
  private dumpContext = false;

  /**
   * Flag which tells the log instance to render the
   * timestamp.
   */
  private showTimestamp = false;

  constructor(printer: typeof Printer, env: Env, user_cfg?: Configuration) {
    this.Printer = printer;
    this.env = env;

    // First merge our user config with our defaults
    const cfg = user_cfg ? (defaultsDeep(user_cfg, defaults) as Defaults) : defaults;

    // Now check if global overrides exist and apply them over top of our configuration
    const shed = env.global.$shed;
    const with_overrides =
      shedExists(shed) && shed.hasOverrides ? (defaultsDeep(shed.overrides, cfg) as Defaults) : cfg;

    // Now we'll pre-parse our filter levels in the config for performance
    this.cfg = parseFilterLevels(with_overrides);

    // Apply our global meta data to the log
    if (this.cfg.meta) {
      this.metaData = this.cfg.meta;
    }
  }

  /**
   * Getter for retrieving the level from the instance.
   */
  public get level(): number | null {
    return this._level;
  }

  /**
   * Getter for retrieving the log render from the instance.
   */
  public get render(): LogRender | null {
    return this._render;
  }

  /**
   * Getter shortcut for retrieving MDC context from the log instance.
   */
  public get context(): MetaData {
    return this._labelVal?.getContext() ?? {};
  }

  // ======================================
  //   Terminating Methods (return void)
  // ======================================

  /**
   * Terminates the log at the *alert* level.
   *
   * **Default Level = 0**
   *
   * This level is useful for calling alert to
   * important information and lives at the lowest level.
   *
   * You should use this sparingly since it's level is lower
   * than error.
   *
   * This is a non-standard API.
   */
  public alert(...args: unknown[]): TerminatedLog<C, this> {
    return this.logMethod('alert', args);
  }

  /**
   * Terminates the log at the *error* level.
   *
   * **Default Level = 1**
   *
   * Use this for logging fatal errors or errors that
   * impact functionality of your application.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/error)
   */
  public error(...args: unknown[]): TerminatedLog<C, this> {
    return this.logMethod('error', args);
  }

  /**
   * Terminates the log at the *warning* level.
   *
   * **Default Level = 2**
   *
   * Use this for logging issues that may impact
   * app performance in a less impactful way than
   * an error.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/warn)
   */
  public warn(...args: unknown[]): TerminatedLog<C, this> {
    return this.logMethod('warn', args);
  }

  /**
   * Terminates the log at the *info* level.
   *
   * **Default Level = 3**
   *
   * Use this for logging general insights into your
   * application. This level does not indicate any
   * problems.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/info)
   */
  public info(...args: unknown[]): TerminatedLog<C, this> {
    return this.logMethod('info', args);
  }

  /**
   * Terminates the log at the *fail* level.
   *
   * **Default Level = 4**
   *
   * Use this for logging network communication errors
   * that do not break your application.
   *
   * This is a non-standard API.
   */
  public fail(...args: unknown[]): TerminatedLog<C, this> {
    return this.logMethod('fail', args);
  }

  /**
   * Terminates the log at the *success* level.
   *
   * **Default Level = 5**
   *
   * Use this for logging successful network communication.
   *
   * This is a non-standard API.
   */
  public success(...args: unknown[]): TerminatedLog<C, this> {
    return this.logMethod('success', args);
  }

  /**
   * Terminates the log at the *log* level.
   *
   * **Default Level = 6**
   *
   * Use this for general logging that doesn't apply
   * to any of the lower levels.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/log)
   */
  public log(...args: unknown[]): TerminatedLog<C, this> {
    // console.log('MODIFIER QUEUE', this.modifierQueue);
    return this.logMethod('log', args);
  }

  /**
   * Terminates the log at the *debug* level.
   *
   * **Default Level = 7**
   *
   * Use this for logging information that you typically
   * do not want to see unless you are debugging a problem
   * with your application. This is typically hidden by
   * default.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/debug)
   */
  public debug(...args: unknown[]): TerminatedLog<C, this> {
    return this.logMethod('debug', args);
  }

  /**
   * Terminates the log at the *verbose* level.
   *
   * **Default Level = 8**
   *
   * Use this for logging extremely detailed debugging
   * information. Use this level when the values you are
   * logging are granular enough that they are no longer
   * easily human readable.
   *
   * This is a non-standard API.
   */
  public verbose(...args: unknown[]): TerminatedLog<C, this> {
    return this.logMethod('verbose', args);
  }

  /**
   * Terminates the log at the provided custom log level.
   *
   * Custom log levels are defined within the Adze configuration object
   * under the `custom_levels` property.
   *
   * This is a non-standard API.
   */
  public custom(level_name: string, ...args: unknown[]): TerminatedLog<C, this> {
    return this.customMethod(level_name, args);
  }

  /**
   * Following the MDC (Mapped Diagnostic Context) pattern this method enables you to create
   * a thread for adding context from different scopes before finally terminating the log.
   *
   * In order to create a thread, this log must specify a label that will be used to link the
   * context and your environment must have a **shed** created.
   *
   * **Example:**
   * ```typescript
   * import { adze, createShed } from 'adze';
   *
   * const shed = createShed();
   *
   * // Creating a shed listener is a great way to get meta data from your
   * // threaded logs to write to disk or pass to another plugin, library,
   * // or service.
   * shed.addListener([1,2,3,4,5,6,7,8], (log) => {
   *   // Do something with `log.context.added` or `log.context.subtracted`.
   * });
   *
   * function add(a, b) {
   *   const answer = a + b;
   *   adze().label('foo').thread('added', { a, b, answer });
   *   return answer;
   * }
   *
   * function subtract(x, y) {
   *   const answer = x - y;
   *   adze().label('foo').thread('subtracted', { x, y, answer });
   *   return answer;
   * }
   *
   * add(1, 2);
   * subtract(4, 3);
   *
   * adze().label('foo').dump.info('Results from our thread');
   * // Info => Results from our thread, { a: 1, b: 2, answer: 3 }, { x: 4, y: 3, answer: 1 }
   *
   * ```
   *
   * This is a non-standard API.
   */
  public thread<T>(key: string, value: T): void {
    // Check if the log has a label. If not, console.warn the user.
    // If the log has a label, attach the context to the label.
    this.runModifierQueue();
    if (this._labelVal) {
      this._labelVal.addContext(key, value);
    } else {
      console.warn('Thread context was not added! Threads must have a label.');
    }
  }

  /**
   * Closes a thread assigned to the log by clearing the context values.
   *
   * This is a non-standard API.
   */
  public close(): void {
    this.runModifierQueue();
    if (this._labelVal) {
      this._labelVal.clearContext();
    }
  }

  /**
   * Alias for console.clear().
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/clear)
   */
  public clear(): void {
    console.clear();
  }

  /**
   * Alias for clear() which is an alias for console.clear().
   *
   * This is a non-standard API.
   */
  public clr(): void {
    this.clear();
  }

  // =============================
  //   MODIFIERS
  // =============================

  /**
   * Adds to the log count for log instances that share this log's label.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/count)
   */
  public get count(): this {
    return this.modifier((ctxt) => {
      if (ctxt._labelVal) {
        ctxt._labelVal.addCount();
      }
    });
  }

  /**
   * Resets the count for the log instances that share this log's label.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/countReset)
   */
  public get countReset(): this {
    return this.modifier((ctxt) => {
      if (ctxt._labelVal) {
        ctxt._labelVal.resetCount();
      }
    });
  }

  /**
   * Unsets the count for the log instances that share this log's label.
   *
   * This is a non-standard method.
   */
  public get countClear(): this {
    return this.modifier((ctxt) => {
      if (ctxt._labelVal) {
        ctxt._labelVal.clearCount();
      }
    });
  }

  /**
   * Instructs the log terminator to add the key/value pairs from the
   * thread context to the console output.
   *
   * This is a non-standard API.
   */
  public get dump(): this {
    return this.modifier((ctxt) => {
      ctxt.dumpContext = true;
    });
  }

  /**
   * Assign meta data to this log instance that is meant to be
   * retrievable in a log listener or from a `log.data()` dump.
   *
   * This is a non-standard API.
   */
  public meta<T>(key: string, val: T): this;
  public meta<KV extends [string, any]>(...[key, val]: KV): this;
  public meta(key: string, val: unknown): this {
    return this.modifier((ctxt) => {
      ctxt.metaData[key] = val;
    });
  }

  /**
   * Instructs this log to print in the dir format. Typically this is useful
   * for rendering deeply nested objects in the console.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/dir)
   */
  public get dir(): this {
    return this.modifier((ctxt) => {
      ctxt.printer = 'printDir';
    });
  }

  /**
   * Instructs this log to print in the dirxml format. Typically this is useful
   * for rendering HTML/DOM or XML Elements in the console.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/dirxml)
   */
  public get dirxml(): this {
    return this.modifier((ctxt) => {
      ctxt.printer = 'printDirxml';
    });
  }

  /**
   * Instructs this log to print its argument in a table format.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/table)
   */
  public get table(): this {
    return this.modifier((ctxt) => {
      ctxt.printer = 'printTable';
    });
  }

  /**
   * This modifier method makes the log ignore the global filter.
   * eg.,
   * if global filter out warn level logs, for the loggers who adopt this modifier with using warn method
   * will still eligible to be printed.
   */
  public get standout(): this {
    return this.modifier((ctxt) => {
      ctxt.isOutstand = true;
    });
  }

  /**
   * This modifier method allows the log to execute normally but
   * prevent it from printing to the console.
   */
  public get silent(): this {
    return this.modifier((ctxt) => {
      ctxt.isSilent = true;
    });
  }

  /**
   * Starts a log group.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/group)
   */
  public get group(): this {
    return this.modifier((ctxt) => {
      ctxt.printer = 'printGroup';
    });
  }

  /**
   * Starts a log group that is collapsed by default.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/groupCollapsed)
   */
  public get groupCollapsed(): this {
    return this.modifier((ctxt) => {
      ctxt.printer = 'printGroupCollapsed';
    });
  }

  /**
   * Ends the most recently opened log group.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/groupEnd)
   */
  public get groupEnd(): this {
    return this.modifier((ctxt) => {
      ctxt.printer = 'printGroupEnd';
    });
  }

  /**
   * Adds a label to the log. Label's can be used for log identification
   * and grouping. Label's also link log instances together.
   *
   * This is a non-standard API, but it replaces the need to provide
   * a label to `count` or `time`.
   */
  public label(name: string): this {
    return this.prependModifier((ctxt) => {
      ctxt._labelVal = addLabel(getLabel(name) ?? new Label(name));
      // console.log('Running label modifier!', ctxt);
    });
  }

  /**
   * Adds a namespace to the log. Namespace's are primarily useful
   * for grouping logs together. Multiple calls to namespace are
   * additive in nature.
   *
   * This is a non-standard API.
   */
  public namespace(ns: C['allowedNamespaces'][]): this;
  public namespace(...rest: C['allowedNamespaces'][]): this;
  public namespace(
    ns: C['allowedNamespaces'] | C['allowedNamespaces'][],
    ...rest: C['allowedNamespaces'][]
  ): this {
    return this.modifier((ctxt) => {
      const namespace = isString(ns) ? [ns, ...rest] : ns;
      ctxt._namespaceVal = [...(ctxt._namespaceVal ?? []), ...namespace];
    });
  }

  /**
   * An alias for `namespace()`.
   *
   * This is a non-standard API.
   */
  public ns(ns: C['allowedNamespaces'][]): this;
  public ns(...rest: C['allowedNamespaces'][]): this;
  public ns(
    ns: C['allowedNamespaces'] | C['allowedNamespaces'][],
    ...rest: C['allowedNamespaces'][]
  ): this {
    return this.namespace(ns as string, ...rest);
  }

  /**
   * Prints a stacktrace along with the log.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/trace)
   */
  public get trace(): this {
    return this.modifier((ctxt) => {
      ctxt.printer = 'printTrace';
    });
  }

  /**
   * Prints a log warning that the assertion failed if the assertion is false.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/console/assert)
   */
  public assert(assertion: boolean): this {
    return this.modifier((ctxt) => {
      ctxt.assertion = assertion;
    });
  }

  /**
   * Allows the log to print if the expression is true.
   *
   * This is a non-standard method.
   */
  public test(expression: boolean): this {
    return this.modifier((ctxt) => {
      ctxt.expression = expression;
    });
  }

  /**
   * Starts a timer associated with this log's *label*. This will do nothing if
   * this log has no label.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/time).
   */
  public get time(): this {
    return this.modifier((ctxt) => {
      if (ctxt._labelVal) {
        ctxt._labelVal.startTime();
      }
    });
  }

  /**
   * Modifies the log render to show the current high-resolution real time.
   *
   * This is a non-standard method.
   */
  public get timeNow(): this {
    return this.modifier((ctxt) => {
      ctxt.timeNowVal = captureTimeNow();
    });
  }

  /**
   * Stops a timer that was previously started by calling time() on a *labeled* log. Calculates the
   * difference between the start time and when this method was called. This then
   * modifies the log render to show the time difference. This will do nothing if the *label* does
   * not exist.
   *
   * MDN API Docs [here](https://developer.mozilla.org/en-US/docs/Web/API/Console/timeEnd).
   */
  public get timeEnd(): this {
    return this.modifier((ctxt) => {
      if (ctxt._labelVal) {
        ctxt._labelVal.endTime();
      }
    });
  }

  /*
    ! console.timeLog() is purposefully omitted from this API.

    timeLog() is a useless method within the Adze API. The same effect can be
    accomplished by created a new log with the same label.
  */

  /**
   * This modifier method tells the log to render a timestamp.
   *
   * This is a non-standard API.
   */
  public get timestamp(): this {
    return this.modifier((ctxt) => {
      ctxt.showTimestamp = true;
    });
  }

  // ==============================
  //   Private Methods
  // ==============================

  /**
   * Queues a modifier method for execution when the log is terminated.
   */
  private modifier(func: (ctxt: BaseLog<C>) => void): this {
    this.modifierQueue = this.modifierQueue.concat([func]);
    return this;
  }

  /**
   * Queues a modifier method for execution at the beginning of the queue when the log is terminated.
   * This is used to ensure that labels are applied before modifiers that use labels are executed.
   */
  private prependModifier(func: (ctxt: BaseLog<C>) => void): this {
    this.modifierQueue = [func].concat(this.modifierQueue);
    return this;
  }

  /**
   * Executes all of the log modifier functions within the queue.
   */
  private runModifierQueue(): void {
    this.modifierQueue.forEach((func) => func(this));
  }

  // ===================================
  //   Private Methods for Terminators
  // ===================================

  /**
   * Generates a terminating log method the specified log level name.
   */
  private logMethod(levelName: string, args: unknown[]): TerminatedLog<C, this> {
    return this.terminate(this.getDefinition('logLevels', levelName), args);
  }

  /**
   * Generates a terminating log method that enables the user to specify a custom
   * log level by key as the format for the log.
   */
  private customMethod(lvlName: string, args: unknown[]): TerminatedLog<C, this> {
    return this.terminate(this.getDefinition('customLevels', lvlName), args);
  }

  /**
   * Gets the log level definition from the log configuration.
   */
  private getDefinition(
    type: 'logLevels' | 'customLevels',
    levelName: string
  ): LogLevelDefinition | undefined {
    const definition = this.cfg[type][levelName];
    return definition ? { ...definition, levelName } : undefined;
  }

  /**
   * The primary logic for terminating log methods.
   */
  private terminate(def: LogLevelDefinition | undefined, args: unknown[]): TerminatedLog<C, this> {
    if (def) {
      // Apply modifiers in the proper order.
      this.runModifierQueue();

      // Save values to this log instance for later recall
      this.args = args;
      this._level = def.level;
      this.definition = def;
      this._timestamp = timestamp();
      this.stacktrace = this.cfg.captureStacktrace ? stacktrace() : null;

      // Set this log data to a variable for type checking
      const log_data = this.data;

      if (isFinalLogData(log_data)) {
        // Render the log
        this._render = new Printer(log_data)[this.printer]();

        // Evaluates if this log can print
        this.printed = allowed(log_data) && this.evalPasses();

        // Attempt to print the render to the console / terminal
        if (this.printed) {
          toConsole(this._render);
        }

        // Cache the log
        this.store();

        // Fire the log listeners
        this.fireListeners(log_data, this._render, this.printed);

        // Return the terminated log object with a render
        return { log: this, render: this._render, printed: this.printed };
      }
    }

    // Return the terminated log object unrendered
    return { log: this, render: null, printed: false };
  }

  /**
   * Check if any assertions or expressions pass for this log to terminate.
   */
  private evalPasses(): boolean {
    if (this.assertion !== undefined && this.expression !== undefined) {
      console.warn(
        'You have declared both an assertion and test on the same log. Please only declare one or nefarious results may occur.'
      );
      return true;
    }
    if (this.assertion !== undefined) {
      return this.assertion === false;
    }
    if (this.expression !== undefined) {
      return this.expression === true;
    }
    return true;
  }

  // ===================================
  //   Log Events
  // ===================================

  /**
   * Stores this log in the Shed if the Shed exists.
   */
  private store(): void {
    const shed = this.env.global.$shed;
    if (shedExists(shed)) {
      shed.store(this);
    }
  }

  /**
   * Fires listeners for this log instance if a Shed exists.
   */
  private fireListeners(data: FinalLogData<C>, render: LogRender | null, printed: boolean): void {
    const shed = this.env.global.$shed;
    if (shedExists(shed)) {
      shed.fireListeners(data, render, printed);
    }
  }

  // ===================================
  //   Generate Log Data
  // ===================================

  /**
   * Creates a slimmed down object comprised of data from a log.
   */
  public get data(): LogData<C> | FinalLogData<C> {
    const values: LogData<C> = {
      cfg: cloneDeep(this.cfg),
      level: this._level,
      definition: this.definition ? { ...this.definition } : null,
      args: this.args ? [...this.args] : null,
      timestamp: this._timestamp ? { ...this._timestamp } : null,
      stacktrace: this.stacktrace,
      namespace: this._namespaceVal ? [...this._namespaceVal] : null,
      label: {
        name: this._labelVal?.name ?? null,
        timeEllapsed: this._labelVal?.timeEllapsed ?? null,
        count: this._labelVal?.count ?? null,
      },
      assertion: this.assertion,
      expression: this.expression,
      dumpContext: this.dumpContext,
      isSilent: this.isSilent,
      isOutstand: this.isOutstand,
      printed: this.printed,
      showTimestamp: this.showTimestamp,
      timeNow: this.timeNowVal,
      meta: { ...this.metaData },
      context: { ...this.context },
      modifierQueue: [...this.modifierQueue],
    };
    return values;
  }

  /**
   * Hydrate this log's properties from a log data object.
   */
  public hydrate(data: LogData<C> | FinalLogData<C>): this {
    this.cfg = cloneDeep(data.cfg);
    this._level = data.level;
    this.definition = data.definition ? { ...data.definition } : null;
    this.args = data.args ? [...data.args] : null;
    this._timestamp = data.timestamp ? { ...data.timestamp } : null;
    this.stacktrace = data.stacktrace;
    this._namespaceVal = data.namespace ? [...data.namespace] : null;
    this._labelVal = this.resolveLabel(data);
    this.assertion = data.assertion;
    this.expression = data.expression;
    this.dumpContext = data.dumpContext;
    this.isOutstand = data.isOutstand;
    this.isSilent = data.isSilent;
    this.printed = data.printed;
    this.showTimestamp = data.showTimestamp;
    this.timeNowVal = data.timeNow;
    this.metaData = { ...data.meta };
    this.modifierQueue = [...data.modifierQueue];

    return this;
  }

  /**
   * Returns the label from the store if it exists by the given name.
   * If it's not in the store, generate a new log with the provided data
   * properties. If the label name is null in the data, return null.
   */
  private resolveLabel(data: LogData<C> | FinalLogData<C>): Label | null {
    if (data.label.name) {
      const stored_label = getLabel(data.label.name) ?? null;
      if (stored_label) {
        return stored_label;
      }
      return new Label(data.label.name, data.context, data.label.count, data.label.timeEllapsed);
    }
    return null;
  }
}
