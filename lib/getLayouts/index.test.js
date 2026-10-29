'use strict';

const { describe, it, beforeEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  lib = require('./');

describe('getLayouts', () => {
  let getFolders;

  beforeEach(() => {
    getFolders = mock.fn(() => []);
    lib.setDeps(getFolders);
    lib.cache.clear();
  });

  it('returns empty array if no layouts', () => {
    assert.deepEqual(lib(), []);
  });

  it('gets a list of internal layouts from the layouts folder', () => {
    getFolders.mock.mockImplementation(() => ['c1']);

    assert.deepEqual(lib(), ['c1']);
    assert.equal(getFolders.mock.calls[0].arguments[0], require('path').join(process.cwd(), 'layouts'));
  });

  it('remembers the list', () => {
    assert.equal(lib(), lib());
    assert.equal(getFolders.mock.callCount(), 1);
  });
});
