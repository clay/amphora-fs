'use strict';

const fs = require('fs'),
  path = require('path'),
  { writeFiles } = require('./tmp');

const YAML_TYPES = [
  'int: 12', 'neg: -3', 'float: 1.5', 'exp: 1e3', 'oct: 0o14', 'oct2: 0777', 'hex: 0xff', 'bool_t: true', 'bool_f: false',
  'yes: yes', 'no: no', 'on: on', 'null1: null', 'null2: ~', 'null3:', 'str: "x"', 'date: 2001-12-14',
  'ts: 2001-12-14T21:59:43.10-05:00', 'ts2: 2001-12-14 21:59:43.10 -5', 'bin: !!binary aGVsbG8=', 'set: !!set {a, b}', 'omap: !!omap [a: 1, b: 2]', 'pairs: !!pairs [a: 1, a: 2]',
  'inf: .inf', 'ninf: -.inf', 'nan: .nan', 'sexa: 190:20:30', 'multi: |\n  line1\n  line2', 'fold: >\n  a\n  b',
  'quoted: \'it\'\'s\'', 'unicode: "\\u00e9\\n"', 'emoji: 😀', 'underscore: 1_000', 'binary: 0b101', 'signed_dot: -.5'
].join('\n') + '\n';

// component name -> files; a schema.yml and a model.js are the usual ones
const COMPONENTS = {
  article: { 'schema.yml': 'a: 1\nb:\n  - x\n  - y\nc: {d: e}\n', 'model.js': 'module.exports.render = (u, d) => d;\nmodule.exports.save = (u, d) => d;\n', 'bootstrap.yml': '_components:\n  article:\n    instances:\n      default:\n        a: 1\n' },
  paragraph: { 'schema.yaml': 'text:\n  _label: Text\n  _has:\n    input: text\n', 'model.js': 'module.exports = { render: 1 };\n' },
  'with-other-models': { 'schema.yml': 'k: v\n', 'model.js': 'module.exports.render = 1;\n', 'amp.model.js': 'module.exports.render = 2;\n', 'html.model.js': 'module.exports.render = 3;\n' },
  'no-model': { 'schema.yml': 'k: v\n' },
  'empty-schema': { 'schema.yml': '' },
  'newline-schema': { 'schema.yml': '\n' },
  'comment-schema': { 'schema.yml': '# nothing here\n' },
  'bad-yaml': { 'schema.yml': 'a: [1, 2\nb: : :\n' },
  'bad-model': { 'schema.yml': 'k: v\n', 'model.js': 'throw new Error("model boom");\n' },
  'syntax-model': { 'schema.yml': 'k: v\n', 'model.js': 'module.exports = {;\n' },
  'both-yaml-yml': { 'schema.yaml': 'from: yaml\n', 'schema.yml': 'from: yml\n' },
  'empty-yaml-real-yml': { 'schema.yaml': '', 'schema.yml': 'from: yml\n' },
  'empty-yaml-only': { 'schema.yaml': '' },
  anchors: { 'schema.yml': 'base: &b\n  x: 1\n  y: 2\nderived:\n  <<: *b\n  z: 3\nlist: &l [1, 2]\nagain: *l\n' },
  types: { 'schema.yml': YAML_TYPES },
  'tab-indent': { 'schema.yml': 'a:\n\tb: 1\n' },
  'unicode-ñame': { 'schema.yml': 'k: ñ\n' },
  'dup-keys': { 'schema.yml': 'a: 1\na: 2\n' },
  'js-tag': { 'schema.yml': 'f: !!js/function "function(){}"\n' },
  'multi-doc': { 'schema.yml': 'a: 1\n---\nb: 2\n' },
  'scalar-doc': { 'schema.yml': 'just a string\n' },
  'list-doc': { 'schema.yml': '- a\n- b\n' },
  bom: { 'schema.yml': '﻿a: 1\n' },
  crlf: { 'schema.yml': 'a: 1\r\nb:\r\n  - x\r\n' },
  'proto-keys': { 'schema.yml': '__proto__: {x: 1}\nconstructor: 2\ntoString: 3\n' },
  'long-string': { 'schema.yml': 'k: ' + 'x'.repeat(5000) + '\n' },
  'nonstring-keys': { 'schema.yml': '1: a\n2.5: b\ntrue: c\nnull: d\n[1,2]: e\n? {k: v}\n: f\n' },
  'dir-schema': { 'schema.yml/inner.txt': 'a directory called schema.yml\n', 'schema.yaml/inner.txt': 'and one called schema.yaml\n' }
};

