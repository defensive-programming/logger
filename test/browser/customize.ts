// eslint-disable-next-line @typescript-eslint/no-var-requires
const browserEnv = require('browser-env');
import test from 'ava';
import adze, { defaults } from '../../src';

// Simulate the browser environment for testing
browserEnv();
// Our global context is the window not global
globalThis.ADZE_ENV = 'dev';

test('renders a custom log', (t) => {
  const style =
    'padding-right: 26px; border-color: 1px solid red; color: white; border-color: blue;';
  const { log, render } = adze({
    customLevels: {
      custom: {
        level: 1,
        emoji: '🤪',
        method: 'log',
        terminal: ['bgCyanBright', 'cyan'],
        style,
      },
    },
  }).custom('custom', 'This is a custom log.');
  t.truthy(log);

  if (render) {
    const [method, args] = render;
    t.is(method, 'log');
    t.is(args[0], ' %c Custom(1)');
    t.is(args[1], defaults.baseStyle + style);
    t.is(args[2], 'This is a custom log.');
  } else {
    t.fail();
  }
});

test('renders a custom log with emoji', (t) => {
  const style =
    'padding-right: 26px; border-color: 1px solid red; color: white; border-color: blue;';
  const { log, render } = adze({
    useEmoji: true,
    customLevels: {
      custom: {
        level: 1,
        emoji: '🤪',
        method: 'log',
        terminal: ['bgCyanBright', 'cyan'],
        style,
      },
    },
  }).custom('custom', 'This is a custom log.');
  t.truthy(log);

  if (render) {
    const [method, args] = render;
    t.is(method, 'log');
    t.is(args[0], ' %c 🤪 Custom(1)');
    t.is(args[1], defaults.baseStyle + style);
    t.is(args[2], 'This is a custom log.');
  } else {
    t.fail();
  }
});

// =========================
// ALTERED BASE STYLE
// =========================

test('renders a log with altered base style', (t) => {
  const baseStyle =
    'font-size: 12px; font-weight: normal; border-radius: 0 5px 5px 0; border-width: 2px; border-style: dashed;';
  const t_log = adze({
    baseStyle,
  }).log('testing');
  t.truthy(t_log.log);

  if (t_log.render) {
    const [method, args] = t_log.render;
    t.is(method, 'log');
    t.is(args[0], ' %c Log(1)');
    t.is(args[1], baseStyle + defaults.logLevels.log.style);
    t.is(args[2], 'testing');
  } else {
    t.fail();
  }
});

// =========================
// UNSTYLED FOR STDOUT
// =========================

test('renders an unstyled log', (t) => {
  const unstyled = adze({ unstyled: true }).label('unstyled').log('This log should have no style.');

  t.truthy(unstyled.log);

  if (unstyled.render) {
    const [method, args] = unstyled.render;
    t.is(method, 'log');
    t.is(args[0], '  Log(1)');
    t.is(args[1], '[unstyled] ');
    t.is(args[2], 'This log should have no style.');
  }
});
