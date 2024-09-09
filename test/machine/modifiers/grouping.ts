import test from 'ava';
import adze, { JsonOutput } from '../../../src';

globalThis.ADZE_ENV = 'dev';

test('group log renders correctly', (t) => {
  const { log, render } = adze({ machineReadable: true }).group.success('Opening a log group.');

  t.truthy(log);
  if (render) {
    const [method, args] = render;
    t.is(method, 'info');
    t.is(args.length, 1);

    const parsed: JsonOutput = JSON.parse(args[0] as string);
    t.is(parsed.method, 'info');
    t.is(parsed.level, 5);
    t.is(parsed.levelName, 'success');
    t.is(parsed.groupAction, 'open');
    t.is(parsed.args.length, 1);
    t.is(parsed.args[0], 'Opening a log group.');
  } else {
    t.fail();
  }
});

test('group collapsed renders correctly', (t) => {
  const { log, render } = adze({ machineReadable: true }).groupCollapsed.success(
    'Opening a collapsed log group.'
  );

  t.truthy(log);
  if (render) {
    const [method, args] = render;
    t.is(method, 'info');
    t.is(args.length, 1);

    const parsed: JsonOutput = JSON.parse(args[0] as string);
    t.is(parsed.method, 'info');
    t.is(parsed.level, 5);
    t.is(parsed.levelName, 'success');
    t.is(parsed.groupAction, 'open');
    t.is(parsed.args.length, 1);
    t.is(parsed.args[0], 'Opening a collapsed log group.');
  } else {
    t.fail();
  }
});

test('group ends correctly', (t) => {
  const { log, render } = adze({ machineReadable: true }).groupEnd.success();

  t.truthy(log);
  if (render) {
    const [method, args] = render;
    t.is(method, 'info');
    t.is(args.length, 1);

    const parsed: JsonOutput = JSON.parse(args[0] as string);
    t.is(parsed.method, 'info');
    t.is(parsed.level, 5);
    t.is(parsed.levelName, 'success');
    t.is(parsed.groupAction, 'close');
    t.is(parsed.args.length, 0);
  } else {
    t.fail();
  }
});
