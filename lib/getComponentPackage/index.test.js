'use strict';

const { describe, it, beforeEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  fn = require('./');

describe('getComponentPackage', () => {
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

  it('handles index.js path', () => {
    const result = [];

    getComponentPath.mock.mockImplementation(() => 'some path');
    tryRequire.mock.mockImplementation(() => result);

    assert.equal(fn('some name'), result);
    assert.equal(tryRequire.mock.calls[0].arguments[0], require('path').join('some path', 'package.json'));
  });

  it('only loads the package once per name', () => {
    getComponentPath.mock.mockImplementation(() => 'some path');
    tryRequire.mock.mockImplementation(() => ({}));

    assert.equal(fn('a'), fn('a'));
    assert.equal(tryRequire.mock.callCount(), 1);
  });
});
