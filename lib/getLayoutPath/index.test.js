'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('path'),
  lib = require('./'),
  { makeTmpDir, writeFiles } = require('../../test/helpers/tmp');

describe('getLayoutPath', () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTmpDir();
    writeFiles(tmp.dir, { 'layouts/c1/schema.yml': 'a: 1\n' });
    mock.method(process, 'cwd', () => tmp.dir);

    lib.setGetLayoutName((name) => ['c1', 'c2'].includes(name));
  });

  afterEach(() => {
    mock.restoreAll();
    tmp.remove();
  });

  it('returns null if name isn\'t a layout', () => {
    assert.equal(lib('c0'), null);
  });

  it('gets an internal path', () => {
    assert.equal(lib('c1'), path.join(tmp.dir, 'layouts', 'c1'));
  });

  it('returns null when it does not exist', () => {
    assert.equal(lib('c2'), null);
  });
});
