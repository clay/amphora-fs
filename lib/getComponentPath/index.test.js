'use strict';

const { describe, it, beforeEach, afterEach, mock } = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('path'),
  lib = require('./'),
  pkg = require('../../test/fixtures/package.json'),
  { makeTmpDir, writeFiles } = require('../../test/helpers/tmp');

describe('getComponentPath', () => {
  let getComponentName, tmp;

  beforeEach(() => {
    tmp = makeTmpDir();
    writeFiles(tmp.dir, { 'components/c1/schema.yml': 'a: 1\n', 'components/c2/schema.yml': 'a: 1\n' });
    mock.method(process, 'cwd', () => tmp.dir);

    getComponentName = mock.fn((name) => ['c1', 'c2', 'clay-c3', 'clay-c5', 'clay-c6'].includes(name));
    lib.setGetComponentName(getComponentName);
  });

  afterEach(() => {
    mock.restoreAll();
    tmp.remove();
  });

  it('returns null if name isn\'t a component', () => {
    assert.equal(lib('c0', pkg), null);
  });

  it('gets an internal path', () => {
    assert.equal(lib('c1', pkg), path.join(tmp.dir, 'components', 'c1'));
  });

  it('gets an npm path', () => {
    assert.equal(lib('clay-c3', pkg), path.join(tmp.dir, 'node_modules', 'clay-c3'));
  });

  it('gets a scoped npm path', () => {
    assert.equal(lib('clay-c5', pkg), path.join(tmp.dir, 'node_modules', '@a', 'clay-c5'));
  });

  it('is undefined for an npm component that is not in the dependencies', () => {
    assert.equal(lib('clay-c6', pkg), undefined);
    assert.equal(lib('clay-c6', {}), undefined);
  });

  it('prefers the first dependency whose name contains the component name', () => {
    assert.equal(lib('clay-c3', { dependencies: { 'zz-clay-c3': '1', 'clay-c3': '1' } }), path.join(tmp.dir, 'node_modules', 'zz-clay-c3'));
  });

  it('reads package.json from the current directory when no package is given', () => {
    writeFiles(tmp.dir, { 'package.json': JSON.stringify({ dependencies: { 'clay-c3': '1' } }) });

    assert.equal(lib('clay-c3'), path.join(tmp.dir, 'node_modules', 'clay-c3'));
    assert.equal(lib('c1'), path.join(tmp.dir, 'components', 'c1'));
  });
});
