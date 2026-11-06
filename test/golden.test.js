'use strict';

const { describe, it } = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  path = require('path'),
  { runProject } = require('./helpers/golden');

// test/fixtures/golden.json is what amphora-fs 2.0.0 gave for the project of test/helpers/project.js:
// every function, with good and odd arguments, in the order amphora uses them, and what changes in the
// file system in between. What it gives now has to be the same, in values, errors and order.
// (The messages of js-yaml, node and V8 are not compared.)
describe('amphora-fs, compared with 2.0.0', () => {
  const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'golden.json'), 'utf8'));

  it('gives the same results on a project', () => {
    const actual = runProject(path.join(__dirname, '..')),
      differences = [];

    assert.equal(actual.length, expected.length);
    expected.forEach(([name, result], i) => {
      try {
        assert.deepEqual(actual[i], [name, result]);
      } catch (e) {
        differences.push(name);
      }
    });

    assert.deepEqual(differences, []);
  });

  it('has results to compare', () => {
    assert.ok(expected.length > 700);
    assert.ok(expected.some(([name, result]) => name.includes('getYaml') && result && result.$object));
    assert.ok(expected.some(([name]) => name.includes('getComponentPath')));
  });
});
