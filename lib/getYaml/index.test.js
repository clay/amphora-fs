'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  fn = require('./'),
  { makeTmpDir, writeFiles } = require('../../test/helpers/tmp');

describe('getYaml', () => {
  beforeEach(() => fn.cache.clear());
  afterEach(() => mock.restoreAll());

  describe('with a stubbed fs', () => {
    it('returns result', () => {
      mock.method(fs, 'readFileSync', () => 'a: b');

      assert.deepEqual(fn('bootstrap'), { a: 'b' });
    });

    it('returns result from yaml extension', () => {
      mock.method(fs, 'readFileSync', (file) => {
        if (file === 'bootstrap.yaml') {
          return 'a: b';
        }
        throw new Error('nope');
      });

      assert.deepEqual(fn('bootstrap'), { a: 'b' });
    });

    it('returns result from yml extension', () => {
      mock.method(fs, 'readFileSync', (file) => {
        if (file === 'bootstrap.yml') {
          return 'a: b';
        }
        throw new Error('nope');
      });

      assert.deepEqual(fn('bootstrap'), { a: 'b' });
    });

    it('does not run env variables for non-configs', () => {
      mock.method(fs, 'readFileSync', () => 'a: ${NOT_AN_ENV_VARIABLE}');

      assert.deepEqual(fn('bootstrap'), { a: '${NOT_AN_ENV_VARIABLE}' });
    });
  });

  describe('with files', () => {
    let tmp;

    beforeEach(() => {
      tmp = makeTmpDir();
      process.env.AMPHORA_FS_TEST_HOST = 'example.test';
      process.env.AMPHORA_FS_TEST_PORT = '3001';
    });

    afterEach(() => {
      tmp.remove();
      delete process.env.AMPHORA_FS_TEST_HOST;
      delete process.env.AMPHORA_FS_TEST_PORT;
    });

    it('reads the yaml file before the yml file, and skips an empty one', () => {
      writeFiles(tmp.dir, { 'a.yaml': 'from: yaml\n', 'a.yml': 'from: yml\n', 'b.yaml': '', 'b.yml': 'from: yml\n' });

      assert.deepEqual(fn(path.join(tmp.dir, 'a')), { from: 'yaml' });
      assert.deepEqual(fn(path.join(tmp.dir, 'b')), { from: 'yml' });
    });

    it('fills in environment variables for config and local files only', () => {
      writeFiles(tmp.dir, {
        'sub/config.yaml': 'host: ${AMPHORA_FS_TEST_HOST}\nurl: http://${AMPHORA_FS_TEST_HOST}:${AMPHORA_FS_TEST_PORT}/x\n',
        'sub/local.yml': 'port: ${AMPHORA_FS_TEST_PORT}\n',
        'sub/other.yaml': 'host: ${AMPHORA_FS_TEST_HOST}\n'
      });

      assert.deepEqual(fn(path.join(tmp.dir, 'sub', 'config')), { host: 'example.test', url: 'http://example.test:3001/x' });
      assert.deepEqual(fn(path.join(tmp.dir, 'sub', 'local')), { port: 3001 });
      assert.deepEqual(fn(path.join(tmp.dir, 'sub', 'other')), { host: '${AMPHORA_FS_TEST_HOST}' });
    });

    it('throws for a config that uses a variable that is not set', () => {
      writeFiles(tmp.dir, { 'config.yaml': 'a: ${AMPHORA_FS_TEST_MISSING}\n' });

      assert.throws(() => fn(path.join(tmp.dir, 'config')), { message: 'AMPHORA_FS_TEST_MISSING is not an environment variable' });
    });

    it('is null for a file that is missing, and undefined for a missing config', () => {
      assert.equal(fn(path.join(tmp.dir, 'missing')), null);
      assert.equal(fn(path.join(tmp.dir, 'config')), undefined);
      assert.equal(fn(path.join(tmp.dir, 'local')), undefined);
    });

    it('is undefined for an empty yml file, but null for an empty yaml file (the last file read decides)', () => {
      writeFiles(tmp.dir, { 'a.yml': '', 'b.yaml': '' });

      assert.equal(fn(path.join(tmp.dir, 'a')), undefined);
      assert.equal(fn(path.join(tmp.dir, 'b')), null);
    });

    it('is null for a file with only comments, and undefined for one with only a newline', () => {
      writeFiles(tmp.dir, { 'a.yml': '# nothing here\n', 'b.yml': '\n', 'c.yml': '\n\n' });

      assert.equal(fn(path.join(tmp.dir, 'a')), null);
      assert.equal(fn(path.join(tmp.dir, 'b')), undefined);
      assert.equal(fn(path.join(tmp.dir, 'c')), null);
    });

    it('throws for yaml that cannot be parsed', () => {
      writeFiles(tmp.dir, { 'bad.yml': 'a: [1, 2\nb: : :\n' });

      assert.throws(() => fn(path.join(tmp.dir, 'bad')), { name: 'YAMLException' });
    });

    it('remembers the result for each name, and does not remember a failure', () => {
      writeFiles(tmp.dir, { 'a.yml': 'x: 1\n' });

      assert.equal(fn(path.join(tmp.dir, 'a')), fn(path.join(tmp.dir, 'a')));

      writeFiles(tmp.dir, { 'bad.yml': 'a: [\n' });
      assert.throws(() => fn(path.join(tmp.dir, 'bad')));
      writeFiles(tmp.dir, { 'bad.yml': 'a: 1\n' });
      assert.deepEqual(fn(path.join(tmp.dir, 'bad')), { a: 1 });
    });
  });
});
