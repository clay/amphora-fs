'use strict';
const fs = require('fs'),
  isDirectory = require('../isDirectory'),
  memoize = require('../memoize'),
  path = require('path');

/**
 * Get folder names.
 *
 * Should only occur once per directory.
 *
 * @param  {string} dir enclosing folder
 * @return {[]}     array of folder names
 */
function getFolders(dir) {
  try {
    return fs.readdirSync(dir)
      .filter(function (file) {
        return isDirectory(path.join(dir, file));
      });
  } catch (ex) {
    return [];
  }
}

module.exports = memoize(getFolders);
