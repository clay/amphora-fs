'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('path'),
  fn = require('./'),
  { makeTmpDir, writeFiles } = require('../../test/helpers/tmp');

describe('tryRequire', () => {
  let req;

  beforeEach(() => {
    req = mock.fn();
    req.resolve = mock.fn();
    fn.setRequire(req);
    fn.cache.clear();
  });

  afterEach(() => fn.setRequire(require));

  it('returns undefined if file does not exist', () => {
    req.resolve.mock.mockImplementation(() => {
      throw new Error('nope');
    });

    assert.equal(fn('some-path'), undefined);
  });

  it('requires file if it exists', () => {
    req.resolve.mock.mockImplementation(() => 'some-path');
    req.mock.mockImplementation(() => 'hi');

    assert.equal(fn('some-path'), 'hi');
    assert.deepEqual(req.mock.calls[0].arguments, ['some-path']);
  });

  it('remembers the result, including that a file does not exist', () => {
    req.resolve.mock.mockImplementation(() => {
      throw new Error('nope');
    });

    assert.equal(fn('some-path'), undefined);
    assert.equal(fn('some-path'), undefined);
    assert.equal(req.resolve.mock.callCount(), 1);
  });

  describe('with the real require', () => {
    let tmp;

    beforeEach(() => {
      fn.setRequire(require);
      tmp = makeTmpDir();
      writeFiles(tmp.dir, { 'ok.js': 'module.exports = { x: 1 };', 'data.json': '{"a":[1]}', 'boom.js': 'throw new TypeError("load boom");', 'bad.json': '{nope' });
    });

    afterEach(() => tmp.remove());

    it('requires a file with or without its extension', () => {
      assert.deepEqual(fn(path.join(tmp.dir, 'ok')), { x: 1 });
      assert.equal(fn(path.join(tmp.dir, 'ok.js')), fn(path.join(tmp.dir, 'ok')));
      assert.deepEqual(fn(path.join(tmp.dir, 'data')), { a: [1] });
    });

    it('does not fail for a missing module', () => {
      assert.equal(fn(path.join(tmp.dir, 'missing')), undefined);
      assert.equal(fn('no-such-package-xyz'), undefined);
    });

    it('throws if the module exists but cannot be loaded', () => {
      assert.throws(() => fn(path.join(tmp.dir, 'boom')), { name: 'TypeError', message: 'load boom' });
      assert.throws(() => fn(path.join(tmp.dir, 'bad')), SyntaxError);
    });
  });
});
