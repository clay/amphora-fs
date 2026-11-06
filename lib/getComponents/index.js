'use strict';

const memoize = require('../memoize'),
  path = require('path'),
  IGNORED_CLAY_MODULES = [
    'clay-log',
    'clay-sitemaps'
  ];

var getFolders = require('../getFolders');

/**
 * Get array of component names, from node_modules and components folder.
 *
 * Should only occur once!
 * @param {object} pkg injected for testing
 * @return {[]}
 */
function getComponents(pkg = require(path.resolve(process.cwd(), 'package.json'))) {
  const npmComponents = Object.keys(pkg.dependencies || {}).map(function (name) {
    if (name.includes('clay-') && !IGNORED_CLAY_MODULES.includes(name)) {
      // this is a clay component
      if (name.includes(path.sep)) {
        // this is a scoped npm component!
        // return the name without the scope/user
        return name.split(path.sep)[1];
      }
      // this is an unscoped npm component
      return name;
    } // otherwise returns undefined, and is filtered out below
  }).filter(Boolean);

  return getFolders(path.join(process.cwd(), 'components')).concat(npmComponents);
}

module.exports = memoize(getComponents);

// For testing
module.exports.setDeps = (gF) => {
  getFolders = gF;
};
