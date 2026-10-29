'use strict';

const fs = require('fs'),
  path = require('path');
var getComponentName = require('../getComponentName');


/**
 * Get the full name of a possibly-scoped npm component
 *
 * @param {string} name, e.g. 'clay-header'
 * @param {object} pkg for testing
 * @returns {string|undefined} e.g. '@nymdev/clay-header'
 */
function getScopedModuleName(name, pkg) {
  return Object.keys(pkg.dependencies || {}).find((dep) => dep.includes(name));
}

/**
 * Get path to component folder.
 *
 * @param  {string} name
 * @param  {object} pkg for testing
 * @return {string}
 */
function getComponentPath(name, pkg = require(path.resolve(process.cwd(), 'package.json'))) {
  let result = null,
    modulePath, npmName;

  // make sure it's a component we have (either in /components or package.json)
  if (getComponentName(name)) {
    modulePath = path.resolve(process.cwd(), 'components', name);

    if (fs.existsSync(modulePath)) {
      result = modulePath;
    } else {
      npmName = getScopedModuleName(name, pkg);
      modulePath = npmName && path.resolve(process.cwd(), 'node_modules', npmName);
      result = modulePath;
    }
  }

  return result;
}

module.exports = getComponentPath;

// For testing
module.exports.setGetComponentName = (mod) => { getComponentName = mod; };
