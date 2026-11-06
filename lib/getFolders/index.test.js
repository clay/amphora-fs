'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  fn = require('./'),
  { makeTmpDir, writeFiles } = require('../../test/helpers/tmp');

describe('getFolders', () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTmpDir();
    fn.cache.clear();
  });

  afterEach(() => {
    mock.restoreAll();
    tmp.remove();
  });

  it('gets a list of folders', () => {
    writeFiles(tmp.dir, { 'b/x.txt': '', 'a/x.txt': '', 'c.txt': '', '.hidden/x.txt': '' });

    assert.deepEqual(fn(tmp.dir), ['.hidden', 'a', 'b']);
  });

  it('counts a symlink to a folder as a folder', (t) => {
    writeFiles(tmp.dir, { 'real/x.txt': '' });

    try {
      fs.symlinkSync(path.join(tmp.dir, 'real'), path.join(tmp.dir, 'link'));
    } catch (e) {
      return t.skip('symlinks are not available');
    }

    assert.deepEqual(fn(tmp.dir), ['link', 'real']);
  });

  it('returns empty array if something goes wrong', () => {
    mock.method(fs, 'readdirSync', () => {
      throw new Error('nope');
    });

    assert.deepEqual(fn('bar'), []);
  });

  it('returns empty array for a missing directory, a file, and things that are not paths', () => {
    writeFiles(tmp.dir, { 'a.txt': '' });

    [`${tmp.dir}/nope`, `${tmp.dir}/a.txt`, '', undefined, null, 5].forEach((value) => assert.deepEqual(fn(value), []));
  });

  it('remembers the list for each directory', () => {
    writeFiles(tmp.dir, { 'a/x.txt': '' });
    const first = fn(tmp.dir);

    writeFiles(tmp.dir, { 'b/x.txt': '' });

    assert.equal(fn(tmp.dir), first);
    assert.deepEqual(first, ['a']);
  });
});
