'use strict';
const fs = require('fs'),
  memoize = require('../memoize');

/**
 * @param {string} file
 * @returns {boolean}
 */
function isDirectory(file) {
  try {
    return fs.statSync(file).isDirectory();
  } catch (ex) {
    return false;
  }
}

module.exports = memoize(isDirectory);
