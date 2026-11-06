'use strict';

const fs = require('fs'),
  path = require('path'),
  serialize = require('./serialize');

/**
 * Use every function of amphora-fs on the project in the current directory, and
 * write down what each one gave back or threw, in the order amphora asks.
 *
 * @param {object} afs amphora-fs
 * @returns {Promise<array>} [name, result] pairs
 */
async function runScenario(afs) {
  const root = process.cwd(),
    out = [],
    at = (...parts) => path.join(root, ...parts),
    label = (value) => {
      if (typeof value === 'string') {
        return path.relative(root, value) || '<root>';
      }
      return Buffer.isBuffer(value) ? 'buffer' : `${typeof value}:${String(value)}`;
    },
    odd = [undefined, null, '', 0, 5, NaN, true, {}, [], () => 1, '__proto__', 'constructor', 'toString', ' ', '.'],
    // a model is a module: say what it has, not what it is
    same = (fn, ...args) => Object.is(fn(...args), fn(...args)),
    shape = (value) => value && typeof value === 'object' ? Object.assign({}, value) : value,
    // what tryRequire found: a module of ours by its exports, anything else by its type
    describe = (value, file) => {
      if (['fs', 'path', 'node:fs'].includes(file) || (typeof value !== 'object' && typeof value !== 'function') || value === null) {
        return typeof value === 'object' || typeof value === 'function' ? { type: typeof value } : value;
      }
      return shape(value);
    };

  async function call(name, fn, ...args) {
    let result;

    try {
      result = await fn(...args);
    } catch (e) {
      result = { $thrown: e };
    }
    out.push([`${out.length}:${name}`, serialize(result, root)]);
  }

  // before anything was listed
  await call('getComponentName cold', afs.getComponentName, 'article');

  // components
  const components = afs.getComponents(),
    pkg = require(at('package.json'));

  await call('getComponents', afs.getComponents);
  await call('getComponents is remembered', () => same(afs.getComponents));
  await call('getComponents(pkg)', afs.getComponents, pkg);
  await call('getComponents(pkg) is remembered', () => same(afs.getComponents, pkg));
  await call('getComponents({})', afs.getComponents, {});
  await call('getComponents(dependencies array)', afs.getComponents, { dependencies: ['clay-a'] });
  await call('getComponents(dependencies null)', afs.getComponents, { dependencies: null });
  await call('getComponents(dependencies string)', afs.getComponents, { dependencies: 'clay-xyz' });
  await call('getComponents(odd names)', afs.getComponents, { dependencies: { 'clay-a': 1, 'x/clay-b': 1, '@s/clay-c': 1, '@s/clay-d/e': 1, 'clay-': 1, 'clay-log': 1, '@s/clay-log': 1, 'clay-sitemaps': 1, 'a-clay-': 1, 'CLAY-up': 1 } });
  await call('getComponents(null)', afs.getComponents, null);

  for (const name of components.concat(['nope', 'clay-log', 'clay-sitemaps', 'lodash', 'clay-bar', 'bar'], odd)) {
    await call(`getComponentName ${label(name)}`, afs.getComponentName, name);
    await call(`getComponentPath ${label(name)}`, afs.getComponentPath, name);
    await call(`getComponentPackage ${label(name)}`, afs.getComponentPackage, name);
    await call(`getComponentModule ${label(name)}`, (n) => shape(afs.getComponentModule(n)), name);
  }

  for (const name of ['with-other-models', 'bar', 'clay-bar', 'article']) {
    for (const prefix of [undefined, null, '', 'amp', 'html', 'nope', 0]) {
      await call(`getComponentModule ${name} ${String(prefix)}`, (n, p) => shape(afs.getComponentModule(n, p)), name, prefix);
    }
  }

  await call('getComponentPath with another package', afs.getComponentPath, 'clay-bar', { dependencies: { 'zzz-clay-bar': 1, '@scope/clay-bar': 1 } });
  await call('getComponentPath with no dependencies', afs.getComponentPath, 'clay-foo', {});
  await call('getComponentPath with null package, local component', afs.getComponentPath, 'article', null);
  await call('getComponentPath with array dependencies', afs.getComponentPath, 'clay-foo', { dependencies: ['x'] });
  await call('getComponentPath with string dependencies', afs.getComponentPath, 'clay-foo', { dependencies: 'clay-foo' });
  await call('getComponentPackage is remembered', () => same(afs.getComponentPackage, 'clay-foo'));
  await call('getComponentModule is remembered', () => same(afs.getComponentModule, 'article'));
  await call('getComponentModule is remembered per prefix', () => same(afs.getComponentModule, 'with-other-models', 'amp'));

  // layouts
  const layouts = afs.getLayouts();

  await call('getLayouts', afs.getLayouts);
  await call('getLayouts is remembered', () => same(afs.getLayouts));

  for (const name of layouts.concat(['nope'], odd)) {
    await call(`getLayoutName ${label(name)}`, afs.getLayoutName, name);
    await call(`getLayoutPath ${label(name)}`, afs.getLayoutPath, name);
    await call(`getLayoutModules ${label(name)}`, (n) => shape(afs.getLayoutModules(n)), name);
  }

  for (const name of ['layout-a', 'layout-b']) {
    for (const prefix of [undefined, 'amp', 'html', 'nope']) {
      await call(`getLayoutModules ${name} ${String(prefix)}`, (n, p) => shape(afs.getLayoutModules(n, p)), name, prefix);
    }
  }

  // schema paths and yaml
  const dirs = components.map((name) => afs.getComponentPath(name)).concat(layouts.map((name) => at('layouts', name)),
    [at('files'), at('nope'), at('sites'), at('components', 'dir-schema'), at('components', 'both-yaml-yml')]);

  for (const dir of dirs.concat(odd)) {
    await call(`getSchemaPath ${label(dir)}`, afs.getSchemaPath, dir);
  }

  for (const dir of dirs) {
    await call(`getYaml ${label(path.join(dir || '', 'schema'))}`, afs.getYaml, path.join(dir || '', 'schema'));
    await call(`getYaml ${label(path.join(dir || '', 'bootstrap'))}`, afs.getYaml, path.join(dir || '', 'bootstrap'));
  }

  for (const site of ['alpha', 'beta', 'gamma', 'delta', 'eps', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu', 'nu', 'xi', 'omicron', 'nonexistent']) {
    for (const file of ['config', 'local', 'bootstrap', 'other']) {
      await call(`getYaml sites/${site}/${file}`, afs.getYaml, at('sites', site, file));
    }
  }

  for (const file of [at('sites', 'alpha', 'subsites', 'sub1', 'config'), at('sites', 'alpha', 'config.yaml'), at('sites', 'alpha', 'config.yml'), at('nope', 'config'),
    'config', 'local', 'schema', at('sites', 'alpha', 'config.'), at('sites', 'alpha', 'config.v2')]) {
    await call(`getYaml ${label(file)}`, afs.getYaml, file);
  }

  for (const file of [undefined, null, '', 5, {}, [], true]) {
    await call(`getYaml ${label(file)}`, afs.getYaml, file);
  }

  await call('getYaml is remembered', () => same(afs.getYaml, at('components', 'article', 'schema')));
  await call('getYaml is remembered for config', () => same(afs.getYaml, at('sites', 'alpha', 'config')));

  // the file system
  const paths = [at('files'), at('files', 'plain.json'), at('files', 'ünï-çödé.txt'), at('files', 'with space'), at('files', 'empty.txt'), at('components'), at('nope'),
    at('files', 'plain.json', 'x'), '', '.', `${root}/`, `${at('files')}/`, at('files', '..', 'files'), 'files', 'package.json'].concat(odd, [Buffer.from(at('files'))]);

  for (const file of paths) {
    await call(`fileExists ${label(file)}`, afs.fileExists, file);
    await call(`isDirectory ${label(file)}`, afs.isDirectory, file);
    await call(`getFolders ${label(file)}`, afs.getFolders, file);
    await call(`getFiles ${label(file)}`, afs.getFiles, file);
    // fs.readFile reads a number as a file descriptor, not as a path: 0 is stdin, and 5 can be a pipe that never ends
    if (typeof file !== 'number') {
      await call(`readFilePromise ${label(file)}`, afs.readFilePromise, file);
    }
  }

  for (const dir of ['components', 'layouts', 'sites', 'styleguides', 'node_modules', 'files', 'sites/alpha', 'components/article']) {
    await call(`getFolders ${dir}`, afs.getFolders, at(dir));
    await call(`getFiles ${dir}`, afs.getFiles, at(dir));
  }

  await call('getFolders is remembered', () => same(afs.getFolders, at('components')));
  await call('getFiles is remembered', () => same(afs.getFiles, at('files')));

  for (const file of [at('files', 'mod.js'), at('files', 'mod'), at('files', 'plain.json'), at('files', 'plain'), at('files', 'bad.json'), at('files', 'mod-undefined'),
    at('files', 'mod-throw'), at('files', 'empty.json'), at('files', 'nope'), at('files'), at('components', 'article', 'model'), at('components', 'syntax-model', 'model'),
    at('components', 'bad-model', 'model'), 'path', 'fs', 'node:fs', 'nonexistent-package-xyz', '', undefined, null, 5, {}]) {
    await call(`tryRequire ${label(file)}`, (f) => describe(afs.tryRequire(f), f), file);
  }

  await call('tryRequire is remembered', () => same(afs.tryRequire, at('files', 'mod.js')));
  await call('tryRequire shares the require cache', () => afs.tryRequire(at('files', 'mod.js')) === require(at('files', 'mod.js')));

  // getIndices: what it finds, in what order, and which of the objects it was given it hands back
  const componentList = Array.from({ length: 5 }, (v, i) => ({ _ref: `/_components/item/instances/${i}`, n: { _ref: `/_components/inner${i % 2}` } })),
    indexInputs = {
      empty: ['/_components/page/instances/a', {}],
      'not a component': ['some ref', {}],
      nested: ['/_components/page/instances/a', { a: 'b', c: { _ref: '/_components/d/instances/e' }, f: { _ref: '/_components/g' }, h: { _ref: '/_components/i', j: { _ref: '/_components/k' } }, l: { _ref: '/_components/g' }, m: { _ref: '/_components/g/instances/n' } }],
      lists: ['/_components/page', { main: componentList, deep: [[{ x: { _ref: '/_components/deep' } }]] }],
      'same ref twice': ['/_components/page', { x: { _ref: '/_components/a', n: 1 }, y: { _ref: '/_components/a', n: 2 } }],
      'ref of the page again': ['/_components/page', { inner: { _ref: '/_components/page', n: 1 } }],
      'integer refs': ['/_components/page', { a: { _ref: 'b' }, c: { _ref: '2' }, d: { _ref: '10' }, e: { _ref: '9' } }],
      'falsy refs': ['/_components/page', { a: { _ref: '' }, b: { _ref: 0 }, c: { _ref: null }, d: { _ref: false }, e: { _ref: '/_components/e' } }],
      'odd refs': ['/_components/page', { a: { _ref: 5 }, b: { _ref: ['/_components/arr'] }, c: { _ref: true }, d: { _ref: { toString: () => '/_components/ts' } } }],
      uris: ['/_layouts/layout/instances/a', { a: { _ref: '/_components/' }, b: { _ref: '/_components/b.html' }, c: { _ref: 'example.com/_components/c/instances/1' }, d: { _ref: '/_components/d.e/f' }, e: { _ref: '/_components//x' } }],
      'length hides refs': ['/_components/page', { length: 120, child: { _ref: '/_components/child' } }],
      'length that is not a number': ['/_components/page', { length: 'long', child: { _ref: '/_components/child' } }],
      'array-like': ['/_components/page', { length: 2, 0: { _ref: '/_components/zero' }, 1: { _ref: '/_components/one' }, other: { _ref: '/_components/other' } }],
      'sparse list': ['/_components/page', Object.assign([], { 1: { _ref: '/_components/one' }, 3: { _ref: '/_components/three' } })],
      '__proto__ as a ref': ['/_components/page', JSON.parse('{"a": {"_ref": "__proto__", "marker": 1}, "b": {"__proto__": {"_ref": "/_components/own-proto"}}}')],
      'ref __proto__': ['__proto__', { a: { _ref: '/_components/a' } }],
      'values that are not plain': ['/_components/page', { map: new Map([['a', { _ref: '/_components/m' }]]), set: new Set([{ _ref: '/_components/s' }]), date: new Date(0), buf: Buffer.from('x'), fn: Object.assign(() => 1, { _ref: '/_components/fn', child: { _ref: '/_components/fnchild' } }) }],
      unicode: ['/_components/ünï/instances/1', { a: { _ref: '/_components/ç-ö/instances/2' } }]
    };

  for (const [name, [ref, data]] of Object.entries(indexInputs)) {
    await call(`getIndices ${name}`, afs.getIndices, ref, data);
  }

  for (const data of [undefined, null, 0, 5, true, 'text', '/_components/a', [], () => 1, new Map(), Buffer.from('x')]) {
    await call(`getIndices of ${typeof data === 'string' ? JSON.stringify(data) : label(data)}`, afs.getIndices, '/_components/root', data);
  }

  for (const ref of [undefined, null, 5, '', {}]) {
    await call(`getIndices with ref ${label(ref)}`, afs.getIndices, ref, { a: { _ref: '/_components/a' } });
  }

  await call('getIndices hands back the objects it was given', () => {
    const data = { a: { _ref: '/_components/a' }, b: [{ _ref: '/_components/b' }] },
      result = afs.getIndices('/_components/root', data);

    return [result.refs['/_components/root'] === data, result.refs['/_components/a'] === data.a, result.refs['/_components/b'] === data.b[0], result.components];
  });

  // what is remembered stays as it was, and what is not looked at again changes
  await call('getFolders before', afs.getFolders, at('styleguides'));
  fs.mkdirSync(at('styleguides', 'sg-late'));
  await call('getFolders after', afs.getFolders, at('styleguides'));
  await call('isDirectory before', afs.isDirectory, at('styleguides', 'sg-late2'));
  fs.mkdirSync(at('styleguides', 'sg-late2'));
  await call('isDirectory after', afs.isDirectory, at('styleguides', 'sg-late2'));
  await call('fileExists before', afs.fileExists, at('files', 'late.txt'));
  fs.writeFileSync(at('files', 'late.txt'), 'x');
  await call('fileExists after', afs.fileExists, at('files', 'late.txt'));
  await call('tryRequire before', afs.tryRequire, at('files', 'late-mod'));
  fs.writeFileSync(at('files', 'late-mod.js'), 'module.exports = 1;');
  await call('tryRequire after', afs.tryRequire, at('files', 'late-mod'));
  await call('getFiles before', afs.getFiles, at('styleguides'));
  fs.writeFileSync(at('styleguides', 'late.scss'), 'x');
  await call('getFiles after', afs.getFiles, at('styleguides'));
  await call('getYaml before', afs.getYaml, at('sites', 'late', 'config'));
  fs.mkdirSync(at('sites', 'late'));
  fs.writeFileSync(at('sites', 'late', 'config.yml'), 'a: 1\n');
  await call('getYaml after', afs.getYaml, at('sites', 'late', 'config'));
  await call('getSchemaPath before', afs.getSchemaPath, at('components', 'no-model'));
  fs.writeFileSync(at('components', 'no-model', 'schema.yaml'), 'z: 1\n');
  await call('getSchemaPath after', afs.getSchemaPath, at('components', 'no-model'));

  return out;
}

module.exports = runScenario;
