'use strict';

// amphora-fs's own messages are part of what it does; the messages of node, V8 and js-yaml are not
const OWN_MESSAGES = /^(Directory path is invalid|Schema path not found|.* is not an environment variable)/;

/**
 * Turn anything amphora-fs can give back into plain JSON, so results can be compared
 * and kept. Records what plain JSON would lose: undefined, NaN, dates, buffers, errors,
 * key order, prototypes and objects that are the same object.
 *
 * @param {*} value
 * @param {string} root a path that is replaced in strings
 * @param {Map} [seen]
 * @param {string} [at]
 * @returns {*}
 */
function serialize(value, root, seen = new Map(), at = '$') {
  const type = typeof value;
  let result;

  if (value === undefined) {
    return { $undefined: true };
  } else if (value === null || type === 'boolean') {
    return value;
  } else if (type === 'string') {
    return value.split(root).join('<root>');
  } else if (type === 'number') {
    return Number.isFinite(value) && !Object.is(value, -0) ? value : { $number: String(Object.is(value, -0) ? '-0' : value) };
  } else if (type === 'function') {
    return { $function: value.name, keys: Object.keys(value).sort() };
  } else if (seen.has(value)) {
    return { $same: seen.get(value) };
  }

  seen.set(value, at);

  if (value instanceof Error) {
    result = { $error: value.name, code: value.code };
    if (OWN_MESSAGES.test(value.message)) {
      result.message = serialize(value.message, root);
    }
    return result;
  } else if (value instanceof Date) {
    return { $date: Number.isNaN(value.getTime()) ? 'invalid' : value.toISOString() };
  } else if (Array.isArray(value)) {
    return { $array: Array.from(value, (item, i) => i in value ? serialize(item, root, seen, `${at}[${i}]`) : { $hole: true }) };
  } else if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
    return { $bytes: Array.from(value) };
  } else if (value instanceof Set) {
    return { $set: Array.from(value, (item) => serialize(item, root, seen, at)) };
  }

  result = { $object: Object.getPrototypeOf(value) === Object.prototype ? 'plain' : 'other', entries: [] };
  Object.keys(value).forEach((key) => {
    result.entries.push([key, serialize(value[key], root, seen, `${at}.${key}`)]);
  });
  return result;
}

module.exports = serialize;
