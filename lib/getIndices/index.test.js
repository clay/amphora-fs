'use strict';

const { describe, it } = require('node:test'),
  assert = require('node:assert/strict'),
  fn = require('./');

describe('getIndices', () => {
  it('allows bad ref, empty data', () => {
    assert.deepEqual(fn('some ref', {}), {
      refs: { 'some ref': {} },
      components: []
    });
  });

  it('allows good ref, empty data', () => {
    assert.deepEqual(fn('/_components/thing/instances/abc', {}), {
      refs: { '/_components/thing/instances/abc': {} },
      components: ['thing']
    });
  });

  it('allows good ref, data with references', () => {
    const ref = '/_components/thing/instances/abc',
      data = {
        a: 'b',
        c: {_ref: '/_components/d/instances/e'},
        f: {_ref: '/_components/g'},
        h: {
          _ref: '/_components/i',
          j: {_ref:'/_components/k'}
        },
        l: {_ref: '/_components/g'},
        m: {_ref: '/_components/g/instances/n'}
      },
      result = fn(ref, data);

    assert.deepEqual(result, {
      refs: {
        '/_components/d/instances/e': { _ref: '/_components/d/instances/e' },
        '/_components/g': { _ref: '/_components/g' },
        '/_components/g/instances/n': { _ref: '/_components/g/instances/n' },
        '/_components/i': { _ref: '/_components/i', j: {_ref:'/_components/k'} },
        '/_components/k': { _ref: '/_components/k' },
        '/_components/thing/instances/abc': data
      },
      components: ['thing', 'd', 'g', 'i', 'k']
    });
    assert.equal(result.refs[ref], data);
    assert.equal(result.refs['/_components/i'], data.h);
  });

  it('finds references inside lists, at any depth', () => {
    const data = { list: [{ _ref: '/_components/a' }, [{ nested: { _ref: '/_components/b' } }]], deep: { a: { b: { c: { _ref: '/_components/c' } } } } };

    // the last branch is walked first, so 'deep' is found before 'list'
    assert.deepEqual(fn('/_components/root', data).components, ['root', 'c', 'a', 'b']);
  });

  it('gives the last of two different objects with the same reference, and keeps the order of the first', () => {
    const first = { _ref: '/_components/a', n: 1 },
      second = { _ref: '/_components/a', n: 2 },
      result = fn('/_components/root', { x: first, y: second });

    assert.equal(result.refs['/_components/a'], second);
    assert.deepEqual(Object.keys(result.refs), ['/_components/root', '/_components/a']);
  });

  it('lets a reference found in the data replace the data for the same ref, in place', () => {
    const inner = { _ref: '/_components/root' },
      result = fn('/_components/root', { inner });

    assert.equal(result.refs['/_components/root'], inner);
    assert.deepEqual(result.components, ['root']);
  });

  it('puts integer-like references first, like any object', () => {
    const result = fn('/_components/root', { a: { _ref: 'b' }, c: { _ref: '2' }, d: { _ref: '10' }, e: { _ref: '9' } });

    assert.deepEqual(Object.keys(result.refs), ['2', '9', '10', '/_components/root', 'b']);
  });

  it('only counts truthy references', () => {
    const result = fn('/_components/root', { a: { _ref: '' }, b: { _ref: 0 }, c: { _ref: null }, d: { _ref: false }, e: { _ref: '/_components/e' } });

    assert.deepEqual(Object.keys(result.refs), ['/_components/root', '/_components/e']);
  });

  it('does not treat a reference as a component unless it is a component uri', () => {
    const result = fn('/_layouts/a/instances/b', { x: { _ref: '/_components/' }, y: { _ref: '/_components/y.html' }, z: { _ref: 'example.com/_components/z/instances/1' } });

    assert.deepEqual(result.components, ['y', 'z']);
  });

  it('handles data that is not an object', () => {
    [undefined, null, 0, 5, true, 'text', '/_components/a'].forEach((data) => {
      assert.deepEqual(fn('/_components/root', data), { refs: { '/_components/root': data }, components: ['root'] });
    });
  });

  it('handles a missing ref', () => {
    assert.deepEqual(fn(undefined, { a: { _ref: '/_components/a' } }).components, ['a']);
    assert.deepEqual(Object.keys(fn(undefined, {}).refs), ['undefined']);
  });

  it('keeps __proto__ as a plain reference name, not as a prototype', () => {
    const result = fn('/_components/root', { a: { _ref: '__proto__', marker: 1 } });

    assert.equal(Object.getPrototypeOf(result.refs), Object.prototype);
    assert.deepEqual(Object.keys(result.refs), ['/_components/root', '__proto__']);
    assert.equal(result.refs.__proto__.marker, 1);
  });

  it('treats an object with a numeric length as a list, as lodash did', () => {
    // data with a `length` (a video's, say) hides every reference below it: kept as is, because rendering depends on it
    const result = fn('/_components/root', { length: 120, child: { _ref: '/_components/child' } });

    assert.deepEqual(result.components, ['root']);
    assert.deepEqual(Object.keys(result.refs), ['/_components/root']);
    assert.deepEqual(Object.keys(fn('/_components/root', { length: 'long', child: { _ref: '/_components/child' } }).refs), ['/_components/root', '/_components/child']);
  });

  it('does not walk into things without own properties', () => {
    const result = fn('/_components/root', { map: new Map([['a', { _ref: '/_components/a' }]]), set: new Set([{ _ref: '/_components/b' }]), buf: Buffer.from('x') });

    assert.deepEqual(result.components, ['root']);
  });

  it('finishes quickly on data that is wide and deep', () => {
    const data = { items: Array.from({ length: 20000 }, (v, i) => ({ _ref: `/_components/c${i % 50}/instances/${i}`, child: { inner: [{ _ref: `/_components/x${i % 7}` }] } })) },
      start = Date.now(),
      result = fn('/_components/root', data);

    assert.equal(result.components.length, 1 + 50 + 7);
    assert.ok(Date.now() - start < 2000);
  });

  it('finds the name of the component in a uri, as clayutils\' getComponentName did', () => {
    // the right-hand side is what clayutils 3.0.0 gives for the uri
    const uris = [
      ['/_components/text', 'text'],
      ['/_components/text/instances/0', 'text'],
      ['/_components/text/instances/abc@published', 'text'],
      ['/_components/text.html', 'text'],
      ['/_components/text.json', 'text'],
      ['example.com/_components/text/instances/a', 'text'],
      ['http://example.com:3001/_components/text/instances/a.html', 'text'],
      ['/_components/', ''],
      ['/_components//x', '/x'],
      ['/_components/.x', '.x'],
      ['/_components/x/', 'x'],
      ['/_components/a.b/c', 'a'],
      ['/_components/a/b/c', 'a'],
      ['/_components/with-dash_and_under/instances/1', 'with-dash_and_under'],
      ['/_components/ünï/instances/1', 'ünï'],
      ['/_components/a b/instances/1', 'a b'],
      ['/_components/a\n/instances/1', 'a'],
      ['/_layouts/layout/instances/a', null],
      ['/_pages/page', null],
      ['_components/text', 'text'],
      ['components/text', null],
      ['', null],
      ['some ref', null],
      ['/_components/a/_components/b', 'a'],
      ['/_components/_components/b', '_components'],
      ['/_components/a?b=c', 'a?b=c'],
      ['/_components/a#h', 'a#h'],
      ['/_components/a@published', 'a@published'],
      ['/_components/A/instances/B', 'A'],
      ['/_COMPONENTS/a', null],
      ['/_components/ ', ' '],
      ['/_components/1/instances/2', '1']
    ];

    uris.forEach(([uri, name]) => {
      assert.deepEqual(fn(uri, {}).components, name ? [name] : [], uri);
    });
  });
});
