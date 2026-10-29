'use strict';

const { describe, it, afterEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  fn = require('./');

describe('readFilePromise', () => {
  afterEach(() => mock.restoreAll());

  it('returns file contents', async () => {
    mock.method(fs, 'readFile', (file, options, callback) => callback(null, 'result'));

    assert.equal(await fn('article.css'), 'result');
    assert.deepEqual(fs.readFile.mock.calls[0].arguments.slice(0, 2), ['article.css', 'utf8']);
  });

  it('rejects with the error', async () => {
    const err = new Error('nope');

    mock.method(fs, 'readFile', (file, options, callback) => callback(err, ''));

    await assert.rejects(fn('.'), (result) => result === err);
  });

  it('reads a real file as a string, and rejects for a missing one', async () => {
    const file = path.join(__dirname, '..', '..', 'test', 'fixtures', 'package.json');

    assert.match(await fn(file), /"clay-c3"/);
    await assert.rejects(fn(path.join(__dirname, 'does-not-exist.txt')), { code: 'ENOENT' });
  });
});
