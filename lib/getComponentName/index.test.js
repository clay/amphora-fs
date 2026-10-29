'use strict';

const { describe, it, beforeEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  lib = require('./');

describe('getComponentName', () => {
  let getComponents;

  beforeEach(() => {
    getComponents = mock.fn();
    lib.setGetComponents(getComponents);
  });

  it('calls the `getComponents` function to get a full list of components', () => {
    lib();
    assert.equal(getComponents.mock.callCount(), 1);
  });

  it('returns the name of the component if it exists', () => {
    getComponents.mock.mockImplementation(() => ['foo', 'bar']);

    assert.equal(lib('foo'), 'foo');
  });

  it('returns false if the component does not exist', () => {
    getComponents.mock.mockImplementation(() => ['bar']);

    assert.equal(lib('foo'), false);
  });

  it('only matches whole names', () => {
    getComponents.mock.mockImplementation(() => ['foobar']);

    assert.equal(lib('foo'), false);
    assert.equal(lib(undefined), false);
    assert.equal(lib(null), false);
  });
});
