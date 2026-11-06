'use strict';

const memoize = require('../memoize'),
  path = require('path');

let getFolders = require('../getFolders');

/**
 * Get array of layout names from layouts folder.
 *
 * Should only occur once!
 * @return {[]}
 */
function getLayouts() {
  return getFolders(path.join(process.cwd(), 'layouts'));
}

module.exports = memoize(getLayouts);
// for testing
module.exports.setDeps = (gF) => {
  getFolders = gF;
};
