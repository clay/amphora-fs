'use strict';
const fs = require('fs'),
  memoize = require('../memoize'),
  path = require('path'),
  isDirectory = require('../isDirectory');

/**
 * get files (that aren't test or documentation) in a directory
 * @param {string} dir
 * @returns {Array}
 */
function getFiles(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(function (file) {
        return !isDirectory(path.join(dir, file)) &&
          file.indexOf('.test.') === -1 && // ignore test files
          file.indexOf('.md') === -1; // ignore documentation files
      });
  } catch (ex) {
    return [];
  }
}

module.exports = memoize(getFiles);
