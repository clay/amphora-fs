'use strict';

const { describe, it, beforeEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  lib = require('./');

describe('getLayoutName', () => {
  let getLayouts;

  beforeEach(() => {
    getLayouts = mock.fn();
    lib.setGetLayouts(getLayouts);
  });

  it('calls the `getLayouts` function to get a full list of layouts', () => {
    lib();
    assert.equal(getLayouts.mock.callCount(), 1);
  });

  it('returns the name of the layout if it exists', () => {
    getLayouts.mock.mockImplementation(() => ['foo', 'bar']);

    assert.equal(lib('foo'), 'foo');
  });

  it('returns false if the layout does not exist', () => {
    getLayouts.mock.mockImplementation(() => ['bar']);

    assert.equal(lib('foo'), false);
  });
});
