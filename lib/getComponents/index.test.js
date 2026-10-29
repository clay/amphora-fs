'use strict';

const { describe, it, beforeEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  lib = require('./'),
  pkg = require('../../test/fixtures/package.json'),
  { makeTmpDir, writeFiles } = require('../../test/helpers/tmp');

describe('getComponents', () => {
  let getFolders;

  beforeEach(() => {
    getFolders = mock.fn(() => []);
    lib.setDeps(getFolders);
    lib.cache.clear();
  });

  it('returns empty array if no components', () => {
    assert.deepEqual(lib({ dependencies: [] }), []);
    assert.deepEqual(lib({}), []);
  });

  it('gets a list of internal components', () => {
    getFolders.mock.mockImplementation(() => ['c1', 'c2', 'c3']);

    assert.deepEqual(lib(pkg).slice(0, 3), ['c1', 'c2', 'c3']);
  });

  it('gets a list of npm components, unscoped and scoped, after the internal ones', () => {
    getFolders.mock.mockImplementation(() => ['c1']);

    assert.deepEqual(lib(pkg), ['c1', 'clay-c5', 'clay-c3', 'clay-c4']);
  });

  it('leaves out the clay packages that are not components (only unscoped ones are ignored by name)', () => {
    const deps = { 'clay-log': '1', 'clay-sitemaps': '1', 'clay-kiln': '1', '@a/clay-log': '1', lodash: '1' };

    assert.deepEqual(lib({ dependencies: deps }), ['clay-kiln', 'clay-log']);
  });

  it('reads the components folder of the current directory', () => {
    const tmp = makeTmpDir();

    writeFiles(tmp.dir, { 'components/a/schema.yml': 'a: 1\n', 'components/b/schema.yml': 'a: 1\n', 'components/file.txt': 'x' });
    lib.setDeps(require('../getFolders'));
    mock.method(process, 'cwd', () => tmp.dir);

    try {
      assert.deepEqual(lib(pkg), ['a', 'b', 'clay-c5', 'clay-c3', 'clay-c4']);
    } finally {
      mock.restoreAll();
      tmp.remove();
    }
  });

  it('remembers the list for the same package', () => {
    assert.equal(lib(pkg), lib(pkg));
    assert.equal(getFolders.mock.callCount(), 1);
  });
});
