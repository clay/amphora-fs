'use strict';

const memoize = require('../memoize');

let req = require;

/**
 * @param {function} value
 */
function setRequire(value) {
  req = value;
}

/**
 * Try to require a module, do not fail if module is missing
 * @param {string} filePath
 * @returns {module}
 * @throw if fails for reason other than missing module
 */
function tryRequire(filePath) {
  let resolvedPath;

  try {
    resolvedPath = req.resolve(filePath);
  } catch (ex) {
    return undefined;
  }
  return req(resolvedPath);
}

module.exports = memoize(tryRequire);

// for testing
module.exports.setRequire = setRequire;