const FILES = {
  'package.json': JSON.stringify({
    name: 'fixture-site',
    version: '1.0.0',
    dependencies: {
      'clay-kiln': '1', 'clay-foo': '1', '@scope/clay-bar': '1', '@scope/clay-bar-extra': '1', 'clay-log': '1', 'clay-sitemaps': '1',
      lodash: '4', amphora: '9', 'my-clay-thing': '1', 'clay-pkgless': '1'
    }
  }, null, 2),
  // layouts
  'layouts/layout-a/schema.yml': 'k: v\n',
  'layouts/layout-a/model.js': 'module.exports.render = 1;\nmodule.exports.save = 2;\n',
  'layouts/layout-a/amp.model.js': 'module.exports.render = 9;\n',
  'layouts/layout-b/schema.yml': 'k: v\n',
  'layouts/layout-b/model.js': 'module.exports.render = 1;\n',
  'layouts/layout-no-model/schema.yml': 'k: v\n',
  'layouts/layout-bad-yaml/schema.yml': 'a: [\n',
  'layouts/readme.md': 'x',
  // sites
  'sites/alpha/config.yaml': 'name: Alpha\nhost: ${FIXTURE_HOST}\nport: ${FIXTURE_PORT}\npath: /\n',
  'sites/alpha/local.yml': 'db: ${FIXTURE_DB}/x\nplain: no-env\n',
  'sites/alpha/bootstrap.yml': '_components:\n  article:\n    instances: {a: {x: 1}}\n',
  'sites/alpha/index.js': 'module.exports = { routes: [] };\n',
  'sites/alpha/subsites/sub1/config.yml': 'name: Sub1\nhost: ${FIXTURE_HOST}\n',
  'sites/alpha/subsites/sub1/index.js': 'module.exports = {};\n',
  'sites/beta/config.yml': 'name: Beta\nnoenv: true\n',
  'sites/gamma/config.yaml': '${FIXTURE_HOST}\n',
  'sites/delta/config.yaml': 'a: ${MISSING_VAR_XYZ}\n',
  'sites/eps/config.yaml': 'a: ${FIXTURE_HOST} and ${FIXTURE_PORT} and ${FIXTURE_HOST}\nb: x ${FIXTURE_PORT}\n',
  'sites/zeta/config.yaml': 'a: ${UNTERMINATED\nb: c\n',
  'sites/eta/config.yaml': 'a: }{ ${FIXTURE_HOST}\n',
  'sites/theta/config.yaml': 'a: $${FIXTURE_HOST}\nb: "${FIXTURE_HOST}"\n',
  'sites/iota/config.yaml': 'a: ${FIXTURE_EMPTY}\n',
  'sites/kappa/config.yaml': '',
  'sites/lambda/config.yml': 'a: [\n',
  'sites/mu/config.yaml': 'a: ${}\n',
  'sites/nu/config.yaml': 'k: ${FIXTURE_HOST}${FIXTURE_PORT}\n',
  'sites/xi/config.yaml': 'k: 1\n# ${MISSING_IN_COMMENT}\n',
  'sites/omicron/other.yaml': 'k: ${MISSING_IN_OTHER}\n',
  'sites/index.js': 'module.exports = {};\n',
  'sites/README.md': 'x',
  // styleguides
  'styleguides/sg1/_variables.scss': '$a: 1;\n',
  'styleguides/sg2/_variables.scss': '$a: 1;\n',
  'styleguides/readme.md': 'x',
  // npm components
  'node_modules/clay-foo/package.json': JSON.stringify({ name: 'clay-foo', version: '1.0.0', main: 'index.js' }),
  'node_modules/clay-foo/schema.yml': 'npm: foo\n',
  'node_modules/clay-foo/model.js': 'module.exports.render = "npm foo";\n',
  'node_modules/@scope/clay-bar/package.json': JSON.stringify({ name: '@scope/clay-bar', version: '2.0.0' }),
  'node_modules/@scope/clay-bar/schema.yaml': 'npm: bar\n',
  'node_modules/@scope/clay-bar/model.js': 'module.exports.render = "npm bar";\n',
  'node_modules/@scope/clay-bar/amp.model.js': 'module.exports.render = "npm bar amp";\n',
  'node_modules/clay-kiln/package.json': JSON.stringify({ name: 'clay-kiln', version: '11.0.0' }),
  'node_modules/clay-kiln/schema.yml': 'kiln: true\n',
  'node_modules/my-clay-thing/package.json': JSON.stringify({ name: 'my-clay-thing' }),
  'node_modules/clay-pkgless/index.js': 'x',
  // odd names and contents, for getFiles, getFolders, readFilePromise and tryRequire
  'files/plain.json': '{"a":1,"b":[1,2,3]}',
  'files/bad.json': '{not json',
  'files/mod.js': 'module.exports = { x: 1 };\n',
  'files/mod-undefined.js': 'module.exports = undefined;\n',
  'files/mod-throw.js': 'throw new TypeError("load boom");\n',
  'files/empty.json': '',
  'files/empty.txt': '',
  'files/ünï-çödé.txt': 'unicode name\n',
  'files/with space/inner.txt': 'x',
  'files/readme.md': 'x',
  'files/a.test.js': 'x',
  'files/b.md.bak': 'x',
  'files/c.mdx': 'x',
  'files/.dotfile': 'x',
  'files/Upper.txt': 'x',
  'files/lower.txt': 'x',
  'files/_under.txt': 'x',
  'files/10.txt': 'x',
  'files/9.txt': 'x',
  'files/2.txt': 'x',
  'files/z-dir/inner.txt': 'x',
  'components/not-a-folder.txt': 'x',
  'components/.hidden/x.txt': 'x'
};

/**
 * Write a project that looks like a Clay site: components (local and npm), layouts,
 * sites with config files that use environment variables, and files that are odd
 *
 * @param {string} root
 */
function buildProject(root) {
  const files = Object.assign({}, FILES);

  Object.keys(COMPONENTS).forEach((name) => {
    Object.keys(COMPONENTS[name]).forEach((file) => {
      files[`components/${name}/${file}`] = COMPONENTS[name][file];
    });
    files[`components/${name}/template.hbs`] = '<div>{{ text }}</div>\n';
    files[`components/${name}/client.js`] = 'module.exports = {};\n';
    files[`components/${name}/${name}.test.js`] = '// test\n';
    files[`components/${name}/README.md`] = '# readme\n';
  });

  writeFiles(root, files);
  fs.mkdirSync(path.join(root, 'files', 'empty-dir'), { recursive: true });
}

module.exports.buildProject = buildProject;
