'use strict';

const memoize = require('../memoize');

let getLayoutPath = require('../getLayoutPath'),
  tryRequire = require('../tryRequire');

/**
 * Load a layout model
 *
 * @param {string} name
 * @param {string} [prefix]
 * @returns {object|false}
 */
function getLayoutModule(name, prefix) {
  var layoutPath;

  if (prefix === 'html') {
    return false;
  }

  layoutPath = getLayoutPath(name);

  return layoutPath && tryRequire(`${layoutPath}/${prefix ? `${prefix}.` : ''}model`);
}

module.exports = memoize(getLayoutModule, (name, prefix) => `${name}${prefix ? `|${prefix}` : ''}`);

// for testing
module.exports.setDeps = (gLP, tR) => {
  getLayoutPath = gLP;
  tryRequire = tR;
};
