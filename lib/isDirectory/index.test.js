'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  fn = require('./'),
  { makeTmpDir, writeFiles } = require('../../test/helpers/tmp');

describe('isDirectory', () => {
  beforeEach(() => fn.cache.clear());
  afterEach(() => mock.restoreAll());

  it('returns true if path is a directory', () => {
    mock.method(fs, 'statSync', () => ({ isDirectory: () => true }));

    assert.equal(fn('some-path'), true);
  });

  it('returns false if path is a file', () => {
    mock.method(fs, 'statSync', () => ({ isDirectory: () => false }));

    assert.equal(fn('some-path'), false);
  });

  it('returns false if the path cannot be read', () => {
    mock.method(fs, 'statSync', () => {
      throw new Error('nope');
    });

    assert.equal(fn('some-path'), false);
  });

  it('works on the real file system, and remembers what it found', () => {
    const tmp = makeTmpDir();

    try {
      writeFiles(tmp.dir, { 'dir/a.txt': '', 'file.txt': '' });

      assert.equal(fn(`${tmp.dir}/dir`), true);
      assert.equal(fn(`${tmp.dir}/file.txt`), false);
      assert.equal(fn(`${tmp.dir}/missing`), false);
      assert.equal(fn(undefined), false);

      fs.mkdirSync(`${tmp.dir}/missing`);
      assert.equal(fn(`${tmp.dir}/missing`), false);
    } finally {
      tmp.remove();
    }
  });
});
