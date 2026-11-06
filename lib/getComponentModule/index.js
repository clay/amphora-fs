'use strict';

const memoize = require('../memoize');

let getComponentPath = require('../getComponentPath'),
  tryRequire = require('../tryRequire');

/**
 * Load a component model
 *
 * NOTE: This includes local components as well as npm components.
 *
 * @param {string} name
 * @param {string} [prefix]
 * @returns {object|false}
 */
function getComponentModule(name, prefix) {
  var componentPath;

  if (prefix === 'html') {
    return false;
  }

  componentPath = getComponentPath(name);

  return componentPath && tryRequire(`${componentPath}/${prefix ? `${prefix}.` : ''}model`);
}

module.exports = memoize(getComponentModule, (name, prefix) => `${name}${prefix ? `|${prefix}` : ''}`);

// for testing
module.exports.setDeps = (gCP, tR) => {
  getComponentPath = gCP;
  tryRequire = tR;
};
