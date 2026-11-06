'use strict';

const { describe, it } = require('node:test'),
  assert = require('node:assert/strict'),
  path = require('path'),
  fn = require('./'),
  fixtures = path.join(__dirname, '..', '..', 'test', 'fixtures');

describe('getSchemaPath', () => {
  it('gets schema with .yaml ext', () => {
    assert.equal(fn(fixtures), path.join(fixtures, 'schema.yaml'));
  });

  it('gets schema with .yml ext', () => {
    assert.equal(fn(path.join(fixtures, 'text')), path.join(fixtures, 'text', 'schema.yml'));
  });

  it('throws error when no schema found', () => {
    assert.throws(() => fn(path.join(fixtures, 'not-found')), /Schema path not found in .*not-found/);
  });

  it('throws error when nothing is passed in', () => {
    assert.throws(() => fn(), /Directory path is invalid/);
  });

  it('throws error if a string is not passed in', () => {
    assert.throws(() => fn(123123), /Directory path is invalid/);
    assert.throws(() => fn(''), /Directory path is invalid/);
    assert.throws(() => fn({}), /Directory path is invalid/);
  });
});
