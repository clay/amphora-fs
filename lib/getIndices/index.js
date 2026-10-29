'use strict';

/**
 * The name of the component in a uri, as clayutils' getComponentName gives it:
 * /_components/text/instances/0 is text, example.com/_components/image.html is image.
 *
 * @param {string} uri
 * @returns {string|null}
 */
function getComponentName(uri) {
  const result = /_components\/(.+?)[/.]/.exec(uri) || /_components\/(.*)/.exec(uri);

  return result && result[1];
}

/**
 * @param {*} value
 * @returns {boolean}
 */
function isObject(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
}

/**
 * Anything that is not a function and has a valid numeric `length` counts as a
 * list, as it did when this used lodash, so data with a `length` field is
 * walked by index and its other properties are not looked at.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isArrayLike(value) {
  return value !== null && value !== undefined && typeof value !== 'function' &&
    Number.isInteger(value.length) && value.length >= 0 && value.length <= Number.MAX_SAFE_INTEGER;
}

/**
 * Get the items of a list that are objects
 *
 * @param {*} list
 * @returns {array}
 */
function getListObjects(list) {
  const items = [],
    length = list.length;
  let i;

  for (i = 0; i < length; i++) {
    if (isObject(list[i])) {
      items.push(list[i]);
    }
  }

  return items;
}

/**
 * Get the values of an object that are objects
 *
 * @param {*} obj
 * @returns {array}
 */
function getValueObjects(obj) {
  const items = [],
    keys = Object.keys(obj);
  let i;

  for (i = 0; i < keys.length; i++) {
    if (isObject(obj[keys[i]])) {
      items.push(obj[keys[i]]);
    }
  }

  return items;
}

/**
 * Get what is inside of something, that is an object
 *
 * @param {*} cursor
 * @returns {array}
 */
function getChildObjects(cursor) {
  if (Array.isArray(cursor) || isArrayLike(cursor)) {
    return getListObjects(cursor);
  } else if (cursor !== null && cursor !== undefined) {
    return getValueObjects(cursor);
  }

  return [];
}

/**
 * Find every object that has a `_ref` anywhere inside of an object.
 * The last branch is walked first, which decides the order of the result.
 *
 * @param {*} obj
 * @returns {array}
 */
function listDeepObjects(obj) {
  const list = [],
    queue = [obj];
  let items, i;

  while (queue.length) {
    items = getChildObjects(queue.pop());
    for (i = 0; i < items.length; i++) {
      if (items[i]._ref) {
        list.push(items[i]);
      }
      queue.push(items[i]);
    }
  }

  return list;
}

/**
 * Add an object to the refs by its `_ref`. Later objects with the same `_ref` replace
 * earlier ones. A `_ref` of `__proto__` is a name like any other, not a prototype.
 *
 * @param {object} refs
 * @param {*} key
 * @param {object} value
 */
function addRef(refs, key, value) {
  if (typeof key === 'symbol') {
    return;
  }

  key = `${key}`;
  if (key === '__proto__') {
    Object.defineProperty(refs, key, { configurable: true, enumerable: true, value, writable: true });
  } else {
    refs[key] = value;
  }
}

/**
 * Loop through the provided object and find all
 * references to other components.
 *
 * @param {string} [ref]
 * @param {object} data
 * @returns {{refs: object, components: Array}}
 */
function getIndices(ref, data) {
  const refs = {},
    names = new Set();

  refs[ref] = data;
  listDeepObjects(data).forEach((item) => addRef(refs, item._ref, item));
  Object.keys(refs).forEach((key) => {
    const name = getComponentName(key);

    if (name) {
      names.add(name);
    }
  });

  return { refs, components: [...names] };
}

module.exports = getIndices;
