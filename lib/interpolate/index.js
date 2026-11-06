'use strict';

const START = '${',
  END = '}';

/**
 * Fill in the environment variables in a string: `${NAME}` becomes the value of NAME.
 * A variable that is not set, or is empty, is an error.
 *
 * This is the function of the template2env package (the only part of it that was
 * used), kept as it was, so a few things are as they were: nothing is changed in a
 * string without variables, and if the string starts with a variable, the whole
 * string is kept in front of the first value.
 *
 * @param {string} str
 * @returns {string}
 * @throws {Error} if a variable is not in `process.env`, or is empty
 */
function interpolate(str) {
  let start, end, match, tail, result;

  str = str || '';
  start = str.indexOf(START);
  end = str.indexOf(END, start);
  result = start > 0 ? str.slice(0, start) : str;

  while (start !== -1 && end !== -1) {
    match = str.substring(start + START.length, end);
    // the start of the next variable
    start = str.indexOf(START, end);

    if (!process.env[match]) {
      throw new Error(match + ' is not an environment variable');
    }

    tail = start > 0 ? str.slice(end + END.length, start) : str.slice(end + END.length);
    result += process.env[match] + tail;
    end = str.indexOf(END, start);
  }

  return result;
}

module.exports = interpolate;
