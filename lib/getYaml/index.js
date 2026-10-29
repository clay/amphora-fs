'use strict';
const memoize = require('../memoize'),
  path = require('path'),
  interpolate = require('../interpolate'),
  fs = require('fs'),
  allowedEnvFiles = ['local', 'config'];
let yaml;


/**
 * @param {string} filename
 * @returns {string|null} null if the file cannot be read
 */
function readFile(filename) {
  try {
    return fs.readFileSync(filename, 'utf8');
  } catch (ex) {
    return null;
  }
}

/**
 * Parse yaml. js-yaml is loaded the first time it is needed.
 *
 * @param {string|null} data
 * @param {string} file that the data is from, to say where the mistake is
 * @returns {*}
 */
function parse(data, file) {
  if (!yaml) {
    yaml = require('js-yaml');
  }

  return yaml.safeLoad(data, { filename: file });
}

/**
 * @param {string} filename without the extension, which is .yaml or .yml
 * @returns {*}
 * @throws {YAMLException} if the yaml is not valid, with the file in the message
 */
function getYaml(filename) {
  const basename = path.basename(filename, path.extname(filename));
  let file = filename + '.yaml',
    data = readFile(file);

  if (!data) {
    file = filename + '.yml';
    data = readFile(file);
  }

  if (allowedEnvFiles.includes(basename)) {
    // if filename is a config or local file
    // parse yaml for env variables
    return parse(interpolate(data), file);
  }

  return parse(data, file);
}

module.exports = memoize(getYaml);
