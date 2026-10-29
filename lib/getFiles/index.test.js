'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  fn = require('./'),
  { makeTmpDir, writeFiles } = require('../../test/helpers/tmp');

describe('getFiles', () => {
  let tmp;

  beforeEach(() => {
    tmp = makeTmpDir();
    fn.cache.clear();
  });

  afterEach(() => {
    mock.restoreAll();
    tmp.remove();
  });

  it('gets a list of files, but not folders', () => {
    writeFiles(tmp.dir, { 'b.js': '', 'a.hbs': '', 'folder/inner.js': '' });

    assert.deepEqual(fn(tmp.dir), ['a.hbs', 'b.js']);
  });

  it('leaves out test files and documentation', () => {
    writeFiles(tmp.dir, { 'model.js': '', 'model.test.js': '', 'README.md': '', 'notes.md.bak': '', 'a.mdx': '', 'template.hbs': '' });

    assert.deepEqual(fn(tmp.dir), ['model.js', 'template.hbs']);
  });

  it('lists in the order the file system returns, without sorting itself', () => {
    writeFiles(tmp.dir, { Upper: '', lower: '', _under: '', 10: '', 9: '' });

    assert.deepEqual(fn(tmp.dir), fs.readdirSync(tmp.dir));
  });

  it('returns empty array on error', () => {
    mock.method(fs, 'readdirSync', () => {
      throw new Error('nope');
    });

    assert.deepEqual(fn('.'), []);
  });

  it('returns empty array for a missing directory, a file, and things that are not paths', () => {
    writeFiles(tmp.dir, { 'a.txt': '' });

    [`${tmp.dir}/nope`, `${tmp.dir}/a.txt`, '', undefined, null, 5].forEach((value) => assert.deepEqual(fn(value), []));
  });

  it('remembers the list for each directory', () => {
    writeFiles(tmp.dir, { 'a.txt': '' });
    const first = fn(tmp.dir);

    writeFiles(tmp.dir, { 'b.txt': '' });

    assert.equal(fn(tmp.dir), first);
    assert.deepEqual(first, ['a.txt']);
  });
});
