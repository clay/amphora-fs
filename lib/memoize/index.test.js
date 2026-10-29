'use strict';

const { describe, it, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  memoize = require('./');

describe('memoize', () => {
  it('calls the function once per first argument', () => {
    const fn = mock.fn((a) => ({ a })),
      memoized = memoize(fn);

    assert.equal(memoized('x', 1), memoized('x', 2));
    assert.notEqual(memoized('y'), memoized('x'));
    assert.equal(fn.mock.callCount(), 2);
    assert.deepEqual(fn.mock.calls[0].arguments, ['x', 1]);
  });

  it('remembers undefined, null, false and 0', () => {
    [undefined, null, false, 0, ''].forEach((value) => {
      const fn = mock.fn(() => value),
        memoized = memoize(fn);

      assert.equal(memoized('a'), value);
      assert.equal(memoized('a'), value);
      assert.equal(fn.mock.callCount(), 1);
    });
  });

  it('does not remember a call that throws', () => {
    let attempts = 0;
    const memoized = memoize(() => {
      if (++attempts < 2) {
        throw new Error('first time');
      }
      return 'ok';
    });

    assert.throws(() => memoized('a'), /first time/);
    assert.equal(memoized('a'), 'ok');
  });

  it('tells keys of different types apart, like a Map', () => {
    const memoized = memoize((key) => ({ key })),
      keys = [1, '1', true, 'true', null, 'null', undefined, 'undefined', NaN, 0, '__proto__', 'constructor', {}, []];

    assert.equal(new Set(keys.map((key) => memoized(key))).size, keys.length);
    assert.equal(memoized(NaN), memoized(NaN));
    assert.equal(memoized(0), memoized(-0));
  });

  it('builds the key with a resolver, which gets every argument', () => {
    const fn = mock.fn((a, b) => [a, b]),
      memoized = memoize(fn, (a, b) => `${a}|${b}`);

    assert.equal(memoized('a', 'b'), memoized('a', 'b'));
    assert.notEqual(memoized('a', 'b'), memoized('a', 'c'));
    assert.equal(fn.mock.callCount(), 2);
  });

  it('keeps the results in `cache`, which can be cleared or replaced', () => {
    const fn = mock.fn(() => ({})),
      memoized = memoize(fn),
      first = memoized('a');

    assert.ok(memoized.cache instanceof Map);
    assert.equal(memoized.cache.get('a'), first);

    memoized.cache.clear();
    assert.notEqual(memoized('a'), first);

    memoized.cache = new Map([['a', 'seeded']]);
    assert.equal(memoized('a'), 'seeded');
  });

  it('works with any cache that has has, get and set', () => {
    const store = {},
      memoized = memoize(() => 'v');

    memoized.cache = { has: (k) => k in store, get: (k) => store[k], set: (k, v) => { store[k] = v; } };

    assert.equal(memoized('a'), 'v');
    assert.deepEqual(store, { a: 'v' });
    assert.equal(memoized('a'), 'v');
  });

  it('passes `this` on', () => {
    const memoized = memoize(function () {
      return this.name;
    });

    assert.equal(memoized.call({ name: 'me' }), 'me');
  });
});
