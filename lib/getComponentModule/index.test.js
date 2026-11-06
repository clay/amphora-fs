'use strict';

const { describe, it, beforeEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  fn = require('./');

describe('getComponentModule', () => {
  let getComponentPath, tryRequire;

  beforeEach(() => {
    getComponentPath = mock.fn();
    tryRequire = mock.fn();
    fn.setDeps(getComponentPath, tryRequire);
    fn.cache.clear();
  });

  it('handles missing name', () => {
    assert.equal(fn(), undefined);
  });

  it('handles bad name', () => {
    assert.equal(fn('some name'), undefined);
  });

  it('handles bad path', () => {
    getComponentPath.mock.mockImplementation(() => null);

    assert.equal(fn('some name'), null);
  });

  it('throws an error if the module exists but cannot be required successfully', () => {
    tryRequire.mock.mockImplementation(() => {
      throw new Error('some error');
    });
    getComponentPath.mock.mockImplementation(() => 'some path');

    assert.throws(() => fn('some name'), /some error/);
  });

  it('returns undefined if the module does not exist', () => {
    tryRequire.mock.mockImplementation(() => undefined);
    getComponentPath.mock.mockImplementation(() => 'some path');

    assert.equal(fn('some name'), undefined);
  });

  it('handles model.js path', () => {
    getComponentPath.mock.mockImplementation(() => 'some path');
    tryRequire.mock.mockImplementation(() => 'some result');

    assert.equal(fn('some name'), 'some result');
    assert.deepEqual(tryRequire.mock.calls[0].arguments, ['some path/model']);
  });

  it('handles renderer model.js path', () => {
    getComponentPath.mock.mockImplementation(() => 'some path');
    tryRequire.mock.mockImplementation(() => 'some result');

    assert.equal(fn('some name', 'foobar'), 'some result');
    assert.deepEqual(tryRequire.mock.calls[0].arguments, ['some path/foobar.model']);
  });

  it('returns false if the prefix is html', () => {
    assert.equal(fn('some name', 'html'), false);
    assert.equal(getComponentPath.mock.callCount(), 0);
  });

  it('remembers results per name and prefix, including those that are not found', () => {
    getComponentPath.mock.mockImplementation(() => 'some path');
    tryRequire.mock.mockImplementation((p) => (p.endsWith('amp.model') ? undefined : { p }));

    assert.equal(fn('a'), fn('a'));
    assert.equal(fn('a', 'amp'), undefined);
    assert.equal(fn('a', 'amp'), undefined);
    assert.notEqual(fn('a'), undefined);
    assert.equal(tryRequire.mock.callCount(), 2);
  });
});
