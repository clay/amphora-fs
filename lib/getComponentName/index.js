'use strict';

var getComponents = require('../getComponents');

/**
 * Get a component name, so we can look it up in the file system.
 * This should be used when you want to validate that the component
 * exists in your instance, rather than just parsing the name of a
 * uri
 *
 * @param {string} name
 * @returns {string|false}
 */
function getComponentName(name) {
  const components = getComponents();

  return Array.isArray(components) && components.includes(name) && name;
}

module.exports = getComponentName;

// For testing
module.exports.setGetComponents = (mod) => getComponents = mod;
