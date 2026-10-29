'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test'),
  assert = require('node:assert/strict'),
  fn = require('./');

describe('interpolate', () => {
  beforeEach(() => {
    process.env.AFS_TEST_A = 'alpha';
    process.env.AFS_TEST_B = 'beta';
    process.env.AFS_TEST_EMPTY = '';
  });

  afterEach(() => {
    delete process.env.AFS_TEST_A;
    delete process.env.AFS_TEST_B;
    delete process.env.AFS_TEST_EMPTY;
  });

  it('returns a string without variables as it is', () => {
    ['', 'plain', 'a: b\nc: d\n', '$ {A}', '{AFS_TEST_A}', '$AFS_TEST_A', '} {'].forEach((str) => assert.equal(fn(str), str));
  });

  it('treats a missing string as empty', () => {
    assert.equal(fn(), '');
    assert.equal(fn(null), '');
    assert.equal(fn(undefined), '');
  });

  it('fills in a variable', () => {
    assert.equal(fn('host: x-${AFS_TEST_A}'), 'host: x-alpha');
    assert.equal(fn('host: ${AFS_TEST_A}-x'), 'host: alpha-x');
    assert.equal(fn('host: x ${AFS_TEST_A} y'), 'host: x alpha y');
  });

  it('fills in every variable, in order, and the same variable twice', () => {
    assert.equal(fn('a: ${AFS_TEST_A}\nb: ${AFS_TEST_B}\nc: ${AFS_TEST_A}\n'), 'a: alpha\nb: beta\nc: alpha\n');
    assert.equal(fn('x ${AFS_TEST_A}${AFS_TEST_B} y'), 'x alphabeta y');
  });

  it('only fills in what is between ${ and the next }', () => {
    assert.equal(fn('a: }{ ${AFS_TEST_A}'), 'a: }{ alpha');
    assert.equal(fn('a: $${AFS_TEST_A}'), 'a: $alpha');
    assert.equal(fn('a: ${AFS_TEST_A} } ${AFS_TEST_B}'), 'a: alpha } beta');
  });

  it('drops a variable that is never closed, and everything after it', () => {
    assert.equal(fn('a: ${AFS_TEST_A'), 'a: ');
    assert.equal(fn('a: ${AFS_TEST_A} b: ${AFS_TEST_B'), 'a: alpha b: ');
  });

  it('throws for a variable that is not set', () => {
    assert.throws(() => fn('a: ${AFS_TEST_MISSING}'), { message: 'AFS_TEST_MISSING is not an environment variable' });
    assert.throws(() => fn('a: ${AFS_TEST_A} ${AFS_TEST_MISSING}'), { message: 'AFS_TEST_MISSING is not an environment variable' });
    assert.throws(() => fn('a: ${}'), { message: ' is not an environment variable' });
  });

  it('throws for a variable that is empty', () => {
    assert.throws(() => fn('a: ${AFS_TEST_EMPTY}'), { message: 'AFS_TEST_EMPTY is not an environment variable' });
  });

  it('keeps the whole string in front of the first value if it starts with a variable (as template2env did)', () => {
    assert.equal(fn('${AFS_TEST_A}'), '${AFS_TEST_A}alpha');
    assert.equal(fn('${AFS_TEST_A} and ${AFS_TEST_B}'), '${AFS_TEST_A} and ${AFS_TEST_B}alpha and beta');
  });
});
