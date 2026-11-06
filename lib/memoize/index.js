'use strict';

/**
 * Remember the result of a function for each key, like lodash's `memoize`.
 *
 * The key is the first argument, unless a resolver builds it from all of them.
 * Every result is remembered, including undefined, null and false ("not found");
 * a call that throws is not. The cache is read again on every call, so it can be
 * cleared or replaced (it only needs `has`, `get` and `set`), which tests do.
 *
 * @param {Function} func
 * @param {Function} [resolver]
 * @returns {Function}
 */
function memoize(func, resolver) {
  function memoized(...args) {
    const key = resolver ? resolver.apply(this, args) : args[0],
      cache = memoized.cache;
    let result;

    if (cache.has(key)) {
      return cache.get(key);
    }

    result = func.apply(this, args);
    memoized.cache = cache.set(key, result) || cache;
    return result;
  }

  memoized.cache = new Map();
  return memoized;
}

module.exports = memoize;
