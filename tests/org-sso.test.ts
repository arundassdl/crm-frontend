import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DEFAULT_CTRL_URL, getCtrlUrl } from '../src/lib/ctrl';

describe('CTRL SSO entry URL', () => {
  test('defaults to ctrl.evoq.app', () => {
    const prev = process.env.NEXT_PUBLIC_CTRL_URL;
    delete process.env.NEXT_PUBLIC_CTRL_URL;
    assert.strictEqual(getCtrlUrl(), `${DEFAULT_CTRL_URL}/`);
    if (prev !== undefined) process.env.NEXT_PUBLIC_CTRL_URL = prev;
  });

  test('honours NEXT_PUBLIC_CTRL_URL and normalizes trailing slash', () => {
    const prev = process.env.NEXT_PUBLIC_CTRL_URL;
    process.env.NEXT_PUBLIC_CTRL_URL = 'https://ctrl.example.test//';
    assert.strictEqual(getCtrlUrl(), 'https://ctrl.example.test/');
    if (prev === undefined) delete process.env.NEXT_PUBLIC_CTRL_URL;
    else process.env.NEXT_PUBLIC_CTRL_URL = prev;
  });
});
