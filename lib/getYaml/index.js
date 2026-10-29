'use strict';
const memoize = require('../memoize'),
  path = require('path'),
  yaml = require('js-yaml'),
  temp2env = require('template2env'),
  fs = require('fs'),
  allowedEnvFiles = ['local', 'config'];


/**
 * @param {string} filename
 * @returns {string}
 */
function readFile(filename) {
  try {
    return fs.readFileSync(filename, 'utf8');
  } catch (ex) {
    return null;
  }
}

/**
 * @param {string} filename
 * @returns {string}
 */
function getYaml(filename) {
  const data = readFile(filename + '.yaml') || readFile(filename + '.yml'),
    basename = path.basename(filename, path.extname(filename));

  if (allowedEnvFiles.includes(basename)) {
    // if filename is a config or local file
    // parse yaml for env variables
    return yaml.safeLoad(temp2env.interpolate(data));
  }

  return yaml.safeLoad(data);
}

module.exports = memoize(getYaml);
