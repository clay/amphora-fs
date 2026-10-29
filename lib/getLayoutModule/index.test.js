'use strict';

const { describe, it, beforeEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  fn = require('./');

describe('getLayoutModule', () => {
  let getLayoutPath, tryRequire;

  beforeEach(() => {
    getLayoutPath = mock.fn();
    tryRequire = mock.fn();
    fn.setDeps(getLayoutPath, tryRequire);
    fn.cache.clear();
  });

  it('handles missing name', () => {
    assert.equal(fn(), undefined);
  });

  it('handles bad name', () => {
    assert.equal(fn('some name'), undefined);
  });

  it('handles bad path', () => {
    getLayoutPath.mock.mockImplementation(() => null);

    assert.equal(fn('some name'), null);
  });

  it('throws an error if the module exists but cannot be required successfully', () => {
    tryRequire.mock.mockImplementation(() => {
      throw new Error('some error');
    });
    getLayoutPath.mock.mockImplementation(() => 'some path');

    assert.throws(() => fn('some name'), /some error/);
  });

  it('returns undefined if the module does not exist', () => {
    tryRequire.mock.mockImplementation(() => undefined);
    getLayoutPath.mock.mockImplementation(() => 'some path');

    assert.equal(fn('some name'), undefined);
  });

  it('handles model.js path', () => {
    getLayoutPath.mock.mockImplementation(() => 'some path');
    tryRequire.mock.mockImplementation(() => 'some result');

    assert.equal(fn('some name'), 'some result');
    assert.deepEqual(tryRequire.mock.calls[0].arguments, ['some path/model']);
  });

  it('handles renderer model.js path', () => {
    getLayoutPath.mock.mockImplementation(() => 'some path');
    tryRequire.mock.mockImplementation(() => 'some result');

    assert.equal(fn('some name', 'foobar'), 'some result');
    assert.deepEqual(tryRequire.mock.calls[0].arguments, ['some path/foobar.model']);
  });

  it('returns false if the prefix is html', () => {
    assert.equal(fn('some name', 'html'), false);
    assert.equal(getLayoutPath.mock.callCount(), 0);
  });
});
