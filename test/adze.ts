import test from 'ava';
import { passesFilters } from '../src/conditions';
import adze, { defaults, isFinalLogData } from '../src';
import { Defaults, LogLevelDefinition } from '../src/_contracts';

globalThis.ADZE_ENV = 'dev';

test('create a new logger with defaults', (t) => {
  const log = adze();

  t.truthy(log);

  // Test the congruity of the default options
  const cfg = log.data.cfg as Defaults;

  // Test the congruity of the default log levels
  const testLevel = (
    { level, style, terminal, method, emoji }: LogLevelDefinition,
    {
      level: cfg_level,
      style: cfg_style,
      terminal: cfg_terminal,
      method: cfg_method,
      emoji: cfg_emoji,
    }: LogLevelDefinition
  ): void => {
    t.is(level, cfg_level);
    t.is(style, cfg_style);
    Array.isArray(terminal) ? t.deepEqual(terminal, cfg_terminal) : t.is(terminal, cfg_terminal);
    t.is(method, cfg_method);
    t.is(emoji, cfg_emoji);
  };

  Object.keys(cfg.logLevels).forEach((name) => {
    t.truthy(Object.keys(defaults.logLevels).includes(name));
    testLevel(cfg.logLevels[name], defaults.logLevels[name]);
  });

  // Test congruity of filters
  t.truthy(cfg.filters);
  t.is(cfg.filters.hideAll, defaults.filters.hideAll);
});

test('prevents log from printing when the log level is lowered', (t) => {
  const terminated = adze({ logLevel: 5 }).log('testing');
  t.truthy(terminated.log);
  t.truthy(terminated.render);
  t.falsy(terminated.printed);
});

test('prevents log from printing when in a test environment', (t) => {
  globalThis.ADZE_ENV = 'test';
  const terminated = adze().log('testing');
  t.truthy(terminated.log);
  t.truthy(terminated.render);
  t.falsy(terminated.printed);
  globalThis.ADZE_ENV = 'dev';
});

test('passesFilters correctly indicates that a log is allowed to print', (t) => {
  const { log } = adze({
    filters: {
      hideAll: true,
    },
  }).log('This is a test.');
  const data = log.data;

  if (isFinalLogData(data)) {
    if (passesFilters(data.cfg, data)) {
      t.fail();
    } else {
      t.pass();
    }
  } else {
    t.fail();
  }
});

test('hideAll global log filter prevents all logs printing', (t) => {
  const cfg = {
    filters: {
      hideAll: true,
    },
  };

  const log = adze(cfg).seal();

  const { printed: a_printed } = log().alert('This is an alert!');
  const { printed: e_printed } = log().error('This is an error!');
  const { printed: w_printed } = log().warn('This is a warn!');
  const { printed: i_printed } = log().info('This is an info!');
  const { printed: f_printed } = log().fail('This is a failure!');
  const { printed: s_printed } = log().success('This is a success!');
  const { printed: l_printed } = log().log('This is a log!');
  const { printed: d_printed } = log().debug('This is a debug!');
  const { printed: v_printed } = log().verbose('This is a verbose!');

  t.falsy(a_printed);
  t.falsy(e_printed);
  t.falsy(w_printed);
  t.falsy(i_printed);
  t.falsy(f_printed);
  t.falsy(s_printed);
  t.falsy(l_printed);
  t.falsy(d_printed);
  t.falsy(v_printed);
});

