'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  fn = require('./'),
  { makeTmpDir, writeFiles } = require('../../test/helpers/tmp');

describe('fileExists', () => {
  afterEach(() => mock.restoreAll());

  describe('with a stubbed fs', () => {
    it('is true if exists', () => {
      mock.method(fs, 'statSync', () => ({}));

      assert.equal(fn('a'), true);
    });

    it('is false if falsy', () => {
      mock.method(fs, 'statSync', () => undefined);

      assert.equal(fn('a'), false);
    });

    it('is false if throws', () => {
      mock.method(fs, 'statSync', () => {
        throw new Error('nope');
      });

      assert.equal(fn('a'), false);
    });
  });

  describe('with the real file system', () => {
    let tmp;

    beforeEach(() => {
      tmp = makeTmpDir();
      writeFiles(tmp.dir, { 'a.txt': 'x', 'dir/b.txt': 'y' });
    });

    afterEach(() => tmp.remove());

    it('finds files and directories', () => {
      assert.equal(fn(path.join(tmp.dir, 'a.txt')), true);
      assert.equal(fn(path.join(tmp.dir, 'dir')), true);
    });

    it('does not find missing paths', () => {
      assert.equal(fn(path.join(tmp.dir, 'nope')), false);
      assert.equal(fn(path.join(tmp.dir, 'a.txt', 'inside-a-file')), false);
      assert.equal(fn(''), false);
    });

    it('is false, and does not throw, for things that are not paths', () => {
      [undefined, null, 5, {}, []].forEach((value) => assert.equal(fn(value), false));
    });

    it('follows symlinks, and a broken one does not exist', (t) => {
      try {
        fs.symlinkSync(path.join(tmp.dir, 'dir'), path.join(tmp.dir, 'link'));
        fs.symlinkSync(path.join(tmp.dir, 'gone'), path.join(tmp.dir, 'broken'));
      } catch (e) {
        return t.skip('symlinks are not available');
      }

      assert.equal(fn(path.join(tmp.dir, 'link')), true);
      assert.equal(fn(path.join(tmp.dir, 'broken')), false);
    });
  });
});
