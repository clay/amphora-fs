'use strict';
const memoize = require('../memoize'),
  path = require('path');

let getComponentPath = require('../getComponentPath'),
  tryRequire = require('../tryRequire');

/**
 * Load a component's package
 *
 * Should only occur once per name!
 *
 * NOTE: This includes local components as well as npm components
 *
 * @param {string} name
 * @returns {object|false}
 */
function getComponentPackage(name) {
  let componentPath = getComponentPath(name);

  return componentPath && tryRequire(path.join(componentPath, 'package.json'));
}

module.exports = memoize(getComponentPackage);
// for testing
module.exports.setDeps = (gCP, tR) => {
  getComponentPath = gCP;
  tryRequire = tR;
};