test('global filter excludes logs based on label', (t) => {
  const cfg = {
    filters: {
      label: {
        exclude: ['test', 'test2'],
      },
    },
  };

  const log = adze(cfg).seal();

  const { printed: a_printed } = log().alert('This is an alert!');
  const { printed: e_printed } = log().label('test').error('This is an error!');
  const { printed: w_printed } = log().warn('This is a warn!');
  const { printed: i_printed } = log().label('test').info('This is an info!');
  const { printed: f_printed } = log().fail('This is a failure!');
  const { printed: s_printed } = log().success('This is a success!');
  const { printed: l_printed } = log().label('test2').log('This is a log!');
  const { printed: d_printed } = log().label('test2').debug('This is a debug!');
  const { printed: v_printed } = log().verbose('This is a verbose!');

  t.truthy(a_printed);
  t.falsy(e_printed);
  t.truthy(w_printed);
  t.falsy(i_printed);
  t.truthy(f_printed);
  t.truthy(s_printed);
  t.falsy(l_printed);
  t.falsy(d_printed);
  t.truthy(v_printed);
});

test('global filter includes logs based on label', (t) => {
  const cfg = {
    filters: {
      label: {
        include: ['test', 'test2'],
      },
    },
  };

  const log = adze(cfg).seal();

  const { printed: a_printed } = log().alert('This is an alert!');
  const { printed: e_printed } = log().label('test').error('This is an error!');
  const { printed: w_printed } = log().warn('This is a warn!');
  const { printed: i_printed } = log().label('test').info('This is an info!');
  const { printed: f_printed } = log().fail('This is a failure!');
  const { printed: s_printed } = log().success('This is a success!');
  const { printed: l_printed } = log().label('test2').log('This is a log!');
  const { printed: d_printed } = log().label('test2').debug('This is a debug!');
  const { printed: v_printed } = log().verbose('This is a verbose!');

  t.falsy(a_printed);
  t.truthy(e_printed);
  t.falsy(w_printed);
  t.truthy(i_printed);
  t.falsy(f_printed);
  t.falsy(s_printed);
  t.truthy(l_printed);
  t.truthy(d_printed);
  t.falsy(v_printed);
});

test('global filter excludes logs based on namespace', (t) => {
  const cfg = {
    filters: {
      namespace: {
        exclude: ['testWOW'],
      },
    },
  };

  const log = adze(cfg).seal();

  const { printed: a_printed } = log().alert('This is an alert!');
  const { printed: e_printed } = log().ns('testWOW').error('This is an error!');
  const { printed: w_printed } = log().warn('This is a warn!');
  const { printed: i_printed } = log().ns('testWOW').info('This is an info!');
  const { printed: f_printed } = log().fail('This is a failure!');
  const { printed: s_printed } = log().success('This is a success!');
  const { printed: l_printed } = log().ns(['testWOW', 'test2']).log('This is a log!');
  const { printed: d_printed } = log().ns('test2').debug('This is a debug!');
  const { printed: v_printed } = log().verbose('This is a verbose!');

  t.truthy(a_printed);
  t.falsy(e_printed);
  t.truthy(w_printed);
  t.falsy(i_printed);
  t.truthy(f_printed);
  t.truthy(s_printed);
  t.falsy(l_printed);
  t.truthy(d_printed);
  t.truthy(v_printed);
});

test('global filter includes logs based on namespace', (t) => {
  const cfg = {
    filters: {
      namespace: {
        include: ['test'],
      },
    },
  };

  const log = adze(cfg).seal();

  const { printed: a_printed } = log().alert('This is an alert!');
  const { printed: e_printed } = log().ns('test').error('This is an error!');
  const { printed: w_printed } = log().warn('This is a warn!');
  const { printed: i_printed } = log().ns('test').info('This is an info!');
  const { printed: f_printed } = log().fail('This is a failure!');
  const { printed: s_printed } = log().success('This is a success!');
  const { printed: l_printed } = log().ns(['test', 'test2']).log('This is a log!');
  const { printed: d_printed } = log().ns('test2').debug('This is a debug!');
  const { printed: v_printed } = log().verbose('This is a verbose!');

  t.falsy(a_printed);
  t.truthy(e_printed);
  t.falsy(w_printed);
  t.truthy(i_printed);
  t.falsy(f_printed);
  t.falsy(s_printed);
  t.truthy(l_printed);
  t.falsy(d_printed);
  t.falsy(v_printed);
});
